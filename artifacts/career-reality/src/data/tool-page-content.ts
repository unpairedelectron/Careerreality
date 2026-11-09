import { calculateCareerTool } from "@workspace/career-tools";
import { ctcWorkedExampleResults } from "../lib/ctc-calculator";
import {
  createCareerRealityIndexReflection,
  escapePlanGoals,
  getEscapePlanTasks,
} from "../lib/application-models";
import type { ToolFaq } from "./tool-faqs";

/**
 * Method, limits, worked examples and sources for tool pages. Both the prerendered
 * snapshot (`scripts/generate-route-snapshots.ts`) and the hydrated React page
 * (`ToolMethodSection`) render these blocks, so crawlers and readers get the same
 * copy. FAQs are kept separately in `tool-faqs.ts`.
 */
export type ToolContentLink = { label: string; href: string; note?: string };
export type ToolContentBlock = {
  id?: string;
  heading: string;
  body?: string;
  list?: string[];
  groups?: Array<{ title: string; items: string[] }>;
  links?: ToolContentLink[];
  /** Paragraph shown after `links`. */
  note?: string;
  table?: { intro?: string; caption: string; columns: string[]; rows: string[][]; rowHeaders?: boolean };
  qa?: ToolFaq[];
};

export const TOOL_METHOD_HEADING = "Method, limits and sources";

const inr = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

const inputsAndPrivacy: ToolContentBlock = {
  heading: "Inputs and privacy",
  body: "Calculations run in the browser. Entered values are not sent to the API, stored, added to the URL, or used as analytics events.",
};
const worksheetLimits: ToolContentBlock = {
  heading: "Limits",
  body: "Educational arithmetic only. Verify contracts, tax questions, and employer-specific terms against current documents and qualified sources.",
};
const genericMethod: ToolContentBlock = {
  heading: "Method and limits",
  body: "Check the example, confirm inputs against your documents, and verify official rules before relying on estimates.",
};

function careerToolExample(toolId: "layoff-runway" | "home-loan-stress-test"): ToolContentBlock {
  const result = toolId === "layoff-runway"
    ? calculateCareerTool("layoff-runway", {
        liquidSavings: 360_000,
        severance: 0,
        essentialMonthlyCosts: 45_000,
        monthlyDebtPayments: 0,
        otherMonthlyIncome: 5_000,
      })
    : calculateCareerTool("home-loan-stress-test", {
        loanPrincipal: 5_000_000,
        annualRatePercent: 8,
        stressRatePercent: 10,
        termMonths: 240,
        monthlyTakeHome: 150_000,
        otherMonthlyCosts: 50_000,
      });
  const rows = result.rows
    .filter((row) => toolId === "layoff-runway"
      ? row.label.includes("Liquid") || row.label.includes("Monthly costs") || row.label.includes("Runway")
      : row.label.includes("Monthly payment") || row.label.includes("Total scheduled") || row.label.includes("Total interest"))
    .map((row) => [
      row.label,
      typeof row.value === "number" && row.format === "inr"
        ? inr(row.value)
        : typeof row.value === "number" && row.format === "months"
          ? `${row.value.toFixed(1)} months`
          : String(row.value),
    ]);
  return {
    heading: "Worked example",
    table: {
      intro: toolId === "layoff-runway"
        ? "Illustrative inputs: ₹3,60,000 liquid savings, ₹45,000 essential monthly costs, no debt payment, and ₹5,000 continuing monthly income. The result is arithmetic only; it does not predict re-employment."
        : "Illustrative inputs: ₹50,00,000 principal over 240 months, with 8% entered as the base rate and 10% as a stress scenario. The stress rate is not a forecast.",
      caption: "Worked example calculated by the same model as the interactive tool",
      columns: ["Measure", "Calculated value"],
      rows,
      rowHeaders: true,
    },
  };
}

/** Illustrative CTC packages, shared by the salary-calculator snapshot and `/tools` copy. */
export function ctcWorkedExampleTable(): NonNullable<ToolContentBlock["table"]> {
  return {
    intro: "Each row is a hypothetical package calculated by the same model as the interactive tool. They use the new regime and 50% basic pay. The ₹8L and ₹12L examples explicitly set employee PF and professional tax to ₹0, so their cash estimates are higher than a payroll estimate with those deductions. Replace these values with your offer or payslip. The ₹20L illustration uses the 2026–27 month-by-month statutory PF ceilings and an explicitly entered 1 April 2026 start date; other examples use manual PF amounts. These are examples, not market observations or guaranteed payroll outcomes.",
    caption: "Illustrative annual package and monthly cash estimates",
    columns: ["Illustration", "CTC/year", "Fixed gross/year", "Target variable/year", "Income tax/year", "Employee PF/year · fixed / target", "Professional tax/year", "Monthly cash at zero variable", "Monthly average at full target"],
    rows: ctcWorkedExampleResults.map(({ label, result }) => [
      label,
      inr(result.inputs.annualCtc),
      inr(result.annualGrossAtZeroVariable),
      inr(result.inputs.annualVariablePay),
      inr(result.annualTaxAtTarget),
      `${inr(result.annualEmployeePfAtZeroVariable)} / ${inr(result.annualEmployeePf)}`,
      inr(result.inputs.annualProfessionalTax),
      inr(result.monthlyInHandAtZeroVariable),
      inr(result.monthlyInHandAtTargetAverage),
    ]),
    rowHeaders: true,
  };
}

function escapePlanChecklists(): ToolContentBlock[] {
  return [
    { heading: "Checklist examples", groups: escapePlanGoals.map((goal) => ({ title: goal, items: [...getEscapePlanTasks(goal)] })) },
    { heading: "Limits and persistence", body: "Progress and selected inputs exist only in the current page state; refreshing clears them. Completing the checklist does not predict hiring, job-search success, or readiness to resign." },
  ];
}

function careerRealityIndexBlocks(): ToolContentBlock[] {
  const reflection = createCareerRealityIndexReflection({
    pay: "Not answered",
    stability: "Not answered",
    optionality: "Not answered",
    ai: "Not answered",
  });
  return [
    { heading: "What the check asks about", list: ["Current pay", "Company confidence", "Ability to move", "AI readiness"] },
    { heading: "What it can and cannot establish", body: `${reflection.truth} ${reflection.lever} ${reflection.next}` },
    { heading: "Questions to consider", list: reflection.questions },
  ];
}

// These are separately authored route notes, not a shared paragraph template.
const worksheetNotes: Record<string, ToolContentBlock[]> = {
  "/layoff-runway": [
    { heading: "Read the cash table as a sequence", body: "The opening balance is the money available at the start of that month. The closing balance subtracts the same net outflow entered in the form; it does not mean every bill is paid on the same day. A positive month-end figure can still hide an earlier rent, school-fee, or loan debit that arrives before salary or severance. Compare the schedule with actual bank dates, not only its final row. If income stops partway through a month, enter the amount that is genuinely expected to continue rather than a full-month assumption." },
    { heading: "Illustrative scenario: separate certain cash from hope", body: "Imagine a person with savings in a bank account, a severance amount that has not yet been confirmed, and occasional freelance work. The worksheet should include the liquid savings now, exclude the unconfirmed severance, and omit freelance income unless the person has a defensible continuing amount. This is not pessimism; it keeps the baseline auditable. A second run can add severance after a signed letter arrives. Keeping both versions makes the cost of waiting visible without treating a recruiter conversation, a pending claim, or an investment balance as spendable money." },
    { heading: "Decide what belongs in the monthly baseline", body: "Start with obligations that continue if work stops: housing, food, utilities, transport, insurance, school or care, minimum debt payments, and support sent to family. Separate recurring costs from one-time expenses such as a move, medical bill, device repair, or travel for interviews. The model has no dedicated field for every irregular cost, so preserve a separate reserve rather than quietly dividing an uncertain bill into monthly income. Avoid counting a loan instalment twice when it is already included in essential costs. Your own ledger is the source of truth; the calculator only performs the arithmetic you supplied." },
    { heading: "Build a conservative, usable plan", body: "Make separate versions for different events rather than blending them into one average. One version can show current household income continuing; another can remove it if a contract ends; a third can add a confirmed payment on its expected date. These are scenarios, not probabilities. Keep the assumptions beside each version so another household member can challenge a number without having to reconstruct your thinking. If the result depends on selling an asset, borrowing from family, or collecting a disputed amount, name that dependency explicitly. A runway figure is most useful when it tells you which conversation or document to pursue before cash becomes urgent." },
    { heading: "Use the schedule to choose a next action", body: "Look for the month where the closing balance crosses a personal floor, not only the month it reaches zero. Your floor might represent money reserved for rent, medical access, dependants, or an unavoidable move. The calculator does not know that boundary; decide it outside the form and write down why it matters. If the balance falls quickly, possible actions include confirming final settlement, reviewing recurring subscriptions, speaking with lenders before a missed payment, or delaying a discretionary purchase. If the projection looks comfortable, still check timing and irregular expenses. The table is an invitation to act earlier, not a reason to wait until its last row." },
    { heading: "Keep evidence attached to each input", body: "For every major amount, note its origin: a current bank balance, a signed settlement statement, a recent bill, or a household estimate. Add a date because balances and obligations change. Distinguish money legally accessible to you from funds jointly held, restricted, pledged, or needed for another commitment. A simple private worksheet can record source, owner, expected date, confidence, and what would invalidate the assumption. Do not paste personal account numbers, employer documents, or identity details into public feedback or analytics. This page calculates in the browser; it does not verify a bank balance, make a benefits claim, negotiate debt, or contact an employer on your behalf." },
  ],
  "/home-loan-stress-test": [
    { heading: "How to read the amortisation schedule", body: "Each row starts with the unpaid balance, calculates one month's interest from the entered annual rate divided across twelve months, then allocates the scheduled payment between interest and principal. The closing balance becomes the next row's opening balance. Early rows can show a larger interest share because the outstanding principal is larger; later allocations shift as that balance falls. This is a standard fixed-rate arithmetic path, not a lender statement. The interactive schedule uses the entered-rate EMI; the second EMI is a separate stress comparison and does not silently rewrite every row." },
    { heading: "Illustrative scenario: compare the monthly squeeze", body: "Illustrative inputs: ₹50,00,000 principal, a 20-year term, 8% in the base field, and 10% in the stress field. The tool calculates two instalments from those inputs and reports the increase, total scheduled payments, estimated interest at the base rate, and cash left after the stressed payment plus other monthly costs. Treat this as a controlled comparison: only the rate changes. A real lender can also alter tenure, reset dates, fees, or the payment date, so the result is not a quotation or a claim about what your bank will charge." },
    { heading: "What the model leaves outside the table", body: "The schedule assumes one principal, one constant rate, regular monthly payments, and no extra principal reductions. It cannot represent an introductory rate followed by a reset, a partial prepayment, late charges, insurance bundled with an instalment, or a lender's day-count convention. If your agreement changes the tenure instead of the monthly payment after a rate revision, this table will not show the resulting end date. Use the lender's current repayment schedule to reconcile outstanding balance and interest. Keep this worksheet for sensitivity analysis, then compare the lender document line by line before budgeting around a payment." },
    { heading: "Check the result against your budget", body: "Compare the stressed instalment with take-home cash after other recurring commitments, not with gross compensation or a household income that may not arrive every month. List rent or maintenance, utilities, food, transport, education, insurance, medical needs, existing debt, and savings you intend to preserve. The worksheet subtracts only the costs you enter, so a positive remainder is not proof that the household is comfortable. Decide which expenses are flexible and which cannot be reduced without harm. If another borrower contributes, test a version that removes that contribution temporarily. The purpose is to surface dependence on shared income, not to judge the household's choices." },
    { heading: "What a prepayment scenario would require", body: "The current schedule has no extra-payment field. Do not interpret its closing balance as a lender forecast if you plan regular prepayments. A separate calculation would need the timing and amount of each extra payment, any fee, the rule for reducing tenure or instalment, and the lender's balance after each reset. Until you have those terms, compare only the base schedule with the rate scenario shown here. Ask the bank for a revised amortisation statement after a rate change and check whether a debit instruction changes automatically. Keep a copy of the requested schedule and the date it applies, because a statement for an earlier cycle may not reflect the next payment." },
    { heading: "Read every row as a model output", body: "An amortisation table is a sequence of arithmetic operations, not a contract amendment. The first row uses the entered principal; every later row depends on the previous closing amount and the rounded payment retained by this model. Actual servicing systems may round each component differently, apply a payment to a date-specific period, or adjust the final instalment. If your lender's amount differs, compare the assumptions before concluding that an error occurred. The most useful reconciliation starts with principal outstanding, rate effective date, remaining months, and the scheduled debit. A qualified lender representative can explain account-specific treatment; this tool cannot inspect your loan account or request a balance confirmation." },
  ],
  "/resign-or-stay": [
    { heading: "Use the comparison to expose assumptions", body: "For each area, enter how important it is to you, then how the staying and moving options currently look. The displayed products are arithmetic reminders of your own stated priorities; they do not measure a career, reveal a correct answer, or establish that one option is safer. Use the same scale consistently. If a factor is non-negotiable, note that separately instead of allowing a high rating elsewhere to cancel it. When the evidence is thin, mark the uncertainty in your own notes and choose a verification step before treating a tentative impression as a settled comparison." },
    { heading: "Illustrative scenario: make the unknown visible", body: "Illustrative scenario: a person enjoys their team but has no written promotion scope, while another employer has described a role verbally. The stay side can reflect known colleagues and familiar work; the move side may reflect potential authority alongside unanswered questions about manager, funding, and variable pay. The useful result is not whichever total is larger. It is the short list of facts that could reverse the choice: an approved role description, a conversation with the future manager, a written compensation plan, or a clearer review date at the current employer." },
    { heading: "What to verify before choosing a date", body: "Read the employment agreement and later amendments for notice obligations, bonus recovery, training repayment, confidentiality, and post-employment terms. Ask the prospective employer to confirm title, reporting line, location, decision authority, compensation components, conditions, background checks, and joining date in writing. Check whether resignation changes insurance, childcare arrangements, commute, visa status, or support for dependants. The worksheet does not interpret legal enforceability or personal wellbeing. Where a clause or consequence could materially change the decision, seek a qualified explanation instead of translating uncertainty into a confident score." },
    { heading: "Separate urgency from readiness", body: "A difficult week can create urgency without supplying evidence that a change will solve the underlying problem. Conversely, a calm period can hide a deadline in a contract, benefit, or household budget. Write down what has to happen soon and what can wait for more information. If the issue is safety, health, discrimination, or a legal threat, this comparison is not an emergency service and should not delay qualified help. For ordinary career uncertainty, define a small test that protects your options: a confidential conversation, a revised scope request, a budget review, or a carefully chosen external interview." },
    { heading: "Give each option a realistic description", body: "Describe the staying path as it is likely to operate, not as the best version of a promise. Include the manager's authority, available work, team dependencies, and date for a decision. Describe the moving path using the written offer, current stage of checks, actual work location, and any unresolved approval. If the new role is not yet documented, compare it as an opportunity under discussion rather than as guaranteed employment. Include a third path when it is real, such as an internal transfer or a temporary pause. A comparison becomes misleading when one option contains facts while another is filled with imagined benefits." },
    { heading: "Decide what evidence would change your view", body: "Before entering preferences, name one fact that would make you reconsider either option. Examples include a manager confirming budget and decision rights, a revised written offer, a household cash calculation, or a conversation with someone who performs the work. Set a review date tied to that event rather than waiting indefinitely for certainty. Keep a record of what you asked, what answer arrived, and what remains unresolved. If no answer arrives by the date, decide whether the delay itself matters. This process does not remove risk; it makes the trade-off explicit enough for you to discuss with people who understand your circumstances." },
  ],
  "/compass": [
    { heading: "Separate evidence from preference", body: "Use one column of your own notes for facts you can point to and another for interpretations or hopes. A written offer, a recent performance review, a completed work sample, and a recurring household cost are different kinds of evidence; a rumour about a reorganisation or a promise of future scope deserves a different confidence label. Record when each item was last checked and who can confirm it. This worksheet does not combine those notes into a score. Its purpose is to help you compare a current role, an external move, or a smaller experiment without pretending that incomplete evidence has equal weight." },
    { heading: "Illustrative scenario: compare three paths", body: "Illustrative scenario: someone is weighing continued work in a current team, accepting a written offer, or asking for a bounded internal project before deciding. The offer path may have clearer pay but an unfamiliar manager. Staying may preserve relationships while leaving authority unresolved. The project may reveal whether the desired work is available without requiring an immediate exit. Write the evidence each path would produce, the cost of waiting, and the point at which you would reconsider. This does not establish which path will succeed; it shows what could be learned before making a harder-to-reverse commitment." },
    { heading: "What to verify next", body: "Choose one question whose answer could genuinely change your preference. Ask the hiring manager who approves the work and how success is reviewed; ask the current manager what scope can be granted and by when; inspect the offer for fixed-versus-variable definitions; or test the commute at the actual travel time. Avoid collecting information that cannot affect the decision. If a promised change has no owner, document, date, or consequence when missed, treat it as uncertain. Revisit your notes when that evidence arrives rather than letting an old impression silently become a fact." },
    { heading: "Keep a decision record that can be revisited", body: "Write the date, options considered, strongest evidence, material unknowns, and next action in ordinary language. Avoid reducing the record to a single total or colour. Add who could confirm each uncertain claim and how long you are willing to wait for the answer. A colleague may help examine work scope; a family member may understand household constraints; a professional adviser may address contractual or financial questions. Those perspectives are different, so note which question each person can answer. Review the note after new evidence arrives, not whenever anxiety spikes. This gives you a way to tell whether the circumstances changed or only your interpretation." },
    { heading: "Do not confuse comparison with certainty", body: "A table can make options easier to discuss, but it cannot reveal a manager's future conduct, the health of a team, the durability of a product, or whether the work will remain satisfying. Treat every statement as one of three things: confirmed, plausible but unconfirmed, or unknown. If the current role has a known constraint and the external option has an unknown constraint, do not call them equivalent simply because both are uncertain. Ask targeted questions that could reduce one uncertainty at a time. Where evidence remains unavailable, decide whether you can tolerate that uncertainty rather than inventing a reassuring answer." },
    { heading: "Prepare for the conversation you need", body: "Choose a person with access to the fact, then ask a question narrow enough to receive a concrete answer. A recruiter can confirm written terms but may not control team budgets. A manager can explain current priorities but may not approve a future reorganisation. A colleague can describe their experience without speaking for the whole organisation. Frame the question around your decision: what will I own, what must be true before I join, or when will this scope be reviewed? Record the response and its limits. If the answer is verbal, request a written summary so that later conversations do not depend on memory or interpretation." },
  ],
  "/salary-drop": [
    { heading: "Compare cash on the same basis", body: "Enter both packages for the same period and decide whether the comparison is gross fixed cash or a broader CTC figure. A target bonus belongs in a separate scenario because a stated target is not identical to money already paid. Check whether employer contributions, reimbursements, equity, or one-time joining amounts appear in either headline. The worksheet does not estimate tax or infer payroll policy. If the new amount is monthly and the old amount is annual, normalize them before comparing. Keep currency, pay period, variable assumptions, and household costs visible so the arithmetic does not conceal a mismatch." },
    { heading: "Illustrative scenario: name the purchase", body: "Illustrative scenario: a person considers lower fixed pay for shorter travel, clearer authority, or work that better matches a long-term direction. First calculate the recurring cash difference, then check that the household can absorb it without relying on a bonus. Next write down the benefit being purchased in observable terms: fewer hours in transit, direct responsibility for a defined product area, or protected time for a portfolio project. A promised cultural improvement is harder to verify than a written scope or a trial commute. The scenario is illustrative; the tool does not decide whether the exchange is worth making." },
    { heading: "Build a review point, not a justification", body: "Before accepting, identify the evidence that would show the trade-off is real and set a date to review it. For a scope change, ask who owns the decision and what work will move to you. For flexibility, clarify the expected schedule, location rules, and exceptions. For learning, define a work sample or responsibility that demonstrates progress. Add recurring expenses that change with the move, such as transport, meals, equipment, or care. One-off relocation or setup expenses should remain distinct from salary loss. If the expected benefit does not appear, decide in advance whether to renegotiate, search again, or revise the goal." },
    { heading: "Test the promise behind the lower figure", body: "A compensation reduction is concrete; a better manager, healthier pace, or broader authority may still be a promise. Translate each expected benefit into something you can observe without demanding a guarantee no employer can make. You might ask who approves priorities, how urgent work is handled, what hours are typical for the team, or which decisions the role owns. Speak with more than one relevant person when possible, and remember that individual experience is not universal evidence. If the employer cannot answer before you decide, include that uncertainty in your own reasoning rather than assigning the promised benefit the same confidence as written salary." },
    { heading: "Check household effects beyond the offer", body: "Estimate how the changed payment affects recurring commitments and goals that do not appear on a payslip: loan obligations, caregiving, education, savings, insurance, commuting, and support for relatives. Keep one-time transition costs separate from the ongoing difference. Consider whether a new location adds deposits, transport, meals, or duplicate housing before a move is complete. A partner's income may be shared in practice but should not be assumed available without discussion. The worksheet uses only the figures entered; it cannot know what the household considers essential. A conservative budget can show whether the trade-off is manageable even if the first few months are less predictable." },
    { heading: "Write a review condition before you accept", body: "Choose a date or event for reviewing the move, and write what evidence you expect by then. Examples include ownership of a named project, a confirmed schedule, or time reserved for a development goal. Decide what response would count as progress and what would prompt another conversation. Do not rely on a vague phrase such as better culture; specify the behaviour you need to observe. The review is not an ultimatum or a prediction that the job will fail. It gives you a way to compare the role you accepted with the role you are actually doing and to make a deliberate adjustment if the promised exchange does not appear." },
  ],
  "/escape-plan": [
    { heading: "Turn a goal into evidence-producing actions", body: "Choose a goal narrow enough to test, such as exploring a different function, improving access to a particular kind of work, or preparing for independent projects. A checklist is useful when each item creates an observable artifact or response: a draft portfolio case, a conversation with a practitioner, a carefully scoped application, or a written question to a hiring team. Reading another article may help, but it should not become a substitute for contact with the actual work. Fit the weekly plan around current energy, family commitments, and deadlines rather than borrowing time from an imaginary empty calendar." },
    { heading: "Illustrative scenario: a bounded career experiment", body: "Illustrative scenario: a person curious about product operations uses a planning window to map one recurring workflow, speak with two people doing similar work, and build a small before-and-after case study from a permitted project. The goal is not to claim expertise after a few tasks. It is to discover whether the daily problems are appealing and what proof employers ask for. If access to a work sample is restricted, use a fictional or public dataset and label it accurately. The checklist tracks actions completed; it does not estimate hiring probability, income, or the date a transition will be complete." },
    { heading: "Review the plan when reality changes", body: "At each review, keep actions that created a useful response, replace tasks that only consumed time, and record the reason for a pause. A rejected application can still reveal a requirement; silence may reveal nothing. Ask whether the target role, evidence, or available hours changed. If a family or financial constraint tightens, adjust the sequence without framing the change as failure. Preserve a version of your original goal so you can see whether your direction moved for a reason. The tool's page state is temporary, so save any plan you want to keep in a private document that does not contain sensitive employer information." },
    { heading: "Make each task observable", body: "Replace vague actions such as research the market with an output you can inspect: a short list of role descriptions, a comparison of recurring responsibilities, or notes from a conversation with someone who does the work. Replace learn a skill with a small artifact that demonstrates the skill in context. Keep the artifact truthful about your contribution and remove confidential material. A task that depends on another person should name the request and a backup if they are unavailable. This level of specificity makes progress visible without turning activity into a claim of competence. The checklist is for planning, not public proof that you are qualified." },
    { heading: "Protect time without overpromising", body: "Choose a weekly time budget that already accounts for work, rest, family, and commute. If a plan requires every free evening, it probably needs a smaller experiment. Break a large project into a first deliverable that can be reviewed before you commit to more expense. Keep optional learning separate from work samples that could test demand. If you pause, record whether the reason was capacity, changed interest, missing access, or a different priority. Those are useful signals, not failures. The page's time window organizes a sequence; it cannot know your calendar or guarantee that an action will receive a response." },
    { heading: "Review the evidence, not just the checklist", body: "At the end of a planning interval, ask what you learned and what remains unknown. Did a practitioner describe the work in a way you still want? Did an application expose a missing requirement? Did the portfolio artifact receive specific critique? Separate a lack of response from a negative response, because they provide different information. Decide whether to repeat, revise, or stop the experiment. If the goal changed, preserve the reason so you can distinguish a deliberate redirection from a temporary reaction. A useful plan can conclude that the original path is not attractive; completion is not the same as switching careers." },
  ],
  "/career-reality-index": [
    { heading: "Treat the response pattern as a prompt", body: "The check asks for self-reported views on pay, company confidence, ability to move, and AI readiness. Its reflection is fixed; the answers are not added, ranked, weighted, or converted into a score. The words you select should describe your current evidence, not the answer you wish were true. A neutral response can mean the situation is acceptable, unclear, or simply not measured; use a note to distinguish those meanings. The tool cannot see your contract, manager, savings, health, or private company plans. Its useful output is a question to investigate, not a label about your career." },
    { heading: "Illustrative scenario: one answer needs evidence", body: "Illustrative scenario: a person is comfortable with current pay but unsure whether their work will remain relevant as a team adopts new software. Instead of interpreting the response as proof of risk, they list the tasks that changed, ask who reviews outputs, and request a discussion about the next project. That evidence may support learning, role redesign, or no immediate change. Another person with the same response could have a different context and need a different next step. The reflection is deliberately conditional because a short set of self-reports cannot establish an employment outcome or personal wellbeing." },
    { heading: "Verify the answer that matters most", body: "Pick one response and tie it to a recent source: a pay statement, written scope, performance feedback, a conversation with a manager, a completed work sample, or an explicit job requirement. Note the date and what would change your interpretation. If the source is missing, make that absence visible instead of guessing. A useful next action is small enough to complete and specific enough to produce evidence. Revisit the reflection after the evidence changes; do not treat a previous response as a permanent identity. Keep any saved note narrative, not as a pseudo-precise personal rating." },
    { heading: "Read one answer in context", body: "A response about pay may refer to monthly cash, progression, fairness, or uncertainty about the next review. A response about company confidence may reflect a recent announcement, a team conversation, or a general feeling with no source attached. Before changing the answer, name the meaning you intended and the evidence supporting it. The same satisfaction label can describe very different circumstances for different people. This check does not normalize those experiences against other workers. Use your own explanation to keep the response grounded in your current situation rather than treating the selection as a diagnosis." },
    { heading: "Choose a reversible verification step", body: "A useful follow-up should produce information without forcing an immediate career move. You might compare your written pay terms with a recent statement, ask for the criteria behind a review, map which tasks changed in your team, or request feedback on a work sample. Keep the question specific and choose someone able to answer it. If the answer is not available, write that down and decide whether the uncertainty itself affects your plans. Avoid sharing sensitive employer or personal material in an open channel. The tool cannot save your private explanation, so preserve only notes you want to keep in a place you control." },
    { heading: "Notice what the check cannot observe", body: "Four self-reports leave out manager behaviour, caregiving, discrimination, health, immigration status, household debt, team funding, and many other facts that can change what is reasonable. A fixed reflection cannot know which factor is decisive for you. Do not use its language to dismiss a concern that needs specialist support or to certify that a workplace is safe. If the topic involves a legal right, tax question, health need, or financial commitment, consult the relevant qualified source. The check is deliberately modest: it can help you name a concern and select one fact to verify; it cannot take responsibility for the resulting decision." },
  ],
  "/ai": [
    { heading: "Start with a task, not a job title", body: "Write down one recurring piece of work from intake through delivery: its inputs, transformation, review, hand-off, and consequence. Ask which step a tool can draft, search, classify, or repeat, then ask what context must still be supplied by a person. A job title can bundle routine production with negotiation, exception handling, customer trust, and accountable decisions. Those tasks may change at different speeds inside one team. This worksheet is a set of investigation prompts, not a measure of exposure, a market forecast, or an estimate of employment risk." },
    { heading: "Illustrative scenario: trace an output to its owner", body: "Illustrative scenario: a team uses a language model to prepare a first draft of a customer update. Map who provides the source facts, who checks claims, who removes confidential information, who approves the tone, and who handles an incorrect statement. Record whether the tool changes the amount of work, its distribution, or the quality-control burden. A faster draft can move effort toward verification rather than remove it. Do not submit restricted or personal material to a system unless your employer has approved that use. The example describes a workflow question, not a prediction about a particular occupation." },
    { heading: "Make a practical learning test", body: "Choose one permitted task and compare a normal process with an assisted process using the same quality standard. Track time, correction types, missing context, and who accepts responsibility. Keep the source and an unassisted baseline where policy allows. Ask your manager how the result will be reviewed and whether the tool is approved for that data. A useful skill demonstration shows judgement: what you rejected, what you checked, and why the final output is fit for its audience. Tool familiarity without a real workflow or review boundary is weak evidence of contribution." },
    { heading: "Map exceptions and hand-offs", body: "Routine examples rarely reveal the hardest part of a workflow. List the exceptions: incomplete records, contradictory instructions, unusual customer needs, policy conflicts, or a failed upstream system. Ask who detects each exception, who can pause the process, and where the case goes next. A tool may produce plausible text while omitting the condition that changes the correct response. Reviewing edge cases helps distinguish a draft generator from a system that can safely complete a task. Keep a record of the review criteria and escalation path rather than relying on a general instruction to check the output." },
    { heading: "Protect data and provenance", body: "Before testing a tool, identify the data classification and the system the employer permits. Do not paste customer records, employee details, source code, confidential strategy, or unpublished financial information into an unapproved service. Ask whether prompts or outputs are retained, who can access them, and whether generated material can be traced to source documents. For a public-facing answer, preserve citations and verify that they support the actual claim. A polished response is not evidence of correctness. If the source cannot be checked, mark the claim unresolved and keep a human owner responsible for the final decision." },
    { heading: "Describe your contribution precisely", body: "If you use an assistant in a work sample, explain the task, the permitted inputs, the parts you reviewed, and the changes you made. Show how you noticed a wrong assumption or improved a weak result. Do not claim that the tool created expertise or that a faster draft proves a business outcome. Ask your manager whether disclosure is required and follow team policy. A useful portfolio case distinguishes your judgement from automated output and respects confidentiality. This gives a hiring conversation something concrete to examine: problem framing, quality checks, exception handling, and accountability rather than a list of software names." },
  ],
};

const officialReference = (links: ToolContentLink[]): ToolContentBlock => ({ heading: "Official reference", links });

const worksheetIntro: Record<string, ToolContentBlock[]> = {
  "/offer-comparison": [
    { heading: "How the worksheet works", body: "Runs both written pay breakdowns through the shared CTC model. It separates fixed pay, zero-variable take-home, full-target take-home, employer-side CTC components, and entered first-year clawback, notice, relocation, and commute costs. It does not assign an aggregate score or predict variable payout." },
    inputsAndPrivacy,
    { heading: "Compare first-year trade-offs", body: "Treat recurring monthly cash separately from a joining payment. Check any clawback against the signed bonus clause, and include relocation or commute costs only when the amount reflects your actual plan." },
    worksheetLimits,
  ],
  "/tax-regime-comparison": [
    { heading: "How the worksheet works", body: "Estimates AY 2026–27 salary-only tax for a resident individual below age 60. Old-regime deductions are a user-entered verified total; the new-regime result uses the shared CTC tax engine. The model does not determine deduction eligibility or handle other income types." },
    inputsAndPrivacy,
    worksheetLimits,
    officialReference([
      { label: "Income Tax Department: tax rates for AY 2026–27", href: "https://www.incometaxindia.gov.in/w/tax-rates%E2%80%8B" },
      { label: "Income Tax Department: AY 2026–27 deductions, including salary standard deduction", href: "https://www.incometaxindia.gov.in/w/deductions-allowable-to-tax-payer" },
      { label: "Income Tax Department: salaried individuals and deductions", href: "https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1" },
      { label: "Income Tax Department: official tax calculator", href: "https://www.incometaxindia.gov.in/income-tax-calculator" },
    ]),
  ],
  "/gratuity-estimator": [
    { heading: "How the worksheet works", body: "Shows a limited monthly-rate 15/26 illustration and the ₹20 lakh maximum stated as current in the Ministry FAQ of 30 December 2025. It does not cover all employee categories, confirm a later ceiling notification, determine eligibility, or establish the applicable wage base." },
    inputsAndPrivacy,
    worksheetLimits,
    officialReference([
      { label: "Ministry of Labour and Employment: FAQs on Labour Codes (30 December 2025), including gratuity amount and ceiling", href: "https://www.labour.gov.in/static/uploads/2026/01/9fb60321f0028fc2fe08d3b3d8626dd7.pdf" },
      { label: "Ministry of Labour and Employment: Additional FAQs on Labour Codes, 16 March 2026 (wage definition)", href: "https://www.labour.gov.in/static/uploads/2026/03/a4ccf4c6d97c4f1f36a6d83f8c64213d.pdf" },
      { label: "India Code: Code on Social Security, 2020", href: "https://www.indiacode.nic.in/indiacode/bitstream/123456789/16823/1/aA2020-36.pdf" },
    ]),
  ],
  "/final-pay-estimator": [
    { heading: "How the worksheet works", body: "Uses the monthly cash amount, daily-rate divisor, notice days, and unused leave days that you enter. It does not decide what an employer owes." },
    inputsAndPrivacy,
    { heading: "Reconcile the final statement", body: "Keep notice pay and leave encashment on separate lines. Compare the entered divisor and days with the contract, leave balance, applicable rules and the employer's final payroll calculation." },
    worksheetLimits,
  ],
  "/layoff-runway": [
    { heading: "How the worksheet works", body: "Divides funds that you identify as liquid by the monthly costs you enter. It predicts no future income or job-search duration." },
    inputsAndPrivacy,
    careerToolExample("layoff-runway"),
    worksheetLimits,
  ],
  "/home-loan-stress-test": [
    { heading: "How the worksheet works", body: "Calculates standard monthly EMI arithmetic at the rates and term you enter. A stressed rate is a scenario, not a prediction." },
    inputsAndPrivacy,
    careerToolExample("home-loan-stress-test"),
    worksheetLimits,
  ],
  "/resign-or-stay": [
    { heading: "How the worksheet works", body: "Displays weighted values you assign to each option. The values are not an outcome score, recommendation, or forecast." },
    inputsAndPrivacy,
    worksheetLimits,
  ],
  "/job-posting-reality-check": [genericMethod],
  "/compass": [genericMethod],
  "/salary-drop": [genericMethod],
  "/escape-plan": escapePlanChecklists(),
  "/career-reality-index": careerRealityIndexBlocks(),
  "/ai": [
    { heading: "What this tool is for", body: "Start with a specific task, then ask what is automated, who reviews the result, and who remains accountable for decisions." },
    { heading: "Method and limits", body: "The examples are not a role-level score, an exposure measurement, or a prediction about a person's employment." },
  ],
};

/**
 * Blocks for a tool route, in render order. `/salary-calculator` returns none: its
 * React page already renders the method, assumptions and source copy itself, and the
 * snapshot mirrors those sections directly.
 */
export function getToolContentBlocks(path: string): ToolContentBlock[] {
  const key = path.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  return [...(worksheetIntro[key] ?? []), ...(worksheetNotes[key] ?? [])];
}
