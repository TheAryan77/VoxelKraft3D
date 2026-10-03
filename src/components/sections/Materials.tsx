"use client";

import { cursorProps } from "@/lib/cursor";
import { useState } from "react";
import { SceneSlot } from "@/components/three/SceneSlot";
import { materials, type Material } from "@/content/materials";
import { cursorCopy, materialsCopy } from "@/content/site";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";

const PROPERTY_KEYS = ["strength", "flexibility", "detail", "heat"] as const;

export function Materials() {
  return (
    <section id="materials" aria-labelledby="materials-heading" className="section-pad" {...cursorProps(cursorCopy.materials)}>
      <div className="container-site">
        <SectionHeading id="materials-heading" title={materialsCopy.heading} sub={materialsCopy.sub} />
      </div>
      {/* Horizontal scroll-snap rail on mobile, five columns on desktop. */}
      <div className="container-site !px-0 md:!px-8">
        <ul className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 md:grid md:grid-cols-5 md:overflow-visible md:px-0">
          {materials.map((m) => (
            <MaterialCard key={m.id} material={m} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function MaterialCard({ material }: { material: Material }) {
  const [hovered, setHovered] = useState(false);

  return (
    <li
      tabIndex={0}
      aria-labelledby={`material-${material.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className="group/material relative flex w-[78vw] max-w-[320px] shrink-0 snap-start flex-col rounded-[20px] border border-line bg-surface p-2 transition-colors duration-300 hover:border-pei/40 focus-visible:border-pei/40 md:w-auto md:max-w-none"
    >
      <SceneSlot
        scene={{ kind: "material", materialId: material.id, hovered }}
        className="aspect-square w-full overflow-hidden rounded-[14px] bg-surface-2/60"
      />
      <div className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-4">
        <h3 id={`material-${material.id}`} className="font-heading text-xl text-text">
          {material.name}
        </h3>
        {/* Summary and property bars share one cell: bars replace the summary
            on hover or focus, and sit below it on touch screens. */}
        <div className="grid [@media(hover:hover)]:grid-cols-1 [@media(hover:hover)]:[&>*]:[grid-area:1/1]">
          <div className="flex flex-col gap-2 transition-opacity duration-300 [@media(hover:hover)]:group-hover/material:opacity-0 [@media(hover:hover)]:group-focus-visible/material:opacity-0">
            <p className="text-sm text-text-muted">{material.summary}</p>
            <p className="text-xs text-text-muted">{material.bestFor}</p>
          </div>
          <dl
            className={cn(
              "mt-4 flex flex-col gap-2.5 transition-opacity duration-300 [@media(hover:hover)]:mt-0",
              "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/material:opacity-100 [@media(hover:hover)]:group-focus-visible/material:opacity-100",
            )}
          >
            {PROPERTY_KEYS.map((key) => {
              const value = material.properties[key];
              return (
                <div key={key} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
                  <dt className="text-xs text-text-muted">{materialsCopy.properties[key]}</dt>
                  <dd className="font-machine text-xs text-text-muted">
                    {value}
                    <span className="sr-only"> out of 5</span>
                  </dd>
                  <div aria-hidden className="col-span-2 h-[3px] overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-pei" style={{ width: `${(value / 5) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </li>
  );
}
