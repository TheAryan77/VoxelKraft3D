"use client";

import { Suspense } from "react";
import { Environment } from "@react-three/drei";

/** Warm key, cool rim, low-intensity warehouse environment. Used in every slot. */
export function StudioLights({ environmentIntensity = 0.4 }: { environmentIntensity?: number }) {
  return (
    <>
      <Suspense fallback={null}>
        {/* Self-hosted, downsampled copy of drei's "warehouse" preset. */}
        <Environment files="/hdri/warehouse-512.hdr" environmentIntensity={environmentIntensity} />
      </Suspense>
      <directionalLight color="#ffd9b8" intensity={2.6} position={[-3, 4.5, 3.5]} />
      <directionalLight color="#9fb4c7" intensity={0.7} position={[2.5, 2, -4.5]} />
    </>
  );
}
