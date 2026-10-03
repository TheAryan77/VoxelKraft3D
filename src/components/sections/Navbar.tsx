"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavBody,
  NavItems,
  Navbar as ResizableNavbar,
} from "@/components/ui/resizable-navbar";
import { MovingBorderLink, MoltenButton } from "@/components/shared/Button";
import { Logo } from "@/components/shared/Logo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { nav } from "@/content/site";
import { heroCtaVisible } from "@/lib/sceneStore";
import { useStore } from "@/lib/store";

export function Navbar({ hasLogo }: { hasLogo: boolean }) {
  const [open, setOpen] = useState(false);
  // While the hero's own CTA is on screen, the nav CTA stays quiet so molten
  // appears in at most two places per viewport.
  const heroCtaOnScreen = useStore(heroCtaVisible);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <ResizableNavbar>
      <NavBody>
        <Link href="/" aria-label={nav.home} className="relative z-20 rounded-full px-3 py-2">
          <Logo hasLogo={hasLogo} />
        </Link>
        <NavItems items={nav.links} />
        <div className="relative z-20 flex items-center gap-2">
          <ThemeToggle />
          <MovingBorderLink href={nav.cta.href} live={!heroCtaOnScreen} containerClassName="h-11">
            {nav.cta.label}
          </MovingBorderLink>
        </div>
      </NavBody>

      <MobileNav>
        <MobileNavHeader>
          <Link href="/" aria-label={nav.home} className="rounded-full px-2 py-2" onClick={() => setOpen(false)}>
            <Logo hasLogo={hasLogo} />
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle className="border-transparent" />
            <MobileNavToggle
              isOpen={open}
              onClick={() => setOpen((o) => !o)}
              openLabel={nav.openMenu}
              closeLabel={nav.closeMenu}
              controls="mobile-menu"
            />
          </div>
        </MobileNavHeader>
      </MobileNav>

      <MobileNavMenu isOpen={open} id="mobile-menu">
        <nav>
          <ul className="flex flex-col gap-2">
            {nav.links.map((item) => (
              <li key={item.link}>
                <a
                  href={item.link}
                  onClick={() => setOpen(false)}
                  className="block py-2 font-display text-[2rem] text-text transition-colors hover:text-text-muted"
                >
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <MoltenButton href={nav.cta.href} onClick={() => setOpen(false)} className="mt-10 w-full">
          {nav.cta.label}
        </MoltenButton>
      </MobileNavMenu>
    </ResizableNavbar>
  );
}
