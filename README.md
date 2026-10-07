# E-SHOP

Phase 1 is the React + Vite storefront foundation: responsive landing page, category navigation, and a starter shop shell. Product data, authentication, seller/admin tools, cart, and checkout are intentionally not included yet.

## Run in the Replit workspace

From the workspace root:

```sh
pnpm --filter @workspace/e-shop run dev
```

## Run as a standalone app

After copying this folder into a standalone repository, run these commands from its root:

```sh
npm install
npm run dev
```

Create a production build with:

```sh
npm run build
```

The package uses standard React, Vite, Tailwind CSS, React Router, and Lucide dependencies. It does not require Replit-specific environment variables to run locally.

## Structure

- `src/pages/` — home, shop, and not-found routes
- `src/components/` — shared storefront header and footer
- `src/data/` — category labels used by the Phase 1 navigation
- `public/` — static storefront imagery
