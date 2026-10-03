/**
 * The 100-day challenge, built in public on Instagram.
 * To add a new day: put the newest reel first. The shortcode is the part of
 * the reel URL after /reel/ (instagram.com/reel/<code>/).
 */
export const challenge = {
  instagram: "https://www.instagram.com/voxelkraft.in/",
  handle: "@voxelkraft.in",
  goal: "₹10,00,000",
  totalDays: 100,
  /** Newest first. Shown at different sizes; five fit the layout best. */
  reels: [
    { code: "DeArKRyTVjk", day: 12, date: "2 Oct 2026" },
    { code: "Dd-MX1kTT1n", day: 11, date: "1 Oct 2026" },
    { code: "Dd7f9HAznGv", day: 10, date: "30 Sep 2026" },
    { code: "Dd5A-VYTmgF", day: 9, date: "29 Sep 2026" },
    { code: "Dd2iVmizAzS", day: 8, date: "28 Sep 2026" },
  ],
};
