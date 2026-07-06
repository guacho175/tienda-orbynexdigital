---
name: orbynex-commerce-polish
description: UI/UX polish workflow for the tienda-orbynexdigital mini-commerce. Use when improving the public storefront, Orbynex identity, hero copy, product cards, admin product table thumbnails, floating notifications/toasts, commercial wording, responsive polish, or visual QA for this TanStack Start + React + Tailwind + Supabase ecommerce demo.
---

# Orbynex Commerce Polish

## Purpose

Use this skill to turn the mini-commerce from a technical demo into a client-facing storefront that feels branded, clear, and sellable without breaking Flow, WhatsApp, Supabase, admin, or product image performance.

## Required Companion Skills

Use these skills together when available:

- `orbynex-frontend`: brand palette, performance, responsive rules, and Orbynex visual identity.
- `frontend-design`: stronger visual direction, better hero thesis, copy that does not feel templated.
- `portafolio-frontend`: mobile centering discipline, professional presentation, subtle motion, and polished responsive checks.
- `browser:control-in-app-browser`: verify the deployed or local UI visually.

## Hard Restrictions

Do not touch:

- `api/flow/*`
- Flow checkout logic
- WhatsApp checkout logic
- `payment_url` behavior
- Auth/RLS/service role/env vars
- orders/order_items
- product deletion logic
- `src/routes/_authenticated/route.tsx`

Keep product image variants working:

- Cards use `image_url_card`.
- Detail uses `image_url_detail`.
- Cart, checkout, and admin thumbnails use `image_url_thumb`.
- Preserve fallback to `image_url` for legacy products.

## Product Positioning

Rewrite public copy for non-technical clients. Avoid internal terms in visible marketing UI:

- Avoid `payment_url`, `Supabase`, `Flow API`, `backend`, `template`, and `demo` in hero/category value copy unless the section is explicitly technical.
- Say what the customer understands: catalog, online payments, WhatsApp orders, product management, checkout, service packages.
- The primary action should usually be `Ver servicios`, `Explorar tienda`, or `Ver productos`.
- Avoid a secondary hero CTA to `Probar carrito`; it feels like QA, not shopping.
- If a secondary CTA is needed, use something user-facing like `Hablar por WhatsApp`, `Ver como comprar`, or remove it.

## Public Storefront Goals

Hero:

- Add a stronger first-viewport Orbynex signal: logo/wordmark treatment, commerce visual, product preview, or live mini storefront composition.
- Make the H1 understandable to a business owner in under 5 seconds.
- Explain that this is a simple online store for selling digital services/products with payments and WhatsApp.
- Replace purely technical cards like "Flujo demo" with a commercial preview: selected product, price, checkout steps, trust badges, or order summary.

Categories:

- Replace "Que puedes vender con esta tienda" if it sounds abstract.
- Use client-facing language such as "Servicios listos para vender online", "Elige una categoria de servicio", or "Soluciones que puedes publicar en tu tienda".
- Category cards should feel clickable and useful, not empty blocks.

Product cards:

- Improve visual hierarchy: thumbnail, category, title, short description, price, primary CTA.
- Keep card image dimensions stable and use existing `ProductImage`.
- Use hover/focus effects that are subtle, branded, and not heavy.
- Avoid nested cards and avoid adding heavy libraries.

Admin:

- In `/admin`, add a small product thumbnail column or thumbnail inside the product cell.
- Use `ProductImage` with `variant="thumb"`, `image_url_thumb`, fallback `image_url_card`, `image_url_detail`, `image_url`.
- Keep the table readable on mobile; if needed, turn rows into compact cards at small widths.
- Do not change product delete behavior.

Notifications:

- Use the existing `sonner` setup.
- Make toasts feel floating and branded: top/right or bottom/right depending on layout, clear success/error titles, concise descriptions, visible border/shadow.
- Keep messages consistent with actions: "Producto actualizado", "Agregado al carrito", "Pedido enviado por WhatsApp".
- Avoid vague errors; tell the admin/client what failed and what to try.

## Visual Direction

Use Orbynex dark technology base with restrained accents:

- Deep blue base.
- Cyan for clarity/data/interactive hints.
- Magenta/fuchsia only as accent.
- Avoid generic gradient blobs/orbs and noisy decoration.
- Prefer crisp panels, commerce previews, thumbnail grids, soft borders, focus rings, and subtle motion.

One acceptable signature element:

- A commerce control panel hero mockup showing product card plus cart/checkout step, using real product thumbnails if available.
- Keep it lightweight in CSS/React, no new image-heavy assets unless optimized.

## Validation

After edits:

- Run `npm run build`.
- Run targeted lint on touched files if global lint fails due CRLF.
- Verify home, catalog, product detail, cart, checkout, and admin where possible.
- Use Browser screenshots/checks at desktop and mobile widths.
- Confirm visible UI has no `payment_url` copy in public customer-facing sections.
- Confirm admin product list shows thumbnails.
- Confirm toasts appear and are readable.
- Create/update a concise Markdown report in `docs/`.
