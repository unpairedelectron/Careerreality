# Plan for build phase (18 Nov 2026; deploy day is 20 Nov)

Written 2026-11-17 (audit). Priority order per RUNBOOK section 0.

1. **Broken/watching:** (a) No 16 Nov deploy entry in LOG and `ops/LAST-DEPLOY` is still `c1e70fa`; live still lacks the 44 `/article/` redirects (`/article/pf-withdrawal/` 404), CTC ledger and guide direct answers. Cause unknown from here (deploy routine may not have run or could not push). Owner to check the 16 Nov run. (b) `http://` 301s to `https://careerreality.in:443/` (host config).
2. **Ship-tier (branch `claude/cycle-2026-11-18`):** nothing queued; look only for broken links or metadata on pages touched by the pending release.
3. **One draft (Ask-first, `claude/guide-<slug>`):** topic with demand: layoff process rights in IT (notice, severance, TCS Pune Labour Commissioner hearing). Write only if a primary source (IR Code / state standing orders / Labour Commissioner) is reachable; otherwise write nothing and say so.
4. **Internal links:** link any draft from `/rules/gratuity-wages`, `/salary-calculator` and the layoffs hub.
