import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Services } from "@/components/sections/Services";
import { Work } from "@/components/sections/Work";
import { Process, type StepMedia } from "@/components/sections/Process";
import { Materials } from "@/components/sections/Materials";
import { Challenge } from "@/components/sections/Challenge";
import { Quote } from "@/components/sections/Quote";
import { Founders } from "@/components/sections/Founders";
import { Reviews } from "@/components/sections/Reviews";
import { Delivery } from "@/components/sections/Delivery";
import { FinalCta } from "@/components/sections/FinalCta";
import { Footer } from "@/components/sections/Footer";
import { availableFiles, publicFileExists } from "@/lib/assets";
import { getChallengeReels } from "@/lib/instagram";
import { processCopy, site } from "@/content/site";
import { work } from "@/content/work";
import { founders } from "@/content/founders";

/** Re-check Instagram for new challenge reels at most once an hour. */
export const revalidate = 3600;

export default async function Home() {
  const reels = await getChallengeReels();
  // Media is checked at build time, so placeholders show until files are added.
  const hasLogo = publicFileExists(site.logoSrc);
  const workPhotos = availableFiles(work.map((w) => w.photo));
  const founderPhotos = availableFiles(founders.map((f) => f.src));
  const processMedia: StepMedia[] = processCopy.steps.map(({ media }) => {
    if (publicFileExists(`${media}.mp4`)) return { type: "video", src: `${media}.mp4` };
    if (publicFileExists(`${media}.jpg`)) return { type: "image", src: `${media}.jpg` };
    return { type: "none", src: `${media}.jpg` };
  });

  return (
    <>
      <a
        href="#main"
        className="fixed left-4 top-4 z-[300] -translate-y-24 rounded-full bg-text px-4 py-2 text-sm text-bg focus:translate-y-0"
      >
        Skip to content
      </a>
      <Navbar hasLogo={hasLogo} />
      <main id="main">
        <Hero />
        <Services />
        <Work photos={workPhotos} />
        <Process media={processMedia} />
        <Materials />
        <Challenge reels={reels} />
        <Founders photos={founderPhotos} />
        <Reviews />
        <FinalCta />
        <Quote />
        <Delivery />
      </main>
      <Footer />
    </>
  );
}
