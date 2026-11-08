# Waiting on the owner

Updated every ops cycle (every 3 days). Only open items; newest first.

1. **Finish Google Search Console + GA4.** Key is saved and signs in, but the service account cannot see any site yet. In Search Console: Settings > Users and permissions > Add user > `claude-seo@careerreality-seo.iam.gserviceaccount.com` > Full. In GA4: Admin > Property access management > add the same email as Viewer, then give Claude the numeric Property ID.
2. **Connect Bing Webmaster Tools** (import the site from Search Console, generate an API key, run the claude-seo Bing installer locally).
3. **Decide on AdSense ads.** Ads are not serving yet, so ad revenue is zero. Turning them on means: confirm the AdSense account and site are approved, choose auto ads or manual placements, set up Google's consent message (needed for EEA/UK/Swiss visitors), and let Claude update `/privacy` to match. Claude will prepare the change on a branch once you say go.
4. **Owner-only facts** in `OWNER-INPUTS-REQUIRED.md` (8 items: company name from MCA, address, data retention, analytics, privacy mailbox, grievance officer, accessibility review, trust routes check).

No republish needed right now: live site matches `main` as of 8 Nov 2026 (only `ops/` files changed since, which do not affect the site).
