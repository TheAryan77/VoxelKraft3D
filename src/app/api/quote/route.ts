import { NextResponse } from "next/server";
import { getMailer } from "@/lib/quote/mailer";
import { quoteSchema, validateFile } from "@/lib/quote/schema";
import { quoteCopy } from "@/content/site";

export const runtime = "nodejs";

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : undefined);

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: quoteCopy.errors.server }, { status: 400 });
  }

  // Honeypot: real people never fill this hidden field.
  if (str(form.get("company"))) return NextResponse.json({ ok: true });

  const parsed = quoteSchema.safeParse({
    name: str(form.get("name")) ?? "",
    contact: str(form.get("contact")) ?? "",
    category: str(form.get("category")),
    material: str(form.get("material")),
    quantity: Number(str(form.get("quantity"))),
    colour: str(form.get("colour")) || undefined,
    notes: str(form.get("notes")) || undefined,
  });
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message]));
    return NextResponse.json({ ok: false, fieldErrors }, { status: 400 });
  }

  const file = form.get("file");
  let attachment;
  if (file instanceof File && file.size > 0) {
    const fileError = validateFile(file);
    if (fileError) {
      return NextResponse.json({ ok: false, fieldErrors: { file: quoteCopy.errors[fileError] } }, { status: 400 });
    }
    attachment = {
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
      content: Buffer.from(await file.arrayBuffer()),
    };
  }

  try {
    await getMailer().send({ ...parsed.data, attachment, receivedAt: new Date() });
  } catch (err) {
    console.error("[quote] send failed", err);
    return NextResponse.json({ ok: false, error: quoteCopy.errors.server }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
