"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconLock } from "@tabler/icons-react";
import { updateCustomisation } from "@/lib/shop/actions/account";
import { shopPolicy } from "@/lib/shop/config";
import { Button, Card, inputStyles } from "@/components/shop/ui";
import { cn } from "@/lib/utils";

/** The order's customisation request: editable until printing starts, then read-only. */
export function CustomisationEditor({ orderId, note, editable }: { orderId: string; note: string | null; editable: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const save = () =>
    start(async () => {
      setError(null);
      const r = await updateCustomisation(orderId, text);
      if (!r.ok) return setError(r.error);
      setEditing(false);
      setSaved(true);
      router.refresh();
    });

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg text-text">{shopPolicy.customisation.title}</h2>
        {editable && !editing && (
          <Button variant="outline" className="h-9 px-4" onClick={() => (setEditing(true), setSaved(false))}>
            {note ? "Edit" : "Add a request"}
          </Button>
        )}
      </div>

      {editing ? (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            rows={4}
            autoFocus
            placeholder="Colour, size, name or text to add, small tweaks…"
            aria-label="Customisation request"
            className={cn(inputStyles, "h-auto py-3")}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={save} disabled={pending}>{pending ? "Saving…" : "Save request"}</Button>
            <Button variant="ghost" onClick={() => (setEditing(false), setText(note ?? ""), setError(null))} disabled={pending}>
              Cancel
            </Button>
            <span className="text-xs text-text-muted">{text.length}/500</span>
          </div>
        </>
      ) : note ? (
        <p className="whitespace-pre-line rounded-[12px] border border-line p-3 text-sm text-text">{note}</p>
      ) : (
        <p className="text-sm text-text-muted">No customisation requested.</p>
      )}

      {error && <p className="text-sm text-error">{error}</p>}
      {saved && !editing && <p className="text-sm text-molten">Saved. We&apos;ve been notified.</p>}

      {editable ? (
        <p className="text-xs text-text-muted">{shopPolicy.customisation.body}</p>
      ) : (
        <p className="flex items-start gap-2 text-xs text-text-muted">
          <IconLock size={14} className="mt-px shrink-0" />
          {shopPolicy.customisation.locked}
        </p>
      )}
    </Card>
  );
}
