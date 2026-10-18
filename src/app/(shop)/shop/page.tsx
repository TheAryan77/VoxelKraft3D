import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { IconSearch } from "@tabler/icons-react";
import { getCategories, getProducts } from "@/lib/shop/catalog";
import { ProductGrid } from "@/components/shop/ProductCard";
import { EmptyState, PageHeader, inputStyles } from "@/components/shop/ui";
import { CategoryChips } from "./CategoryChips";

export const metadata: Metadata = { title: "Shop" };
export const dynamic = "force-dynamic";

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const [categories, products] = await Promise.all([getCategories(), getProducts({ query: q })]);

  return (
    <div className="container-site">
      <PageHeader title="Shop" sub="Ready-to-ship prints, made on our own printer in Gurgaon. Want something custom? Send us your idea from the home page." />

      {/* Categories */}
      {!q && categories.length > 0 && (
        <section aria-labelledby="cat-heading" className="mb-14 md:mb-20">
          <h2 id="cat-heading" className="mb-5 font-heading text-xl text-text md:text-2xl">
            Shop by category
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/shop/${c.slug}`}
                  className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-[16px] border border-line bg-surface-2 p-3 transition-colors hover:border-pei/50 sm:rounded-[20px] sm:p-5"
                >
                  {c.cover && (
                    <Image src={c.cover} alt="" fill sizes="(min-width: 640px) 33vw, 50vw" className="object-cover opacity-60 transition-[opacity,transform] duration-500 group-hover:scale-[1.04] group-hover:opacity-75" />
                  )}
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
                  <span className="relative font-heading text-sm text-text sm:text-lg">{c.name}</span>
                  <span className="relative font-machine text-[11px] text-text-muted sm:text-xs">
                    {c.productCount} {c.productCount === 1 ? "product" : "products"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="all-heading">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 id="all-heading" className="font-heading text-xl text-text md:text-2xl">
            {q ? `Results for “${q}”` : "All products"}
          </h2>
          <form action="/shop" className="relative w-full md:w-72" role="search">
            <IconSearch size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
            <input name="q" defaultValue={q} placeholder="Search products" aria-label="Search products" className={`${inputStyles} pl-10`} />
          </form>
        </div>
        <div className="mb-6">
          <CategoryChips categories={categories} />
        </div>
        {products.length ? (
          <ProductGrid products={products} />
        ) : (
          <EmptyState title="Nothing found" body={q ? "Try a different word, or browse the categories." : "Products will appear here soon."} />
        )}
      </section>
    </div>
  );
}
