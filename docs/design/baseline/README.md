# CareerReality baseline

Captured on 8 October 2026 before product-code changes.

## Scope

The baseline covers the current public decision journey and the eight routes listed under **Tools**:

- `/compass`
- `/salary-calculator`
- `/salary-reality`
- `/resignation-risk`
- `/layoff-radar`
- `/salary-drop`
- `/escape-plan`
- `/career-reality-index`
- `/ai`

The route catalogue currently describes eight tools, while Compass is grouped separately under Decide. `/tools` is the public directory for both groups and the rest of the site.

## Evidence collected

### Screenshots

- `home-1280-js-on.jpg`
- `salary-calculator-1280-js-on.jpg`
- `layoff-radar-1280-js-on.jpg`
- `compass-390-js-on.jpg`
- `salary-reality-390-js-on.jpg`

### Measurements

`measurements.json` contains route-level checks at 1280×900 and 390×844 for:

- response status
- page title and H1
- document height and horizontal overflow
- landmark counts
- controls smaller than 24 px
- unlabeled form inputs
- images without alt attributes
- browser console errors

## What is working

1. **The visual system is distinctive and consistent.** Newsreader, Manrope, and DM Mono establish clear editorial, interface, and evidence voices. The restrained paper palette, green decision color, rules, and grids repeat coherently.
2. **Responsive structure is technically stable.** All 11 sampled routes returned HTTP 200 with no horizontal overflow at 390 or 1280 px.
3. **Basic semantics are sound.** Every sampled route had a visible H1, no sampled form control lacked a label, and no sampled image lacked alt text.
4. **The public tools explain their limits.** The calculator, market read, radar, and Compass state evidence quality, unknowns, and next actions rather than presenting a score as a verdict.
5. **Production has a useful static fallback.** With JavaScript disabled, the published homepage and four sampled decision routes retain an H1 and 617–1,259 characters of route-specific copy.
6. **The CTC calculation has focused unit coverage.** Tests cover progressive bands, rebate and marginal relief, PF deduction limits, surcharge thresholds, and the new-regime surcharge cap.

## Findings

### P0 — Separate data reliability from interface redesign

The published pages and the staging preview currently show different evidence states:

- Published Salary Reality shows a populated Bengaluru software-engineer benchmark.
- Staging shows “No source-backed benchmark for this combination yet.”
- Published Layoff Radar shows six signals.
- Staging shows no publishable signals and “Source retrieval date unavailable.”
- Staging Compass withholds the context score because its evidence reads are unavailable.

This is not primarily a visual defect. Any redesign comparison must use a fixed fixture or a known evidence state; otherwise data availability will invalidate before/after judgments.

### P1 — Mobile journeys are too long for the decision being made

Measured mobile document heights:

| Route | Height at 390 px |
| --- | ---: |
| Homepage | 9,142 px |
| Salary Reality | 4,464 px |
| Salary Drop | 4,339 px |
| Salary Calculator | 4,306 px |
| Career Reality Index | 4,273 px |
| Compass | 4,050 px |
| Escape Plan | 3,975 px |
| AI Pulse | 3,916 px |
| Resignation Risk | 3,877 px |
| Tools directory | 3,876 px |
| Layoff Radar | 3,268 px |

The pages remain usable, but the primary answer, evidence explanation, decision guide, FAQs, and full global footer all receive similar visual weight. On mobile, secondary education should progressively disclose after the answer and next action.

### P1 — Empty and degraded states still present interpretation copy

In the staging Salary Reality capture, the benchmark is withheld, but the following “Read the band” panel says the target falls in the observed range and discusses its relation to the observed median. Even if this text is guarded internally, the visible combination reads as contradictory.

Degraded states should replace all dependent interpretation with:

- what failed or is unavailable
- what remains known from user input
- what the user can do next
- when the evidence was last successfully retrieved, if available

### P1 — The first meaningful result is visually delayed

The large editorial H1 is effective for discovery pages, but repeated on every utility route it pushes the working surface down. On desktop the calculator begins around the middle of the first viewport; on mobile Salary Reality uses roughly the first 490 px before the input card starts.

For repeat-use tools, preserve the editorial identity but reduce the route header after first visit or move the key input/result pair higher.

### P2 — Mobile footer cost is disproportionate

The full footer adds a long list of links after already long tools. It is useful for crawlability and discovery, but on mobile it extends the journey substantially. A compact grouped disclosure can preserve all links and reduce scroll cost.

### P2 — Dev no-JavaScript behavior differs from production

The Vite development server renders an empty body when JavaScript is disabled. The published build correctly serves generated route snapshots with route-specific H1s and text. This is expected from the current build pipeline, but local accessibility or crawler checks must run against the built static output rather than the dev server.

### P2 — Evidence labels are visually small

Provenance, confidence, field labels, and source trails rely heavily on small monospaced uppercase text. This supports the editorial style but risks making the most important trust information the least readable information, especially on mobile. Preserve the mono voice while increasing critical provenance text size and line height.

## Recommended order of work

1. Freeze deterministic fixtures for populated, empty, loading, degraded, and stale evidence states.
2. Make degraded-state interpretation internally consistent across Compass, Salary Reality, and Layoff Radar.
3. Redesign one representative path first: Salary Reality → CTC decoder → next action.
4. Move the answer and confidence summary above secondary educational content.
5. Collapse decision guides, FAQs, and mobile footer groups without removing crawlable content.
6. Validate the resulting pattern on Compass and the remaining six tools.

## Baseline acceptance checks for the next pass

- No horizontal overflow at 390, 768, and 1280 px.
- A result or explicit unavailable state is visible without scrolling past secondary education.
- Populated, empty, loading, degraded, and stale states each have a deterministic fixture.
- No interpretation references a benchmark or signal that has been withheld.
- Evidence source, date, confidence, and limitation remain visible.
- Keyboard focus, labels, and 200% zoom remain usable.
- Production static snapshots retain route-specific titles, H1s, canonicals, and meaningful no-JavaScript copy.

## Environment notes

- The web preview started cleanly with no browser console errors beyond the expected Clerk development-key warning.
- The API server reported degraded readiness because its public signal seed did not complete; public endpoints still returned HTTP 200.
- The existing published SEO workflow failure predates this baseline and is not caused by these documentation-only files.
