import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/** Signed-in user or redirect to /login, coming back to `next` afterwards. */
export async function requireUser(next = "/account") {
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?next=${encodeURIComponent(next)}`);
  return session.user;
}

/** Admin only. Re-checks the role in the database, not just the session. */
export async function requireAdmin() {
  const user = await requireUser("/admin");
  const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { role: true } });
  if (dbUser?.role !== "ADMIN") redirect("/");
  return user;
}

/** For server actions: throws instead of redirecting. */
export async function assertAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  const dbUser = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (dbUser?.role !== "ADMIN") throw new Error("Not allowed");
  return session.user;
}

export async function assertUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  return session.user;
}
