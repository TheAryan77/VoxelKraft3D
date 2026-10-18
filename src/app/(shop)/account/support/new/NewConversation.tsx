"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startConversation } from "@/lib/shop/actions/support";
import { Button, Card, Field, inputStyles } from "@/components/shop/ui";
import { cn } from "@/lib/utils";

export function NewConversation({ orderId, subject: initialSubject }: { orderId?: string; subject?: string }) {
  const router = useRouter();
  const [subject, setSubject] = useState(initialSubject ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <Card className="max-w-2xl">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await startConversation({ subject, message, orderId });
            if (!r.ok) return setError(r.error);
            router.push(`/account/support/${r.id}`);
          });
        }}
      >
        <Field label="Subject">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={120} className={inputStyles} />
        </Field>
        <Field label="Message">
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} maxLength={2000} className={cn(inputStyles, "h-auto py-3")} />
        </Field>
        {error && <p className="text-sm text-error">{error}</p>}
        <div>
          <Button disabled={pending}>{pending ? "Sending…" : "Send"}</Button>
        </div>
      </form>
    </Card>
  );
}
