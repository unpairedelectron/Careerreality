# CareerReality production launch checklist

Launch target: **2026-09-07**  
Current published host: `https://careerreality.in`
Intended canonical host: `https://careerreality.in`

## Current go/no-go baseline

Already verified in the workspace:

- Dependency audit: 0 critical, high, moderate, or low findings.
- SAST scan: 0 findings.
- Privacy/dataflow scan: 0 findings.
- Typecheck and frontend production build pass.
- Public browser regression suite passes.
- API health returns `{"status":"ok"}`.
- Public company API returns 26 records.
- Unknown static routes return HTTP 404.
- Valid company and auth callback routes have generated app shells.

## Two-hour launch sequence

### T-120 to T-90 — publish configuration

- [ ] Attach `careerreality.in` and `www.careerreality.in` to the CareerReality Replit deployment.
- [ ] Confirm both domains resolve to the same current deployment, not the older Vercel host.
- [ ] Configure a path- and query-preserving HTTP 301 from `www.careerreality.in` to `careerreality.in` at the domain/proxy edge; the static artifact cannot provide this host-level redirect.
- [ ] Set the production site URL used at build time to `https://careerreality.in` (apex).
- [ ] Confirm the production deployment is public and the API service is included.
- [ ] Select the final publishing geography before the first production publish; Replit locks geography after first publish.

### T-90 to T-65 — identity and data

- [ ] Confirm Clerk is using the production instance and production publishable/secret keys.
- [ ] Confirm Clerk allowed origins, redirect URLs, and sign-in callback paths use the apex canonical domain; verify any legacy `www` callback reaches the apex before authentication.
- [ ] Confirm the production database is provisioned from the current development schema.
- [ ] Confirm the public seed data is present in production, including the 26 company signals.
- [ ] Do not copy development sessions, test users, or development secrets into production.

### T-65 to T-40 — publish and smoke test

- [ ] Publish the current build.
- [ ] Run the named [`published-seo` release gate](artifacts/career-reality/scripts/verify-published-seo.mjs) from the Replit Validation panel. The package command is `pnpm --filter @workspace/career-reality run verify:published-seo`.
- [ ] Check `/`, `/companies`, `/salary-reality`, `/salary-calculator`, `/compass`, `/articles`, and `/privacy-policy`.
- [ ] Check `/api/healthz` and `/api/public/companies`.
- [ ] Check one new company detail route, such as `/companies/hcltech`.
- [ ] Check an unknown route returns HTTP 404.
- [ ] Check `/robots.txt` and `/sitemap.xml` use the apex canonical domain, retain the indexable `/companies/` directory, and exclude unsourced company-detail pages.
- [ ] Confirm route-specific title, description, canonical URL, and Open Graph URL on `/companies/hcltech`.
- [ ] Verify `https://www.careerreality.in/career-reality-index/?check=1` returns HTTP 301 with the same path and query on `https://careerreality.in`.

### SEO release gate — mandatory go/no-go

- [ ] Open the **latest `published-seo` validation run** and confirm its status is `PASSED` before launch.
- [ ] Confirm the run covers the primary domain plus configured alternate public hosts, `/search/`, `sitemap.xml`, `robots.txt`, one article, and the editorial trust route.
- [ ] Treat `STALE PUBLISHED BUILD` or `SEO RELEASE BLOCKED` as a release blocker. The run prints the exact route, expected value, and observed value for every failure.
- [ ] On a passing run, confirm the sanitized rollback baseline was written to `artifacts/career-reality/reports/published-seo-known-good.json`. Failed runs must never overwrite that baseline.
- [ ] Current result: the local build and live custom-domain SEO checks pass. The generated Replit hostname is intentionally crawl-blocked with `Disallow: /`; the release verifier treats that as expected. Publish the current legacy-AI handoff patch and rerun the gate before launch.

### T-40 to T-20 — real user paths

- [ ] Complete one real Clerk sign-in on the production domain.
- [ ] Save a salary decision, refresh, and confirm it remains in the workspace.
- [ ] Watch a company, refresh, and confirm it remains in the workspace.
- [ ] Confirm signed-out save/watch actions return to the originating route after sign-in.
- [ ] Confirm no salary, company, private note, Clerk ID, or secret appears in analytics payloads.

### T-20 to launch — go/no-go

- [ ] Review the current deployment build status and runtime logs.
- [ ] Check browser console for uncaught errors on the smoke-test routes.
- [ ] If any gate fails, do not announce launch: keep the current deployment, fix the blocker, and republish.
- [ ] After launch, watch API and deployment logs for the first 30 minutes.
- [ ] Keep the last known-good checkpoint available for rollback.

## Explicit launch blockers

1. The current legacy-AI handoff patch is not live until the corrected artifact is republished and the latest `published-seo` gate passes.
2. The production Clerk instance and a real production session must be verified manually.
3. Production database schema and seed contents must be checked after publishing.
4. Canonical, robots, and sitemap checks must pass on the final custom domain, not only on the Replit host.