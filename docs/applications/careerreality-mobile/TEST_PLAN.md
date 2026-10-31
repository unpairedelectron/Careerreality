# CareerReality Mobile — test plan

## Automated
- Run Expo static-path tests and mobile Plan UI browser tests with the existing system-Chromium harness.
- Verify auth callback markers, session transition, profile hydration, API freshness/error states, and unknown static paths.
- Run the built mobile bundle checks after any auth or route changes.

## Human device gate
An authorized release device is still required to verify native Google sign-in/callback, keyboard reachability, screen-reader labels, refresh behavior, offline/error states, and signed-in navigation. Automated web coverage is not a substitute.
