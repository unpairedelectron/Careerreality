# Waiting on the owner

Updated every ops cycle (every 3 days). Only open items; newest first.

1. **Pull, build and republish in Replit: `292bc43..c1e70fa`.** Puts live: Google Analytics 4 and the updated `/privacy` text, the new Form 130 guide (`/guides/form-130-salary-tds-certificate-india`), and Form 130 / tax-year 2026–27 wording on the rules pages and regime guide. None of this has had a full build yet; the Replit build is that check. What to do: RUNBOOK section 2, steps 2 to 5. Run `pnpm install` first because the lockfile changed.
2. **Allow sites in the routine's network settings** (claude.ai/code, environment "Default"): `careerreality.in`, `www.careerreality.in`, `incometax.gov.in`, `www.incometax.gov.in`, `incometaxindia.gov.in`, `www.incometaxindia.gov.in`, `epfindia.gov.in`, `labour.gov.in`. Still blocked on 8 Nov (second run): no live health check, drift check or primary-source check could run.
3. **Set GA4 data retention to 14 months** (Admin > Data collection and modification > Data retention). GA4 property `563172819` is created and readable; the default keeps detailed data for only 2 months.
4. **Connect Bing Webmaster Tools** (import the site from Search Console, generate an API key, run the claude-seo Bing installer locally).
5. **Decide on AdSense ads.** Ads are not serving yet, so ad revenue is zero. Turning them on means: confirm the AdSense account and site are approved, choose auto ads or manual placements, set up Google's consent message (needed for EEA/UK/Swiss visitors), and let Claude update `/privacy` to match. Claude will prepare the change on a branch once you say go.
6. **Owner-only facts** in `OWNER-INPUTS-REQUIRED.md` (8 items: company name from MCA, address, data retention, analytics, privacy mailbox, grievance officer, accessibility review, trust routes check).

Resolved this cycle: the cloud routine can now push to GitHub (8 Nov second run pushed `108f5c8` to `main`).
