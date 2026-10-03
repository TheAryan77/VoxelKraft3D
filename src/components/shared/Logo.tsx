import { cn } from "@/lib/utils";
import { site } from "@/content/site";

/** The logo file once it exists, otherwise a placeholder wordmark. */
export function Logo({ hasLogo, className }: { hasLogo: boolean; className?: string }) {
  if (hasLogo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={site.logoSrc} alt={site.name} className={cn("h-7 w-auto", className)} />;
  }
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-text", className)}>
      <span aria-hidden className="flex w-4 flex-col gap-[3px]">
        <span className="h-[3px] w-4 rounded-full bg-text" />
        <span className="h-[3px] w-4 rounded-full bg-text" />
        <span className="h-[3px] w-3 rounded-full bg-text-muted" />
      </span>
      <span className="font-heading text-[15px] leading-none tracking-tight">{site.name}</span>
    </span>
  );
}
