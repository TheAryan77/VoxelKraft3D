"use client";

import { Suspense, useEffect, useId, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, useGLTF } from "@react-three/drei";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { DRACO_DECODER_PATH, MODELS } from "@/lib/models.config";
import { setAnimating } from "@/lib/sceneStore";
import { useStore } from "@/lib/store";
import { appearanceStore } from "@/lib/theme";
import { PALETTES, mixHex, sceneColors } from "@/lib/themeConfig";
import { ModelErrorBoundary } from "./ModelErrorBoundary";
import { StudioLights } from "./StudioLights";

/**
 * "From idea to object": one model shown at four stages, driven by a 0..3
 * progress value from the DOM (arrows, autoplay, scrubbing the bar).
 *
 *   0 Idea + material   a churning lump of raw material, sparks of an idea around it
 *   0→1                 the particles fly onto the model's surface, the wireframe draws in
 *   1 Wireframe         the 3D model, every triangle
 *   1→2                 printed bottom-up: raw filament with layer lines, a glowing fresh layer
 *   2 Layers            the raw print
 *   2→3                 a colour pass sweeps across it, revealing the real materials
 *   3 Finished          the finished piece
 */

const ENTRY = MODELS.journey;
const FOV = 30;
const ELEVATION = THREE.MathUtils.degToRad(14);
const SWAY_SPEED = 0.35;
/** Resting angle (a 3/4 view), from the model's registry rotation. */
const BASE_TURN = ENTRY.rotation?.[1] ?? 0.6;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const range = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
const smooth = (t: number) => t * t * (3 - 2 * t);

interface RuntimeProps {
  progress: { get(): number };
  visible: boolean;
  isMobile: boolean;
  reduced: boolean;
  element: HTMLElement | null;
}

export function JourneyScene(props: RuntimeProps) {
  if (!ENTRY.src) return null;
  return (
    <>
      <StudioLights environmentIntensity={0.55} />
      <ModelErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <Journey {...props} src={ENTRY.src} />
        </Suspense>
      </ModelErrorBoundary>
    </>
  );
}

/* ------------------------------- Build once ------------------------------- */

interface Part {
  geometry: THREE.BufferGeometry;
  finished: THREE.Material | THREE.Material[];
}

interface Built {
  parts: Part[];
  height: number;
  minY: number;
  minX: number;
  maxX: number;
  /** Furthest any vertex sits from the vertical axis (what a turn sweeps). */
  radius: number;
  footX: number;
  footZ: number;
  points: THREE.BufferGeometry;
  blobRadius: number;
}

/** Bakes every mesh into one model space: centred, base on y = -height/2, ~2 units across. */
function build(scene: THREE.Object3D, pointCount: number): Built {
  // Baked unrotated, so the colour pass runs along the model's length;
  // the turning group supplies the 3/4 view.
  const root = scene.clone(true);
  root.updateMatrixWorld(true);

  const parts: Part[] = [];
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry?.attributes.position) return;
    const geometry = mesh.geometry.clone();
    geometry.applyMatrix4(mesh.matrixWorld);
    const finished = Array.isArray(mesh.material) ? mesh.material.map((m) => m.clone()) : mesh.material.clone();
    parts.push({ geometry, finished });
  });

  const box = new THREE.Box3();
  for (const p of parts) {
    p.geometry.computeBoundingBox();
    box.union(p.geometry.boundingBox!);
  }
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const s = 2 / Math.max(size.x, size.y, size.z);
  const normalise = new THREE.Matrix4().makeScale(s, s, s).multiply(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z));
  for (const p of parts) p.geometry.applyMatrix4(normalise);

  const height = size.y * s;
  let radius = 0;
  const v = new THREE.Vector3();
  for (const p of parts) {
    const pos = p.geometry.attributes.position;
    for (let i = 0; i < pos.count; i += 3) radius = Math.max(radius, Math.hypot(pos.getX(i), pos.getZ(i)));
  }

  // Particles: targets spread over the surface (by area), starts inside a lumpy blob.
  const flat = parts.map((p) => p.geometry.toNonIndexed());
  const areas = flat.map((g) => {
    const pos = g.attributes.position;
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    let area = 0;
    for (let i = 0; i < pos.count; i += 3) {
      a.fromBufferAttribute(pos, i);
      b.fromBufferAttribute(pos, i + 1);
      c.fromBufferAttribute(pos, i + 2);
      area += b.sub(a).cross(c.sub(a)).length() / 2;
    }
    return area;
  });
  const total = areas.reduce((n, a) => n + a, 0) || 1;
  const blobRadius = Math.max(height * 0.75, radius * 0.38);
  const blobY = -height / 2 + blobRadius * 0.85;
  const target = new Float32Array(pointCount * 3);
  const start = new Float32Array(pointCount * 3);
  const seed = new Float32Array(pointCount);
  const spark = new Float32Array(pointCount);
  let k = 0;
  flat.forEach((g, gi) => {
    const n = gi === flat.length - 1 ? pointCount - k : Math.round((areas[gi] / total) * pointCount);
    if (n <= 0) return;
    const sampler = new MeshSurfaceSampler(new THREE.Mesh(g)).build();
    for (let i = 0; i < n && k < pointCount; i++, k++) {
      sampler.sample(v);
      target.set([v.x, v.y, v.z], k * 3);
      // Uniform direction, radius biased outward, a little lumpy.
      const u = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
      const lump = 1 + 0.16 * Math.sin(u.x * 5.1 + u.y * 3.7) + 0.1 * Math.sin(u.z * 7.3);
      const r = blobRadius * (0.25 + 0.75 * Math.cbrt(Math.random())) * lump;
      start.set([u.x * r * 1.15, blobY + u.y * r * 0.85, u.z * r], k * 3);
      seed[k] = Math.random();
      spark[k] = Math.random() < 0.014 ? 1 : 0;
    }
    g.dispose();
  });

  const points = new THREE.BufferGeometry();
  points.setAttribute("position", new THREE.BufferAttribute(target, 3));
  points.setAttribute("aStart", new THREE.BufferAttribute(start, 3));
  points.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  points.setAttribute("aSpark", new THREE.BufferAttribute(spark, 1));
  // The particles fly everywhere; never cull them by the target bounds.
  points.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10);

  return { parts, height, minY: -height / 2, minX: (-size.x * s) / 2, maxX: (size.x * s) / 2, footX: size.x * s, footZ: size.z * s, radius, points, blobRadius };
}

/* -------------------------------- Shaders -------------------------------- */

const particleVertex = /* glsl */ `
  attribute vec3 aStart;
  attribute float aSeed;
  attribute float aSpark;
  uniform float uT;
  uniform float uTime;
  uniform float uSize;
  uniform float uScale;
  uniform float uBlobR;
  uniform float uBlobY;
  varying float vSpark;
  varying float vT;
  void main() {
    float delay = aSeed * 0.45;
    float t = clamp((uT - delay) / 0.55, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);
    vec3 from = aStart;
    // Raw material churns slowly; idea sparks orbit it.
    from += vec3(sin(uTime * 1.3 + aSeed * 40.0), cos(uTime * 1.1 + aSeed * 27.0), sin(uTime * 0.9 + aSeed * 13.0)) * 0.025;
    if (aSpark > 0.5) {
      float a = uTime * (0.5 + aSeed * 0.6) + aSeed * 6.2831;
      float r = uBlobR * (1.3 + 0.6 * fract(aSeed * 7.31));
      from = vec3(cos(a) * r, uBlobY + sin(a * 1.7 + aSeed * 9.0) * uBlobR * 0.6, sin(a) * r);
    }
    vec3 p = mix(from, position, t);
    p.y += sin(t * 3.14159) * uBlobR * 0.6 * (aSeed - 0.35);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (aSpark > 0.5 ? 1.8 : 1.0) * uScale / -mv.z;
    vSpark = aSpark;
    vT = t;
  }
`;

const particleFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uSparkColor;
  uniform float uOpacity;
  varying float vSpark;
  varying float vT;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = 1.0 - smoothstep(0.15, 0.5, d);
    vec3 c = mix(uColor, uSparkColor, max(vSpark * (1.0 - vT), vT * 0.6));
    gl_FragColor = vec4(c, a * uOpacity);
  }
`;

interface RawUniforms {
  uLayer: { value: number };
  uCut: { value: number };
  uPaint: { value: number };
  uGlow: { value: THREE.Color };
  uCutGlow: { value: number };
  uPaintGlow: { value: number };
}

/**
 * Raw filament: layer lines from the model-space height, and a glowing band
 * at the fresh layer (printing) or at the colour pass (finishing).
 */
function rawMaterial(uniforms: RawUniforms, planes: THREE.Plane[]) {
  const m = new THREE.MeshStandardMaterial({ roughness: 0.72, metalness: 0, side: THREE.DoubleSide, clippingPlanes: planes, clipShadows: true });
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = `varying vec3 vkLocal;\n${shader.vertexShader}`.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\n vkLocal = transformed;",
    );
    shader.fragmentShader = `varying vec3 vkLocal;
      uniform float uLayer; uniform float uCut; uniform float uPaint;
      uniform vec3 uGlow; uniform float uCutGlow; uniform float uPaintGlow;
      ${shader.fragmentShader}`
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float vkL = fract(vkLocal.y / uLayer);
        diffuseColor.rgb *= mix(0.74, 1.0, smoothstep(0.0, 0.3, vkL) * (1.0 - smoothstep(0.7, 1.0, vkL)));`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += uGlow * (
          uCutGlow * (1.0 - smoothstep(0.0, uLayer * 2.5, uCut - vkLocal.y)) +
          uPaintGlow * (1.0 - smoothstep(0.0, 0.09, abs(vkLocal.x - uPaint)))
        ) * 1.6;`,
      );
  };
  m.customProgramCacheKey = () => "vk-journey-raw";
  return m;
}

/* --------------------------------- Scene --------------------------------- */

function Journey({ src, progress, visible, isMobile, reduced, element }: RuntimeProps & { src: string }) {
  const key = useId();
  const { scene } = useGLTF(src, (ENTRY.draco ?? true) ? DRACO_DECODER_PATH : false);
  const { palette, accent } = useStore(appearanceStore);
  const camera = useRef<THREE.PerspectiveCamera>(null);
  const turn = useRef<THREE.Group>(null);
  const plate = useRef<THREE.Mesh>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const invalidate = useThree((s) => s.invalidate);
  const drag = useRef({ active: false, x: 0, offset: 0, velocity: 0 });

  const built = useMemo(() => build(scene, isMobile ? 3500 : 6500), [scene, isMobile]);

  // Clipping planes live in model space; they're moved with the turning group each frame.
  const local = useMemo(
    () => ({
      rawBelowCut: new THREE.Plane(new THREE.Vector3(0, -1, 0), 0),
      wireAboveCut: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
      rawRightOfPaint: new THREE.Plane(new THREE.Vector3(1, 0, 0), 0),
      finishedLeftOfPaint: new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0),
    }),
    [],
  );
  const world = useMemo(
    () => ({
      rawBelowCut: new THREE.Plane(),
      wireAboveCut: new THREE.Plane(),
      rawRightOfPaint: new THREE.Plane(),
      finishedLeftOfPaint: new THREE.Plane(),
    }),
    [],
  );

  const uniforms = useMemo<RawUniforms>(
    () => ({
      uLayer: { value: built.height / 38 },
      uCut: { value: built.minY },
      uPaint: { value: built.minX },
      uGlow: { value: new THREE.Color() },
      uCutGlow: { value: 0 },
      uPaintGlow: { value: 0 },
    }),
    [built],
  );

  const particleUniforms = useMemo(
    () => ({
      uT: { value: 0 },
      uTime: { value: 0 },
      uSize: { value: isMobile ? 0.03 : 0.024 },
      uScale: { value: 500 },
      uBlobR: { value: built.blobRadius },
      uBlobY: { value: built.minY + built.blobRadius * 0.85 },
      uColor: { value: new THREE.Color() },
      uSparkColor: { value: new THREE.Color() },
      uOpacity: { value: 1 },
    }),
    [built, isMobile],
  );

  const objects = useMemo(() => {
    const raw = rawMaterial(uniforms, [world.rawBelowCut, world.rawRightOfPaint]);
    const line = new THREE.LineBasicMaterial({ toneMapped: false, transparent: true, opacity: 0, depthWrite: false, clippingPlanes: [world.wireAboveCut] });
    // A plain body under the wireframe hides the far side's lines, as in the service cards.
    const body = new THREE.MeshStandardMaterial({
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
      clippingPlanes: [world.wireAboveCut],
    });
    const meshes = built.parts.map((p) => {
      const wire = new THREE.LineSegments(new THREE.WireframeGeometry(p.geometry), line);
      const bodyMesh = new THREE.Mesh(p.geometry, body);
      // Both are transparent while fading; draw the body first so the lines stay on top.
      bodyMesh.renderOrder = 1;
      wire.renderOrder = 2;
      const finishedMats = (Array.isArray(p.finished) ? p.finished : [p.finished]).map((m) => {
        m.clippingPlanes = [world.finishedLeftOfPaint];
        m.side = THREE.DoubleSide;
        return m;
      });
      return {
        raw: new THREE.Mesh(p.geometry, raw),
        finished: new THREE.Mesh(p.geometry, Array.isArray(p.finished) ? finishedMats : finishedMats[0]),
        wire,
        body: bodyMesh,
      };
    });
    const particles = new THREE.Points(
      built.points,
      new THREE.ShaderMaterial({
        uniforms: particleUniforms,
        vertexShader: particleVertex,
        fragmentShader: particleFragment,
        transparent: true,
        depthWrite: false,
      }),
    );
    particles.frustumCulled = false;
    return { raw, line, body, meshes, particles };
  }, [built, uniforms, particleUniforms, world]);

  useEffect(
    () => () => {
      objects.raw.dispose();
      objects.line.dispose();
      objects.body.dispose();
      (objects.particles.material as THREE.Material).dispose();
      built.points.dispose();
      for (const m of objects.meshes) {
        m.wire.geometry.dispose();
        m.raw.geometry.dispose();
        (Array.isArray(m.finished.material) ? m.finished.material : [m.finished.material]).forEach((x) => x.dispose());
      }
    },
    [objects, built],
  );

  // Colours follow the Appearance picker.
  const plateMaterial = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.9, transparent: true, opacity: 0 }), []);
  useEffect(() => {
    const c = sceneColors(palette, accent);
    const light = PALETTES[palette].scheme === "light";
    objects.raw.color.set(light ? "#cfc8bd" : "#d9d3c9");
    objects.line.color.set(c.wire);
    objects.body.color.set(c.solid);
    uniforms.uGlow.value.set(c.accent);
    particleUniforms.uColor.value.set(light ? mixHex("#8a8076", c.accent, 0.25) : mixHex("#cfc6ba", c.accent, 0.2));
    particleUniforms.uSparkColor.value.set(c.accent);
    plateMaterial.color.set(light ? mixHex(PALETTES[palette].surface2, "#000000", 0.06) : PALETTES[palette].surface2);
    invalidate();
  }, [palette, accent, objects, uniforms, particleUniforms, plateMaterial, invalidate]);

  // Soft round shadow under the finished piece (cheaper than ContactShadows).
  const shadowTexture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(0,0,0,0.55)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
  useEffect(() => () => shadowTexture.dispose(), [shadowTexture]);

  // Sideways drag turns the model, with a little inertia.
  useEffect(() => {
    if (!element) return;
    const d = drag.current;
    const down = (e: PointerEvent) => {
      d.active = true;
      d.x = e.clientX;
      d.velocity = 0;
      element.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      if (!d.active) return;
      const dx = e.clientX - d.x;
      d.x = e.clientX;
      d.offset += dx * 0.009;
      d.velocity = dx * 0.009 * 60;
      invalidate();
    };
    const up = () => {
      d.active = false;
      element.style.cursor = "grab";
    };
    element.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      element.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [element, invalidate]);

  useEffect(() => {
    setAnimating(key, visible);
    return () => setAnimating(key, false);
  }, [key, visible]);

  const clock = useRef(0);
  const fitted = useRef("");

  useFrame((_, delta) => {
    if (!visible || !turn.current || !camera.current) return;
    const dt = Math.min(delta, 0.1);
    clock.current += dt;
    const p = THREE.MathUtils.clamp(progress.get(), 0, 3);

    // Framing: everything the model sweeps while turning fits the view.
    const w = element?.clientWidth ?? 0;
    const h0 = element?.clientHeight ?? 0;
    const fitKey = `${w}x${h0}`;
    if (fitKey !== fitted.current && w > 0 && h0 > 0) {
      fitted.current = fitKey;
      const aspect = w / h0;
      const margin = isMobile ? 1.02 : 1.08;
      const tanY = Math.tan(THREE.MathUtils.degToRad(FOV) / 2) / margin;
      const tanX = tanY * aspect;
      const r = built.radius;
      const h = Math.max(built.height, built.blobRadius * 2.2);
      const distance = r + Math.max(h / 2 / tanY, r / tanX);
      camera.current.aspect = aspect;
      camera.current.position.set(0, Math.sin(ELEVATION) * distance, Math.cos(ELEVATION) * distance);
      camera.current.lookAt(0, -built.height * 0.05, 0);
      camera.current.updateProjectionMatrix();
      particleUniforms.uScale.value = (h0 * Math.min(window.devicePixelRatio, 1.75)) / (2 * Math.tan(THREE.MathUtils.degToRad(FOV) / 2));
    }

    // Turning: a slow sway about a 3/4 view, plus whatever the visitor drags in.
    const d = drag.current;
    if (!d.active) {
      d.offset += d.velocity * dt;
      d.velocity *= Math.pow(0.04, dt);
    }
    turn.current.rotation.y = BASE_TURN + (reduced ? 0 : Math.sin(clock.current * SWAY_SPEED) * 0.55) + d.offset;
    turn.current.updateMatrixWorld();

    // 0 → 1: particles assemble; the wireframe draws in as they land.
    const assemble = range(p, 0, 1);
    particleUniforms.uT.value = assemble;
    particleUniforms.uTime.value = reduced ? 0 : clock.current;
    particleUniforms.uOpacity.value = 1 - smooth(range(p, 0.8, 1.15));
    objects.particles.visible = p < 1.15;
    const wireIn = smooth(range(p, 0.55, 1));

    // 1 → 2: printed bottom-up. Raw shows below the cut, the wireframe above it.
    const print = range(p, 1, 2);
    const cut = built.minY - 0.01 + print * (built.height + 0.03);
    uniforms.uCut.value = cut;
    uniforms.uCutGlow.value = print > 0 && print < 1 ? 1 : 0;
    local.rawBelowCut.constant = cut;
    local.wireAboveCut.constant = -cut;
    const wireOut = 1 - smooth(range(p, 1.9, 2.1));
    // Small screens pack the triangles tighter, so the lines are fainter there.
    objects.line.opacity = (isMobile ? 0.45 : 0.85) * wireIn * wireOut;
    objects.body.opacity = smooth(range(p, 0.7, 1)) * wireOut;
    objects.body.depthWrite = objects.body.opacity > 0.98;

    // 2 → 3: a colour pass sweeps along the model, revealing its real finish.
    const paintT = smooth(range(p, 2, 3));
    const paint = built.minX - 0.12 + paintT * (built.maxX - built.minX + 0.24);
    uniforms.uPaint.value = paint;
    uniforms.uPaintGlow.value = paintT > 0 && paintT < 1 ? 1 : 0;
    local.rawRightOfPaint.constant = -paint;
    local.finishedLeftOfPaint.constant = paint;

    for (const m of objects.meshes) {
      m.raw.visible = p > 1 && paintT < 1;
      m.finished.visible = p > 2;
      m.wire.visible = p > 0.5 && p < 2.1;
      m.body.visible = p > 0.7 && p < 2.1;
    }

    // Planes follow the turning model.
    const mw = turn.current.matrixWorld;
    world.rawBelowCut.copy(local.rawBelowCut).applyMatrix4(mw);
    world.wireAboveCut.copy(local.wireAboveCut).applyMatrix4(mw);
    world.rawRightOfPaint.copy(local.rawRightOfPaint).applyMatrix4(mw);
    world.finishedLeftOfPaint.copy(local.finishedLeftOfPaint).applyMatrix4(mw);

    // Build plate while printing, then a soft shadow once it's finished.
    plateMaterial.opacity = 0.65 * smooth(range(p, 0.85, 1.2)) * (1 - smooth(range(p, 2.4, 2.9)));
    if (plate.current) plate.current.visible = plateMaterial.opacity > 0.01;
    if (shadow.current) (shadow.current.material as THREE.MeshBasicMaterial).opacity = smooth(range(p, 2.2, 3)) * 0.9;
  });


  return (
    <>
      <PerspectiveCamera ref={camera} makeDefault fov={FOV} near={0.01} far={100} position={[0, 1, 6]} />
      <group ref={turn}>
        {objects.meshes.map((m, i) => (
          <group key={i}>
            <primitive object={m.raw} />
            <primitive object={m.finished} />
            <primitive object={m.body} />
            <primitive object={m.wire} />
          </group>
        ))}
        <primitive object={objects.particles} />
        <mesh ref={plate} position={[0, built.minY - 0.012, 0]} material={plateMaterial}>
          <boxGeometry args={[built.footX * 1.04, 0.02, built.footZ * 1.5]} />
        </mesh>
        <mesh ref={shadow} position={[0, built.minY - 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[built.footX * 1.5, built.footZ * 1.9, 1]}>
          <planeGeometry />
          <meshBasicMaterial map={shadowTexture} transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </>
  );
}
