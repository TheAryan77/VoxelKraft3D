"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startConversation } from "@/lib/shop/actions/support";
import { shopPolicy } from "@/lib/shop/config";
import { Button, Card, Field, inputStyles } from "@/components/shop/ui";
import { AttachmentPicker } from "@/components/shop/Attachments";
import { cn } from "@/lib/utils";

/** Reasons for a query on a delivered order. `proof`: an exchange needs photos or a video. */
const REASONS = [
  { id: "damaged", label: "Arrived damaged or broken", proof: true },
  { id: "wrong", label: "Wrong item, colour or size", proof: true },
  { id: "missing", label: "Missing item or part", proof: true },
  { id: "quality", label: "Print quality problem", proof: true },
  { id: "other", label: "Something else", proof: false },
] as const;

export function NewConversation({ orderId, orderLabel, subject: initialSubject, query }: { orderId?: string; orderLabel?: string; subject?: string; query?: boolean }) {
  const router = useRouter();
  const [subject, setSubject] = useState(initialSubject ?? "");
  const [reason, setReason] = useState<(typeof REASONS)[number]["id"]>("damaged");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const picked = REASONS.find((r) => r.id === reason)!;

  const submit = () => {
    setError(null);
    if (query && picked.proof && !files.length) return setError("Attach photos or an unboxing video so we can approve an exchange.");
    start(async () => {
      const r = await startConversation({
        subject: query ? `Query: ${picked.label}${orderLabel ? ` · ${orderLabel}` : ""}` : subject,
        message,
        orderId,
        attachments: files,
      });
      if (!r.ok) return setError(r.error);
      router.push(`/account/support/${r.id}`);
    });
  };

  return (
    <Card className="max-w-2xl">
      {query && (
        <div className="mb-5">
          <h2 className="font-heading text-lg text-text">Raise a query{orderLabel ? ` for ${orderLabel}` : ""}</h2>
          <p className="mt-2 rounded-[12px] border border-line p-3 text-sm text-text-muted">
            <span className="font-semibold text-text">{shopPolicy.returns.title}.</span> {shopPolicy.returns.body}
          </p>
        </div>
      )}
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {query ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm text-text-muted">What went wrong?</legend>
            {REASONS.map((r) => (
              <label
                key={r.id}
                className={cn("flex cursor-pointer items-center gap-3 rounded-[12px] border px-4 py-3 text-sm transition-colors", reason === r.id ? "border-molten text-text" : "border-line text-text-muted hover:border-pei/50")}
              >
                <input type="radio" name="reason" checked={reason === r.id} onChange={() => setReason(r.id)} className="accent-[var(--color-molten)]" />
                {r.label}
              </label>
            ))}
          </fieldset>
        ) : (
          <Field label="Subject">
            <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={120} className={inputStyles} />
          </Field>
        )}
        <Field label={query ? "Tell us what happened" : "Message"}>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} maxLength={2000} className={cn(inputStyles, "h-auto py-3")} />
        </Field>
        <div className="flex flex-col gap-2">
          <span className="text-sm text-text-muted">
            {query && picked.proof ? "Proof (required): clear photos or an unboxing video" : "Photos or video (optional)"}
          </span>
          <AttachmentPicker onChange={(urls) => (setFiles(urls), urls.length && setError(null))} onBusyChange={setUploading} />
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
        <div>
          <Button disabled={pending || uploading}>{uploading ? "Uploading…" : pending ? "Sending…" : "Send"}</Button>
        </div>
      </form>
    </Card>
  );
}
