import { NextResponse } from "next/server";
import { INDIAN_STATES } from "@/lib/shop/address";

/** India Post spells a few states differently from our list. */
const STATE_ALIASES: Record<string, (typeof INDIAN_STATES)[number]> = {
  "jammu & kashmir": "Jammu and Kashmir",
  "andaman & nicobar islands": "Andaman and Nicobar Islands",
  "andaman and nicobar": "Andaman and Nicobar Islands",
  chattisgarh: "Chhattisgarh",
  "dadra & nagar haveli": "Dadra and Nagar Haveli and Daman and Diu",
  "dadra and nagar haveli": "Dadra and Nagar Haveli and Daman and Diu",
  "daman & diu": "Dadra and Nagar Haveli and Daman and Diu",
  "daman and diu": "Dadra and Nagar Haveli and Daman and Diu",
  "the dadra and nagar haveli and daman and diu": "Dadra and Nagar Haveli and Daman and Diu",
  pondicherry: "Puducherry",
  orissa: "Odisha",
  "new delhi": "Delhi",
};

function matchState(raw: string) {
  const key = raw.trim().toLowerCase();
  return INDIAN_STATES.find((s) => s.toLowerCase() === key) ?? STATE_ALIASES[key] ?? null;
}

type PostOffice = { District?: string; State?: string };

/** City and state for an Indian PIN code (India Post's public API, cached for a month). */
export async function GET(_request: Request, { params }: { params: Promise<{ pin: string }> }) {
  const { pin } = await params;
  if (!/^[1-9]\d{5}$/.test(pin)) return NextResponse.json({ error: "Enter a 6-digit PIN code" }, { status: 400 });
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      next: { revalidate: 60 * 60 * 24 * 30 },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`India Post ${res.status}`);
    const [data] = (await res.json()) as [{ Status: string; PostOffice: PostOffice[] | null }];
    const office = data?.Status === "Success" ? data.PostOffice?.find((p) => p.District && p.State) : undefined;
    if (!office) return NextResponse.json({ error: "We couldn't find this PIN code" }, { status: 404 });
    const state = matchState(office.State!);
    // Delhi's districts are things like "South West Delhi"; people write "Delhi".
    const city = state === "Delhi" ? "Delhi" : office.District!.trim();
    return NextResponse.json({ city, state }, { headers: { "Cache-Control": "public, max-age=86400" } });
  } catch (err) {
    console.error("[pincode] lookup failed", err);
    return NextResponse.json({ error: "Lookup unavailable" }, { status: 502 });
  }
}
