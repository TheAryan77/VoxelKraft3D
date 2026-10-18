import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCategories, getProducts } from "@/lib/shop/catalog";
import { ProductGrid } from "@/components/shop/ProductCard";
import { EmptyState, PageHeader } from "@/components/shop/ui";
import { CategoryChips } from "../CategoryChips";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const c = await db.category.findUnique({ where: { slug: category } });
  return { title: c?.name ?? "Shop" };
}

export default async function CategoryPage({ params }: Props) {
  const { category: slug } = await params;
  const category = await db.category.findFirst({ where: { slug, isActive: true } });
  if (!category) notFound();
  const [categories, products] = await Promise.all([getCategories(), getProducts({ categorySlug: slug })]);

  return (
    <div className="container-site">
      <PageHeader title={category.name} sub={category.description ?? undefined} />
      <div className="mb-6">
        <CategoryChips categories={categories} active={slug} />
      </div>
      {products.length ? <ProductGrid products={products} /> : <EmptyState title="No products here yet" body="Check back soon, or ask us for a custom print." />}
    </div>
  );
}
