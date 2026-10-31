---
name: TheirStack provider access
description: TheirStack can be wired with a secure Bearer API key, but live job search may still return 403 when the provider account is not authorized for the endpoint.
---

TheirStack is the approved broad job provider for India and remote coverage. The adapter should remain behind `THEIRSTACK_API_KEY`, normalize only HTTPS canonical destinations, and preserve the last successful feed timestamp when the provider returns an error. A configured secret alone does not prove endpoint access; verify the live search response and keep 403s visible as provider-unavailable rather than serving the result as current.

**Why:** The workspace secret flow can store a key successfully while the provider account still denies the Jobs API.

**How to apply:** Treat live provider authorization as an operational prerequisite after code changes, and use the Jobs source-health state to distinguish provider access failure from an empty result.