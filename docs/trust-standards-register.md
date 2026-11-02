# Trust standards register

Reviewed 2 November 2026. This is an internal mapping, not a certification.

| Source | Standard or guidance | Implementation / evidence | Status |
|---|---|---|---|
| Google Search Essentials and helpful-content guidance | Crawlable, useful, people-first pages; no ranking promises | Trust routes have unique metadata, route registry entries, sitemap and internal links | Implemented in code; live recrawl after publication still required |
| Google Search Quality Rater Guidelines (September 2025 copy reviewed) | Clear operator, purpose, attribution, sourcing, corrections, and contact context | About, Team, Editorial, Sources, Corrections and Contact pages | Partial; owner-supplied registered name is not MCA-verified |
| Schema.org | Accurate Organization and relevant page types | Organization; AboutPage, ContactPage, and Person nodes on corresponding trust pages | Implemented in hydrated pages; crawlable snapshot validation remains required |
| The Trust Project transparency standards | Explain ownership, authorship, sources, corrections, and methods | Trust pages and public sources register | Used as a voluntary checklist only; no affiliation or certification |
| WCAG 2.2 | Accessibility success criteria | Accessibility statement and existing automated/component checks | No conformance claim; manual assistive-technology audit outstanding |
| RFC 9116 | security.txt syntax, contact, policy, expiry, canonical | `public/.well-known/security.txt` | Added; verify published response after deployment |
| DPDP Act 2023, Rules 2025, G.S.R. 843(E) | Staged commencement | Privacy page states schedule as of 2026-11-02 and separates current observed flows from future obligations | Counsel applicability review required |
| MCA master-data services | Verify legal identity | Official lookup service was reachable as a page, but interactive search did not establish the registered entity name | Unverified; retain owner-provided string and flag for counsel |
| IT Rules | Grievance and intermediary obligations | No statutory officer named; no applicability assertion | Counsel review required |

Source records and access dates are in `artifacts/career-reality/public/sources.json`.
