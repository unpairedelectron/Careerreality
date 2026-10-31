# Search query and page ownership map

**Observed:** 2026-10-09  
**Scope:** One surviving tool: the CTC calculator. No article passed the publication gate.

## Dated search-result observation

Sampled on 2026-10-09 using the workspace web-search tool with queries including “India CTC calculator PF 2026”, “CTC to in hand salary calculator India” and “India salary calculator gratuity PF”. The callback does not expose its search backend, Google-specific results, device, India-localized location, search volume or stable rank positions. The list order below is not reported as rank. Pages were fetched where possible; this is a sample, not a complete SERP.

| Returned page | Visible result/page contents | Freshness and limitation |
| --- | --- | --- |
| [India Salary Calculator](https://indiasalarycalculator.com/) | Direct calculator with old/new regime, HRA city, basic percentage, rent, deductions, professional tax and employee PF inputs; describes employer PF and a take-home waterfall. | Page title says 2026 but labels FY 2025–26 / AY 2026–27. It is not evidence for tax-year 2026–27 rules. |
| [CTC Calculator](https://www.ctccalculator.in/) | CTC input, month/year toggle, advanced settings and educational sections on CTC, basic pay, HRA, EPF and standard deduction. | Page contains a ₹15,000 PF wage-cap discussion, which is stale relative to the official September 2026 ₹25,000 wage-ceiling announcement. |
| [SalaryInHand PF Calculator](https://salaryinhand.in/pf-calculator) | Separate employee/employer PF calculator with rate and cap inputs, a contribution result and FAQ. | Page title says 2026 but its FAQ still calls ₹15,000 the statutory ceiling; treat displayed freshness claims cautiously. |
| [SalaryInHand calculators](https://salaryinhand.in/calculators) | Directory of numerous salary, tax, notice-period, loan and investment calculators; advertising labels appear in extracted content. | Tool breadth does not establish accuracy or source quality. No rank or traffic inference. |
| [InHandPay](https://inhandpay.com/) | CTC-to-in-hand calculator, new/old regime comparison, a ₹12 LPA worked example and related salary tools. | Page says FY 2026–27; underlying rule accuracy was not assessed from this competitor page. |
| [CTC Calculator India](https://ctc-calculator.in/) | Search snippet describes take-home, employer PF and gratuity components; page extraction failed. | Only the returned title/snippet was available; page depth, sources and freshness were not verified. |

The observed result set is calculator-heavy. Some competitors show current-year labels while their extracted PF-ceiling language is stale or ambiguous. Competitor pages are not sources for tax, PF or payroll rules and are not copied as claims or assumptions.

| Priority | Intent/query family | Owning route | Supporting language and content needed | Sample pages returned | Current status |
| --- | --- | --- | --- | --- | --- |
| Near-term, narrow intent | “India CTC calculator employer PF”; “CTC breakdown calculator gratuity India”; FY 2026–27 offer-to-monthly-cash questions | `/salary-calculator/` (canonical owner; currently `noindex`) | Separate CTC, fixed gross, target variable, employee/employer PF, tax and entered employer costs. Ask for actual offer/payroll amounts; state that PF rate and wage base are not inferred. Show model limits and source dates. | Results included [India Salary Calculator](https://indiasalarycalculator.com/), [CTC Calculator](https://www.ctccalculator.in/), [SalaryInHand PF Calculator](https://salaryinhand.in/pf-calculator) and [InHandPay](https://inhandpay.com/). | Opportunity hypothesis only. Do not index until qualified review and source gaps close. |
| Head term | “CTC to in-hand salary calculator India”; “take-home salary from CTC”; “in-hand salary calculator India 2026” | `/salary-calculator/` (same canonical owner; currently `noindex`) | Immediate calculator use, visible assumptions, offer-specific inputs, fixed and target-variable scenarios, a transparent tax method, and clear estimates/limits. Do not promise exact payroll take-home. | Results included [CTC Calculator](https://www.ctccalculator.in/), [India Salary Calculator](https://indiasalarycalculator.com/), [InHandPay](https://inhandpay.com/) and [SalaryInHand calculators](https://salaryinhand.in/calculators). | Competitive head term. Product deliberately exposes the new regime only and does not automate PF; keep noindex pending review. |
| Supporting navigation | “career tools India” / “career decision tools” | `/tools/` | A truthful directory of currently available tools, with direct links and clear status. Avoid claiming a broad portfolio; only the CTC calculator is featured. | Sample search did not establish a distinct, validated result set for this broad phrase. | Local sitemap owner for navigation only; no ranking claim or volume evidence. |

## Ownership rules

- Do not create a second page for CTC-to-in-hand intent. `/salary-calculator/` is the sole planned owner.
- The calculator is intentionally noindex, so this is a planning map, not an active search target.
- No article is retained for a query family. The 44 archived articles stay outside navigation, sitemap, structured data and local article snapshots.
- SERP snippets can contain competitors' assumptions. They are not sources for tax or payroll rules.
- Do not copy competitors' per-CTC landing-page patterns or create programmatic pages.
