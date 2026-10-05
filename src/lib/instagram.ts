import { challenge, fallbackReels, type ChallengeReel } from "@/content/challenge";

/**
 * Newest 100-day-challenge reels from Instagram, via the official Instagram
 * API (Instagram Login). Needs INSTAGRAM_ACCESS_TOKEN: a long-lived token for
 * the @voxelkraft.in professional account. Results are cached and refreshed
 * at most once an hour (ISR). Falls back to `fallbackReels` on any problem.
 */

const REFRESH_SECONDS = 60 * 60;

interface MediaItem {
  id: string;
  caption?: string;
  media_type?: string;
  permalink?: string;
  timestamp?: string;
}

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

function toReel(item: MediaItem): (ChallengeReel & { time: number }) | null {
  const day = item.caption?.match(/day\s*(\d{1,3})/i)?.[1];
  const code = item.permalink?.match(/\/(?:reel|p)\/([^/?#]+)/)?.[1];
  if (!day || !code || !item.timestamp) return null;
  const time = Date.parse(item.timestamp);
  return { code, day: Number(day), date: dateFormat.format(time), time };
}

export async function getChallengeReels(): Promise<ChallengeReel[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return fallbackReels;
  try {
    const url = new URL("https://graph.instagram.com/me/media");
    url.searchParams.set("fields", "id,caption,media_type,permalink,timestamp");
    url.searchParams.set("limit", "30");
    url.searchParams.set("access_token", token);
    const res = await fetch(url, { next: { revalidate: REFRESH_SECONDS } });
    if (!res.ok) throw new Error(`Instagram responded ${res.status}`);
    const { data } = (await res.json()) as { data?: MediaItem[] };
    // One card per day (the newest post for that day), newest days first.
    const byDay = new Map<number, ChallengeReel & { time: number }>();
    for (const item of data ?? []) {
      if (item.media_type && item.media_type !== "VIDEO") continue;
      const reel = toReel(item);
      if (reel && (!byDay.has(reel.day) || byDay.get(reel.day)!.time < reel.time)) byDay.set(reel.day, reel);
    }
    const reels = [...byDay.values()]
      .sort((a, b) => b.day - a.day)
      .slice(0, challenge.cardCount)
      .map(({ code, day, date }) => ({ code, day, date }));
    return reels.length ? reels : fallbackReels;
  } catch (err) {
    console.warn("[instagram] using fallback reels:", err);
    return fallbackReels;
  }
}
