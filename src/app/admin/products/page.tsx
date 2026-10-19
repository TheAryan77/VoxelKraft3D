import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/shop/money";
import { ButtonLink, Card, Pill } from "@/components/shop/ui";
import { ProductRowActions } from "./ProductRowActions";

export default async function AdminProducts() {
  const [products, categoryCount] = await Promise.all([
    db.product.findMany({ orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }], include: { category: { select: { name: true } } } }),
    db.category.count(),
  ]);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-3xl text-text">Products</h1>
        {categoryCount > 0 ? <ButtonLink href="/admin/products/new">Add product</ButtonLink> : <ButtonLink href="/admin/categories">Add a category first</ButtonLink>}
      </div>
      {products.length === 0 ? (
        <Card className="text-sm text-text-muted">No products yet.</Card>
      ) : (
        <Card className="overflow-x-auto p-0 md:p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs text-text-muted">
              <tr>
                <th className="px-5 py-3 font-normal">Product</th>
                <th className="px-5 py-3 font-normal">Category</th>
                <th className="px-5 py-3 font-normal">Price</th>
                <th className="px-5 py-3 font-normal">Stock</th>
                <th className="px-5 py-3 font-normal">Shown</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => (
                <tr key={p.id} className={p.isActive ? "" : "opacity-60"}>
                  <td className="px-5 py-3">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 hover:underline">
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[10px] bg-surface-2">
                        {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="48px" className="object-cover" />}
                      </span>
                      <span className="text-text">{p.name}</span>
                      {p.isFeatured && <Pill>Featured</Pill>}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-text-muted">{p.category.name}</td>
                  <td className="px-5 py-3 font-machine text-text">{formatPrice(p.price)}</td>
                  <td className={`px-5 py-3 font-machine ${p.stock !== null && p.stock <= 0 ? "text-error" : "text-text-muted"}`}>{p.stock === null ? "Made to order" : p.stock <= 0 ? "Out of stock" : p.stock}</td>
                  <td className="px-5 py-3 text-text-muted">{p.isActive ? "In shop" : "Hidden"}</td>
                  <td className="px-5 py-3 text-right">
                    <ProductRowActions id={p.id} slug={p.slug} isActive={p.isActive} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
