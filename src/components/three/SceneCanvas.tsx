"use client";

import { useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { animatingCount, modalOpen, pointer } from "@/lib/sceneStore";
import { useStore } from "@/lib/store";

/**
 * The one WebGL context on the page. Every <ModelSlot> renders into it through
 * drei's <View>, which scissors each slot to its DOM rectangle.
 */
export default function SceneCanvas() {
  const isModalOpen = useStore(modalOpen);

  return (
    <Canvas
      // Above section content (so opaque cards don't hide models) but below the
      // navbar. While a modal holds a model, it moves above the modal.
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: isModalOpen ? 110 : 30,
      }}
      eventSource={typeof document !== "undefined" ? document.body : undefined}
      eventPrefix="client"
      frameloop="demand"
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.localClippingEnabled = true;
        gl.setClearColor(0x000000, 0);
      }}
      aria-hidden
    >
      <ClearPass />
      <FrameloopController />
      <View.Port />
    </Canvas>
  );
}

/** Views render with autoClear off, so clear the whole canvas once per frame first. */
function ClearPass() {
  useFrame(({ gl }) => {
    gl.setScissorTest(false);
    gl.clear(true, true, true);
  }, 0.5);
  return null;
}

/**
 * frameloop="always" only while a visible slot is animating, otherwise "demand".
 * In demand mode, scrolling and pointer moves still request frames so views
 * stay glued to their DOM rectangles.
 */
function FrameloopController() {
  const count = useStore(animatingCount);
  const setFrameloop = useThree((s) => s.setFrameloop);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    setFrameloop(count > 0 ? "always" : "demand");
  }, [count, setFrameloop]);

  useEffect(() => {
    const onScroll = () => invalidate();
    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      invalidate();
    };
    // Capture catches scrolling inside horizontal rails and modals too.
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    const unsubModal = modalOpen.subscribe(onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointermove", onPointer);
      unsubModal();
    };
  }, [invalidate]);

  return null;
}
