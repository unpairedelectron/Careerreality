# CTC / in-hand calculator — technical spec

The `/salary-calculator` route renders the calculator in the CareerReality React/Vite app. Form state feeds local tax and pay calculations; the result is not requested from the API. Invalid or unsupported values must show validation feedback and must not be coerced into a zero result.

Annual CTC, user-entered payroll components, regime selection, and state context should stay out of query strings, analytics, and application logs. The calculator has no save action. The owner directed local search indexability on 2026-11-06 before qualified tax/payroll review was completed. Preserve estimate-only, manual-PF, and review-pending disclosures; publication is separate.
