import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductForm } from "../ProductForm";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    db.product.findUnique({ where: { id } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/products" className="text-sm text-text-muted hover:text-text">← Products</Link>
        <h1 className="mt-2 font-heading text-3xl text-text">{product.name}</h1>
      </div>
      <ProductForm
        categories={categories}
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: String(product.price / 100),
          compareAt: product.compareAt ? String(product.compareAt / 100) : "",
          categoryId: product.categoryId,
          images: product.images,
          colors: product.colors.join(", "),
          material: product.material ?? "",
          leadTimeDays: String(product.leadTimeDays),
          stock: product.stock === null ? "" : String(product.stock),
          isActive: product.isActive,
          isFeatured: product.isFeatured,
        }}
      />
    </div>
  );
}
