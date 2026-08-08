---
name: testing-craftcart-storefront
description: How to run and end-to-end test the CraftCreative vanilla-JS + Vite storefront (products, categories, cart, WhatsApp checkout, mobile layout, production build).
---

# Testing the CraftCreative storefront

## Running it
- No backend, no auth, no credentials. `npm install && npm run dev` → http://localhost:5173
- Production check: `npm run build && npm run preview -- --port 4173` → http://localhost:4173.
  A custom Vite plugin in `vite.config.js` copies `store-config.js`, `app.js` and `products/` into `dist/`.
  `index.html` loads these as classic (non-module) scripts, so Vite emits a
  "can't be bundled without type=module" warning — expected, not a failure. Always smoke-test the
  preview build, not just the dev server, because a plugin (not the bundler) is what ships those files.

## Where behaviour lives
- All data (store name, `whatsappNumber`, `categories`, products with `price`/`originalPrice`/`category`/`image`)
  is in `store-config.js` → `window.STORE_CONFIG`. Read it first to derive expected counts/prices.
- `app.js`: `visibleProducts()` (category AND search, search matches name+description+category),
  `renderGrid()` (the "N items" count text), `discountPct()` (`round((orig-price)/orig*100)`),
  `cartTotal()` (uses `price`, never `originalPrice`), `placeOrder()` (validation toast
  "Please fill all delivery details" then `https://wa.me/<number>?text=<encoded>`).

## Useful assertions
- Broken images: `[...document.querySelectorAll('.card__img')].filter(i=>!i.complete||i.naturalWidth===0).length`
- Category/search: click pills and type in the search box via real UI clicks; check the `#gridCount` text.
- WhatsApp: clicking "Place Order via WhatsApp" opens a new tab; `wa.me` redirects to
  `api.whatsapp.com/send/?phone=...&text=...` — read that tab's URL for the assertion and close it
  without sending. Cancel the "Open xdg-open?" dialog Chrome shows.
- Console JS via devtools must be an expression; wrap multi-statement snippets in an IIFE `(() => { ... })()`.

## Mobile layout (known risk area)
`styles.css` gives `.header__inner` a fixed `height: var(--header-h)` while the `@media (max-width:480px)`
block sets `flex-wrap: wrap` and a full-width `.header__search`. The wrapped content overflows the fixed
height and can visually and *interactively* cover the category pills below. Verify with hit-testing, not
just a screenshot:
```js
(() => [...document.querySelectorAll('#categoryPills button')].map(b => {
  const r = b.getBoundingClientRect();
  const el = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2);
  return {pill: b.textContent, coveredBy: el === b ? null : el.tagName};
}))()
```
Any non-null `coveredBy` means the pills are unclickable. Likely fix: let the header grow
(`height: auto; min-height: var(--header-h)`) in the mobile media query.

## Devin Secrets Needed
None.
