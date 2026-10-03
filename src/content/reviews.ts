/**
 * SAMPLE REVIEWS — placeholders to show the layout. Replace them with real
 * customer quotes (with permission). While any entry is marked `demo: true`,
 * the section shows a visible "sample reviews" note so nobody mistakes them
 * for real customers. Remove `demo: true` from real reviews.
 */
export interface Review {
  quote: string;
  name: string;
  /** What they ordered, or where they're from. */
  title: string;
  rating?: number;
  demo?: boolean;
}

export const reviews: Review[] = [
  {
    quote: "Sent a rough sketch on WhatsApp and got a perfect print two days later. They even suggested a stronger material for it.",
    name: "Aryan",
    title: "Custom desk organiser",
    rating: 5,
    demo: true,
  },
  {
    quote: "The cactus toothpick holder is the first thing guests ask about. Clean finish, no stringing, and packed really well.",
    name: "Nikhil",
    title: "Cactus toothpick dispenser",
    rating: 5,
    demo: true,
  },
  {
    quote: "Needed a replacement clip for my scooter that nobody sells anymore. They measured the broken one and it fit first time.",
    name: "Rahul",
    title: "Functional replacement part",
    rating: 5,
    demo: true,
  },
  {
    quote: "Ordered a miniature for my brother's birthday. The detail on the cape was unreal for the price.",
    name: "Priya",
    title: "Tabletop miniature",
    rating: 5,
    demo: true,
  },
  {
    quote: "They sent progress photos while it printed, which I loved. The lamp shade glows exactly like the reel.",
    name: "Karan",
    title: "Wave lamp shade",
    rating: 5,
    demo: true,
  },
  {
    quote: "Quick replies, honest pricing and they told me straight away what would and wouldn't print well.",
    name: "Sneha",
    title: "Architecture student model",
    rating: 4,
    demo: true,
  },
];

/** True while any sample review is still on the page (drives the visible note). */
export const hasSampleReviews = reviews.some((r) => r.demo);
