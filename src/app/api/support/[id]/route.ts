import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/** Messages for a conversation (the chat window polls this). Marks them read for the viewer. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const convo = await db.conversation.findUnique({ where: { id }, include: { messages: { orderBy: { createdAt: "asc" } } } });
  if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const role = (await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } }))?.role;
  const isOwner = convo.userId === session.user.id;
  if (!isOwner && role !== "ADMIN") return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const viewerIsAdmin = role === "ADMIN" && !isOwner;
  if (viewerIsAdmin ? convo.adminUnread : convo.customerUnread) {
    await db.conversation.update({ where: { id }, data: viewerIsAdmin ? { adminUnread: false } : { customerUnread: false } });
  }
  return NextResponse.json({
    status: convo.status,
    messages: convo.messages.map((m) => ({ id: m.id, sender: m.sender, body: m.body, createdAt: m.createdAt.toISOString() })),
  });
}
