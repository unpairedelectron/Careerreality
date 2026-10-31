# Escape Plan — technical spec

The `/escape-plan` route keeps the goal, duration, hours, and checklist progress in component state. `getEscapePlanTasks` selects the goal list and `calculateEscapePlanHours` validates and multiplies the bounded input.

There is no persistence or API mutation. Progress resets when the page state is reset or the page is reloaded. The route's static snapshot should preserve the task purpose and non-prediction caveat.
