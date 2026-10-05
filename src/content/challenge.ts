/**
 * The 100-day challenge, built in public on Instagram.
 *
 * The live site fetches the newest reels from Instagram on its own (see
 * src/lib/instagram.ts) when INSTAGRAM_ACCESS_TOKEN is set. `fallbackReels`
 * is what shows when it isn't, or if Instagram can't be reached.
 */
export interface ChallengeReel {
  /** The part of the reel URL after /reel/ (instagram.com/reel/<code>/). */
  code: string;
  day: number;
  date: string;
}

export const challenge = {
  instagram: "https://www.instagram.com/voxelkraft.in/",
  handle: "@voxelkraft.in",
  goal: "₹10,00,000",
  totalDays: 100,
  /** How many reel cards to show. Older days drop off as new ones arrive. */
  cardCount: 5,
};

/** Newest first. Last updated 5 Oct 2026. */
export const fallbackReels: ChallengeReel[] = [
  { code: "DeGBHeJzFr7", day: 14, date: "4 Oct 2026" },
  { code: "DeDRtL8Tiii", day: 13, date: "3 Oct 2026" },
  { code: "DeArKRyTVjk", day: 12, date: "2 Oct 2026" },
  { code: "Dd-MX1kTT1n", day: 11, date: "1 Oct 2026" },
  { code: "Dd7f9HAznGv", day: 10, date: "30 Sep 2026" },
];
