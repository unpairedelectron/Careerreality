# CareerReality Mobile — technical spec

The Expo app uses Clerk authentication and generated API-client hooks. Auth transitions must wait for the confirmed Clerk session and local profile hydration before routing. Personalized brief requests require the authenticated profile to be synchronized before reading.

Market and job screens must distinguish loading, current, stale, insufficient, and unavailable states. Cross-origin Expo web previews require the API allowlist to include the preview origin. `/mobile-app` is a noindex public landing route; native screens are not public SEO pages.
