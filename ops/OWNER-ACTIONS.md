# Waiting on the owner

Updated every ops cycle (every 3 days). Only open items; newest first.

1. **Optional: publish before 16 Nov.** The publishing blocker is cleared: Replit merged and pushed `b7eebe8` on 12 Nov (`b629cf6`), so Replit and origin match and the 16 Nov deploy can proceed on its own. If you want the article redirects (issue #2), CTC ledger and guide direct answers live sooner, publish in Replit now (pull, build, Publish, push). Otherwise do nothing.
2. **Allow sites in the routine's network settings** (claude.ai/code, environment "Default"): `incometax.gov.in`, `www.incometax.gov.in`, `incometaxindia.gov.in`, `www.incometaxindia.gov.in`, `epfindia.gov.in`, `labour.gov.in`. `careerreality.in` is now reachable (9 Nov); government sites not yet tested, so primary-source checks are still unconfirmed.
3. **Set GA4 data retention to 14 months** (Admin > Data collection and modification > Data retention). GA4 property `563172819` is created and readable; the default keeps detailed data for only 2 months.
4. **Connect Bing Webmaster Tools** (import the site from Search Console, generate an API key, run the claude-seo Bing installer locally).
5. **Do not request AdSense review yet (rejected for low-value content).** As of 8 Nov 2026 Search Console shows 28 clicks in 3 months, nearly all to old `/article/` pages that are now noindex. First: recover those URLs, publish steadily for 8 to 10 weeks, resolve the owner-only facts behind the "not verified" wording in the legal pages, and see clicks growing. Claude will say when it looks ready.
6. **Owner-only facts** in `OWNER-INPUTS-REQUIRED.md` (8 items: company name from MCA, address, data retention, analytics, privacy mailbox, grievance officer, accessibility review, trust routes check).

Publishing is automatic on deploy days; no manual republish is needed.
