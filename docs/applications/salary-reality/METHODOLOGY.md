# Salary Reality — methodology

The client filters returned benchmark records through `usableDecisionSalaryBenchmarks` before showing a band. It compares the entered annual CTC with the record's P25, median, and P75. This is a descriptive comparison to the returned benchmark, not a confidence interval about the user's likely offer.

The target CTC is not sent to the benchmark request. Role, city, and experience determine the aggregate lookup. A current human review of sample representativeness and coverage is not recorded in this readiness pass; no recommendation may be based on an absent or ineligible record.
