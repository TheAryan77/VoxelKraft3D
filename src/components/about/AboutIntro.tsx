import { Spotlight } from "@/components/ui/spotlight";
import { MoltenButton } from "@/components/shared/Button";
import { aboutCopy } from "@/content/site";
import { cn } from "@/lib/utils";
import Link from "next/link";

/** Top of /about: who we are, a few facts, and how we work. */
export function AboutIntro() {
  return (
    <section aria-labelledby="about-heading" className="relative overflow-hidden pb-12 pt-32 md:pb-20 md:pt-44">
      <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="var(--color-molten)" />
      <div className="container-site relative">
        <p className="font-machine text-xs uppercase tracking-[0.2em] text-molten">{aboutCopy.eyebrow}</p>
        <h1 id="about-heading" className="mt-4 font-display text-[length:var(--text-display)] leading-[0.95] text-text">
          {aboutCopy.headline.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h1>
        <p className="prose-body mt-6 max-w-2xl text-base text-text-muted md:text-lg">{aboutCopy.intro}</p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <MoltenButton href={aboutCopy.cta.href}>{aboutCopy.cta.label}</MoltenButton>
          <Link href={aboutCopy.shop.href} className="text-sm font-medium text-text underline decoration-line underline-offset-[6px] transition-colors hover:decoration-pei">
            {aboutCopy.shop.label}
          </Link>
        </div>

        <dl className="mt-12 grid grid-cols-2 border-t border-line md:mt-16 md:grid-cols-4">
          {aboutCopy.facts.map((f, i) => (
            <div key={f.label} className={cn("border-b border-line py-5 pr-4 md:border-b-0 md:py-6", i % 2 === 1 && "pl-4 md:pl-0", i > 0 && "md:border-l md:pl-6")}>
              <dt className="text-xs text-text-muted">{f.label}</dt>
              <dd className="mt-1 font-machine text-sm text-text md:text-base">{f.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-16 md:mt-24">
          <h2 className="font-heading text-[length:var(--text-heading)] text-text">{aboutCopy.valuesHeading}</h2>
          <ol className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
            {aboutCopy.values.map((v, i) => (
              <li key={v.title} className="rounded-[20px] border border-line bg-surface p-6 transition-colors hover:border-pei/40 md:p-7">
                <span className="font-machine text-xs text-molten">0{i + 1}</span>
                <h3 className="mt-3 font-heading text-xl text-text">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{v.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
