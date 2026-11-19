# MOTIF website — version 2 (scroll story)

The home page is a pinned, scroll-driven close-up of the frame. Live on GitHub Pages: https://liobulio.github.io/motif-site-2/
The static version is in liobulio/motif-site-1.

Static site: plain HTML, CSS and JavaScript. No build step, no framework.
Shopify is used only as the backend (products, inventory, checkout, orders).

## Files

    index.html        home page
    product.html      product page — ?colour=black or ?colour=caramel
    fr/               French versions of both pages (same CSS, JS and images)
    css/styles.css    all styles; colours and fonts are variables at the top
    css/story.css     home page scroll story, fit statement, shop-card hover
    js/config.js      everything you need to edit before launch
    js/site.js        menu, waitlist form, colour/view switching, Shopify checkout
    js/story.js       home page: scroll-driven camera over the four product images
    js/vendor/        Lenis 1.3.27 (MIT), smooth wheel scrolling on the home page
    assets/story/     story copy of the product image with the page colour baked in
    assets/           product images (webp)

## Run locally

    python3 -m http.server 8000
    # open http://localhost:8000

## Deploy

Upload the folder to any static host (Cloudflare Pages, Netlify, Vercel, GitHub Pages).
No build command; the output directory is the folder itself.

## Before launch

1. **Waitlist** — set `waitlistEndpoint` in `js/config.js`. Until you do, the form
   tells visitors it is not connected. Either:
   - a serverless function on Vercel/Netlify (not GitHub Pages), or
   - use a form service URL that accepts a JSON POST.
2. **Placeholders** — replace `[LAUNCH MONTH]` / `[RETURN POLICY]` in the English pages and
   `[MOIS DE LANCEMENT]` / `[POLITIQUE DE RETOUR]` in `fr/`.
3. **Footer links** — Shipping, Contact and Instagram currently point to `#`.
4. **French copy** — have a Québec French speaker read `fr/` once before launch.
   Any text you change in the English pages must be changed in `fr/` too;
   colour names and form messages live in `js/config.js` and `js/site.js`.
5. **Product claims** — 20 g, UV400, thread-locked screws and the fit copy are plans.
   Confirm each against the real sample before the site goes public.
6. **Images** — the current ones are renders. Swap in real photos with the same
   file names in `assets/` (portrait, about 3:4, white background).

## Switching to selling

1. In Shopify admin, add the Headless sales channel, create a storefront and copy
   its **public** Storefront API token.
2. Create the product with two variants and copy each variant's GID.
3. In `js/config.js` fill in `shopify.domain`, `shopify.storefrontToken`,
   `shopify.variants`, then set `mode: 'shop'`.

The product page button then creates a cart through the Storefront API and sends
the buyer to Shopify's hosted checkout. Payment, tax, shipping and order emails
all happen on Shopify.

Never put an Admin API token in `js/config.js`: everything in these folders is public.

## Scroll story (home page)

The pinned section at the top of the home page is driven entirely by scroll
position: nothing plays on its own. `js/story.js` moves a "camera" over the caramel
3/4 product image:

    0.00–0.14  01 whole pair, caramel 3/4
    0.14–0.38  zoom into the temple inlay, levelled
    0.40–0.58  02 light sweeps across the weave
    0.62–0.78  pull back out
    0.78–1.00  03 weight counts up to 20 g

Chapter text uses `data-in` / `data-out` on each `.chap` element with the same 0–1 scale.
If you replace the product image, regenerate `assets/story/caramel-34.webp` (the image
multiplied by the page colour #EFEFEC) and update the `full`, `inlay`, `len` and `angle` values in `LAYERS` (fractions of the image), or the zoom will land in the wrong place.
With "reduce motion" turned on in the OS, the zoom and sweep are skipped; the text
chapters still change as you scroll.

