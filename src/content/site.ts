/**
 * All site-wide copy. Values in {CURLY_BRACES} are placeholders to fill in later
 * (see section 13 of the build spec).
 */

export const PLACEHOLDERS = {
  LAYER_HEIGHT: "{LAYER_HEIGHT}",
  MATERIALS: "{MATERIALS}",
  TURNAROUND: "{TURNAROUND}",
  REPLY_TIME: "{REPLY_TIME}",
  CITY: "{CITY}",
  EMAIL: "{EMAIL}",
  INSTAGRAM_URL: "{INSTAGRAM_URL}",
  WHATSAPP_URL: "{WHATSAPP_URL}",
} as const;

export const site = {
  name: "Voxel Kraft 3D",
  description:
    "Custom 3D printing studio for prototypes, custom models, functional parts, miniatures and architectural models.",
  /** Shown in the navbar and footer until /public/brand/logo.svg exists. */
  logoSrc: "/brand/logo.svg",
  contact: {
    email: PLACEHOLDERS.EMAIL,
    whatsapp: PLACEHOLDERS.WHATSAPP_URL,
    instagram: "https://www.instagram.com/voxelkraft.in/",
  },
};

export const nav = {
  links: [
    { name: "Work", link: "/#work" },
    { name: "Services", link: "/#services" },
    { name: "Process", link: "/#process" },
    { name: "Materials", link: "/#materials" },
    { name: "About", link: "/#challenge" },
  ],
  cta: { label: "Start a project", href: "/#quote" },
  openMenu: "Open menu",
  closeMenu: "Close menu",
  themeToLight: "Switch to light theme",
  themeToDark: "Switch to dark theme",
  home: "Voxel Kraft 3D home",
};

export const hero = {
  headline: ["We print", "your ideas."],
  subline: "Custom 3D printing for prototypes, parts, miniatures and one-offs.",
  primaryCta: { label: "Start a project", href: "#quote" },
  secondaryCta: { label: "See our work", href: "#work" },
  /** Real specs of the printer. */
  machineData: [
    // Provisional values — confirm with the printer settings (Bambu Lab P2S).
    { value: "From 0.08 mm", label: "Layer height" },
    { value: "PLA, PETG, ABS, TPU", label: "Materials" },
    { value: "2–4 days", label: "Turnaround" },
  ],
};

export const servicesCopy = {
  heading: "What we make",
  sub: "From a single prototype to a small batch.",
  askLabel: "Ask about this",
  swipeHint: "Swipe to see all five.",
};

export const workCopy = {
  heading: "Selected work",
  sub: "A few recent prints, straight off the bed.",
  materialLabel: "Material",
  sizeLabel: "Size",
  printTimeLabel: "Print time",
  cta: "Make something like this",
  close: "Close",
  orbitHint: "Drag to turn, scroll to zoom",
};

export const processCopy = {
  heading: "How it works",
  steps: [
    {
      title: "Send your idea",
      body: "No 3D file? No problem. Send us a sketch, a photo, or a link to a model or video you've seen, and tell us what you want. Message us on Instagram or WhatsApp, or upload a file below.",
      media: "/process/step-01",
      /** Phone screenshot: shown tall instead of in a wide frame. */
      portrait: true,
      mediaAlt: "A customer sends us a video of a toothpick dispenser they want printed",
      contact: true,
    },
    {
      title: "We prepare the model",
      body: "We check sizing, strength and the right material, then confirm the price.",
      media: "/process/step-02",
      mediaAlt: "Hands inside the printer, setting up the build plate for a print",
    },
    {
      title: "We print it",
      body: "Layer by layer on our own machine. We'll send a progress photo.",
      media: "/process/step-03",
      mediaAlt: "The Hexagon Balance game printing on the build plate",
    },
    {
      title: "You receive it",
      body: "Cleaned, finished and packed. Pickup or delivery.",
      media: "/process/step-04",
      mediaAlt: "A finished car print being unwrapped from its bubble-wrap packing",
    },
  ],
};

export const processContactCopy = {
  instagram: "Message on Instagram",
  whatsapp: "Message on WhatsApp",
  upload: "Upload a file",
};

export const materialsCopy = {
  heading: "Pick the right material",
  sub: "Every material prints differently. Here is how they compare.",
  properties: {
    strength: "Strength",
    flexibility: "Flexibility",
    detail: "Detail",
    heat: "Heat resistance",
  },
};

export const challengeCopy = {
  heading: "100 days to ₹10 lakh",
  sub: "We're building Voxel Kraft in public: one printer, a new reel every day, and a goal of ₹10,00,000 in sales in 100 days.",
  progress: (day: number, total: number) => `Day ${day} of ${total}`,
  follow: "Follow the journey on Instagram",
  dragHint: "Drag the reels around. Tap one to play.",
  dragHintMobile: "Drag a reel by its Day label to move it. Tap a video to play.",
  dayLabel: (day: number) => `Day ${day}`,
  reelTitle: (day: number) => `Day ${day} of the 100-day challenge, on Instagram`,
};

export const quoteCopy = {
  heading: "Have a file? Get a quote.",
  sub: `Send the model and a few details. We reply with a price within ${PLACEHOLDERS.REPLY_TIME}.`,
  upload: {
    title: "Upload your file",
    hint: "Drag and drop, or click to browse. STL, OBJ, 3MF, STEP up to 50 MB.",
    photoHint: "Only have a photo or sketch? JPG and PNG work too.",
    drop: "Drop it",
    remove: "Remove file",
    previewTitle: "Preview",
    dimensions: "Bounding box",
  },
  fields: {
    name: "Name",
    contact: "Email or phone",
    category: "What is it?",
    categoryPlaceholder: "Choose one",
    material: "Material",
    quantity: "Quantity",
    colour: "Colour",
    notes: "Notes",
    notesPlaceholder: "Size, deadline, finish, a download link for large files…",
    colourPlaceholder: "Any, or name a colour",
  },
  submit: "Request quote",
  submitting: "Sending…",
  success: `Quote requested. We'll reply within ${PLACEHOLDERS.REPLY_TIME}.`,
  sendAnother: "Send another request",
  errors: {
    fileTooLarge: "This file is over 50 MB. Compress it or send a download link in the notes.",
    fileType:
      "We can't read this file type. Send an STL, OBJ, 3MF or STEP file, or a JPG or PNG photo.",
    tooManyFiles: "Send one file at a time. Add links to other files in the notes.",
    name: "Tell us your name.",
    contact: "Add an email address or a phone number we can reach you on.",
    category: "Pick what you'd like printed.",
    material: "Pick a material, or choose Not sure.",
    quantity: "Quantity must be a whole number between 1 and 1000.",
    server: "Something went wrong sending your request. Try again, or email us directly.",
  },
};

export const ctaCopy = {
  headline: ["Have an idea?", "Let's print it."],
  button: { label: "Start a project", href: "#quote" },
};

export const footerCopy = {
  line: `Custom 3D printing studio in ${PLACEHOLDERS.CITY}.`,
  links: [
    { name: "Work", href: "/work" },
    { name: "Materials", href: "/materials" },
    { name: "About", href: "/about" },
    { name: "Get a quote", href: "/quote" },
    { name: "Contact", href: "/contact" },
  ],
  social: [
    { name: "Instagram", href: site.contact.instagram },
    { name: "WhatsApp", href: site.contact.whatsapp },
    { name: "Email", href: `mailto:${site.contact.email}` },
  ],
  copyright: (year: number) => `© ${year} Voxel Kraft 3D`,
  creditsLabel: "3D models:",
  creditBy: "by",
  wordmark: "VOXEL KRAFT",
};

export const comingSoon = {
  title: "Coming soon",
  body: "This page is still on the print bed.",
  back: "Back to home",
};

export const placeholderCopy = {
  /** Shown on empty photo slots until the real file is added. */
  photoMissing: (path: string) => `Add ${path}`,
  modelSlot: (id: string) => `Model slot: ${id} — add /models/${id}.glb`,
};

/**
 * Following-pointer cursor: the wording and shade shown while the mouse is
 * over each part of the page. Tones: molten, ember, amber, pei, rim, ink.
 */
export const cursorCopy = {
  hero: { label: "Let's print", tone: "molten" },
  heroModel: { label: "Printing now", tone: "ember" },
  services: { label: "Pick a service", tone: "pei" },
  work: { label: "Open this print", tone: "ember" },
  workModel: { label: "Drag to turn", tone: "amber" },
  process: { label: "Layer by layer", tone: "rim" },
  materials: { label: "Feel the finish", tone: "pei" },
  challenge: { label: "Day by day", tone: "amber" },
  founders: { label: "Meet the founders", tone: "amber" },
  reviews: { label: "Real feedback", tone: "ember" },
  quote: { label: "Send your file", tone: "molten" },
  challengeCard: { label: "Drag me", tone: "molten" },
  delivery: { label: "We ship here", tone: "ember" },
  cta: { label: "Let's talk", tone: "molten" },
  footer: { label: "Say hello", tone: "ink" },
} as const;

export const reviewsCopy = {
  heading: "What customers say",
  sub: "From first-time ideas to repeat orders.",
  ratingLabel: (rating: number) => `${rating} out of 5 stars`,
  sampleNote: "Sample reviews. Real customer stories coming soon.",
};

export const foundersCopy = {
  heading: "From the founders",
  sub: "Two founders, one printer and a 100-day goal. Here's why we're building Voxel Kraft.",
  previous: "Previous founder",
  next: "Next founder",
};

export const deliveryCopy = {
  heading: "Printed here, delivered anywhere",
  sub: `Every order leaves our workshop in ${PLACEHOLDERS.CITY}, packed and tracked. Pickup is free.`,
  swipeHint: "Swipe the map to see where we ship.",
  mapLabel: `Map of delivery routes from ${PLACEHOLDERS.CITY} to customers around the world.`,
};
