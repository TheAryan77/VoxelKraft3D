"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { modalOpen } from "@/lib/sceneStore";
import { useStore } from "@/lib/store";
import type { SlotSceneDescriptor } from "./types";

const SlotViewport = dynamic(() => import("./SlotViewport"), { ssr: false });

interface SceneSlotProps {
  scene: SlotSceneDescriptor;
  className?: string;
  style?: CSSProperties;
  /** Page slots hide while a modal holds the canvas. */
  layer?: "page" | "modal";
  children?: ReactNode;
}

/**
 * DOM rectangle that a 3D scene renders into. Mounts its scene once it is
 * within one viewport of the screen, and reports on-screen visibility so the
 * scene can pause its updates.
 */
export function SceneSlot({ scene, className, style, layer = "page", children }: SceneSlotProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const isModalOpen = useStore(modalOpen);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const nearObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          nearObserver.disconnect();
        }
      },
      { rootMargin: "100% 100% 100% 100%" },
    );
    const visibleObserver = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    nearObserver.observe(el);
    visibleObserver.observe(el);
    return () => {
      nearObserver.disconnect();
      visibleObserver.disconnect();
    };
  }, []);

  const hidden = layer === "page" && isModalOpen;

  return (
    <div ref={ref} className={cn("relative", className)} style={style}>
      {children}
      {near && <SlotViewport scene={scene} visible={visible} hidden={hidden} />}
    </div>
  );
}
