"use client";

import dynamic from "next/dynamic";

// three.js stays out of the main bundle; the canvas loads after hydration.
const SceneCanvas = dynamic(() => import("./SceneCanvas"), { ssr: false });

export function SceneCanvasLoader() {
  return <SceneCanvas />;
}
