# CTC / in-hand calculator — test plan

## Automated
- Run `pnpm --filter @workspace/career-reality run test:ctc-tax`.
- Cover both regimes, taxable-income boundaries, rebate/surcharge/marginal-relief edges, PF wage basis, variable-pay handling, entered professional tax, and invalid inputs.
- Assert that unsupported inputs withhold output instead of silently substituting zero.

## Manual release checks
Verify the assumption summary, estimate-only warning, field labels, keyboard order, screen-reader announcements, and narrow mobile layout. Tax-law review and real payroll examples require a qualified human reviewer; tests cannot replace them.
