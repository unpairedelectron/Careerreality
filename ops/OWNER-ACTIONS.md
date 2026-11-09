# Waiting on the owner

Updated every ops cycle (every 3 days). Only open items; newest first.

1. **Allow sites in the routine's network settings** (claude.ai/code, environment "Default"): `incometax.gov.in`, `www.incometax.gov.in`, `incometaxindia.gov.in`, `www.incometaxindia.gov.in`, `epfindia.gov.in`, `labour.gov.in`. `careerreality.in` is now reachable (9 Nov); government sites not yet tested, so primary-source checks are still unconfirmed.
2. **Set GA4 data retention to 14 months** (Admin > Data collection and modification > Data retention). GA4 property `563172819` is created and readable; the default keeps detailed data for only 2 months.
3. **Connect Bing Webmaster Tools** (import the site from Search Console, generate an API key, run the claude-seo Bing installer locally).
4. **Do not request AdSense review yet (rejected for low-value content).** As of 8 Nov 2026 Search Console shows 28 clicks in 3 months, nearly all to old `/article/` pages that are now noindex. First: recover those URLs, publish steadily for 8 to 10 weeks, resolve the owner-only facts behind the "not verified" wording in the legal pages, and see clicks growing. Claude will say when it looks ready.
5. **Owner-only facts** in `OWNER-INPUTS-REQUIRED.md` (8 items: company name from MCA, address, data retention, analytics, privacy mailbox, grievance officer, accessibility review, trust routes check).

Publishing is automatic on deploy days; no manual republish is needed.
