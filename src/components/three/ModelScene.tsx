"use client";

import { Suspense, useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Bounds, Center, ContactShadows, OrbitControls, PerspectiveCamera, useBounds } from "@react-three/drei";
import { MODELS, type ModelEntry, type ModelSlotId } from "@/lib/models.config";
import { modelPrintProgress, pointer, setAnimating } from "@/lib/sceneStore";
import { GLBModel } from "./GLBModel";
import { ModelErrorBoundary } from "./ModelErrorBoundary";
import { PlaceholderModel } from "./PlaceholderModel";
import { FX_LAYER, PrintReveal } from "./PrintReveal";
import { StudioLights } from "./StudioLights";
import type { Framing } from "./types";

export interface ModelSceneProps {
  id: ModelSlotId;
  mode?: "default" | "print-reveal";
  /** Orbit controls (zoom limited). */
  interactive?: boolean;
  /** Hover-driven rotation: spins while true on desktop, while in view on mobile. */
  active?: boolean;
  /** Tilts up to ±6° toward the cursor. */
  parallax?: boolean;
  /** Hotend rides the print edge (print-reveal only). */
  hotend?: boolean;
  framing?: Framing;
  onFail?: () => void;
}

interface RuntimeProps {
  visible: boolean;
  isMobile: boolean;
  reduced: boolean;
  /** The DOM element the view tracks, used as the orbit controls' event target. */
  element: HTMLElement | null;
}

const TILT = THREE.MathUtils.degToRad(6);
const SPIN_SPEED = 0.42; // rad/s

export function ModelScene(props: ModelSceneProps & RuntimeProps) {
  const { id, interactive, onFail } = props;
  const entry = MODELS[id];
  const camera = useRef<THREE.PerspectiveCamera>(null);

  useEffect(() => {
    camera.current?.layers.enable(FX_LAYER);
  }, []);

  const placeholderRig = <Rig {...props} entry={entry} model={<PlaceholderModel kind={entry.placeholder} />} />;

  return (
    <>
      <PerspectiveCamera ref={camera} makeDefault position={[0, 1.15, 4.4]} fov={30} near={0.01} far={500} />
      <StudioLights />
      {interactive && (
        <OrbitControls
          makeDefault
          domElement={props.element ?? undefined}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minPolarAngle={0.25}
          maxPolarAngle={Math.PI / 2 + 0.15}
        />
      )}
      {entry.src ? (
        <ModelErrorBoundary key={entry.src} fallback={placeholderRig} onError={onFail}>
          <Suspense fallback={null}>
            <Rig {...props} entry={entry} model={<GLBModel src={entry.src} draco={entry.draco ?? true} saturation={entry.saturation} finish={entry.finish} />} />
          </Suspense>
        </ModelErrorBoundary>
      ) : (
        placeholderRig
      )}
    </>
  );
}

interface Dims {
  width: number;
  height: number;
  depth: number;
}

function Rig({
  entry,
  model,
  mode = "default",
  interactive = false,
  active,
  parallax = false,
  hotend = false,
  visible,
  isMobile,
  reduced,
  element,
  framing,
}: ModelSceneProps & RuntimeProps & { entry: ModelEntry; model: ReactNode }) {
  const key = useId();
  const tilt = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Group>(null);
  const [dims, setDims] = useState<Dims | null>(null);
  const invalidate = useThree((s) => s.invalidate);
  const printReveal = mode === "print-reveal";

  // Spin target: hover-driven slots follow `active` (or visibility on mobile);
  // others follow the registry. Never under reduced motion or in orbit mode.
  let spinTarget = 0;
  if (!reduced && !interactive) {
    if (active !== undefined) spinTarget = (isMobile ? visible : active) ? 1 : 0;
    // Auto-rotating models spin on phones too, but only while on screen.
    else spinTarget = entry.autoRotate && (!isMobile || visible) ? 1 : 0;
  }
  const tiltEnabled = parallax && !reduced && !isMobile;
  const speed = useRef(spinTarget);

  useEffect(() => {
    setAnimating(key, visible && (spinTarget > 0 || interactive || tiltEnabled));
    return () => setAnimating(key, false);
  }, [key, visible, spinTarget, interactive, tiltEnabled]);

  const onCentered = useCallback(({ width, height, depth }: Dims) => {
    setDims((prev) =>
      prev && prev.width === width && prev.height === height && prev.depth === depth ? prev : { width, height, depth },
    );
  }, []);

  const onRefit = useCallback(() => invalidate(), [invalidate]);

  // Models that turn (auto-rotate, hover spin, orbit) are framed by their spin envelope.
  const turns = !!entry.autoRotate || active !== undefined || interactive;
  const envelope = useMemo<SpinEnvelope | null>(
    () => (turns && dims ? { radius: Math.hypot(dims.width, dims.depth) / 2, height: dims.height } : null),
    [turns, dims],
  );

  useFrame((_, delta) => {
    if (!visible) return;
    const dt = Math.min(delta, 0.1);
    let needsFrame = false;

    speed.current = THREE.MathUtils.damp(speed.current, spinTarget, 4, dt);
    if (Math.abs(speed.current - spinTarget) > 0.002) needsFrame = true;
    else speed.current = spinTarget;
    if (spin.current && speed.current > 0) spin.current.rotation.y += dt * SPIN_SPEED * speed.current;

    if (tilt.current) {
      const tx = tiltEnabled ? pointer.y * TILT * 0.6 : 0;
      const ty = tiltEnabled ? pointer.x * TILT : 0;
      tilt.current.rotation.x = THREE.MathUtils.damp(tilt.current.rotation.x, tx, 5, dt);
      tilt.current.rotation.y = THREE.MathUtils.damp(tilt.current.rotation.y, ty, 5, dt);
      if (Math.abs(tilt.current.rotation.x - tx) + Math.abs(tilt.current.rotation.y - ty) > 0.0005) needsFrame = true;
    }

    if (printReveal && shadow.current) {
      const mesh = shadow.current.children[0] as THREE.Mesh | undefined;
      const mat = mesh?.material as THREE.Material | undefined;
      if (mat) mat.opacity = 0.4 * Math.pow(modelPrintProgress(), 3);
    }

    if (needsFrame) invalidate();
  });

  return (
    <>
      <group ref={tilt}>
        {printReveal ? (
          <PrintReveal visible={visible} hotend={hotend}>
            <Fitted spin={spin} entry={entry} onCentered={onCentered} element={element} onRefit={onRefit} framing={framing} envelope={envelope} isMobile={isMobile}>
              {model}
            </Fitted>
          </PrintReveal>
        ) : (
          <Fitted spin={spin} entry={entry} onCentered={onCentered} element={element} onRefit={onRefit} framing={framing} envelope={envelope} isMobile={isMobile}>
            {model}
          </Fitted>
        )}
      </group>
      {dims && visible && (
        <ContactShadows
          ref={shadow}
          position={[0, -dims.height / 2 - dims.height * 0.002, 0]}
          scale={Math.max(dims.width, dims.depth) * 2.4}
          far={dims.height * 0.6}
          resolution={256}
          blur={2.5}
          opacity={printReveal ? 0 : 0.4}
          color="#000000"
        />
      )}
    </>
  );
}

/** Auto-fit: any file, any scale or origin, ends up centred and framed. */
function Fitted({
  spin,
  entry,
  onCentered,
  element,
  onRefit,
  framing,
  envelope,
  isMobile,
  children,
}: {
  spin: React.RefObject<THREE.Group | null>;
  entry: ModelEntry;
  onCentered: (d: Dims) => void;
  element: HTMLElement | null;
  onRefit: () => void;
  framing?: Framing;
  envelope: SpinEnvelope | null;
  isMobile: boolean;
  children: ReactNode;
}) {
  return (
    // No `fit`/`observe`: drei's own fit would override RefitOnResize's precise
    // one whenever the view resizes. Bounds is kept for its camera API.
    <Bounds clip margin={1.2} maxDuration={0.0001}>
      <RefitOnResize
        element={element}
        onRefit={onRefit}
        margin={framing?.margin ?? (isMobile ? entry.mobileMargin : undefined) ?? entry.margin}
        lift={framing?.lift ?? (isMobile ? entry.mobileLift : undefined) ?? entry.lift}
        envelope={envelope}
      />
      <group ref={spin}>
        <Center onCentered={onCentered}>
          <group scale={entry.scale ?? 1} rotation={entry.rotation ?? [0, 0, 0]}>
            {children}
          </group>
        </Center>
      </group>
    </Bounds>
  );
}

const FIT_MARGIN = 1.2;
const _point = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3();

/**
 * The space a model sweeps while it spins about its vertical axis. Framing to
 * this keeps the size steady and nothing clips, whatever angle it's at.
 */
export interface SpinEnvelope {
  radius: number;
  height: number;
}

/** Points to frame: the box corners, or samples around the spin envelope. */
function framingPoints(box: THREE.Box3, center: THREE.Vector3, envelope: SpinEnvelope | null) {
  const points: THREE.Vector3[] = [];
  if (envelope) {
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      for (const y of [-envelope.height / 2, envelope.height / 2]) {
        points.push(new THREE.Vector3(Math.cos(a) * envelope.radius, y, Math.sin(a) * envelope.radius));
      }
    }
    return points;
  }
  for (let i = 0; i < 8; i++) {
    points.push(
      new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).sub(center),
    );
  }
  return points;
}

/**
 * Distance at which every point fits the frustum with `margin`. drei's Bounds
 * fits the largest side at the box centre, which crops the near edge of wide
 * or deep models; projecting each point doesn't.
 */
function fitDistance(points: THREE.Vector3[], dir: THREE.Vector3, camera: THREE.PerspectiveCamera, margin = FIT_MARGIN) {
  const tanY = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) / margin;
  const tanX = tanY * camera.aspect;
  _right.crossVectors(camera.up, dir).normalize();
  _up.crossVectors(dir, _right).normalize();
  let distance = 0;
  for (const p of points) {
    _point.copy(p);
    const toward = _point.dot(dir); // how far the point sits toward the camera
    distance = Math.max(
      distance,
      toward + Math.abs(_point.dot(_up)) / tanY,
      toward + Math.abs(_point.dot(_right)) / tanX,
    );
  }
  return distance;
}

/**
 * Frames the model precisely, and again whenever its DOM slot changes size
 * (a modal growing out of a card, a phone rotating). Bounds' own `observe`
 * only tracks the canvas.
 */
function RefitOnResize({
  element,
  onRefit,
  margin = FIT_MARGIN,
  lift = 0,
  envelope = null,
}: {
  element: HTMLElement | null;
  onRefit: () => void;
  margin?: number;
  lift?: number;
  envelope?: SpinEnvelope | null;
}) {
  const bounds = useBounds();
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as unknown as { minDistance: number; maxDistance: number } | null;

  useEffect(() => {
    const fit = () => {
      const size = bounds.refresh().clip().getSize();
      // A spinning model turns about the origin (Center puts it there).
      const center = envelope ? new THREE.Vector3() : size.center;
      _dir.copy(camera.position).sub(center);
      if (_dir.lengthSq() < 1e-9) _dir.set(0, 0.25, 1);
      _dir.normalize();
      const distance = fitDistance(framingPoints(size.box, center, envelope), _dir, camera, margin);
      // Lifting = moving camera and target down together, so the model sits higher.
      const target = center.clone();
      if (lift) {
        const visibleHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
        target.addScaledVector(_up, -lift * visibleHeight);
      }
      bounds.moveTo(target.clone().addScaledVector(_dir, distance)).lookAt({ target });
      // Orbit zoom stays in a band around the fitted distance.
      if (controls) {
        controls.minDistance = distance * 0.6;
        controls.maxDistance = distance * 1.4;
      }
      onRefit();
    };
    fit();
    if (!element) return;

    let last = "";
    let frame = 0;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const key = `${Math.round(width)}x${Math.round(height)}`;
      if (key === last || width === 0 || height === 0) return;
      last = key;
      cancelAnimationFrame(frame);
      // Wait a frame so the view has picked up the new aspect ratio.
      frame = requestAnimationFrame(fit);
    });
    ro.observe(element);
    // Layout animations move the slot with transforms, which ResizeObserver
    // doesn't see; refit once more after they settle.
    const settle = window.setTimeout(fit, 700);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
    };
  }, [element, bounds, camera, controls, onRefit, margin, lift, envelope]);
  return null;
}
