import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import { site } from "@/content/site";
import { GrainOverlay } from "@/components/shared/GrainOverlay";
import { SmoothScroll } from "@/components/shared/SmoothScroll";
import { ThemeSync } from "@/components/shared/ThemeSync";
import { FollowingPointerLayer } from "@/components/ui/following-pointer";
import { SceneCanvasLoader } from "@/components/three/SceneCanvasLoader";
import { THEME_COLORS, themeInitScript } from "@/lib/themeConfig";

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
  themeColor: THEME_COLORS.dark,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // data-theme may be changed by the init script before hydration.
    <html lang="en" className={archivo.variable} data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeSync />
        <SmoothScroll>{children}</SmoothScroll>
        <SceneCanvasLoader />
        <GrainOverlay />
        <FollowingPointerLayer />
      </body>
    </html>
  );
}
