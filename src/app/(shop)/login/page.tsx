import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { IconBrandGoogleFilled } from "@tabler/icons-react";
import { auth, devLoginEnabled, signIn } from "@/auth";
import { Button, Card, inputStyles } from "@/components/shop/ui";

export const metadata: Metadata = { title: "Sign in" };

/** Only allow relative "next" paths, so sign-in can't bounce people to other sites. */
function safeNext(next?: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const redirectTo = safeNext(next);
  const session = await auth();
  if (session?.user) redirect(redirectTo);
  const googleReady = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

  return (
    <div className="container-site flex justify-center">
      <Card className="w-full max-w-md p-6 md:p-10">
        <h1 className="font-heading text-3xl text-text">Sign in</h1>
        <p className="mt-2 text-sm text-text-muted">To place orders, track them and chat with us.</p>

        {error && <p className="mt-6 rounded-[12px] border border-error/40 px-4 py-3 text-sm text-error">Sign-in didn&apos;t work. Please try again.</p>}

        <form
          className="mt-8"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo });
          }}
        >
          <Button variant="outline" className="h-12 w-full" disabled={!googleReady}>
            <IconBrandGoogleFilled size={18} aria-hidden /> Continue with Google
          </Button>
          {!googleReady && <p className="mt-2 text-xs text-text-muted">Google sign-in isn&apos;t set up yet (AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET).</p>}
        </form>

        {devLoginEnabled && (
          <form
            className="mt-8 flex flex-col gap-3 border-t border-line pt-6"
            action={async (formData) => {
              "use server";
              await signIn("dev-login", { email: formData.get("email"), redirectTo });
            }}
          >
            <p className="text-xs text-text-muted">Local testing only: sign in with any email (hidden on the live site).</p>
            <input name="email" type="email" required placeholder="you@example.com" className={inputStyles} />
            <Button variant="outline">Dev sign-in</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
