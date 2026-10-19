"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { IconPaperclip, IconPlayerPlayFilled, IconX } from "@tabler/icons-react";
import { ACCEPT_ATTACHMENTS, ATTACHMENT_TYPES, MAX_ATTACHMENTS, attachmentKind, attachmentProblem } from "@/lib/shop/attachments";
import { cn } from "@/lib/utils";

/* -------------------------------- Uploading -------------------------------- */

let modePromise: Promise<"blob" | "local" | "off"> | null = null;
function uploadMode() {
  modePromise ??= fetch("/api/support/upload")
    .then((r) => r.json() as Promise<{ mode: "blob" | "local" | "off" }>)
    .then((r) => r.mode)
    .catch(() => {
      modePromise = null;
      return "off" as const;
    });
  return modePromise;
}

async function uploadAttachment(file: File) {
  const mode = await uploadMode();
  if (mode === "blob") {
    const ext = ATTACHMENT_TYPES[file.type].ext;
    const blob = await upload(`support/${crypto.randomUUID()}.${ext}`, file, {
      access: "public",
      handleUploadUrl: "/api/support/upload",
      multipart: file.size > 8 * 1024 * 1024,
    });
    return blob.url;
  }
  if (mode === "local") {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/support/upload", { method: "POST", body });
    const json = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !json.url) throw new Error(json.error ?? "Upload failed");
    return json.url;
  }
  throw new Error("Attachments aren't available right now. Send them on WhatsApp instead.");
}

type Pending = { id: string; name: string; kind: "image" | "video"; preview?: string; url?: string; error?: string };

/**
 * "Add photos or video" button plus previews. Files upload as soon as they're
 * picked; `onChange` gets the finished URLs and `onBusyChange` whether any are
 * still uploading (so the form can wait).
 */
export function AttachmentPicker({
  onChange,
  onBusyChange,
  resetKey,
  compact,
}: {
  onChange: (urls: string[]) => void;
  onBusyChange?: (busy: boolean) => void;
  /** Change this to clear the picker (e.g. after sending). */
  resetKey?: number;
  compact?: boolean;
}) {
  const [items, setItems] = useState<Pending[]>([]);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const callbacks = useRef({ onChange, onBusyChange });
  useEffect(() => {
    callbacks.current = { onChange, onBusyChange };
  });

  useEffect(() => {
    setItems([]);
    setError(null);
  }, [resetKey]);

  useEffect(() => {
    callbacks.current.onChange(items.flatMap((i) => (i.url ? [i.url] : [])));
    callbacks.current.onBusyChange?.(items.some((i) => !i.url && !i.error));
  }, [items]);

  const add = (files: FileList | null) => {
    setError(null);
    if (!files?.length) return;
    const room = MAX_ATTACHMENTS - items.length;
    const picked = Array.from(files).slice(0, Math.max(room, 0));
    if (files.length > room) setError(`Up to ${MAX_ATTACHMENTS} files per message.`);
    for (const file of picked) {
      const problem = attachmentProblem(file);
      if (problem) {
        setError(problem);
        continue;
      }
      const id = crypto.randomUUID();
      const kind = ATTACHMENT_TYPES[file.type].kind;
      setItems((list) => [...list, { id, name: file.name, kind, preview: kind === "image" ? URL.createObjectURL(file) : undefined }]);
      uploadAttachment(file)
        .then((url) => setItems((list) => list.map((i) => (i.id === id ? { ...i, url } : i))))
        .catch((err: Error) => setItems((list) => list.map((i) => (i.id === id ? { ...i, error: err.message || "Upload failed" } : i))));
    }
  };

  const remove = (id: string) =>
    setItems((list) => {
      const gone = list.find((i) => i.id === id);
      if (gone?.preview) URL.revokeObjectURL(gone.preview);
      return list.filter((i) => i.id !== id);
    });

  return (
    // Compact (in the chat composer): `contents`, so the button sits in the
    // composer row and the previews wrap onto their own line above it.
    <div className={compact ? "contents" : "flex flex-col gap-2"}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={items.length >= MAX_ATTACHMENTS}
          aria-label="Attach photos or video"
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-line text-sm text-text-muted transition-colors hover:border-pei/60 hover:text-text disabled:opacity-40",
            compact ? "h-11 w-11 justify-center" : "h-10 px-4",
          )}
        >
          <IconPaperclip size={16} />
          {!compact && "Add photos or video"}
        </button>
        {!compact && <span className="text-xs text-text-muted">Photos up to 10 MB, videos up to 100 MB.</span>}
        <input ref={input} type="file" accept={ACCEPT_ATTACHMENTS} multiple hidden onChange={(e) => (add(e.target.files), (e.target.value = ""))} />
      </div>
      {items.length > 0 && (
        <ul className={cn("flex flex-wrap gap-2", compact && "order-first basis-full")}>
          {items.map((i) => (
            <li key={i.id} className={cn("relative h-16 w-16 overflow-hidden rounded-[10px] border bg-surface-2", i.error ? "border-error" : "border-line")} title={i.error ?? i.name}>
              {i.preview ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob: preview
                <img src={i.preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center text-text-muted">
                  <IconPlayerPlayFilled size={18} />
                </span>
              )}
              {!i.url && !i.error && <span className="absolute inset-0 grid place-items-center bg-bg/60 text-[10px] text-text">Uploading…</span>}
              {i.error && <span className="absolute inset-0 grid place-items-center bg-bg/80 px-1 text-center text-[10px] text-error">Failed</span>}
              <button
                type="button"
                onClick={() => remove(i.id)}
                aria-label={`Remove ${i.name}`}
                className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-bg/80 text-text"
              >
                <IconX size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {(error || items.find((i) => i.error)) && <p className={cn("text-xs text-error", compact && "order-first basis-full")}>{error ?? items.find((i) => i.error)?.error}</p>}
    </div>
  );
}

/* --------------------------------- Showing --------------------------------- */

/** Attachments inside a chat message: photo thumbnails (open full size) and playable videos. */
export function AttachmentList({ urls, className }: { urls: string[]; className?: string }) {
  if (!urls.length) return null;
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {urls.map((url) =>
        attachmentKind(url) === "video" ? (
          <li key={url} className="w-full max-w-[280px]">
            <video src={url} controls preload="metadata" playsInline className="w-full rounded-[12px] bg-black" />
          </li>
        ) : (
          <li key={url}>
            <a href={url} target="_blank" rel="noopener noreferrer" className="block h-24 w-24 overflow-hidden rounded-[12px] border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element -- user uploads of any size, shown as-is */}
              <img src={url} alt="Attached photo" loading="lazy" className="h-full w-full object-cover" />
            </a>
          </li>
        ),
      )}
    </ul>
  );
}
