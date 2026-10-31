# Career Compass — test plan

## Automated
- Compare valid, equal, lower, and higher annual CTC values; reject blank, malformed, negative, and over-limit values.
- Assert that readouts preserve independent evidence labels and contain no score, probability, or risk band.
- Verify an invalid input withholds the comparison instead of using zero.

## Manual release checks
Test each upstream loading/error/empty state, saving only after explicit action, screen-reader announcements, keyboard navigation, and mobile layout. Verify that no result is framed as an offer recommendation.
