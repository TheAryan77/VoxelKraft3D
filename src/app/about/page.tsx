import type { Metadata } from "next";
import { Navbar } from "@/components/sections/Navbar";
import { AboutIntro } from "@/components/about/AboutIntro";
import { Founders } from "@/components/sections/Founders";
import { Challenge } from "@/components/sections/Challenge";
import { Journey } from "@/components/sections/Journey";
import { Materials } from "@/components/sections/Materials";
import { Delivery } from "@/components/sections/Delivery";
import { FinalCta } from "@/components/sections/FinalCta";
import { Footer } from "@/components/sections/Footer";
import { availableFiles, publicFileExists } from "@/lib/assets";
import { getChallengeReels } from "@/lib/instagram";
import { aboutCopy, site } from "@/content/site";
import { founders } from "@/content/founders";

export const metadata: Metadata = { title: "About", description: aboutCopy.intro };

/** Same as the home page: pick up new challenge reels at most once an hour. */
export const revalidate = 3600;

export default async function AboutPage() {
  const reels = await getChallengeReels();
  const hasLogo = publicFileExists(site.logoSrc);
  const founderPhotos = availableFiles(founders.map((f) => f.src));

  return (
    <>
      <Navbar hasLogo={hasLogo} />
      <main id="main">
        <AboutIntro />
        <Founders photos={founderPhotos} />
        <Challenge reels={reels} />
        <Journey />
        <Materials />
        <Delivery />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
