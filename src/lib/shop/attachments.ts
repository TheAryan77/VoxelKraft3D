/**
 * Photos and videos attached to support messages (proof for exchange
 * requests). Shared by the upload route, the server actions and the chat UI.
 */

export const ATTACHMENT_TYPES: Record<string, { ext: string; kind: "image" | "video" }> = {
  "image/jpeg": { ext: "jpg", kind: "image" },
  "image/png": { ext: "png", kind: "image" },
  "image/webp": { ext: "webp", kind: "image" },
  "video/mp4": { ext: "mp4", kind: "video" },
  "video/quicktime": { ext: "mov", kind: "video" },
  "video/webm": { ext: "webm", kind: "video" },
};

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const MAX_ATTACHMENTS = 6;
export const ACCEPT_ATTACHMENTS = Object.keys(ATTACHMENT_TYPES).join(",");

/** Why a file can't be attached, or null if it's fine. */
export function attachmentProblem(file: { type: string; size: number }) {
  const t = ATTACHMENT_TYPES[file.type];
  if (!t) return "Attach photos (JPG, PNG, WebP) or videos (MP4, MOV, WebM).";
  if (t.kind === "image" && file.size > MAX_IMAGE_BYTES) return "Photos must be under 10 MB.";
  if (t.kind === "video" && file.size > MAX_VIDEO_BYTES) return "Videos must be under 100 MB. Trim it, or send it on WhatsApp.";
  return null;
}

export function attachmentKind(url: string): "image" | "video" {
  return /\.(mp4|mov|webm)(\?|$)/i.test(url) ? "video" : "image";
}

/** Only files we stored ourselves (Vercel Blob, or local dev uploads) can be attached. */
export function isOurAttachmentUrl(url: string) {
  return (
    /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/support\/[\w./-]+$/i.test(url) ||
    (process.env.NODE_ENV === "development" && /^\/api\/local-uploads\/support\/[\w.-]+$/.test(url))
  );
}
