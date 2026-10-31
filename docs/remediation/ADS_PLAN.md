# Ads plan and guardrails

**Ads stay off.** No AdSense code, publisher ID, ad slot, consent prompt for advertising, ad request, or AdSense submission was added or enabled.

## Before any future ad review

- Keep ads disabled until the owner separately approves them.
- Verify the built homepage, article pages, tools, trust pages, error routes, and mobile layout contain no ad units, AdSense scripts, or ad network requests.
- If ads are later proposed, first complete the publisher's consent, privacy, layout, and policy review. Do not place ads beside unverified company/layoff claims, calculations, or unresolved content.
- Record a second explicit approval before deployment or submission. This remediation task does not provide that approval.

## Staging check

Run a source and built-output search for `pagead2.googlesyndication.com`, `adsbygoogle`, `ca-pub-`, and AdSense script URLs after the final build. Inspect browser network requests as well; text search alone is not a runtime guarantee.
