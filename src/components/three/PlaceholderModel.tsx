"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import type { PlaceholderKind } from "@/lib/models.config";
import { useStore } from "@/lib/store";
import { appearanceStore } from "@/lib/theme";
import { sceneColors } from "@/lib/themeConfig";
import { getPlaceholderGeometry } from "./placeholderGeometries";

/** Faint wireframe (tinted by the accent) over a solid in the palette: intentional, not broken. */
export function PlaceholderModel({ kind }: { kind: PlaceholderKind }) {
  const { solid, edges } = getPlaceholderGeometry(kind);
  const { palette, accent } = useStore(appearanceStore);
  const invalidate = useThree((s) => s.invalidate);

  const materials = useMemo(
    () => ({
      solid: new THREE.MeshStandardMaterial({
        color: "#171513",
        roughness: 0.82,
        metalness: 0.05,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      }),
      line: new THREE.LineBasicMaterial({ color: "#2a2622", toneMapped: false }),
    }),
    [],
  );

  useEffect(() => {
    const c = sceneColors(palette, accent);
    materials.solid.color.set(c.solid);
    materials.line.color.set(c.placeholderLine);
    invalidate();
  }, [materials, palette, accent, invalidate]);

  useEffect(
    () => () => {
      materials.solid.dispose();
      materials.line.dispose();
    },
    [materials],
  );

  return (
    <group>
      <mesh geometry={solid} material={materials.solid} />
      <lineSegments geometry={edges} material={materials.line} />
    </group>
  );
}
