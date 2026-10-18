"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setConversationStatus } from "@/lib/shop/actions/support";
import { Button } from "@/components/shop/ui";

export function CloseToggle({ id, status }: { id: string; status: "OPEN" | "CLOSED" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      className="h-9 px-4"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await setConversationStatus(id, status === "OPEN" ? "CLOSED" : "OPEN");
          router.refresh();
        })
      }
    >
      {status === "OPEN" ? "Mark resolved" : "Reopen"}
    </Button>
  );
}
