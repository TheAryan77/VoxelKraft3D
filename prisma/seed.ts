/**
 * Sample catalogue for LOCAL development: `npm run db:seed`.
 * Prices and stock here are placeholders. Don't run this against the live
 * database; add real products from /admin instead.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const categories = [
  { slug: "home-decor", name: "Home & decor", description: "Lamps, vases and pieces for your shelves.", sortOrder: 1 },
  { slug: "desk-organisers", name: "Desk & organisers", description: "Stands, holders and tidy-ups for your desk.", sortOrder: 2 },
  { slug: "toys-games", name: "Toys & games", description: "Tabletop games, fidgets and puzzles.", sortOrder: 3 },
  { slug: "figures-miniatures", name: "Figures & miniatures", description: "Detailed figures and collectibles.", sortOrder: 4 },
  { slug: "tech-accessories", name: "Tech accessories", description: "Phone, laptop and gadget add-ons.", sortOrder: 5 },
  { slug: "kitchen", name: "Kitchen & dining", description: "Handy, food-safe-finish pieces for the table.", sortOrder: 6 },
];

const products = [
  { slug: "spiral-wave-lamp", name: "Spiral wave lamp", category: "home-decor", price: 1499, compareAt: 1799, image: "/work/work-01.jpg", material: "PLA", colors: ["Ivory", "Sand"], featured: true,
    description: "A single-wall spiral shade that throws soft wave patterns across the room. Includes a warm LED base." },
  { slug: "iphone-duo-replica", name: "iPhone Duo display replica", category: "tech-accessories", price: 699, image: "/work/work-02.jpg", material: "PLA", colors: ["White & peach", "Black & grey"], featured: true,
    description: "A two-tone phone-style display piece with a raised camera bump. Great for shop counters and desk setups." },
  { slug: "lattice-cape-figure", name: "Lattice cape figure", category: "figures-miniatures", price: 1199, image: "/work/work-03.jpg", material: "PETG", colors: ["Black"],
    description: "A detailed hero figure with an open lattice cape, printed in tough PETG." },
  { slug: "cactus-toothpick-dispenser", name: "Cactus toothpick dispenser", category: "kitchen", price: 449, image: "/work/work-04.jpg", material: "PLA", colors: ["Green & black", "Green & terracotta"], featured: true,
    description: "Fill the pot with toothpicks and they become the cactus's spines. Our most requested print." },
  { slug: "hexagon-balance-game", name: "Hexagon Balance game", category: "toys-games", price: 899, compareAt: 999, image: "/work/work-05.jpg", material: "PLA", colors: ["Purple & blue", "Orange & white"], featured: true,
    description: "A honeycomb board on a single stem. Take turns placing pieces without tipping it over." },
];

async function main() {
  for (const c of categories) {
    await db.category.upsert({ where: { slug: c.slug }, update: c, create: c });
  }
  for (const p of products) {
    const category = await db.category.findUniqueOrThrow({ where: { slug: p.category } });
    const data = {
      slug: p.slug,
      name: p.name,
      description: p.description,
      price: p.price * 100,
      compareAt: p.compareAt ? p.compareAt * 100 : null,
      images: [p.image],
      colors: p.colors,
      material: p.material,
      isFeatured: !!p.featured,
      categoryId: category.id,
    };
    await db.product.upsert({ where: { slug: p.slug }, update: data, create: data });
  }
  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
}

main().finally(() => db.$disconnect());
