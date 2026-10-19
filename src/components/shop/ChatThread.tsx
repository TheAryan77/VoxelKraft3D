"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { IconSend } from "@tabler/icons-react";
import { sendMessage } from "@/lib/shop/actions/support";
import { Button, inputStyles } from "./ui";
import { AttachmentList, AttachmentPicker } from "./Attachments";
import { cn } from "@/lib/utils";

type Msg = { id: string; sender: "CUSTOMER" | "ADMIN"; body: string; attachments: string[]; createdAt: string };

const time = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/**
 * A conversation that refreshes every few seconds. `as` decides which side's
 * messages sit on the right: the customer's in their account, Voxel Kraft's in admin.
 */
export function ChatThread({ conversationId, initial, as, closed }: { conversationId: string; initial: Msg[]; as: "CUSTOMER" | "ADMIN"; closed?: boolean }) {
  const [messages, setMessages] = useState(initial);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/support/${conversationId}`, { cache: "no-store" });
      if (res.ok) setMessages((await res.json()).messages);
    } catch {}
  }, [conversationId]);

  useEffect(() => {
    const t = window.setInterval(() => document.visibilityState === "visible" && refresh(), 4000);
    return () => window.clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    // Braces matter: scrollIntoView returns a Promise in newer browsers, and
    // React treats an effect's return value as its cleanup.
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const send = () => {
    const body = text.trim();
    if ((!body && !files.length) || uploading) return;
    setError(null);
    startTransition(async () => {
      const r = await sendMessage(conversationId, body, files);
      if (!r.ok) return setError(r.error);
      setText("");
      setResetKey((k) => k + 1);
      await refresh();
    });
  };

  return (
    <div className="flex flex-col rounded-[20px] border border-line bg-surface">
      <div data-lenis-prevent className="flex max-h-[60vh] min-h-[280px] flex-col gap-3 overflow-y-auto p-4 md:p-6">
        {messages.map((m) => {
          const mine = m.sender === as;
          return (
            <div key={m.id} className={cn("flex max-w-[85%] flex-col gap-1", mine ? "self-end items-end" : "self-start items-start")}>
              {m.body && (
                <div className={cn("whitespace-pre-wrap rounded-[16px] px-4 py-2.5 text-sm", mine ? "bg-molten text-on-molten" : "bg-surface-2 text-text")}>{m.body}</div>
              )}
              <AttachmentList urls={m.attachments ?? []} className={mine ? "justify-end" : undefined} />
              <span className="text-[11px] text-text-muted">
                {m.sender === "ADMIN" ? "Voxel Kraft" : as === "ADMIN" ? "Customer" : "You"} · {time.format(new Date(m.createdAt))}
              </span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form
        className="flex flex-wrap items-end gap-2 border-t border-line p-3 md:p-4"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <AttachmentPicker compact resetKey={resetKey} onChange={setFiles} onBusyChange={setUploading} />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder={closed ? "This conversation is closed. Writing reopens it." : "Write a message…"}
          aria-label="Message"
          className={cn(inputStyles, "h-auto min-h-11 min-w-0 flex-1 resize-none py-3")}
        />
        <Button type="submit" disabled={pending || uploading || (!text.trim() && !files.length)} aria-label="Send" className="h-11 w-11 shrink-0 px-0">
          <IconSend size={16} />
        </Button>
      </form>
      {error && <p className="px-4 pb-3 text-xs text-error">{error}</p>}
    </div>
  );
}
