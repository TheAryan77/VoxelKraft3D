import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { assertAdmin } from "@/lib/shop/session";

export const runtime = "nodejs";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
const MAX_BYTES = 5 * 1024 * 1024;

/** Product / category photo upload (admin only). Vercel Blob in production, .local-uploads/ locally. */
export async function POST(request: Request) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Use a JPG, PNG, WebP or AVIF image" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Images must be under 5 MB" }, { status: 400 });
  const name = `products/${randomUUID()}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(name, file, { access: "public", contentType: file.type });
    return NextResponse.json({ url: blob.url });
  }
  if (process.env.NODE_ENV === "development") {
    // Kept outside /public: the dev server reloads the page when /public changes.
    const { mkdir, writeFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const file_ = path.join(process.cwd(), ".local-uploads", name);
    await mkdir(path.dirname(file_), { recursive: true });
    await writeFile(file_, Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ url: `/api/local-uploads/${name}` });
  }
  return NextResponse.json({ error: "Image storage isn't set up (BLOB_READ_WRITE_TOKEN)" }, { status: 500 });
}
