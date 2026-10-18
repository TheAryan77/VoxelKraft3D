import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import { site } from "@/content/site";
import { GrainOverlay } from "@/components/shared/GrainOverlay";
import { SmoothScroll } from "@/components/shared/SmoothScroll";
import { ThemeSync } from "@/components/shared/ThemeSync";
import { SessionProvider } from "@/components/shop/SessionProvider";
import { FollowingPointerLayer } from "@/components/ui/following-pointer";
import { SceneCanvasLoader } from "@/components/three/SceneCanvasLoader";
import { DEFAULT_ACCENT, DEFAULT_PALETTE, THEME_COLORS, appearanceCss, themeInitScript } from "@/lib/themeConfig";

// One family, two widths: Archivo's variable width axis (62–125%).
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  title: { default: `${site.name}: custom 3D printing studio`, template: `%s | ${site.name}` },
  description: site.description,
};

export const viewport: Viewport = {
  themeColor: THEME_COLORS[DEFAULT_PALETTE],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // The init script may swap these for the visitor's saved palette/accent before hydration.
    <html
      lang="en"
      className={archivo.variable}
      data-theme="dark"
      data-palette={DEFAULT_PALETTE}
      data-accent={DEFAULT_ACCENT}
      suppressHydrationWarning
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: appearanceCss() }} />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeSync />
        <SessionProvider>
          <SmoothScroll>{children}</SmoothScroll>
        </SessionProvider>
        <SceneCanvasLoader />
        <GrainOverlay />
        <FollowingPointerLayer />
      </body>
    </html>
  );
}
