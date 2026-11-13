# Plan for build phase (14 Nov 2026; deploy day is 16 Nov)

Written 2026-11-13 (audit). Priority order per RUNBOOK section 0.

1. **Broken/watching:** (a) 44 `/article/<slug>/` redirects are still not live (`/article/pf-withdrawal/` 404); waits on a publish. Next deploy (16 Nov) must not stop on Replit's extra unbuilt commit `b7eebe8`; owner action. (b) `http://` still 301s to `https://careerreality.in:443/`; host config, no repo source (see 10 Nov).
2. **Ship-tier (branch `claude/cycle-2026-11-14`):** only if a primary source is reachable. Gov sites still answer 301/302 from this network, so test whether following redirects works (`curl -L`) before concluding they are blocked. Form 121 vs 15G/15H: no page mentions it; skip unless a source is confirmed.
3. **One draft (Ask-first, `claude/guide-<slug>`):** expand `/guides/labour-codes-and-layoffs-india` with retrenchment compensation (15 days' average pay per completed year, IR Code) and the 50% wage rule effect on PF/gratuity, only with figures read from labour.gov.in / gazette text. If no primary source is reachable, write nothing.
4. **Internal links:** from `/rules/gratuity-wages`, `/salary-calculator` and the layoffs hub to whatever item 3 produces.
