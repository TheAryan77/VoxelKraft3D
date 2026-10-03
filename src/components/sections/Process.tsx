"use client";

import { cursorProps } from "@/lib/cursor";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { PhotoSlot } from "@/components/shared/PhotoSlot";
import { LayerReveal } from "@/components/shared/LayerReveal";
import { cursorCopy, processContactCopy, processCopy, site } from "@/content/site";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { SectionHeading } from "./SectionHeading";

export type StepMedia = { type: "video"; src: string } | { type: "image"; src: string } | { type: "none"; src: string };

export function Process({ media }: { media: StepMedia[] }) {
  const reduced = useReducedMotion();

  return (
    <section id="process" aria-labelledby="process-heading" className="section-pad" {...cursorProps(cursorCopy.process)}>
      <div className="container-site">
        <SectionHeading id="process-heading" title={processCopy.heading} />
        <TracingBeam>
          <ol className="flex flex-col gap-16 md:gap-24">
            {processCopy.steps.map((step, i) => {
              const m = media[i];
              return (
                <li key={step.title} className="grid grid-cols-1 items-start gap-6 md:grid-cols-12 md:gap-10">
                  <div className="md:col-span-5">
                    <p className="font-machine text-sm text-text-muted">{String(i + 1).padStart(2, "0")}</p>
                    <h3 className="mt-2 font-heading text-2xl text-text md:text-3xl">{step.title}</h3>
                    <p className="prose-body mt-3 text-text-muted">{step.body}</p>
                    {"contact" in step && step.contact && <ContactLinks />}
                  </div>
                  <div className="md:col-span-7">
                    {m.type === "video" ? (
                      <LayerReveal className="relative aspect-[16/10] overflow-hidden rounded-[20px] bg-surface-2">
                        <video
                          className="absolute inset-0 h-full w-full object-cover"
                          src={m.src}
                          muted
                          loop
                          playsInline
                          autoPlay={!reduced}
                          controls={reduced}
                          preload="metadata"
                          aria-label={step.title}
                        />
                      </LayerReveal>
                    ) : (
                      <PhotoSlot
                        src={m.src}
                        alt={"mediaAlt" in step && step.mediaAlt ? step.mediaAlt : step.title}
                        available={m.type === "image"}
                        sizes={"portrait" in step && step.portrait ? "320px" : "(min-width: 768px) 55vw, 100vw"}
                        className={cn(
                          "w-full rounded-[20px] border border-line",
                          "portrait" in step && step.portrait
                            ? "mx-auto aspect-[738/1404] max-w-[300px] md:mx-0 [&_img]:object-top"
                            : "aspect-[16/10]",
                        )}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </TracingBeam>
      </div>
    </section>
  );
}

/** Instagram / WhatsApp / upload shortcuts for the first step. Links that are
 * still {PLACEHOLDERS} in site.ts are hidden until filled in. */
function ContactLinks() {
  const links = [
    { href: site.contact.instagram, label: processContactCopy.instagram, external: true },
    { href: site.contact.whatsapp, label: processContactCopy.whatsapp, external: true },
    { href: "#quote", label: processContactCopy.upload, external: false },
  ].filter((l) => !l.href.startsWith("{"));
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="inline-flex h-11 items-center rounded-full border border-line px-5 text-sm font-medium text-text transition-[border-color,transform] hover:border-pei/60 active:scale-[0.97]"
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}
