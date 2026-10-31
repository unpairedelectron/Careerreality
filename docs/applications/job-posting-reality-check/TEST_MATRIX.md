# Job Posting Reality Check: document extraction browser matrix

Last checked: 2026-10-29

## Production build checks

| Engine | PDF | DOCX | Local processing / worker MIME | Result |
| --- | --- | --- | --- | --- |
| Chromium | Passed previously | Passed previously | No resume text POST; PDF worker returned JavaScript MIME | Verified |
| Firefox 153 (Playwright) | Passed | Passed | No resume text POST; PDF worker returned JavaScript MIME | Verified |
| WebKit 26.5 (Playwright) | Not run | Not run | Browser could not launch in the current Replit Linux environment | Unverified |
| macOS Safari | Not run | Not run | Not tested on Apple Safari | Unverified |

The Firefox production-preview run covered both formats in one test and an additional DOCX-only review flow. The corresponding WebKit tests could not launch because this environment lacks compatible `libjpeg-turbo8`, `libgles2`, and `gstreamer1.0-libav` libraries. This is a test-environment limitation, not evidence that extraction fails in WebKit.

Playwright WebKit exercises the WebKit engine but is not a substitute for testing Apple Safari. Do not claim Safari compatibility until the PDF and DOCX flows are checked in a supported WebKit runner and on actual Safari.
