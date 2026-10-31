# Resignation Risk — technical spec

The `/resignation-risk` React route stores selections in component state and calls the pure `createResignationPlan` model on explicit form submission. It bounds runway to 0–60 months and renders a validation error for non-finite or out-of-range values.

The result is announced as a live status, repeats the selected inputs, and does not call an API or analytics event with the values. Reset clears the form state. Route copy and metadata call it a checklist, not a calculator.
