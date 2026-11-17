# Waiting on the owner

Updated every ops cycle (every 3 days). Only open items; newest first.

1. **Request indexing in Search Console (web UI only; the API cannot do it).** URL Inspection → paste URL → Request indexing, for these 7 pages Google has not indexed: `/guides/data-science-career-claims/`, `/ai/`, `/security/`, `/layoffs/amazon-devices-services-reduction-2026/` (never discovered), `/guides/independent-work-without-romanticising-it/` (Soft 404 from a 12 Nov crawl; page is fine now), `/about/` (crawled, not indexed; rewritten since), `/guides/read-the-offer-beyond-ctc/` (target of the biggest old-article redirect). About 10 minutes; daily quota is limited, so do the first three today if needed.
2. **Optional: fix the `http://` redirect at the host.** `http://careerreality.in/` 301s to `https://careerreality.in:443/` (explicit port). Harmless, but it adds a variant URL; it is Replit/host configuration, not repo code.
3. **Record the last publish.** Live already serves the article redirects and guide direct answers (seen 17 Nov), but `ops/LAST-DEPLOY` still says `c1e70fa`. Tell Claude the commit Replit published (Replit shows it), or let the 20 Nov deploy write it.
4. **Allow sites in the routine's network settings** (claude.ai/code, environment "Default"): `incometax.gov.in`, `www.incometax.gov.in`, `incometaxindia.gov.in`, `www.incometaxindia.gov.in`, `epfindia.gov.in`, `labour.gov.in`. `careerreality.in` is now reachable (9 Nov); government sites not yet tested, so primary-source checks are still unconfirmed.
5. **Set GA4 data retention to 14 months** (Admin > Data collection and modification > Data retention). GA4 property `563172819` is created and readable; the default keeps detailed data for only 2 months.
6. **Connect Bing Webmaster Tools** (import the site from Search Console, generate an API key, run the claude-seo Bing installer locally).
7. **Do not request AdSense review yet (rejected for low-value content).** As of 8 Nov 2026 Search Console shows 28 clicks in 3 months, nearly all to old `/article/` pages that are now noindex. First: recover those URLs, publish steadily for 8 to 10 weeks, resolve the owner-only facts behind the "not verified" wording in the legal pages, and see clicks growing. Claude will say when it looks ready.
8. **Owner-only facts** in `OWNER-INPUTS-REQUIRED.md` (8 items: company name from MCA, address, data retention, analytics, privacy mailbox, grievance officer, accessibility review, trust routes check).

Publishing is automatic on deploy days; no manual republish is needed.
