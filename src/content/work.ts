import type { ModelSlotId } from "@/lib/models.config";
import type { ServiceCategory } from "./services";

export interface WorkItem {
  slug: string;
  title: string;
  modelId: ModelSlotId;
  photo: string;
  material: string;
  size: string;
  printTime: string;
  description: string;
  /** Pre-fills the quote form when "Make something like this" is pressed. */
  category: ServiceCategory;
  /** Optional badges on the card and in the pop-up, e.g. ["Trending"]. */
  tags?: string[];
}

// Placeholder entries — replace with real prints. Photos go in /public/work/.
export const work: WorkItem[] = [
  {
    slug: "spiral-vase",
    title: "Spiral vase",
    modelId: "work-01",
    photo: "/work/work-01.jpg",
    material: "PLA",
    size: "120 × 120 × 210 mm",
    printTime: "9 h 40 min",
    description: "A single-wall vase printed in one continuous spiral, so there is no visible seam.",
    category: "custom",
    tags: ["Most viewed"],
  },
  {
    // TODO: confirm material, size and print time with Anurag.
    slug: "iphone-duo",
    title: "iPhone Duo",
    modelId: "work-02",
    photo: "/work/work-02.jpg",
    material: "PLA",
    size: "{SIZE}",
    printTime: "{PRINT_TIME}",
    description:
      "A two-tone iPhone-style replica in white and peach, with a raised camera bump and an inlaid logo. One of our most requested prints right now.",
    category: "custom",
    tags: ["Trending"],
  },
  {
    // TODO: confirm size and print time with Anurag.
    slug: "batman",
    title: "Batman",
    modelId: "work-03",
    photo: "/work/work-03.jpg",
    material: "PETG",
    size: "{SIZE}",
    printTime: "{PRINT_TIME}",
    description:
      "A detailed Batman figure in black PETG, with an open lattice cape that shows how fine a print we can hold together.",
    category: "miniatures",
  },
  {
    // TODO: confirm material, size and print time with Anurag.
    slug: "cactus-toothpick-dispenser",
    title: "Cactus toothpick dispenser",
    modelId: "work-04",
    photo: "/work/work-04.jpg",
    material: "PLA",
    size: "{SIZE}",
    printTime: "{PRINT_TIME}",
    description:
      "A cactus in a pot that holds toothpicks as its spines. Designed and printed after a follower asked for one.",
    category: "functional",
    tags: ["Customer request"],
  },
  {
    // TODO: confirm material, size and print time with Anurag.
    slug: "hexagon-balance-game",
    title: "Hexagon Balance game",
    modelId: "work-05",
    photo: "/work/work-05.jpg",
    material: "PLA",
    size: "{SIZE}",
    printTime: "{PRINT_TIME}",
    description:
      "A tabletop balance game: a honeycomb board on a single stem, where players take turns placing pieces without tipping it over.",
    category: "custom",
    tags: ["Latest", "Unique"],
  },
  {
    // A piece still on the print bed. Swap in the real details once it's done.
    slug: "on-the-print-bed",
    title: "On the print bed",
    modelId: "work-06",
    photo: "/work/work-06.jpg",
    material: "In progress",
    size: "To be revealed",
    printTime: "Printing now",
    description:
      "A new piece is printing right now. Follow along on Instagram to see it first when it comes off the bed.",
    category: "custom",
    tags: ["Coming soon"],
  },
];
