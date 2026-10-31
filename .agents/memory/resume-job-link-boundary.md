---
name: Resume and job-link privacy boundary
description: Production approval gate for resume uploads and user-submitted job URL fetching.
---

On 2026-10-28, the product owner approved transient first-party processing for resume intelligence and allowlisted public job links. Keep both features unavailable in production until their separate operational controls are verified. Treat URL retrieval as SSRF-sensitive and require private-network, DNS-rebinding, redirect, timeout, and response-limit defenses. See `docs/privacy/resume-and-job-link-safeguards.md` for the current engineering checklist.

**Why:** Resume processing and URL fetching move sensitive career or job-search data off-device; source-level checks cannot establish production logging, backups, or access. A published endpoint can also disagree with guarded workspace code or an operator's reported status.

**How to apply:** Keep resume uploads unavailable until their approved contract and production controls are verified. After deployment, check route availability with a no-content request, never a real resume, and assess logs, traces, backups, and access separately. Keep job-link fetching restricted to the approved allowlist and disabled in production until operator checks and SSRF tests pass.
