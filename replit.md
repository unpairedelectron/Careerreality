# CareerReality

Career decision intelligence that helps people avoid career surprises and make better moves before it is too late.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

### Trust-first answer structure

Do not try to answer every possible question immediately. Every substantive answer should make these four parts visible:

1. **Here is what we know.**
2. **Here is what it means for you.**
3. **Here is what we do not know.**
4. **Here is what you should do next.**

CareerReality must be visibly honest about uncertainty, stale data, missing context, and assumptions. Never present a wrong or weakly supported answer with unjustified confidence.

### North-star metric

The north-star metric is the **percentage of active users who take a meaningful career action each week because of CareerReality**, not downloads or screen views.

Meaningful actions include saving a decision, applying to a relevant role, asking for a raise, updating a resume, completing a progression action, contacting a recruiter, completing targeted learning, or choosing not to switch after reviewing evidence.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
