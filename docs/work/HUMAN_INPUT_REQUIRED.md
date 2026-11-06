# Human input required before publication

No response is requested to complete the current local close-out. These items are gates for any later production release or indexing decision.

1. **Site owner and accountability**
   - Confirm the operating legal entity and jurisdiction.
   - Confirm which named people own editorial, product, privacy and corrections responsibilities, with approved public biographies if those will be shown.
   - Confirm a public contact route that someone monitors and the expected handling process. Do not invent an email or response-time promise.
2. **Privacy, terms and correction facts**
   - Have the owner verify actual data collected, processors, retention/deletion practices, user rights/request path, and any account or analytics behavior.
   - Approve the terms and privacy wording against actual operations and applicable law.
   - Supply the real correction/change history and a process for future changes. Do not manufacture a correction log or imply independent review.
3. **Editorial corpus**
   - For any article proposed for republishing, provide a verified author, publication/update dates, claim-level primary sources, source attribution and evidence of human review.
   - Review the exact-copy audit and make an explicit editorial decision for each archived source before any route is restored. The archived originals contain exact substantive repeats: 30/44 have within-article repeats at the 25-word threshold, and 26/44 share at least one such block with another article.
   - Review `NEAR_DUPLICATE_CANDIDATES.csv` manually. Its reproducible 5-word-shingle scan emits 278 candidates (212 cross-article across 6 article pairs; 66 within-article); none is a semantic duplicate verdict. An earlier unsaved scan reported 412 under the same stated thresholds but could not be reproduced exactly. Classify each candidate as substantive reuse, legitimate shared scaffold, or distinct text; do not assume every similar passage is duplicated.
4. **CTC calculator**
    - The owner reports that Aman Mishra inspected the calculation logic and tests and agreed to be identified as reviewer, with a stated review date of 05 November 2026 and a tax/PF scope. The uploaded sign-off document is incomplete: implementation version, evidence, findings, outcome, limitations, final credential wording, and signature remain blank. Do not describe this as a completed independent review.
    - Obtain the reviewer-completed and signed record for the exact implementation and test evidence reviewed. It must address applicable tax-year boundaries and how the official EPFO FAQ's rates and ₹25,000 ceiling apply to offer components, statutory PF wages, and relevant membership/voluntary-contribution cases. The FAQ PDF was retrieved on 9 October 2026; it provides examples but does not settle an individual's mapping. Keep PF manual and the calculator noindex until this review is complete.
   - Confirm whether example inputs are useful and clearly hypothetical; do not frame them as typical salaries.
5. **Market and company data**
   - Follow `MARKET_DATA_RESTORATION_PLAN.md`: provide source evidence, observation/retrieval dates, geography, role or event scope, sample details, and method for every row before publication. Current production state is 392 blocked rows, 0 VERIFIED, 0 DERIVED and 0 ESTIMATED.
   - Approve any company score formula before any score or ranking is shown. The current rows remain unchanged and suppressed.
6. **Search measurement**
   - Provide a Search Console export for the correct property and post-release period, with date range, country, device, page and query dimensions plus clicks, impressions, CTR and average position.
   - The existing indexed-URL export is not a post-remediation query/performance baseline.
7. **Removal behavior**
   - Confirm the acceptable production action for each URL class: 410 where the origin supports it, redirect only where an actually equivalent destination exists, or a verified 404. The 2026-10-09 08:14:50 UTC live check found all 80 reviewed URLs still returning 200/noindex and no redirects; local output removal has not changed the published server.
   - If 410 is required, authorize a request-time handler that can return it for the reviewed paths. Static output absence alone does not prove a 404 or 410.
   - Decide whether `/sitemap/` should remain indexable. Production includes it as a 200/index-follow page in the XML sitemap; the local build marks it noindex and omits it. It is not part of the 80 retired-route decisions.
   - Production publishing remains separate and is not authorized by this report.
