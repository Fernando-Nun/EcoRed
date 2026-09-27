# EcoRed — Donaciones y reciclaje

Aplicación en español para conectar donantes de materiales con centros de reciclaje y organizaciones sociales, con validación por roles y trazabilidad de donaciones.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/ecored run dev` — run the EcoRed web application
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm run test:coverage` — run Jest unit tests with coverage
- Required env: `DATABASE_URL` and `SESSION_SECRET` (set through Secrets; never commit their values)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/ecored/` — React/Vite interface
- `artifacts/api-server/` — Express routes, JWT middleware, and domain logic
- `lib/api-spec/openapi.yaml` — API contract source of truth
- `lib/db/src/schema/` — PostgreSQL/Drizzle schema
- `docs/` — architecture, testing/security, and closure report
- `.github/workflows/ci.yml` — CI, optional SonarQube/ZAP, and staging hook

## Architecture decisions

- Public registration creates donor or organization accounts only; administrator privileges are provisioned explicitly out of band.
- Organization profiles remain private in the public directory until an administrator verifies them.
- Donation state changes are role-scoped: admins can approve or reject pending donations; the recipient organization can accept a pending donation and later confirm an approved one as delivered. The existing `approved` state is labeled “Aceptada” in the interface, and each transition is recorded in `donation_events`.
- JWT bearer tokens live in browser `sessionStorage` for this academic MVP; review HttpOnly cookies/refresh/revocation before production use.

## Product

Donors register materials and choose verified recipients that accept the selected category. The recipient organization can accept a pending donation and confirm delivery after receiving it; administrators can still approve or reject pending donations. Geolocation, rewards, notifications, and environmental-equivalence reports are future scope.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI change, rerun `pnpm --filter @workspace/api-spec run codegen`.
- Jest's 80% threshold is scoped to the tested security and authorization modules, not the full app.
- OWASP ZAP and SonarQube jobs require GitHub variables/secrets; an unconfigured job is not a completed scan.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
