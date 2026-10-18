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

## 100-day challenge reels

With `INSTAGRAM_ACCESS_TOKEN` set, the site fetches @voxelkraft.in's newest reels
from the Instagram API every hour, reads "Day N" from each caption and shows the
newest 5 (older days drop off). Without it, it shows `fallbackReels` in
`src/content/challenge.ts`.

Getting a token: switch @voxelkraft.in to a Professional (Creator or Business)
account, create an app at developers.facebook.com with the "Instagram API with
Instagram Login" product, add the account, and generate a long-lived token
(scope `instagram_business_basic`). It lasts 60 days; refresh it before then with
`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=<token>`.

## Shop (e-commerce)

The landing page is unchanged; the shop lives around it.

| Area | Routes |
|---|---|
| Storefront | `/shop`, `/shop/[category]`, `/product/[slug]`, `/cart`, `/checkout` |
| Customer account | `/login` (Google), `/account`, `/account/orders/[id]` (tracking), `/account/addresses`, `/account/support` (chat) |
| Admin | `/admin` dashboard, orders (status, tracking, payment), products (with photo upload), categories, customer care inbox, customers |

How it works:
- **Data:** PostgreSQL via Prisma (`prisma/schema.prisma`). Money is stored in paise.
- **Sign-in:** Auth.js with Google. Emails listed in `ADMIN_EMAILS` get the admin dashboard.
- **Cart:** kept in the browser; prices are always re-read from the database at checkout.
- **Payments:** Razorpay (UPI, cards, netbanking) and cash on delivery. Payments are
  verified by signature on the server, with a webhook as backup. Without Razorpay keys,
  checkout offers COD only.
- **Orders:** VK-1001 onwards. Stock (if set) is reserved when an order is placed and
  returned if it's cancelled. Customers can cancel until printing starts.
- **Tracking:** every status change and note shows on the customer's order page; add a
  courier, tracking number and link from the admin order page.
- **Customer care:** chat per customer or per order, refreshing every few seconds.
- **Shop settings** (shipping fee, free-shipping threshold, COD limit): `src/lib/shop/config.ts`.

### Local development

```bash
brew services start postgresql@15   # or start Postgres your own way
createdb voxelkraft
cp .env.example .env.local          # fill DATABASE_URL, AUTH_SECRET; set AUTH_DEV_LOGIN=true
cp .env.local .env                  # the Prisma CLI reads .env
npm run db:migrate                  # create tables
npm run db:seed                     # sample categories and products (local only)
npm run dev
```

With `AUTH_DEV_LOGIN=true`, `/login` also offers an email-only sign-in for testing
(development only; never active in production). Use an email from `ADMIN_EMAILS`
to see `/admin`.

### Going live on Vercel

1. **Database:** Vercel → your project → Storage → Create → **Neon** (Postgres). Connect it
   to the project; it adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED`. Tables are created
   on the next deploy (`scripts/db-deploy.mjs`).
2. **Photos:** Storage → Create → **Blob**. Connect it; it adds `BLOB_READ_WRITE_TOKEN`.
3. **Google sign-in:** Google Cloud Console → APIs & Services → Credentials → Create
   OAuth client ID (Web application). Authorised redirect URI:
   `https://<your-domain>/api/auth/callback/google`. Add `AUTH_GOOGLE_ID`,
   `AUTH_GOOGLE_SECRET`, and `AUTH_SECRET` (run `npx auth secret`).
4. **Admins:** `ADMIN_EMAILS` = Anurag's Google email (comma-separate several).
5. **Payments:** Razorpay dashboard → API keys → `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
   (test keys first). Webhook: `https://<your-domain>/api/razorpay/webhook` with events
   `payment.captured` and `order.paid`, secret in `RAZORPAY_WEBHOOK_SECRET`. Live keys
   need Razorpay KYC.
6. Redeploy, sign in with the admin Google account, add categories and products at `/admin`.

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
