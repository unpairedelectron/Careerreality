# Salary Reality — technical spec

The `/salary-reality` page uses the generated `useListSalaryBenchmarks` query with role, city, and experience band. It validates the target amount locally and selects only records accepted by `usableDecisionSalaryBenchmarks`.

Pending, API-error, no-eligible-record, invalid-target, and comparison states are separate. An API error must not fall back to a previous value as current. The route is noindex while live-data review and route-level interaction testing remain open.
