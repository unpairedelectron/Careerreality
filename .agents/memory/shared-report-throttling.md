---
name: Shared report throttling
description: Durable design constraints for anonymous report abuse controls across API instances.
---

Use a database-backed atomic upsert for report throttling so restarts and multiple API instances share one counter. HMAC the identity before storage; never persist a raw client IP.

**Why:** An in-process map resets on restart and splits limits across instances. PostgreSQL can infer an interval parameter as the wrong type in timestamp comparisons, so use `CURRENT_TIMESTAMP` for expiry predicates when composing the SQL expression.

**How to apply:** Keep anonymous buckets keyed by a secret-derived HMAC of the client address, signed-in buckets keyed by a HMAC of the user identity, and return retry timing from the stored window start. If the shared store is unavailable, fail closed with a generic retryable response and log only a request ID plus safe error type.