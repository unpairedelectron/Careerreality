# CTC / in-hand calculator — methodology

The calculator separates fixed cash, target variable cash, employee PF, employer-paid CTC components, and entered professional tax before estimating annual tax and monthly cash. PF treatment depends on the selected wage basis; professional tax is entered rather than inferred from a state schedule.

The tax calculation is a deterministic local model for the selected regime and configured assumptions. It does not observe the user's actual payroll, tax residency, special-rate income, exemptions, or employer policy. Passing a unit test does not establish tax-law accuracy. No qualified tax reviewer has signed off on the current assumptions, so results remain educational estimates only.
