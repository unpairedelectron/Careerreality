# Plan for build phase (12 Nov 2026 is a deploy day; build runs 10 Nov)

Written 2026-11-09 (audit). Priority order per RUNBOOK section 0.

1. **Broken/watching (ship tier):** `http://careerreality.in/` 301s to `https://careerreality.in:443/` (explicit :443). Harmless but untidy; find where the redirect is generated (host config vs `route-registry.json`/`_redirects`). Fix only if it lives in the repo; otherwise note for owner.
2. **Ship-tier improvement:** EPF/PF withdrawal: reports say Form 121 replaces Form 15G/15H for TDS declaration on EPF withdrawal from tax year 2026-27. Check whether `/guides/pf-withdrawal-after-job-loss` and rules pages still say 15G/15H. Wording that changes no figure: ship. Any rule/threshold change: branch for owner. Verify against primary source first (incometaxindia.gov.in, if reachable) before editing.
3. **One draft (Ask-first, branch `claude/guide-<slug>`):** pick one: (a) Labour Codes first anniversary: take-home vs PF/gratuity, with worked example (check existing `/guides/labour-codes-and-layoffs-india` first and expand it instead of adding a new page if overlap is high); (b) EPFO 3.0 / PF withdrawal tax. Do not use claims from secondary blogs as figures; cite primary sources.
4. **Internal links:** link the new/expanded piece from `/rules/gratuity-wages`, `/salary-calculator`, layoffs hub.
5. Branch `claude/guide-form-130-salary-tds-certificate` is already merged (c1e70fa) and can be left; `claude/article-redirects` and `claude/ga4-tag` also merged.
