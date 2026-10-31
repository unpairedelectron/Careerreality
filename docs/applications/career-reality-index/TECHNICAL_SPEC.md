# Career Reality Index — technical spec

The `/career-reality-index` page keeps answers in React state and calls a pure helper that returns the same reflection text for each completed response set. The visible answer summary is generated from the user's four selections.

No response content is sent to analytics. A separate Save action explicitly posts a user-owned decision note to the workspace API. Route metadata is noindex while browser, accessibility, and content checks remain open.
