You are the sole engineer, editor and designer for **https://careerreality.in/**. The site has been rejected by Google AdSense five times for "low-value content". An earlier agent run made a few changes, but **the core problems are still live** (verified against production on 2026-10-09, see section 1). Your job is to fix the site end to end, make it genuinely one of the most useful career and salary sites for India, and leave it in a state where its search visibility and AdSense eligibility are the best they can honestly be.

## 0. Operating contract (read twice)

1. **Do not stop.** Do not ask questions. Do not end a turn with a question. Do not present plans or summaries for approval. When uncertain, apply the default in section 3, record it in `docs/work/DECISIONS.md` (one line: decision, reason, date) and continue.
2. **Verify on production, not in tests.** Nothing is "done" until you have fetched the production URL (after deploy) and confirmed the change is live. The previous run's changes were not verified this way and the core defects persisted. A passing test, a green build or an agent report is not proof.
3. **Keep a state file.** Create `docs/work/PROGRESS.md` with every task as a checkbox. After each task: implement, verify, commit, tick the box. If you lose context or restart, read `PROGRESS.md` and `DECISIONS.md` first and resume. Never restart from scratch.
4. **Work in small tasks.** Commit after each task with a clear message. Deploy per tier (section 4), not only at the end.
5. **If a task fails three different ways,** write it to `docs/work/BLOCKERS.md` with what you tried, apply the safe default (usually: leave that item unpublished), and move on. A blocker never ends the run.
6. **Be honest in all output.** Never claim guaranteed rankings, traffic, AdSense approval or "#1". Report measured facts only.

## 1. Verified starting state (production, 2026-10-09)

Re-verify each item yourself first; record disagreements in `DECISIONS.md`.

1. `/articles/` lists 44 articles. **23 have the identical blurb** "A concise editorial brief on {title}, with the trade-offs and questions that matter before your next move." (Still live.)
2. `/article/junior-data-scientist-reality-india/`: after each H2 lead, **the same 4-paragraph block (~383 words) repeats under all 16 sections** (with a two-variant ending). About 80% of the page is duplicate text. "32 min read" is computed on it. Still live.
3. `/article/home-loan-trap-dream-house-financial-prison/`: a 2-paragraph block (~229 words) repeats under all 16 sections. `/article/indian-it-layoff-cycle-2026/`: three consecutive sections have identical bodies, and two closing sentences rotate. Last verified earlier; re-check.
4. Template scaffold on every sampled article: "Reality check" block with the title interpolated, "Who this matters to: People weighing {keyword}…", identical "Biggest risk" line, "Text equivalent" table, "Decision summary" block. Meta descriptions are `{keyword}: {blurb}` cut mid-sentence with "...". `<title>` differs from the H1. Byline is only "CareerReality editorial desk" with one unlabelled date. Every sampled article says it is "not a claim of original reporting".
5. `/companies/` still prints **26 numeric "NN/100 directional stability" scores**, each marked "source citation unavailable, directional / unverified", on an `index, follow` page. (Earlier claims that unsupported scores were "suppressed" are false in production.)
6. Tool pages (`/compass/`, `/salary-reality/`, `/layoff-radar/`, `/salary-calculator/`) delivered 100-170 words of server HTML with an identical "Method and assumptions" paragraph that states no method. Rendered (JS) behaviour was not audited.
7. Improvement observed: the ₹20 LPA article's meta now states the ₹1,50,633/month figure is after income tax and before payroll deductions, and some reference labels now read "Claim source". Keep and build on this.
8. Search sample: the CTC-to-in-hand space is crowded with calculators and per-CTC programmatic pages. Do **not** copy that pattern.
9. Technical SEO (canonicals, robots meta, www to apex) looked clean. It is not the cause of the rejection.

## 2. Hard rules

1. **Never fabricate** authors, reviewers, credentials, bios, sources, URLs, dates, statistics, quotes, ratings, review counts, user counts, testimonials, "audited/verified" badges, case studies or reader stories.
2. **Never pad.** Word count is not value. Deleting is a valid fix. Do not generate new generic advice to replace removed text.
3. **Financial and legal claims** (tax, PF, gratuity, loans, notice periods) must come from official sources you have opened and read, with the URL and access date in the claim register. Never use a competitor page or a search snippet as proof of a rule.
4. **Do not enable ads, add AdSense scripts, or submit to AdSense.** Reserve no ad space.
5. **No programmatic page factories** (one page per CTC value, city or company). Not now, not as "quick wins".
6. **Privacy:** never store or log users' salary or other tool inputs. No amounts in analytics, URLs that get indexed, or server logs.
7. **Back up before any data change** (DB export to `backups/` with timestamp). Every removal or merge of a live URL gets a row in `docs/work/URL_DECISIONS.csv` (old URL, action 301/410/keep, target, reason).
8. **Structured data must be true and visible.** No `aggregateRating`, no fake `Review`, no `Person`/`Organization` fields you cannot fill truthfully.
9. **Authorized actions:** edit code and content, change the database (after backup), unpublish/redirect URLs, rebuild the sitemap, and deploy to production at the end of each tier **only if that tier's checks pass**. **Not authorized:** AdSense changes, spending money, contacting third parties, or any action not listed.

## 3. Default decision policy (use instead of asking)

| Situation | Default |
|---|---|
| Unsure whether to keep an article | **Remove or merge.** For AdSense, a weak page costs more than a missing one. |
| Unsure whether a claim is supported | Remove the claim. |
| Numeric score about a named company, no source | Do not display it anywhere. |
| Tool has no real method or data | Unlink it, `noindex`, do not feature it. |
| Missing author or reviewer name | Truthful organisation-level attribution ("CareerReality"); add the need to `HUMAN_INPUT_REQUIRED.md`; never invent a person. |
| Missing official source for a tax or legal rule | Do not publish a number for it; say what is unverified. |
| Conflicting rules or sources | Use the official source, the more conservative reading, and record both. |
| Design or naming choice | Pick one, record it, move on. |
| Competitor shows a different figure | Do not adopt it. Explain the assumption difference from official rules. |
| You cannot tell if a page is "good enough" | Apply the content gate (section 5). If still uncertain, do not publish. |

## 4. Tiers and deploys

- **Tier A, quarantine (subtractive, fast):** sections 5.1, 6.1, 7.1. Deploy as soon as verified.
- **Tier B, rebuild:** sections 5.2-5.4, 6, 7, 8, 9, 10. Deploy in at most two releases.
- **Tier C, close-out:** section 11 and 12.

For Tier A, **unpublish** failing pages (return 410, or 301 to the most relevant surviving page) and remove them from the sitemap, navigation, internal links and search index. Do not rely on `noindex` alone: a noindexed page that is still linked and reachable can still be seen by a reviewer. Use `noindex` only for pages that must remain reachable for users.

## 5. Content: gate, rebuild, claims

### 5.1 Tier A: quarantine the weak corpus now
1. Export all published articles to `docs/work/articles.json` (`slug`, `title`, `description`, `body`, `published`, `updated`, `author`).
2. Run the duplicate script in Appendix A. Save `dupe_report.csv`.
3. Immediately unpublish every article that matches **any** of these: a paragraph of 25+ words appearing twice inside it; the "A concise editorial brief" blurb; the repeated-block signature above. Record each in `URL_DECISIONS.csv` (301 to the best surviving page or 410). Keep the originals in `archive/articles/` (not served).
4. Remove them from sitemap, nav, hub pages, related-links and structured data. Deploy and verify on production (the URL returns 301/410 and is absent from the sitemap).

### 5.2 The content gate (apply to every article, including those you keep)

**Step 1: hard requirements (pass/fail, independent of score).** An article that fails any cannot be published:
- No repeated paragraph inside the article or shared with another article.
- Every factual claim is supported by a source that states it, or labelled editorial judgment.
- Title, meta description and body agree.
- Author and dates are shown truthfully.
- It works as a standalone page, including with JavaScript off.

**Step 2: score.** Assign the Original Value Score to the page *as it will be published*, with one sentence answering: "What does a reader get here that the cited sources do not already give them?" Scale: 0 repackaging; 1 minor interpretation; 2 some meaningful specific analysis or a reproducible calculation; 3 substantial analysis; 4 original dataset or research; 5 strong proprietary research. Calibration: junior data scientist 0-1, home-loan 1, IT-layoff 0-1, ₹20 LPA 2.

**Step 3: decision (score is a triage signal, not an automatic rule).**
- 0: presumed weak. Remove or merge. Keep only if lifted to 2+ by adding verified material, not by rewording.
- 1: needs substantial improvement or consolidation into a stronger article. No 1 may be live at the end.
- 2+: eligible. Retain only if it also holds up on originality, evidence, usefulness, differentiation, trust, search-intent satisfaction (the page answers its question without the reader needing another site) and standalone value, with no clear failure on any.
- Traffic, backlinks and existing URLs never justify retention. Preserve them with a 301 to the best target.
- If still uncertain: merge or remove.

**Step 4: record.** `docs/work/CONTENT_TRIAGE.csv`: slug, score before, score after, one-line reason per criterion, action.

### 5.3 Rebuild what survives
- Delete every duplicated block, rotating closer and title-interpolated scaffold. Keep only genuinely specific passages. If a section is thin, fill it **only** with a verified, sourced point or delete the section.
- Real meta description (≤155 characters, specific, no trailing "..."), `<title>` consistent with the H1, a one-sentence statement of what the reader can do after reading.
- Read time computed on the final text only (words ÷ 238).
- Label every vignette "Illustrative scenario". No invented named people or attributed quotes.
- Fix source mismatches (e.g. an equity-compensation guide cited on a home-loan page; figures in text that are missing from references). Every in-text figure appears in the references with a section-specific note.
- A target of 8-15 strong pages is better than 44 weak ones. Do not publish more than you can verify.

### 5.4 Claim register
`docs/work/CLAIM_REGISTER.csv` for every published factual claim: page, claim, type, source URL, publisher, primary (Y/N), source date, access date, supports claim (Y/N + exact supporting point, paraphrased), status. Fetch every URL. Drop dead, irrelevant or "context only" sources. Unsupportable claims are removed.

## 6. Data and company intelligence

1. **Tier A:** remove numeric company scores, momentum labels and unsourced narrative statements from **every surface** (server HTML, API, JSON-LD, OG tags, search index, RSS, sitemap). Unpublish `/companies/` and its detail pages (410/301 to the tools hub) unless a row meets the policy below. Delete, do not relabel.
2. **Policy:** a score about a named real company is shown only with a working source URL, a source date and a published method version. Enforce with a DB constraint or an application-level invariant plus tests on every surface.
3. Classify the market-data table (~392 rows) by type and provenance: VERIFIED (working source states the figure), DERIVED (formula stored), ESTIMATED (method stored), UNVERIFIED, LEGACY. Write `docs/work/DATA_PROVENANCE.md` with counts. Publicly render only VERIFIED and DERIVED rows with source and date. If too few remain to make a company feature worthwhile, leave it unpublished and record that in `DECISIONS.md`.
4. Do not invent a methodology to re-enable scores.

## 7. Tools: the main route to rankings

The strategic position is: **a small number of tools that are correct, explained, verifiable and fast**, each with the supporting content that makes it understandable. Not a large number of weak pages.

### 7.1 Tier A: stop the bleeding
Any tool with no real method or data (likely `/layoff-radar/`, `/compass/`, `/salary-reality/` as they stand) is unlinked from navigation and `noindex`ed until it passes the Tool Gate. `/salary-calculator/` stays live.

### 7.2 Tool Gate
A tool may be indexed and featured only if all are true:
- It has a one-sentence user task.
- Its method is documented, implemented and verifiable against official rules or stored formulas.
- Any data shown is sourced and dated.
- It adds something a generic calculator does not (e.g. reconciliation with an offer letter or payslip, honest explanation of assumptions, comparison across scenarios).
- Its server-rendered page is useful with the widget removed.

### 7.3 Tool portfolio and order
Build in this order, stopping at six live tools at most, and only those that pass the gate with verified rules:
1. **CTC to in-hand salary (flagship).** Section 7.4.
2. **Offer comparator:** two offers side by side by in-hand pay, variable share, joining-bonus clawback, notice period and location/commute cost, using the flagship module.
3. **Old vs new regime comparison** (only if the old-regime rules can be implemented and verified fully).
4. **Gratuity calculator** (verify eligibility and cap rules from the official source).
5. **Layoff runway calculator:** savings, expenses, severance and notice into a plain runway estimate. Pure arithmetic; no invented data.
6. **Home-loan stress test:** EMI against the flagship's in-hand figure.

Do not build tools whose rules you cannot verify.

### 7.4 Flagship: CTC to in-hand (`/salary-calculator/`)
**User task:** "I have an offer of ₹X CTC. What will actually land in my account each month, and why?"

**Correctness**
1. One calculation module used by the page, worked examples, other tools and tests. No duplicate logic.
2. Verify every rule against official sources and write them in `docs/work/CALCULATOR_VERIFICATION.md` with URL and date: new-regime slabs for the modelled financial year, standard deduction, Section 87A rebate and marginal relief, cess, surcharge, employee PF (rate, wage ceiling, actual vs capped basic), professional tax by state, and what "CTC" includes. If FY 2026-27 rules cannot be verified from an official source, model the verified year, label it, and do not claim "latest".
3. Unit tests: slab boundaries, either side of the rebate threshold, with and without PF, surcharge cases, high and zero variable pay. Include ₹20 LPA (an earlier check reproduced ₹1,50,633/month tax-only under FY 2025-26-style new-regime slabs with a ₹75,000 standard deduction and 4% cess; confirm the correct rules and values). A test fails if any number printed on the page differs from the module's output.

**Inputs and outputs**
- Inputs: annual CTC, fixed/variable split, basic %, whether employer PF is inside CTC, PF basis, state, regime.
- Output waterfall: CTC, less employer-side components, gross, less employee PF, professional tax and income tax, monthly in-hand. Show annual tax and effective rate. Show **both** "tax only" and "after PF and professional tax" views, clearly labelled, so users can reconcile with an offer letter or payslip.
- Indian number grouping, `inputmode="numeric"`, sensible limits and helpful errors. Shareable result via URL parameters, with canonical set to the base URL and parameterised states `noindex`. No inputs logged.

**Server-rendered page (must stand on its own without JavaScript), in order**
1. H1 phrased as the question and a one-paragraph direct answer.
2. The calculator, with the result explained beside it.
3. Worked-example table computed at build time from the module for a few representative CTCs (chosen for usefulness, not keyword coverage).
4. Method and assumptions written for this tool: slab table, deductions, cess, PF and professional-tax treatment, what CTC includes.
5. What is excluded and known limits (variable-pay timing, employer-specific structures, TDS vs final liability).
6. **"Why calculators show different numbers":** a factual explanation of assumption differences (employer PF inside or outside CTC, PF basis, professional tax, variable pay, fiscal year). Do not name or criticise other sites.
7. Sources with a true "last verified" date (official sources only).
8. FAQ (4-6 questions written for this tool), related reading (only gate-passing articles) and related tools.
9. Attribution and dates (section 9).

Apply the same structure to every other tool that passes the gate.

### 7.5 Tool UX and accessibility
Labels tied to inputs; errors announced to assistive technology; results in an `aria-live` region; full keyboard operation; visible focus; no colour-only meaning; results reachable without long scrolling at 360 px; tables readable on mobile; a no-JS fallback that still delivers the explanation, method and worked-example table.

## 8. Design pass (look and feel)

Principles: a calm, credible, **distinctive** reading and tool experience that feels like a careful publication with working instruments, not a generic dashboard or template.

1. **Look first.** Capture screenshots of home, an article, a tool and the hub at 1280, 768 and 360 px, with and without JavaScript. Run Lighthouse (mobile) and an accessibility scan if tooling is available; if not, use what is available and record the limitation.
2. **Write a short design plan in `docs/work/DESIGN_PLAN.md` before coding:** 4-6 named hex colours, type families and roles (one or two families, clearly distinct if two), a layout concept in prose, and the principles. Then **review the plan against the usual generated-site defaults** (cream background with serif and terracotta accent; near-black with a single neon accent; identical rounded cards with the same soft shadow; ALL-CAPS tracked eyebrow labels above every heading; "WORD — fragment" labels; arrows appended to links; fade-and-slide on every section) and revise any part that is a default rather than a choice for this subject (Indian salary and career decisions). Record what you changed.
3. **Typography:** body 16-18 px; line length under about 75 characters; sensible line height; a clear type scale; efficient font loading with a real fallback stack.
4. **Structure carries information:** use numbering, borders and labels only when the content is a sequence or the label encodes something. Remove decorative chrome.
5. **Hero:** open with the most characteristic thing: on tool pages the question and a live result; on the homepage what the site is, who runs it and the one or two instruments that work. No stat tiles unless each number is sourced and current.
6. **Components (build once):** header and footer with About, Editorial standards, Corrections, Contact and Privacy; byline and dates; callouts for Assumption, Caution and **Illustrative scenario**; source list; responsive data table (scrolls inside its own container); result card; form controls; FAQ; breadcrumbs; related links.
7. **Quality floor:** WCAG AA contrast, visible focus, 44 px touch targets, `prefers-reduced-motion` respected, motion only where it shows a state change, semantic headings.
8. **Performance targets (mobile):** LCP under 2.5 s, CLS under 0.1, INP under 200 ms. Server-render main content, keep tool JavaScript lean and deferred, reserve space for dynamic elements, optimise images. Record misses honestly.
9. **Navigation:** only things that exist and work. A content-rich tools hub (question each tool answers, worked example, last verified date), not a bare grid.
10. Re-capture the same screenshots after and compare in `docs/work/BEFORE_AFTER.md`.

## 9. Trust, authorship, dates

1. Build and link sitewide (header or footer): About, Editorial standards, Corrections (with a log), Contact, Methodology, Sources and data, and Privacy.
2. Write them **truthfully from what you can verify**: inspect the repo and database for how content was actually produced. If AI generated or assisted drafting or data, disclose that plainly; do not describe a human editorial process that does not exist. State plainly who operates the site only if the repo or config shows it; otherwise leave that line for the owner.
3. Attribution: if named people are not supplied, use truthful organisation-level attribution and list exactly what is needed in `docs/work/HUMAN_INPUT_REQUIRED.md` (real author names and bios, any reviewer, operating entity, contact email, correction history). Do not block publishing on this, but the final readiness report must show authorship as incomplete.
4. Dates: show published, updated (only for material edits, with a one-line change note) and reviewed (only if a human reviewed). Use git history or the CMS audit log to restore true dates for pages bulk-restamped on 2026-08-13/14/15. Where unknown, show only what is known.
5. Structured data: `BreadcrumbList`, `WebApplication` (name, description, category only) and article data with truthful fields only. Do not expect FAQ rich results.

## 10. Search and architecture

1. **Query ownership map** (`docs/seo/QUERY_MAP.md`): for each tool and surviving article, one primary query family (the user's question in natural language), supporting language, the one canonical page that owns it, and the dated SERP observation (date, device, what the top results contain: tools, depth, freshness, features). If you have web search, use it for the SERP review; if not, record that as a limitation. Two tracks, kept separate: **(a) nearer-term opportunities** (specific, less crowded questions where your page can be clearly better) and **(b) head-term leadership** (e.g. CTC to in-hand salary), with what the page must beat. Difficulty changes the sequence, not whether the target is analysed. Do not state or imply guaranteed outcomes.
2. **No cannibalisation:** one owner page per query family; merge or redirect duplicates.
3. **Metadata:** unique human-written title and description per indexable page that identify the page, state the useful outcome, and include a truthful differentiator. A favicon and site identity at the hostname level. Self-referential canonicals; correct `robots` meta.
4. **Sitemap:** rebuild from scratch. Include only URLs that return 200, are indexable, self-canonical and pass the gates. Compare counts (sitemap, indexable routes, canonicals) in `docs/work/INDEXATION.md`.
5. **Internal links:** each tool links to the one to three most relevant articles and related tools; each surviving article links to its relevant tool. Only to destinations that exist and help. No link quotas. Fix orphans; remove links to redirected or removed URLs.
6. **Direct answers:** where the reader asks a direct question, give the answer first with its conditions and date. This helps readers and answer engines but guarantees nothing.
7. **Measurement plan** (`docs/seo/MEASUREMENT.md`): Search Console baseline per tool (queries, impressions, average position, CTR), monthly review, and the three separate states: implemented locally, delivered and verified on production, and search outcome observed (pending). Request Search Console exports in `HUMAN_INPUT_REQUIRED.md`. Do not request indexing or change Search Console properties yourself.

## 11. Verification (after each deploy and at the end)

1. Crawl production (every URL in the new sitemap plus every internal link): status, canonical, robots, title, H1, server-rendered word count, JS-off content.
2. Re-run the Appendix A script on the live corpus: zero repeated paragraphs inside or across articles, zero templated blurbs, zero truncated meta descriptions.
3. Re-fetch every source in the claim register (200 and relevant).
4. Confirm: no company score on any surface; no ad script or placeholder anywhere; no salary input in logs, URLs or analytics.
5. Run the calculator test suite and a production smoke test of each tool.
6. Run Lighthouse (mobile) and the accessibility scan on home, one article, each tool.
7. Re-read the homepage, one article, every live tool and every trust page as a skeptical external reviewer who has never heard of the site. Write what a reviewer would still criticise.

## 12. Final output (the only report you give)

Write `docs/work/FINAL_REPORT.md` and show its contents as your last message. It must contain:
1. What changed (counts: articles unpublished, merged, rewritten, kept; tools live; URLs redirected), each verified on production with the date.
2. Before/after metrics (duplicate-paragraph share, indexable URL count, server-rendered words per tool page, Lighthouse and accessibility results).
3. Remaining weaknesses, honestly, including every item in `BLOCKERS.md` and `HUMAN_INPUT_REQUIRED.md`.
4. Your verdict: **"Would I recommend resubmitting to AdSense today? YES or NO"**, with exact reasons. If any of these is false, the answer is NO: no duplicated text; every kept article scores 2 or higher; every number is in the claim register with a verified source; no unsourced company data anywhere; every live tool is server-rendered with method, example and limits; trust pages are live and truthful; authorship is complete (named people supplied); dates are true; ads are absent.
5. The three most likely remaining reasons a reviewer would still reject the site.
6. A plain statement that search visibility is not guaranteed and that ranking depends on competition, time and signals outside this codebase.

---

## Appendix A: duplicate/template forensics script (read-only)

Save as `scripts/audit_dupes.py`. Input: a folder of article files or a JSON export `[{"slug": "...", "body": "..."}]`. Output: `dupe_report.csv` and the ten worst articles.

```python
#!/usr/bin/env python3
import sys, os, re, json, csv, hashlib, html
from collections import defaultdict

def strip_html(s):
    s = re.sub(r"(?is)<(script|style).*?</\1>", " ", s)
    return html.unescape(re.sub(r"(?s)<[^>]+>", "\n", s))

def load(path):
    docs = {}
    if os.path.isdir(path):
        for fn in sorted(os.listdir(path)):
            if fn.lower().endswith((".md", ".html", ".htm", ".txt")):
                raw = open(os.path.join(path, fn), encoding="utf-8", errors="ignore").read()
                docs[fn] = strip_html(raw) if fn.lower().endswith((".html", ".htm")) else raw
    else:
        for r in json.load(open(path, encoding="utf-8")):
            docs[r["slug"]] = strip_html(r["body"]) if "<" in r["body"] else r["body"]
    return docs

def paras(t, n=25):
    out = []
    for p in re.split(r"\n\s*\n", t):
        p = re.sub(r"\s+", " ", p).strip()
        if len(p.split()) >= n: out.append(p)
    return out

def h(p): return hashlib.md5(re.sub(r"[^a-z0-9 ]", "", p.lower()).encode()).hexdigest()

def main(path):
    docs, owner, stats = load(path), defaultdict(set), {}
    for slug, text in docs.items():
        seen, dup, total = defaultdict(int), 0, len(text.split())
        ps = paras(text)
        for p in ps:
            k = h(p); seen[k] += 1; owner[k].add(slug)
            if seen[k] > 1: dup += len(p.split())
        stats[slug] = dict(words=total, paras=len(ps), dup=dup, pct=round(100 * dup / max(total, 1), 1))
    shared = {k: s for k, s in owner.items() if len(s) > 1}
    for slug in stats:
        stats[slug]["shared"] = sum(1 for k, s in shared.items() if slug in s)
    with open("dupe_report.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["slug", "words", "paras>=25w", "repeated_inside_words", "repeated_inside_pct", "paras_shared_with_other_articles"])
        for s, v in sorted(stats.items(), key=lambda kv: -kv[1]["pct"]):
            w.writerow([s, v["words"], v["paras"], v["dup"], v["pct"], v["shared"]])
    for s, v in sorted(stats.items(), key=lambda kv: -kv[1]["pct"])[:10]:
        print(f'{v["pct"]:5.1f}%  {v["words"]:6d}w  {s}')

if __name__ == "__main__":
    main(sys.argv[1]) if len(sys.argv) == 2 else sys.exit("usage: audit_dupes.py <folder|json>")
```

## Appendix B: files you maintain

`docs/work/`: `PROGRESS.md`, `DECISIONS.md`, `BLOCKERS.md`, `URL_DECISIONS.csv`, `CONTENT_TRIAGE.csv`, `CLAIM_REGISTER.csv`, `DATA_PROVENANCE.md`, `CALCULATOR_VERIFICATION.md`, `DESIGN_PLAN.md`, `BEFORE_AFTER.md`, `INDEXATION.md`, `HUMAN_INPUT_REQUIRED.md`, `FINAL_REPORT.md`.
`docs/seo/`: `QUERY_MAP.md`, `MEASUREMENT.md`.