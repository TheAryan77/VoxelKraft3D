"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import type { PlaceholderKind } from "@/lib/models.config";
import { useStore } from "@/lib/store";
import { themeStore } from "@/lib/theme";
import { getPlaceholderGeometry } from "./placeholderGeometries";

/** --surface-2 and --line per theme. Kept in sync with globals.css. */
const COLORS = {
  dark: { solid: "#171513", line: "#2a2622" },
  light: { solid: "#fff4ec", line: "#f2a877" },
};

/** Wireframe in --line over a faint solid in --surface-2: intentional, not broken. */
export function PlaceholderModel({ kind }: { kind: PlaceholderKind }) {
  const { solid, edges } = getPlaceholderGeometry(kind);
  const theme = useStore(themeStore);
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
    materials.solid.color.set(COLORS[theme].solid);
    materials.line.color.set(COLORS[theme].line);
    invalidate();
  }, [materials, theme, invalidate]);

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
