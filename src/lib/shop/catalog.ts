import "server-only";
import { db } from "@/lib/db";

const cardSelect = {
  id: true,
  slug: true,
  name: true,
  price: true,
  compareAt: true,
  images: true,
  category: { select: { name: true, slug: true } },
} as const;

export async function getCategories() {
  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: { where: { isActive: true } } } },
      products: { where: { isActive: true }, select: { images: true }, take: 1, orderBy: { isFeatured: "desc" } },
    },
  });
  return categories.map((c) => ({
    ...c,
    productCount: c._count.products,
    cover: c.image ?? c.products[0]?.images[0] ?? null,
  }));
}

export async function getProducts({ categorySlug, query, featured }: { categorySlug?: string; query?: string; featured?: boolean } = {}) {
  const q = query?.trim();
  return db.product.findMany({
    where: {
      isActive: true,
      category: { isActive: true, ...(categorySlug ? { slug: categorySlug } : {}) },
      ...(featured ? { isFeatured: true } : {}),
      ...(q
        ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { material: { contains: q, mode: "insensitive" } }] }
        : {}),
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    select: cardSelect,
  });
}

export async function getProduct(slug: string) {
  return db.product.findFirst({
    where: { slug, isActive: true, category: { isActive: true } },
    include: { category: true },
  });
}

export async function getRelated(productId: string, categoryId: string) {
  return db.product.findMany({
    where: { isActive: true, categoryId, id: { not: productId } },
    take: 4,
    orderBy: { isFeatured: "desc" },
    select: cardSelect,
  });
}
