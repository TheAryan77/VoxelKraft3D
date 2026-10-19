import Image from "next/image";
import { cn } from "@/lib/utils";
import { site } from "@/content/site";

/** The full logo file once it exists, otherwise the wolf mark plus the name. */
export function Logo({ hasLogo, className }: { hasLogo: boolean; className?: string }) {
  if (hasLogo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={site.logoSrc} alt={site.name} className={cn("block h-7 w-auto", className)} />;
  }
  return (
    <span className={cn("flex items-center gap-2.5 text-text", className)}>
      <Image src="/brand/mark.png" alt="" width={32} height={32} priority className="h-8 w-8 shrink-0 rounded-full" />
      <span className="font-heading text-[15px] leading-none tracking-tight">{site.name}</span>
    </span>
  );
}
