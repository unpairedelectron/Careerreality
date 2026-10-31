# Archived ₹20L article review

**Reviewed:** 2026-10-26  
**Decision:** Keep the existing editorial/noindex hold. This review is not approval to publish or index the archived article.

## Scope checked

- Current archived article source in `artifacts/career-reality/src/data/authored-articles-market.ts`
- Its current model-based answer in `artifacts/career-reality/src/data/editorial-briefs.ts`
- The indexable CTC guide at `/guides/read-the-offer-beyond-ctc/`
- Historical copies in `docs/remediation/baseline/articles-repo-source.json` and `articles-live.json`
- The route policy in `artifacts/career-reality/src/data/route-registry.json`

The route registry points to an `archive/articles/...json` file for this slug, but that archive directory is absent. The current authored source and dated baseline copies are therefore distinct records; the historical copy should not be restored as current content.

## Findings

### Calculation

The current answer uses the shared CTC model: for the stated ₹20,00,000 package, estimated take-home is ₹1,33,931/month at zero variable pay and ₹1,45,811/month averaged across the year if the full target bonus pays. The text labels these as modeled examples, not a market average or guaranteed payslip.

The assumptions shown alongside the current guide include Tax Year 2026–27, a resident salaried individual below 60 using the default/new regime, a ₹75,000 standard deduction, employee and employer PF at 12% on the selected statutory ceiling with an assumed PF start date of 1 April 2026, ₹0 professional tax, and no gratuity, other employer costs, other income, or additional deductions and exemptions. The article appropriately says this does not establish an individual's PF eligibility or employer payroll treatment. The guide links to Income Tax Department and EPFO material.

I checked the official materials on 2026-10-26:

- The [Income-tax Act, 2025, as amended by Finance Act 2026](https://www.incometaxindia.gov.in/documents/d/guest/income_tax_act_2025_as_amended_by_fa_act_2026-pdf), section 19, provides the salary deduction of up to ₹75,000 where tax is computed under section 202(1). The [Finance Bill 2026 memorandum](https://www.indiabudget.gov.in/doc/memo.pdf) confirms the Tax Year 2026–27 section 202 default-regime bands used by the model (₹0–4L nil, then 5%, 10%, 15%, 20%, 25%, and 30% bands) and 4% health and education cess. These support the model’s tax period, deduction, slab and cess inputs; they do not validate any individual’s tax return.
- EPFO’s [FAQs: Revision of EPFO Statutory Wage Ceiling](https://pmvbry-cdn.epfindia.gov.in/wp-content/uploads/2026/09/EPFO_Wage_Ceiling_FAQs.pdf) state that the ceiling changed from ₹15,000 to ₹25,000 per month effective 17 September 2026. Its September illustration explicitly splits the month at that date and describes 12% employee and employer shares, with the employer share divided between EPF and EPS as applicable. This supports the model’s dated ceiling schedule and stated rate assumption, but does not settle a particular employee’s membership, wage definition, contribution basis, or employer payroll treatment.

Historical metadata is not safe to reuse: the older repository/live snapshots describe ₹20L as fixed cash and cite about ₹1,50,633/month after income tax but before payroll deductions. That is not a general ₹20L CTC take-home answer and conflicts with the current model-based example. Preserve the snapshots as historical evidence, but do not reuse their title description or calculation in a visitor-facing page.

### Editorial quality and overlap

- The archived source has useful guidance on separating fixed pay, conditional pay, employer costs, household costs, and offer-letter questions.
- It has 19 sections and is substantially longer than needed for the single ₹20L search question. The existing duplication audit records two repeated-paragraph groups and 16 extra copies in this article.
- The indexable CTC guide already gives the clearer answer, visible assumptions, sourced context, and a route to calculate a reader's own offer. Publishing a second long page on the same query would split the answer and reintroduce the stale-metadata risk.
- The archived narrative makes no supported city-level cost comparison or market-average claim; it is general decision guidance rather than original salary or cost-of-living research.

### Authorship, dates, approval, and corrections

- The current authored-article record contains section headings and body text, but no author attribution or publication/modification dates for this article. Its configured source entries have no named reviewer or review date; the metadata resolver therefore marks them `REQUIRES_EDITORIAL_REVIEW` with null reviewer/date.
- No editorial approval or approval date is recorded in the reviewed project data. The official-source check above is source verification for this review, not editorial approval to publish or lift the hold.
- Before any future reconsideration, record a named editor’s approval and date, add verifiable authorship and publication/update dates, replace any historical fixed-cash/₹1,50,633 snippets with the shared model and its assumptions, remove duplicated template passages, and establish a distinct reader benefit from the existing CTC guide.
- No approved correction or change to the article itself is made by this review. The required action is to keep the article held until those records and corrections exist and are reviewed.

## Recommendation

Do not approve this archived draft as a separate indexable page in its current form. Keep the hold. The current guide is the appropriate visitor-facing destination. If the article is reconsidered later, first replace all historical snippets with the shared-model answer, remove duplicated template passages, and define a distinct reader benefit that does not compete with the guide.

## Route state observed

The local route registry still treats `/article/*` as an editorial-hold, `noindex` app shell. On 2026-10-26, the published URL for this specific article returned a permanent redirect to `/guides/read-the-offer-beyond-ctc/`. No article publication or route change was made during this review.
