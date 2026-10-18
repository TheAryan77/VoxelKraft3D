import type { ReactNode } from "react";
import { requireUser } from "@/lib/shop/session";
import { signOut } from "@/auth";
import { AccountNav } from "./AccountNav";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await requireUser("/account");
  return (
    <div className="container-site">
      <div className="mb-8 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-heading text-[length:var(--text-heading)] text-text">Your account</h1>
          <p className="mt-2 text-sm text-text-muted">{user.email}</p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button className="text-sm text-text-muted underline decoration-line underline-offset-4 hover:text-text">Sign out</button>
        </form>
      </div>
      <AccountNav />
      <div className="mt-8">{children}</div>
    </div>
  );
}
