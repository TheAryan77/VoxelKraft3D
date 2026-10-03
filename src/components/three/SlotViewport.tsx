"use client";

import { useState } from "react";
import { View, useGLTF } from "@react-three/drei";
import { DRACO_DECODER_PATH, MODELS } from "@/lib/models.config";
import { useIsMobile, useReducedMotion } from "@/lib/useReducedMotion";
import { SceneRouter } from "./SceneRouter";
import type { SlotSceneDescriptor } from "./types";

// Only the hero model is preloaded; every other slot loads when it nears the viewport.
const hero = MODELS["hero-print"];
if (hero.src) useGLTF.preload(hero.src, (hero.draco ?? true) ? DRACO_DECODER_PATH : false);

interface SlotViewportProps {
  scene: SlotSceneDescriptor;
  /** In the viewport right now. */
  visible: boolean;
  /** Hidden behind a modal. */
  hidden: boolean;
}

/** The three.js half of a slot: a drei <View> tracking the slot's rectangle. */
export default function SlotViewport({ scene, visible, hidden }: SlotViewportProps) {
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();
  const [element, setElement] = useState<HTMLElement | null>(null);
  const interactive = scene.kind === "model" && !!scene.interactive;

  return (
    <View
      ref={setElement as never}
      className="absolute inset-0"
      style={{ pointerEvents: interactive ? "auto" : "none", touchAction: interactive ? "none" : undefined, cursor: interactive ? "grab" : undefined }}
      visible={!hidden}
    >
      <SceneRouter scene={scene} runtime={{ visible: visible && !hidden, isMobile, reduced, element }} />
    </View>
  );
}
