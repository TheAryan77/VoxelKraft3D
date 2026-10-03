"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, PerspectiveCamera } from "@react-three/drei";
import { materials, type MaterialId } from "@/content/materials";
import { setAnimating } from "@/lib/sceneStore";
import { StudioLights } from "./StudioLights";

let layerNormalMap: THREE.DataTexture | null = null;

/**
 * Normal map of fine horizontal ridges: the layer lines of an FDM print.
 * Mapped onto the sphere's UVs, the stripes follow lines of latitude.
 */
function getLayerNormalMap() {
  if (layerNormalMap) return layerNormalMap;
  const h = 32;
  const data = new Uint8Array(4 * h * 4);
  for (let y = 0; y < h; y++) {
    // Each layer is a rounded bead: height ~ sin(pi * t). Slope gives the normal.
    const t = y / h;
    const slope = Math.cos(Math.PI * t) * 0.9;
    const n = new THREE.Vector3(0, -slope, 1).normalize();
    for (let x = 0; x < 4; x++) {
      const i = (y * 4 + x) * 4;
      data[i] = Math.round((n.x * 0.5 + 0.5) * 255);
      data[i + 1] = Math.round((n.y * 0.5 + 0.5) * 255);
      data[i + 2] = Math.round((n.z * 0.5 + 0.5) * 255);
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, 4, h, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 70);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  layerNormalMap = tex;
  return tex;
}

interface MaterialSphereProps {
  materialId: MaterialId;
  hovered: boolean;
  visible: boolean;
  reduced: boolean;
}

/** Procedural material swatch: no GLB, just MeshPhysicalMaterial tuned per material. */
export function MaterialSphere({ materialId, hovered, visible, reduced }: MaterialSphereProps) {
  const key = useId();
  const mesh = useRef<THREE.Mesh>(null);
  const spinSpeed = useRef(0);
  const invalidate = useThree((s) => s.invalidate);
  const surface = materials.find((m) => m.id === materialId)!.surface;

  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: surface.color,
      roughness: surface.roughness,
      metalness: surface.metalness ?? 0,
      clearcoat: surface.clearcoat ?? 0,
      clearcoatRoughness: surface.clearcoatRoughness ?? 0,
      transmission: surface.transmission ?? 0,
      thickness: surface.thickness ?? 0,
      ior: surface.ior ?? 1.5,
      sheen: surface.sheen ?? 0,
      sheenColor: new THREE.Color(surface.sheenColor ?? "#ffffff"),
    });
    if (surface.layerLines) {
      m.normalMap = getLayerNormalMap();
      m.normalScale = new THREE.Vector2(0.45, 0.45);
    }
    return m;
  }, [surface]);

  useEffect(() => () => material.dispose(), [material]);

  const active = hovered && !reduced;
  useEffect(() => {
    setAnimating(key, visible && active);
    return () => setAnimating(key, false);
  }, [key, visible, active]);

  useFrame((_, delta) => {
    if (!visible || !mesh.current) return;
    const dt = Math.min(delta, 0.1);
    spinSpeed.current = THREE.MathUtils.damp(spinSpeed.current, active ? 1 : 0, 5, dt);
    mesh.current.rotation.y += dt * 0.9 * spinSpeed.current;

    let settling = Math.abs(spinSpeed.current - (active ? 1 : 0)) > 0.002;
    if (surface.squash) {
      const sy = active ? 0.9 : 1;
      const sxz = active ? 1.05 : 1;
      const s = mesh.current.scale;
      s.y = THREE.MathUtils.damp(s.y, sy, 8, dt);
      s.x = s.z = THREE.MathUtils.damp(s.x, sxz, 8, dt);
      mesh.current.position.y = s.y - 1;
      if (Math.abs(s.y - sy) > 0.001) settling = true;
    }
    if (settling) invalidate();
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.35, 4.6]} fov={30} onUpdate={(c) => c.lookAt(0, -0.08, 0)} />
      <StudioLights environmentIntensity={0.55} />
      <mesh ref={mesh} material={material}>
        <sphereGeometry args={[1, 96, 64]} />
      </mesh>
      {visible && (
        <ContactShadows position={[0, -1.01, 0]} scale={3.6} far={1.2} resolution={256} blur={2.5} opacity={0.4} />
      )}
    </>
  );
}
