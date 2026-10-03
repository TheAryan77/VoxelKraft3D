import { cursorProps } from "@/lib/cursor";
import { cursorCopy, footerCopy, site } from "@/content/site";
import { modelCredits } from "@/content/credits";
import { TextHoverEffect } from "@/components/ui/text-hover-effect";
import { IconBrandInstagram, IconBrandWhatsapp } from "@tabler/icons-react";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative" {...cursorProps(cursorCopy.footer)}>
      {/* Six hairline layer lines as the divider. */}
      <div aria-hidden className="layer-lines w-full" />
      {/* Big outlined wordmark at the very bottom; glows where the mouse is. */}
      <div className="container-site pt-12 md:pt-16">
        <TextHoverEffect text={footerCopy.wordmark} duration={0.15} />
        <div className="pb-8 pt-2">
          {/* Instagram and WhatsApp (Anurag) */}
          <div className="mb-4 flex justify-center gap-3">
            {[
              { href: site.contact.instagram, label: footerCopy.instagramLabel, Icon: IconBrandInstagram },
              { href: site.contact.whatsapp, label: footerCopy.whatsappLabel, Icon: IconBrandWhatsapp },
            ].map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="grid h-11 w-11 place-items-center rounded-full border border-line text-text-muted transition-[color,border-color,transform] hover:border-pei/60 hover:text-text active:scale-[0.97]"
              >
                <Icon size={20} stroke={1.5} aria-hidden />
              </a>
            ))}
          </div>
          <p className="text-center font-machine text-xs text-text-muted">{footerCopy.copyright(year)}</p>
            {modelCredits.length > 0 && (
              <p className="mx-auto mt-2 max-w-4xl text-center text-[11px] leading-relaxed text-text-muted/80">
                {footerCopy.creditsLabel}{" "}
                {modelCredits.map((c, i) => (
                  <span key={c.url}>
                    {i > 0 && ", "}
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="underline decoration-line underline-offset-2 hover:text-text">
                      {c.title}
                    </a>{" "}
                    {footerCopy.creditBy} {c.author} (
                    <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-line underline-offset-2 hover:text-text">
                      {c.license}
                    </a>
                    )
                  </span>
                ))}
              </p>
            )}
        </div>
      </div>
    </footer>
  );
}
