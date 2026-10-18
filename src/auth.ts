import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: Role } & DefaultSession["user"];
  }
}

/** Comma-separated emails that get the admin dashboard (e.g. Anurag's Gmail). */
export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return admins.includes(email.toLowerCase());
}

/** Local-only sign-in by email, for testing without Google keys. Never on in production. */
export const devLoginEnabled = process.env.NODE_ENV === "development" && process.env.AUTH_DEV_LOGIN === "true";

const providers = [Google];
if (devLoginEnabled) {
  providers.push(
    Credentials({
      id: "dev-login",
      name: "Dev login",
      credentials: { email: { label: "Email" } },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
        return db.user.upsert({
          where: { email },
          update: {},
          create: { email, name: email.split("@")[0] },
        });
      },
    }) as unknown as typeof Google,
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  // JWT sessions: required by the dev credentials provider and cheap on Vercel.
  session: { strategy: "jwt" },
  providers,
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
        // Admins are whoever is listed in ADMIN_EMAILS, checked at every sign-in.
        const role: Role = isAdminEmail(user.email) ? "ADMIN" : "CUSTOMER";
        await db.user.update({ where: { id: user.id }, data: { role } }).catch(() => undefined);
        token.role = role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.role = (token.role as Role) ?? "CUSTOMER";
      return session;
    },
  },
});
