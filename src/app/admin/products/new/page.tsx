import Link from "next/link";
import { db } from "@/lib/db";
import { ProductForm } from "../ProductForm";

export default async function NewProduct() {
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/products" className="text-sm text-text-muted hover:text-text">← Products</Link>
        <h1 className="mt-2 font-heading text-3xl text-text">Add product</h1>
      </div>
      <ProductForm
        categories={categories}
        initial={{ name: "", slug: "", description: "", price: "", compareAt: "", categoryId: categories[0]?.id ?? "", images: [], colors: "", material: "PLA", leadTimeDays: "3", stock: "", isActive: true, isFeatured: false }}
      />
    </div>
  );
}
