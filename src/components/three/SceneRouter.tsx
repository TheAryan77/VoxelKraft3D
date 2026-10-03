"use client";

import { MaterialSphere } from "./MaterialSphere";
import { ModelScene } from "./ModelScene";
import { StlPreview } from "./StlPreview";
import type { SlotSceneDescriptor } from "./types";

export interface SceneRuntime {
  visible: boolean;
  isMobile: boolean;
  reduced: boolean;
  element: HTMLElement | null;
}

/** Maps a plain scene descriptor (built in the DOM tree) to its R3F scene. */
export function SceneRouter({ scene, runtime }: { scene: SlotSceneDescriptor; runtime: SceneRuntime }) {
  switch (scene.kind) {
    case "model":
      return <ModelScene {...scene} {...runtime} />;
    case "material":
      return <MaterialSphere materialId={scene.materialId} hovered={scene.hovered} visible={runtime.visible} reduced={runtime.reduced} />;
    case "stl":
      return <StlPreview file={scene.file} visible={runtime.visible} onMeasured={scene.onMeasured} onFail={scene.onFail} />;
  }
}
