import type { Metadata } from "next";
import { requireUser } from "@/lib/shop/session";
import { NewConversation } from "./NewConversation";

export const metadata: Metadata = { title: "New message" };

export default async function NewSupportPage({ searchParams }: { searchParams: Promise<{ order?: string; subject?: string }> }) {
  await requireUser("/account/support/new");
  const { order, subject } = await searchParams;
  return <NewConversation orderId={order} subject={subject} />;
}
