import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getRelated, isOutOfStock } from "@/lib/shop/catalog";
import { formatPrice } from "@/lib/shop/money";
import { LOW_STOCK_AT, shopConfig, shopPolicy } from "@/lib/shop/config";
import { ProductGrid } from "@/components/shop/ProductCard";
import { Gallery } from "./Gallery";
import { AddToCart } from "./AddToCart";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  return p ? { title: p.name, description: p.description.slice(0, 160) } : { title: "Product" };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const related = await getRelated(product.id, product.categoryId);
  const soldOut = isOutOfStock(product);
  const lowStock = !soldOut && product.stock !== null && product.stock <= LOW_STOCK_AT;
  const onSale = !soldOut && product.compareAt && product.compareAt > product.price;

  return (
    <div className="container-site">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-text-muted">
        <Link href="/shop" className="hover:text-text">Shop</Link>
        <span className="mx-2">/</span>
        <Link href={`/shop/${product.category.slug}`} className="hover:text-text">{product.category.name}</Link>
      </nav>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-12">
        <div className="md:col-span-7">
          <Gallery images={product.images} name={product.name} />
        </div>

        <div className="flex flex-col gap-6 md:col-span-5">
          <div>
            <h1 className="font-heading text-3xl text-text md:text-4xl">{product.name}</h1>
            <p className={`mt-3 flex flex-wrap items-baseline gap-3 font-machine text-2xl ${soldOut ? "text-text-muted" : "text-text"}`}>
              {formatPrice(product.price)}
              {onSale && <span className="text-base text-text-muted line-through">{formatPrice(product.compareAt!)}</span>}
              {soldOut && (
                <span className="self-center rounded-full border border-error/50 px-3 py-1 font-sans text-xs font-semibold text-error">Out of stock</span>
              )}
              {lowStock && (
                <span className="self-center rounded-full border border-molten/50 px-3 py-1 font-sans text-xs font-semibold text-molten">Only {product.stock} left</span>
              )}
            </p>
            <p className="mt-1 text-xs text-text-muted">Inclusive of taxes. Free shipping over {formatPrice(shopConfig.freeShippingFrom)}.</p>
          </div>

          <AddToCart
            product={{ productId: product.id, slug: product.slug, name: product.name, image: product.images[0], price: product.price }}
            colors={product.colors}
            soldOut={soldOut}
            maxQuantity={product.stock === null ? shopConfig.maxQuantityPerItem : Math.min(shopConfig.maxQuantityPerItem, Math.max(product.stock, 1))}
          />
          {soldOut && <p className="-mt-2 text-sm text-text-muted">This one&apos;s out of stock right now. Message us if you&apos;d like it printed when it&apos;s back.</p>}

          <ul className="flex flex-col gap-3 rounded-[16px] border border-line p-4 text-sm">
            <li>
              <p className="text-text">{shopPolicy.customisation.title}</p>
              <p className="mt-0.5 text-text-muted">{shopPolicy.customisation.short}</p>
            </li>
            <li className="border-t border-line pt-3">
              <p className="text-text">{shopPolicy.returns.title}</p>
              <p className="mt-0.5 text-text-muted">{shopPolicy.returns.short}</p>
            </li>
          </ul>

          <p className="prose-body whitespace-pre-line text-text-muted">{product.description}</p>

          <dl className="grid grid-cols-2 gap-4 border-t border-line pt-5 text-sm">
            {product.material && (
              <div>
                <dt className="text-xs text-text-muted">Material</dt>
                <dd className="mt-1 font-machine text-text">{product.material}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-text-muted">Ships in</dt>
              <dd className="mt-1 font-machine text-text">
                {product.leadTimeDays} {product.leadTimeDays === 1 ? "day" : "days"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted">Made</dt>
              <dd className="mt-1 text-text">Printed to order in Gurgaon</dd>
            </div>
            {product.stock !== null && (
              <div>
                <dt className="text-xs text-text-muted">Stock</dt>
                <dd className="mt-1 font-machine text-text">{soldOut ? "Out of stock" : `${product.stock} left`}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20" aria-labelledby="related-heading">
          <h2 id="related-heading" className="mb-5 font-heading text-xl text-text md:text-2xl">
            You might also like
          </h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
