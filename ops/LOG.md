# Operations log

Newest first. One entry per session or scheduled run.

## 2026-11-08 — First ops cycle (test run)

- Run `cse_01XeDgQRMpDaXs48u6xRxHPS`. Push notification was accepted ("Mobile push requested"). Its commits and branches were lost: every push got 403 (Claude GitHub App lacks write access).
- No production checks ran: `careerreality.in` is blocked by the cloud environment's network policy.
- Findings to redo after access is fixed: `tsx` is missing from career-reality devDependencies, so `pnpm run build` fails outside Replit; Form 130 (replaces Form 16) guide draft; tax rules pages and old-vs-new regime guide still scoped to AY 2026–27 (Ask-first).
- Search Console key saved locally and signs in; no property shared with the service account yet.

## 2026-11-08 — Handover

- Owner handed day-to-day operation to Claude; rules in `ops/RUNBOOK.md`.
- Shipped since the audit: `2c70593` post-audit SEO fixes (shared page schemas, sitemap, robots, ads.txt); `1c008b7` verifier allows the founder byline; `8e93cb8` favicon.ico. Owner merged `claude/seo-title-description-copy` and `claude/seo-trailing-slash-links`.
- Live check after republish at `10a653c`: favicon.ico 200, ads.txt/robots.txt/sitemap.xml 200, all 87 sitemap URLs 200, guide byline and Article author schema present.
- Set up weekly cloud routine `trig_011FfvPEJ5QKG2S96bPebGGd` (Mondays 09:00 IST, first run 2026-11-09). Replit connector confirmed it can read Repl `IndigoBowedMegabyte` publish status.
- Open: Search Console / GA4 access not connected; Replit publish via connector unproven; items in `OWNER-INPUTS-REQUIRED.md`.
