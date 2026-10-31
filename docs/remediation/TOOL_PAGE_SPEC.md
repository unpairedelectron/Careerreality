# CTC calculator page specification

## Purpose

`/salary-calculator` helps someone compare an Indian job offer’s headline CTC with annual and monthly cash under stated assumptions. It is an offer-comparison estimate, not a payroll statement, tax filing tool, recommendation, or guarantee.

## Page structure

1. Plain-language introduction that distinguishes CTC from spendable cash.
2. Offer inputs:
   - Headline annual CTC
   - Annual fixed pay
   - Target variable pay
   - Basic pay as a percentage of fixed pay
3. Employer structure:
   - PF contribution basis: none, current statutory ceiling, or full basic
   - Whether employer PF is included within CTC
   - Visible warning that the current selected monthly PF basis is annualized over 12 months
4. Offer details and tax:
   - Manually entered annual professional tax and state/UT context
   - Gratuity and other employer-side costs, entered only if stated in the offer
   - Tax year 2026–27 and selected regime
   - Other old-regime deductions, capped together with eligible employee PF at ₹1.5 lakh
5. Readout:
   - Fixed-pay monthly average assuming zero variable pay
   - Annualized monthly average assuming the full target variable is paid
   - Tax-only amounts, variable pay at risk, effective deductions, and annual breakdown
   - CTC reconciliation: employer components, unallocated CTC, or an explicit shortfall
6. Shared worked examples, method, limitations, and official sources.

## Calculation and state contract

- One pure shared model drives interactive results, shared examples, the ₹20 lakh article example, crawler snapshots, and tests.
- Changing an input recalculates locally. Reset and worked-example buttons only update the current page state.
- If target gross cash plus employer components marked inside CTC exceeds the headline CTC, suppress take-home results and show the shortfall instead.
- Professional tax is manual. Do not infer a state rate from the selected location.
- Do not infer gratuity, employer costs, or PF arrangements that the offer does not state.
- Treat variable pay as a target. Fixed monthly cash assumes zero variable; target monthly average assumes the full target is paid and divides annual take-home by 12.
- The selected monthly PF basis is annualized across 12 months. Do not present it as a month-by-month reconstruction of the partial 2026–27 ceiling transition.

## Privacy and navigation

- User-entered salary values exist only in the current page’s form state.
- Do not serialize those values into query parameters, fragments, history state, local/session storage, analytics, API requests, logs, saved decisions, or share links.
- The homepage and Salary Reality entry points link to the calculator without carrying salary, role, or location values.
- The page has no “save calculation” or “share calculation” flow.

## Validation and error states

- CTC must be greater than zero; other numeric values must be non-negative; basic percentage must be between 0 and 100.
- Require a state/UT value, including the explicit “Not specified” option.
- Professional tax cannot exceed annual fixed pay.
- Inline errors are associated with their fields and also announce a text error; the results panel explains that a valid result is unavailable.
- No result should be shown while inputs are invalid or CTC reconciliation has a shortfall.

## Out of scope

- No expansion of Compass, Salary Reality, Layoff Radar, or other low-evidence tools.
- No live tax or market API, account save, report, export, or payroll integration.
- No tax optimization recommendation, guarantee, or interpretation for special-rate income.
- No production publishing, ad enablement, AdSense submission, or indexing request.

## Acceptance checks

- The model, worked examples, article example, built snapshots, and tests agree on values.
- Rebate and surcharge boundaries are checked against the official 2026–27 text.
- Calculator values are absent from URLs, storage, analytics, and request payloads after interaction.
- Home and Salary Reality links do not prefill values.
- Desktop/mobile and light/dark states are reviewed; static snapshot verifier recognizes the method anchor and source text.
