# Google sign-in release test record

This record tracks the provider-side checks that cannot be completed from the
Replit workspace. Do not add email addresses, Clerk IDs, screenshots containing
account data, or other personal information here.

## Callback contract

- Native scheme: `career-reality-mobile`
- Native callback route: `career-reality-mobile://sso-callback`
- Sign-in and sign-up use the same native scheme and callback path.
- An interrupted callback returns the tester to the matching sign-in or sign-up
  screen instead of leaving the app without a recovery action.

## Workspace evidence

| Test date (UTC) | Build/environment | Platform | Result |
| --- | --- | --- | --- |
| 2026-09-08 | Replit workspace; Expo SDK 57 release-shaped static build `1788864633446-286` | iOS bundle | **PASS** — callback contract check passed; iOS bundle and manifest generated successfully. |
| 2026-09-08 | Replit workspace; Expo SDK 57 release-shaped static build `1788864633446-286` | Android bundle | **PASS** — callback contract check passed; Android bundle and manifest generated successfully. |

These checks prove the app configuration and both platform bundles, not the
browser-to-app handoff on a physical device.

## Current release target

The app version and platform build identifiers below come from `app.json`.
When shipping a new build, update `app.json` first and replace every manual
sign-off row with the new values. A PASS from an older version or build does
not carry forward.

| Platform | App version | Release build identifier |
| --- | --- | --- |
| iOS | `1.0.0` | `1` (`ios.buildNumber`) |
| Android | `1.0.0` | `1` (`android.versionCode`) |

## Required release tester sign-off

Update each row after testing. Every row must record the app version and
platform release build identifier from the current release target, along with
the date, build/environment, platform, and outcome (`PASS` or `FAIL` plus a
short provider/redirect error summary if applicable). Do not record
test-account details.

| Test date (UTC) | App version | Release build identifier | Build/environment | Platform | Result |
| --- | --- | --- | --- | --- | --- |
| — | `1.0.0` | `1` | Development build installed on a physical device | iOS | **NOT RUN** — complete Google sign-in and verify return to `career-reality-mobile://sso-callback`. |
| — | `1.0.0` | `1` | Development build installed on a physical device | Android | **NOT RUN** — complete Google sign-in and verify return to `career-reality-mobile://sso-callback`. |
| — | `1.0.0` | `1` | Published production mobile build installed from the release channel | iOS | **NOT RUN** — smoke-test Google sign-in and confirm no provider or redirect rejection. |
| — | `1.0.0` | `1` | Published production mobile build installed from the release channel | Android | **NOT RUN** — smoke-test Google sign-in and confirm no provider or redirect rejection. |

## Launch gate

The workspace checks are passing, but launch is **not cleared by this record**
until all four required release-tester rows above are completed successfully
for the current app version and platform build identifiers. Run
`pnpm run test:google-release-readiness` from this package to flag missing,
stale, or non-PASS results before launch.
