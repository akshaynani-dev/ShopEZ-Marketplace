# ShopEZ

ShopEZ is a full-stack e-commerce marketplace where buyers discover and purchase products, and sellers manage their storefront and analytics.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/shopez run dev` — run the frontend (port 21378)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Demo Accounts

- **Seller:** `seller@shopez.com` / `password123`
- **Buyer:** `buyer@shopez.com` / `password123`
- **Seller 2:** `marcus@shopez.com` / `password123`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, React Query, Recharts, Wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Auth: JWT (jsonwebtoken) + bcryptjs, token stored in localStorage
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/db/src/schema/` — Drizzle schema (users, products, reviews, cart, orders)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, products, reviews, cart, orders, seller)
- `artifacts/api-server/src/middlewares/auth.ts` — JWT middleware (requireAuth, requireSeller)
- `artifacts/shopez/src/` — React frontend

## Architecture decisions

- JWT stored in localStorage and injected via custom-fetch.ts automatically for all API requests
- Orders store item snapshots as JSONB (productId, name, price, quantity, imageUrl) for immutable history
- Seller analytics (stats, sales chart, top products) computed server-side from orders JSONB without a separate analytics table
- Buyer and seller share the same `/products` CRUD — sellers are scoped to their own products via sellerId check
- Cart is persisted in the database (not localStorage) so it survives sessions

## Product

- **Buyers:** Browse product catalog, filter by category/price/sort, view product details with reviews, manage cart, checkout, track orders
- **Sellers:** Dashboard with revenue stats and sales chart, product management (add/edit/delete), order fulfillment with status updates

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm run typecheck:libs` before artifact typechecks when schema files change
- After every OpenAPI spec change, re-run `pnpm --filter @workspace/api-spec run codegen`
- The products route has `/products/featured` and `/products/categories` BEFORE `/products/:id` — order matters in Express 5

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
