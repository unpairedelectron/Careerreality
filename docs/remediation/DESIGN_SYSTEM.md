# CareerReality design system foundation

## Purpose

CareerReality is an evidence-led career decision product, not a generic job board. The homepage should make the product and the next action clear; tools should show the assumptions behind an estimate instead of presenting a precise-looking answer without context.

This foundation records the existing shared visual language used by the homepage and CTC calculator. It does not introduce a second theme or replace the application tokens.

## Design principles

1. **Lead with the user’s decision.** Use plain-language headings and direct next steps; avoid score-first or motivational claims.
2. **Make evidence and uncertainty visible.** Separate verified sources, assumptions, unknowns, and user-entered values.
3. **Use editorial hierarchy, not dashboard density.** Serif display headings establish the reading voice; sans-serif text carries instructions; monospaced labels distinguish data and metadata.
4. **Keep primary actions specific.** Homepage entry points open a relevant tool without collecting or passing salary details.
5. **Make the same interface work in light and dark themes.** Use semantic tokens, not page-specific hard-coded colors, except for decorative artwork.
6. **Respect accessibility preferences.** Keep labels and hints attached to inputs, show errors in text, provide visible focus, preserve contrast, and disable nonessential motion when reduced motion is requested.

## Shared tokens

Values are HSL components from `src/index.css`, not hex colors.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `background` | `45 25% 94%` | `198 28% 9%` | Page canvas |
| `foreground` | `201 32% 14%` | `90 21% 95%` | Main text |
| `card` | `48 38% 97%` | `194 25% 14%` | Raised content surfaces |
| `primary` | `175 65% 26%` | `164 50% 63%` | Main actions, links, focus ring |
| `accent` | `10 36% 43%` | `18 65% 68%` | Secondary emphasis |
| `secondary` | `130 12% 90%` | `180 17% 19%` | Grouped and supporting surfaces |
| `muted-foreground` | `190 9% 38%` | `166 9% 73%` | Secondary copy |
| `border` | `135 10% 85%` | `186 16% 25%` | Dividers and control boundaries |
| `destructive` | `0 43% 49%` | `5 80% 69%` | Errors and invalid states |

## Typography and shape

- **Display:** Newsreader, with Georgia/serif fallback. Use for the homepage hero, section headings, and prominent calculator results.
- **Body and controls:** Manrope, with sans-serif fallback. Use for explanations, navigation, labels, and actions.
- **Data labels:** DM Mono, with monospace fallback. Use for small overlines, figures, and technical metadata, not long explanatory copy.
- **Base radius:** `0.8rem`; use tighter radii for fields and larger radii for cards.
- **Numerals:** Use tabular numerals for amounts and keep currency symbols visible.

## Layout and interaction

- Homepage content is centered in a maximum 1180px measure. The hero pairs the plain-language product statement with a short editorial note; the primary offer entry is a direct calculator link.
- At tablet widths the homepage hero and entry sections stack; at phone widths they use a single-column layout and reduced outer gutters.
- The calculator uses a two-column input/readout layout on wide screens and a single column on narrow screens. Keep the readout adjacent to the inputs on desktop and immediately after them on mobile.
- Interactive controls should have at least a 44px target. The calculator fields are 48px high; source links also keep a 44px minimum target.
- Use semantic HTML and visible `:focus-visible` indicators. Inputs must retain a programmatic label, hint, invalid state, and linked text error.
- Use movement only for entrance or hover feedback; content and meaning must remain available without animation.

## Page-specific visual contract

- **Homepage:** explain what CareerReality helps decide, distinguish its evidence-oriented approach, and provide one clear “decode an offer” route. Do not rebuild a CTC form or put salary values in a CTA URL.
- **CTC calculator:** group offer inputs, employer structure, tax settings, results, worked examples, and method/source material. Use restrained teal emphasis for the result, not a green/red “good offer/bad offer” judgment.
- **Source and uncertainty treatment:** keep official references beside assumptions; label estimates as estimates and unverified or missing evidence explicitly.

## Review checks

- Review homepage and calculator at desktop and phone widths in light and dark themes.
- Verify focus visibility, reduced motion, field labels/errors, and link-target size.
- Do not claim a contrast or accessibility pass from token values alone; inspect rendered states and automated checks.
