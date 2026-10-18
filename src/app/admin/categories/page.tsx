import { db } from "@/lib/db";
import { CategoryManager } from "./CategoryManager";

export default async function AdminCategories() {
  const categories = await db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { products: true } } } });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-3xl text-text">Categories</h1>
      <CategoryManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description ?? "",
          image: c.image ?? "",
          sortOrder: String(c.sortOrder),
          isActive: c.isActive,
          productCount: c._count.products,
        }))}
      />
    </div>
  );
}
