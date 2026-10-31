# CTC calculation source audit

**Checked:** 26 October 2026  
**Scope:** The calculator's new-regime salary-tax estimate and selectable PF estimate. This is a source-based software check, not individual tax advice or an independent payroll sign-off.

## Findings and implementation

| Area | Source checked | Result |
|---|---|---|
| Tax Year 2026–27 salary slabs and surcharge | Income Tax Department, Income-tax Act, 2025, section 202: https://www.incometaxindia.gov.in/w/section-202-78 | Existing progressive bands, cess and surcharge treatment were retained; calculation boundaries have automated tests. |
| Standard deduction and employment tax | Income Tax Department, Income-tax Act, 2025, section 19: https://www.incometaxindia.gov.in/w/section-19-206 | The section allows the full employment tax paid and a ₹75,000 standard deduction (limited to salary) when tax is computed under section 202(1). The Tax Year 2026–27 CTC estimate now subtracts employee-paid professional tax from taxable salary. |
| AY 2026–27 new-regime treatment | Income Tax Department, AY 2026–27 tax-rate guidance: https://www.incometaxindia.gov.in/w/tax-rates-and-computation | The Income-tax Act, 1961 new regime disallows the section 16(iii) employment-tax deduction. For this selected period, professional tax reduces take-home but not taxable income. |
| Rebate | Income Tax Department, Income-tax Act, 2025, section 156: https://www.incometaxindia.gov.in/w/section-156-88 | The ₹60,000 rebate ceiling through ₹12 lakh total income and marginal-relief behavior remain covered by boundary tests. |
| PF contribution ceiling and EPS share | PIB, Ministry of Labour & Employment release: https://www.pib.gov.in/PressReleasePage.aspx?PRID=2314111; EPFO wage-ceiling FAQ: https://pmvbry-cdn.epfindia.gov.in/wp-content/uploads/2026/09/EPFO_Wage_Ceiling_FAQs.pdf | The statutory estimate uses the ₹15,000 ceiling through 16 September 2026 and ₹25,000 from 17 September, with September split by days. It models 12% employee/employer shares and an 8.33% employer EPS share subject to the ceiling. Eligibility and employer-specific treatment remain outside the estimate. |

## Automated regression coverage

- `pnpm --filter @workspace/career-reality run test:ctc-tax`
- `pnpm --filter @workspace/career-reality exec playwright test tests/salary-calculator.spec.ts`

The tests distinguish Tax Year 2026–27 from AY 2026–27 for employment-tax deductions, cover the CTC/PF calculation boundaries, and check the visible tax-period change. Re-run them if an official rate, deduction, contribution ceiling or source interpretation changes.

## Remaining boundary

The calculator asks for the employee-paid professional-tax amount. Employer-paid professional tax may require salary gross-up and is not separately modeled. PF membership, eligibility, exemptions and employer-specific payroll handling are not inferred. No independent payroll sign-off was performed; this source audit covers deterministic assumptions and is not individual payroll advice.
