"use client";

import {
  Suspense,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { MODELS } from "@/lib/models.config";
import { modelPrintProgress, modelPrintStart, setAnimating, startHeroPrint, startModelPrint } from "@/lib/sceneStore";
import { GLBModel } from "./GLBModel";
import { ModelErrorBoundary } from "./ModelErrorBoundary";
import { PlaceholderModel } from "./PlaceholderModel";

/** Objects on this layer are seen by the slot camera but not by ContactShadows. */
export const FX_LAYER = 1;

const BINS = 48;
const PARK_MS = 900;
const MOLTEN = "#ff6a13";

interface Profile {
  minY: number;
  maxY: number;
  height: number;
  /** Max distance from the Y axis for each horizontal band, bottom to top. */
  radii: Float32Array;
}

/** Samples the model's silhouette so the glowing edge and nozzle hug its outline. */
function measureProfile(root: THREE.Object3D): Profile | null {
  root.updateWorldMatrix(true, true);
  const toLocal = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const m = new THREE.Matrix4();
  const v = new THREE.Vector3();
  const ys: number[] = [];
  const rs: number[] = [];
  let minY = Infinity;
  let maxY = -Infinity;

  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    const pos = mesh.isMesh ? mesh.geometry?.attributes.position : undefined;
    if (!pos) return;
    m.multiplyMatrices(toLocal, mesh.matrixWorld);
    const stride = Math.max(1, Math.floor(pos.count / 40000));
    for (let i = 0; i < pos.count; i += stride) {
      v.fromBufferAttribute(pos, i).applyMatrix4(m);
      ys.push(v.y);
      rs.push(Math.hypot(v.x, v.z));
      if (v.y < minY) minY = v.y;
      if (v.y > maxY) maxY = v.y;
    }
  });

  const height = maxY - minY;
  if (!Number.isFinite(height) || height < 1e-6) return null;

  const radii = new Float32Array(BINS);
  for (let i = 0; i < ys.length; i++) {
    const b = Math.min(BINS - 1, Math.floor(((ys[i] - minY) / height) * BINS));
    if (rs[i] > radii[b]) radii[b] = rs[i];
  }
  let last = radii.find((r) => r > 0) ?? height * 0.3;
  for (let b = 0; b < BINS; b++) {
    if (radii[b] === 0) radii[b] = last;
    else last = radii[b];
  }
  return { minY, maxY, height, radii };
}

function radiusAt(p: Profile, y: number) {
  const t = ((y - p.minY) / p.height) * BINS - 0.5;
  const i = THREE.MathUtils.clamp(Math.floor(t), 0, BINS - 1);
  const j = Math.min(BINS - 1, i + 1);
  return THREE.MathUtils.lerp(p.radii[i], p.radii[j], THREE.MathUtils.clamp(t - i, 0, 1));
}

function forEachMaterial(root: THREE.Object3D, fn: (m: THREE.Material) => void) {
  root.traverse((o) => {
    const mat = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    if (!mat) return;
    (Array.isArray(mat) ? mat : [mat]).forEach(fn);
  });
}

function setLayer(root: THREE.Object3D, layer: number) {
  root.traverse((o) => o.layers.set(layer));
}

const CIRCLE = Array.from({ length: 97 }, (_, i) => {
  const a = (i / 96) * Math.PI * 2;
  return new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
});

interface PrintRevealProps {
  children: ReactNode;
  visible: boolean;
  /** Show the hotend riding the cut height. */
  hotend?: boolean;
}

/**
 * Builds the model bottom-up like a real print: a horizontal clipping plane
 * rises from the model's base to its top, with a molten edge at the cut.
 * Starts when the model is on screen and plays once per page load.
 */
export function PrintReveal({ children, visible, hotend = false }: PrintRevealProps) {
  const key = useId();
  const content = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Group>(null);
  const nozzle = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, -1, 0), 0), []);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [finished, setFinished] = useState(
    () => modelPrintStart.get() !== null && modelPrintProgress() >= 1,
  );
  const clipped = useRef(false);
  const doneAt = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (!content.current) return;
    const root = content.current;
    setProfile(measureProfile(root));
    if (!finished) {
      forEachMaterial(root, (m) => {
        m.clippingPlanes = [plane];
        m.clipShadows = true;
        m.needsUpdate = true;
      });
      clipped.current = true;
    }
    startHeroPrint();
    startModelPrint();
    return () => {
      if (!clipped.current) return;
      forEachMaterial(root, (m) => {
        m.clippingPlanes = null;
        m.needsUpdate = true;
      });
      clipped.current = false;
    };
    // Measured once per mounted model.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setAnimating(key, visible && !finished);
    return () => setAnimating(key, false);
  }, [key, visible, finished]);

  useEffect(() => {
    if (ring.current) setLayer(ring.current, FX_LAYER);
  });

  useFrame(() => {
    if (!visible || !profile || !content.current) return;
    const now = performance.now();
    const p = modelPrintProgress(now);
    const cut = THREE.MathUtils.lerp(profile.minY, profile.maxY, p);

    if (p < 1) {
      plane.normal.set(0, -1, 0);
      plane.constant = cut;
      plane.applyMatrix4(content.current.matrixWorld);
    } else if (clipped.current) {
      forEachMaterial(content.current, (m) => {
        m.clippingPlanes = null;
        m.needsUpdate = true;
      });
      clipped.current = false;
    }

    if (p >= 1 && doneAt.current === null) doneAt.current = now;
    const park = doneAt.current === null ? 0 : Math.min(1, (now - doneAt.current) / PARK_MS);
    const r = radiusAt(profile, Math.min(cut, profile.maxY));

    if (ring.current) {
      const started = p > 0.002;
      ring.current.visible = started && park < 1;
      ring.current.position.y = cut;
      const s = r * 1.025 + profile.height * 0.004;
      ring.current.scale.set(s, 1, s);
      ring.current.children.forEach((child, i) => {
        const mat = (child as THREE.Mesh).material as THREE.Material;
        mat.opacity = (i === 0 ? 1 : 0.22) * (1 - park);
      });
    }

    if (nozzle.current) {
      const a = now * 0.0021;
      const lift = park * park * profile.height * 0.7;
      nozzle.current.position.set(Math.cos(a) * r, cut + lift, Math.sin(a) * r);
      const s = profile.height * 0.2 * (1 - park);
      nozzle.current.scale.setScalar(Math.max(s, 1e-4));
      nozzle.current.visible = park < 1 && p > 0.002;
    }

    if (light.current) {
      const h = profile.height;
      light.current.position.set(0, cut + h * 0.04, r + h * 0.35);
      light.current.distance = h * 0.9;
      light.current.intensity = THREE.MathUtils.lerp(h * h * 0.5, h * h * 0.05, park);
    }

    if (park >= 1 && !finished) setFinished(true);
  });

  const hotendEntry = MODELS.hotend;

  return (
    <>
      <group ref={content}>{children}</group>

      {profile && (
        <pointLight
          ref={light}
          color={MOLTEN}
          decay={2}
          position={[0, profile.maxY, profile.radii[BINS - 1] + profile.height * 0.35]}
          intensity={finished ? profile.height * profile.height * 0.05 : 0}
          distance={profile.height * 0.9}
        />
      )}

      {profile && !finished && (
        <group ref={ring} visible={false}>
          <Line points={CIRCLE} color={MOLTEN} lineWidth={2} transparent toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
          <Line points={CIRCLE} color={MOLTEN} lineWidth={9} transparent opacity={0.22} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
        </group>
      )}

      {profile && hotend && !finished && (
        <group ref={nozzle} visible={false}>
          {hotendEntry.src ? (
            <ModelErrorBoundary fallback={<FxLayer><PlaceholderModel kind={hotendEntry.placeholder} /></FxLayer>}>
              <Suspense fallback={null}>
                <FitTip>
                  <GLBModel src={hotendEntry.src} draco={hotendEntry.draco ?? true} />
                </FitTip>
              </Suspense>
            </ModelErrorBoundary>
          ) : (
            <FxLayer>
              <PlaceholderModel kind={hotendEntry.placeholder} />
            </FxLayer>
          )}
        </group>
      )}
    </>
  );
}

function FxLayer({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    if (ref.current) setLayer(ref.current, FX_LAYER);
  });
  return <group ref={ref}>{children}</group>;
}

/** Normalises a hotend model: ~1.15 units tall, tip (lowest point) at the origin. */
function FitTip({ children }: { children: ReactNode }) {
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    if (!outer.current || !inner.current) return;
    inner.current.position.set(0, 0, 0);
    inner.current.scale.setScalar(1);
    outer.current.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(inner.current);
    const size = box.getSize(new THREE.Vector3());
    const s = size.y > 0 ? 1.15 / size.y : 1;
    const center = box.getCenter(new THREE.Vector3());
    inner.current.scale.setScalar(s);
    inner.current.position.set(-center.x * s, -box.min.y * s, -center.z * s);
    setLayer(outer.current, FX_LAYER);
  });
  return (
    <group ref={outer}>
      <group ref={inner}>{children}</group>
    </group>
  );
}
