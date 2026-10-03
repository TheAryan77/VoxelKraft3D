import Link from "next/link";
import { comingSoon } from "@/content/site";

/** Scaffold for routes that aren't built yet. */
export function ComingSoon({ title }: { title: string }) {
  return (
    <main className="container-site flex min-h-[100svh] flex-col justify-center gap-6 py-32">
      <p className="text-sm text-text-muted">{comingSoon.title}</p>
      <h1 className="font-display text-[length:var(--text-display)]">{title}</h1>
      <p className="prose-body text-text-muted">{comingSoon.body}</p>
      <Link href="/" className="w-fit text-sm text-text underline decoration-line underline-offset-[6px] hover:decoration-pei">
        {comingSoon.back}
      </Link>
    </main>
  );
}
