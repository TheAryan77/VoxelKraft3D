import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComingSoon } from "@/components/shared/ComingSoon";
import { work } from "@/content/work";

export function generateStaticParams() {
  return work.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: work.find((w) => w.slug === slug)?.title ?? "Work" };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = work.find((w) => w.slug === slug);
  if (!item) notFound();
  return <ComingSoon title={item.title} />;
}
