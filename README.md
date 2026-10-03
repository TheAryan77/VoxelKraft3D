# Voxel Kraft 3D

Website for Voxel Kraft 3D, a custom 3D printing studio. Next.js 15 (App Router),
Tailwind CSS v4, Aceternity UI, React Three Fiber.

## Run locally

```bash
npm install
npm run dev
```

## Where things live

| What | Where |
|---|---|
| All copy (headlines, labels, placeholders like `{CITY}`) | `src/content/site.ts` |
| Work cards (photos, tags, materials) | `src/content/work.ts` + photos in `public/work/` |
| Founders, reviews, materials, delivery map | `src/content/*.ts` |
| 3D models | `public/models/*.glb`, registered in `src/lib/models.config.ts` |
| Model attribution (CC BY) | `src/content/credits.ts` (shown in the footer) |
| Light/dark colours | `src/app/globals.css` |

## Adding a 3D model

1. Optimise it:
   ```bash
   npx gltf-transform optimize input.glb public/models/<slot-id>.glb --compress draco --texture-compress webp
   ```
   Helpers: `scripts/strip-nodes.mjs` (remove collider meshes),
   `scripts/strip-tangents.mjs` (smaller files).
2. Set `src` for that slot in `src/lib/models.config.ts`. Options per model:
   `finish` (`"solid"` / `"wireframe"`), `saturation`, `margin` (lower = bigger), `lift`, `rotation`.
3. If it's CC BY, add it to `src/content/credits.ts`.

A missing or broken model falls back to the placeholder; nothing crashes.

## Environment variables

See `.env.example`. The quote form emails through Resend when `RESEND_API_KEY`,
`QUOTE_FROM_EMAIL` and `QUOTE_TO_EMAIL` are set; otherwise requests are only logged.

## Deploying (Vercel)

Import the GitHub repo in Vercel; the defaults (Next.js, `npm run build`) work as is.

Note: Vercel limits request bodies to about 4.5 MB, so quote uploads larger than
that will fail there. For 50 MB files, upload straight to storage (e.g. Vercel Blob)
and send the link with the form.

## Before launch

- Replace the `{PLACEHOLDERS}` in `src/content/site.ts` (layer height, materials,
  turnaround, reply time, city, email, WhatsApp).
- Replace the sample reviews in `src/content/reviews.ts` with real ones (while any
  sample remains, the section shows a "Sample reviews" note).
- Fill in sizes and print times in `src/content/work.ts`.
- Check that every Sketchfab model licence allows commercial web use, and replace
  trademarked characters (BatMinion, Batman, iPhone) if needed.
