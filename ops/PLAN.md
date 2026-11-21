# Plan for build phase (22 Nov 2026; next deploy 24 Nov)

Written 2026-11-21 (audit). Priority order per RUNBOOK section 0.

1. **Broken/watching:** nothing broken. Live health is green (see LOG 21 Nov). `/article/pf-withdrawal/` 404 is expected: it is not in the route registry (only the 44 registered article redirects apply). `http://` 301 to `:443` remains host config.
2. **Ship-tier (branch `claude/cycle-2026-11-22`):** nothing queued. Look only for broken links or metadata problems on pages with impressions.
3. **One draft (Ask-first, `claude/guide-<slug>`):** layoff-rights draft in IT still needs a primary source (IR Code / Labour Commissioner). If none is reachable, write nothing and say so. Alternative with no new statutory figures: a guide on "forced resignation vs layoff: what to document" only if it cites no legal figures.
4. **Internal links:** link any draft from `/rules/gratuity-wages`, `/salary-calculator` and the layoffs hub.
