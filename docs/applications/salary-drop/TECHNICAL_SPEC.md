# Salary Drop planner — technical spec

The `/salary-drop` page calls the pure `calculateSalaryDrop` model in the browser. It rejects blank, non-finite, negative, and out-of-range inputs before returning a calculation. The supported ranges are enforced by the model, not only HTML field attributes.

Results remain in page state. Compensation and cost inputs must not appear in URL parameters, analytics payloads, or server logs. The page has no save action.
