import type { ReactNode } from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { publicFileExists } from "@/lib/assets";
import { site } from "@/content/site";

/** Shop, product, cart, checkout and account pages share the landing page's navbar and footer. */
export default function ShopLayout({ children }: { children: ReactNode }) {
  const hasLogo = publicFileExists(site.logoSrc);
  return (
    <>
      <Navbar hasLogo={hasLogo} />
      <main id="main" className="min-h-[70vh] pb-16 pt-28 md:pb-24 md:pt-36">
        {children}
      </main>
      <Footer />
    </>
  );
}
