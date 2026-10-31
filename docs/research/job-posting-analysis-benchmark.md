# Job requirement analysis benchmark

## Purpose and review status

This is a small, deterministic benchmark for checking extraction, category labels, evidence states, and quoted resume evidence. Its examples are invented; they contain no real job posting, resume, or person.

The expected labels are author-adjudicated test references, not labels from independent human reviewers. The set has not been validated on real or consented resume/job pairs. This is a transparent regression baseline, not a representative sample, hiring study, or estimate of real-world accuracy.

**Independent validation status: not completed.** No consented, privacy-reviewed representative pairs or other approved representative source, independent reviewer annotations, adjudication record, or held-out evaluation results are available for this report. The synthetic results below are not a substitute. Do not describe this benchmark or the checker as independently validated.

Each reference item records the intended requirement text, primary category, evidence state, and (when positive evidence is expected) a distinctive excerpt that should be quoted. A requirement omitted from the reference labels is treated as non-requirement context for that pair. “Not documented” does not mean the candidate lacks the skill.

## Independent review protocol

Do not collect or use real pairs until the data source, participant consent, processing and retention plan, reviewer access, and privacy controls have been approved. Consent must specifically cover independent human review and the study's purpose; account creation or consent to use the product is not study consent. Do not put real resumes, job descriptions, excerpts, or identifying details in this repository, test fixtures, logs, or public report.

Before annotation, freeze a written rubric and a sampling plan. The rubric should ask each reviewer to work independently and without seeing checker output or the other reviewer's labels:

1. Identify each distinct job requirement and transcribe only the shortest text needed to identify it.
2. Label its category: responsibility, essential competency, eligibility, qualification, preferred, contextual tool, or unclear.
3. Label its signal as mandatory, preferred, or ambiguous, based on the job wording rather than the reviewer's opinion of importance.
4. Label resume evidence as direct, transferable, partial, not documented, confirmed gap, or unresolved. “Not documented” means only that the supplied resume does not establish the evidence; it is not a confirmed gap. Use “confirmed gap” only when the supplied text explicitly supports that conclusion. Use “unresolved” when the text is too ambiguous to make a defensible label.
5. Record the shortest verbatim supporting excerpt and its source (job text or resume text) for each positive or contradictory label. Mark no excerpt when none exists; do not infer evidence from a keyword alone.
6. Mark non-requirement job context separately so it can be checked for false extraction.

Have a third qualified reviewer adjudicate every disagreement using the frozen rubric, retaining the two original labels and the adjudicated label in the controlled study record. Report pre-adjudication agreement and disagreement counts as well as post-adjudication results; do not present adjudicated labels as unanimous agreement. Keep source data and any excerpt mapping out of the public report.

Define the target population and sample before evaluation. Split at the person/pair level before any model tuning or rubric changes; keep held-out examples inaccessible to implementation authors until the evaluation is locked. Avoid leakage from the same candidate, job posting, or duplicate text across development and held-out partitions. If a held-out split or independent annotation cannot be maintained, report the evaluation as exploratory and do not make a validation claim. Publish only aggregate counts, denominators, error definitions, sampling limitations, reviewer process, and uncertainty where appropriate—never personal data or identifying excerpts.

## How to run

Run `pnpm test:job-posting-reality`. The test prints counts by reference category and checks the observed benchmark baseline. Update this report whenever intentional code or benchmark changes alter those counts.

## Observed results

Results from the 18 synthetic job/resume pairs:

| Reference category | Labeled requirements | Missed | Extra extraction | Wrong category | Wrong evidence state | Correct quote attribution / expected |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Responsibility | 1 | 0 | 0 | 0 | 0 | 1 / 1 |
| Essential competency | 12 | 0 | 0 | 0 | 0 | 6 / 6 |
| Eligibility | 1 | 0 | 0 | 0 | 0 | N/A |
| Qualification | 1 | 0 | 0 | 0 | 0 | 1 / 1 |
| Preferred | 1 | 0 | 0 | 0 | 0 | 1 / 1 |
| Contextual tool | 1 | 0 | 1 | 0 | 0 | 1 / 1 |
| Unclear | 1 | 0 | 0 | 0 | 0 | N/A |
| **Total** | **18** | **0** | **1** | **0** | **0** | **10 / 10** |

The remaining extra extraction is an incidental mention of Python in company context, not a candidate requirement. The benchmark now checks narrow paraphrases for data analysis, project management, and stakeholder management, alongside examples where related words appear without the relevant action. In particular, “Analyzed sales records and summarized trends” is now recognized as direct evidence for “data analysis” with its resume excerpt quoted. The benchmark also covers direct action evidence, missing skills, partial multi-skill evidence, a transferable cloud platform, a qualification, eligibility, a preferred tool, a bare keyword, vague wording, and explicitly negated evidence.

“Correct quote attribution” means the returned quote contains the pre-labeled excerpt. A missing or unrelated quote is not credited. N/A means the reference expects no positive excerpt. Counts are case counts, not a percentage or confidence interval.

## What this supports—and what it does not

- It supports that these specific examples are repeatable regression checks, including the remaining false-positive extraction and contrasts intended to catch loose semantic matches.
- It supports the local behavior change that a directly negated skill mention is not used as positive evidence in the included example.
- It does not establish population accuracy, reliable coverage, hiring outcomes, fairness across groups, or performance on other languages, formats, seniority levels, resume styles, or job families.
- The sample is small, synthetic, and authored alongside the implementation. There is no independent human review, blinded annotation, inter-rater agreement, or external holdout set.
- Do not add a match percentage, accuracy claim, or “validated” language based on this benchmark. The UI should continue to describe the checker as a heuristic and ask users to review its output.

To consider a real-world performance claim, first complete the independent review protocol above using an appropriately consented, privacy-reviewed representative source. Then assess whether the held-out results support the exact proposed claim and its stated limits. Until that work is completed and reviewed, keep match percentages, accuracy, reliability, and validation claims out of the product.
