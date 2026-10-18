import "server-only";

/**
 * Emails the shop owner about new orders and messages, via Resend when
 * RESEND_API_KEY, QUOTE_FROM_EMAIL and QUOTE_TO_EMAIL are set. Otherwise logs.
 * Never throws: a failed email must not break checkout.
 */
export async function notifyAdmin(subject: string, text: string) {
  const { RESEND_API_KEY, QUOTE_FROM_EMAIL, QUOTE_TO_EMAIL } = process.env;
  const site = process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const body = text.replace(/ \/(admin[^\s]*)/g, (_m, p) => ` ${site}/${p}`);
  if (!RESEND_API_KEY || !QUOTE_FROM_EMAIL || !QUOTE_TO_EMAIL) {
    console.info(`[notify] ${subject}: ${body}`);
    return;
  }
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: QUOTE_FROM_EMAIL, to: [QUOTE_TO_EMAIL], subject: `[Voxel Kraft] ${subject}`, text: body }),
    });
  } catch (err) {
    console.warn("[notify] email failed", err);
  }
}
