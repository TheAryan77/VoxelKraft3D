import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/shop/money";

export interface ProductCardData {
  slug: string;
  name: string;
  price: number;
  compareAt: number | null;
  images: string[];
  category?: { name: string } | null;
}

export function ProductCard({ product, priority }: { product: ProductCardData; priority?: boolean }) {
  const image = product.images[0];
  const onSale = product.compareAt && product.compareAt > product.price;
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-[16px] border border-line bg-surface transition-colors hover:border-pei/40 sm:rounded-[20px]"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-2">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="layer-lines absolute inset-0 !h-full opacity-60" />
        )}
        {onSale && (
          <span className="absolute left-2 top-2 rounded-full bg-molten px-2 py-0.5 text-[10px] font-semibold text-on-molten sm:left-3 sm:top-3 sm:text-xs">
            Sale
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        {product.category && <p className="text-[11px] text-text-muted sm:text-xs">{product.category.name}</p>}
        <h3 className="font-heading text-sm leading-snug text-text sm:text-base">{product.name}</h3>
        <p className="mt-auto flex items-baseline gap-2 pt-1 font-machine text-sm text-text">
          {formatPrice(product.price)}
          {onSale && <span className="text-xs text-text-muted line-through">{formatPrice(product.compareAt!)}</span>}
        </p>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.slug}>
          <ProductCard product={p} priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}
