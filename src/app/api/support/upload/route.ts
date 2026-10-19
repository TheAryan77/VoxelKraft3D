import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/auth";
import { ATTACHMENT_TYPES, MAX_VIDEO_BYTES, attachmentProblem } from "@/lib/shop/attachments";

export const runtime = "nodejs";

const blobEnabled = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/** Tells the browser how to upload: straight to Vercel Blob, or (local dev) through this route. */
export async function GET() {
  return NextResponse.json({ mode: blobEnabled ? "blob" : process.env.NODE_ENV === "development" ? "local" : "off" });
}

/**
 * Proof photos/videos for support messages, from signed-in customers (and admin).
 * Production: hands out a short-lived token so the browser uploads directly to
 * Vercel Blob (videos are too big to pass through a function).
 * Local dev without Blob: takes the file itself and saves it to .local-uploads/.
 */
export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (request.headers.get("content-type")?.includes("multipart/form-data")) {
    if (!userId) return NextResponse.json({ error: "Sign in to attach files" }, { status: 401 });
    if (blobEnabled || process.env.NODE_ENV !== "development") return NextResponse.json({ error: "Not available" }, { status: 400 });
    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
    const problem = attachmentProblem(file);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });
    const name = `${randomUUID()}.${ATTACHMENT_TYPES[file.type].ext}`;
    const { mkdir, writeFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const dir = path.join(process.cwd(), ".local-uploads", "support");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ url: `/api/local-uploads/support/${name}` });
  }

  if (!blobEnabled) return NextResponse.json({ error: "File storage isn't set up (BLOB_READ_WRITE_TOKEN)" }, { status: 500 });
  try {
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Checked here, when the browser asks for a token (the completion callback comes from Vercel, not a user).
        if (!userId) throw new Error("Sign in to attach files");
        if (!/^support\/[\w.-]+$/.test(pathname)) throw new Error("Bad file name");
        return {
          allowedContentTypes: Object.keys(ATTACHMENT_TYPES),
          maximumSizeInBytes: MAX_VIDEO_BYTES,
          addRandomSuffix: true,
          tokenPayload: userId,
        };
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
