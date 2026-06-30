# ShopEZ

ShopEZ is a full-stack **virtual stock trading platform** where users practice buying and selling real-world stocks using a $100,000 virtual balance — risk-free.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/shopez run dev` — run the frontend (port 21378)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env: `MONGODB_URI` — MongoDB connection string, `SESSION_SECRET` — JWT signing secret

## Demo Accounts

- **Trader:** `alice@shopez.com` / `password123`
- **Admin:** `admin@shopez.com` / `password123`

> Demo users are seeded by calling `POST /api/auth/register` on first run.  
> Stocks (20) are auto-seeded on server startup via `seedStocks()` in app.ts.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, React Query, Recharts, Wouter
- API: Express 5
- DB: MongoDB + Mongoose (replacing old PostgreSQL/Drizzle)
- Validation: Zod (imported as `"zod"` — not `"zod/v4"` — in API server routes)
- Auth: JWT (jsonwebtoken) + bcryptjs, token stored in localStorage
- API codegen: Orval (from OpenAPI spec, mode: "single")
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/db/src/` — Mongoose models: User, Stock, Transaction, Holding
- `artifacts/api-server/src/routes/` — Express routes: auth, stocks, trading, portfolio, admin
- `artifacts/api-server/src/middlewares/auth.ts` — JWT middleware (requireAuth, requireAdmin)
- `artifacts/shopez/src/` — React frontend
- `artifacts/shopez/src/pages/` — Home, Market, StockDetail, Portfolio, Transactions, AdminDashboard, Login, Register

## Architecture decisions

- JWT stored in localStorage and injected via custom-fetch.ts automatically for all API requests
- Stocks auto-seeded (20 stocks with 30-day historical data) on first server startup
- Historical price data stored in Stock document as embedded array (`historicalData[]`)
- Portfolio holdings tracked in separate Holding collection (userId + symbol + avgBuyPrice + quantity)
- Transactions stored immutably in Transaction collection
- Buy/sell updates both Holding and User.virtualBalance atomically
- Admin role can manage users (balance adjustment), stocks (add/delete), and view all transactions
- Zod must be imported from `"zod"` (not `"zod/v4"`) in API server routes — esbuild can't resolve the subpath

## Product

- **Traders (user role):** Browse 20 listed stocks, view 30-day price chart, buy/sell with virtual balance, track portfolio holdings + P&L, view transaction history
- **Admins:** Manage users (edit virtual balance), manage stocks (add/delete/seed), view all platform transactions

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm run typecheck:libs` before artifact typechecks when schema files change
- After every OpenAPI spec change, re-run `pnpm --filter @workspace/api-spec run codegen`
- After codegen, fix `lib/api-zod/src/index.ts` with: `echo "export * from './generated/api';" > lib/api-zod/src/index.ts`
- Import zod as `"zod"` not `"zod/v4"` in API server routes (esbuild can't resolve subpath)
- Express 5 params type is `string | string[]` — use `String(req.params.x)` when calling string methods

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
