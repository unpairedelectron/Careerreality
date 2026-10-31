const editorial = (heading, content, sourceLinks = []) => ({ heading, content, sourceLinks });

export default {
  "read-the-offer-beyond-ctc": {
    editorialFrame: "A CTC headline is not a monthly salary. Compare the written fixed-pay terms, conditional pay, employer costs, reimbursements and deductions separately; then reconcile the first payslip with the offer. Use the ₹20 lakh example below as arithmetic, not as a promise about your own payroll.",
    lead: "",
    sections: [
      editorial("Start with the document, not the headline", `Open the signed offer and every annexure that describes compensation. Make one row for each component and copy the document’s own name, amount, payment frequency, condition and responsible entity. Keep an “unknown” column. If a recruiter says a figure is standard but the letter is silent, mark it unknown rather than silently treating it as guaranteed.

Separate recurring fixed pay from variable pay, a joining bonus, reimbursements, employer contributions and benefits that are not cash in the current month. A target bonus belongs in a scenario, not in the guaranteed total. A joining bonus may arrive early but can carry a repayment condition; check the trigger, the period, whether repayment reduces over time, and whether the clause covers resignation, termination or failure to join. Ask what happens if the employer changes the role or start date.

Employer PF is an employer cost, not take-home pay. Reimbursements may require an eligible expense and proof. Gratuity may be shown as a cost in a CTC illustration, but its presence in that headline does not make it monthly cash. The useful comparison is not “largest package wins”; it is the amount you can rely on, when it reaches you, and what obligation comes with it.`, [
        {
          url: "https://pmvbry-cdn.epfindia.gov.in/wp-content/uploads/2026/09/EPFO_Wage_Ceiling_FAQs.pdf",
          label: "EPFO: FAQs on revision of statutory wage ceiling",
          year: "2026",
        },
        {
          url: "https://www.incometaxindia.gov.in/documents/d/guest/income_tax_act_2025_as_amended_by_fa_act_2026-pdf",
          label: "Income-tax Act, 2025, as amended by Finance Act 2026",
          year: "2026",
        },
      ]),
      editorial("A repeatable offer-to-payslip method", `First, mark each component as fixed, conditional, expense-linked or employer-side. Second, map each item to the month in which it could actually be paid. Third, create two totals: a conservative case with conditional amounts set to zero, and a target case that uses only the stated target. Do not put reimbursements into either total until you know the eligible expense and process.

Next, compare the offer against your current payslip using the same time period. Annual fixed salary must be compared with annual fixed salary; a first-year bonus should not be compared with recurring pay without being labelled. Write down the deductions shown on a real payslip and ask payroll which components determine them. The offer comparison tool can show headline differences, while the CTC calculator estimates a payroll view from the assumptions you enter. Neither can interpret a clause the employer has not provided.

When the first payslip arrives, reconcile each amount against the written terms. Record a difference beside the relevant line, ask for the payroll explanation in writing, and update the model only after the explanation is clear. Keep the initial offer calculation too; it shows which assumption changed. This turns a vague feeling that “the package is lower” into a small set of answerable questions.`),
      editorial("Illustrative scenarios and common traps", `Illustrative scenario: A candidate sees a large target bonus in the offer and uses it to cover a recurring home expense. A safer comparison is to budget from fixed monthly cash, then decide what the household will do if the target is paid. This is not pessimism; it keeps a conditional amount from becoming a fixed obligation.

Illustrative scenario: Another candidate receives a joining bonus that would cover a deposit. Before relying on it, they request the repayment clause and ask whether the balance is prorated. They also check the payment date. If the bonus arrives after the deposit is due, the headline amount does not solve that timing problem.

Illustrative scenario: A first payslip has a lower in-hand amount than expected. The candidate compares the offer, payroll breakup and payslip line by line rather than assuming an error. The missing difference may be a benefit counted in CTC, a contribution, timing, or a document mismatch. The next step is to ask payroll for the component and calculation, not to change an unrelated assumption in the calculator.

Common mistakes include adding every listed benefit to cash, counting target pay as certain, overlooking a clawback, and comparing one employer’s CTC with another employer’s fixed salary. Another trap is treating a calculator output as proof of what the employer must pay. Use it to expose assumptions and prepare a focused question; the signed terms and actual payroll records govern the reconciliation.`),
      editorial("Questions to ask and records to keep", `Before accepting, ask for the component-wise compensation breakup, the variable-pay plan, the joining-bonus clause, the expected first payment date, the employer PF treatment, and the policy for expense claims. Ask which items are guaranteed in the first month and which depend on a later review or approval. If the explanation changes between recruiter and offer letter, request the corrected writing rather than relying on a call.

Keep the offer, annexures, bonus plan, joining-bonus agreement, later amendments, relevant HR emails, payslips and reimbursement records together. Do not share confidential employer material in a public portfolio or upload it to an unapproved tool. If a term affects a statutory calculation, open the matching rules-library entry and follow its dated official source; seek qualified advice for a dispute rather than inferring your contribution base from a CTC headline.

If a response is not available before your decision date, mark that item as unresolved and compare a case with it excluded. You can still make a decision, but it should be clear which uncertainty you are choosing to carry. A written list also makes follow-up more efficient: ask one question per component, name the relevant document, and record the reply beside the line it explains.

If the employer will not change a clause, you can still ask about a smaller recoverable amount, a shorter period, payment after the start date, or an exception for an employer-initiated role change. Treat these as negotiation questions, not rights that every employer must grant. Compare the final version with the first offer and save both. If the term affects a large payment or your ability to leave, get qualified advice before signing instead of relying on an informal summary.`),
      editorial("Questions people ask", `Q: Is CTC the same as take-home pay? A: No. CTC can include items that are not monthly cash, are conditional, or require an eligible expense. Reconcile the components and payroll deductions instead of applying one universal percentage.

Q: Should I count target variable pay in my budget? A: Keep it in a separate target case. Use recurring fixed cash for obligations that must be paid every month; decide in advance how you will use a bonus if it is actually earned and paid.

Q: What should I check in a joining-bonus clause? A: Read the repayment trigger, time period, amount due, any reduction over time, and the collection method. Ask how the clause applies if the start date or role changes.

Q: Why did my first payslip differ from the offer model? A: Compare payment timing and each deduction with the written breakup. Ask payroll to explain the specific line; do not assume that a modeled estimate guarantees a payroll result.

Q: Which tool should I use? A: Use the CTC calculator for an assumption-based payroll estimate and offer comparison for two headline packages. The tools help frame questions; they do not replace the offer or payslip.`, [
        { url: "/rules/employee-pf", label: "EPF statutory wage-ceiling source and limits" },
        { url: "/salary-calculator", label: "CTC calculator" },
        { url: "/offer-comparison", label: "Offer comparison" },
        { url: "/guides/runway-debt-and-big-decisions/", label: "Runway, debt and big decisions" },
      ]),
    ],
    faqs: [
      { question: "Is CTC the same as take-home pay?", answer: "No. Separate cash, conditional pay, employer costs, reimbursements and payroll deductions." },
      { question: "Should target variable pay fund monthly expenses?", answer: "Keep it out of the conservative budget until it is earned and paid." },
      { question: "What should I inspect in a joining-bonus clause?", answer: "Check triggers, repayment period, amount, any prorating and the collection process." },
      { question: "Why might my first payslip differ from a calculator?", answer: "Reconcile timing and each payroll line with the written offer; a model cannot verify missing terms." },
    ],
    nextSteps: [],
    relatedLinks: [
      { url: "/salary-calculator", label: "CTC calculator" },
      { url: "/offer-comparison", label: "Offer comparison" },
      { url: "/rules/employee-pf", label: "EPF rules and source" },
      { url: "/guides/runway-debt-and-big-decisions/", label: "Runway, debt and big decisions" },
    ],
  },
  "runway-debt-and-big-decisions": {
    editorialFrame: "A job change can look affordable in an annual package and still strain a household month by month. Put accessible cash, recurring bills, loan payments and employer-linked equity in separate columns. Then test what changes if income arrives late, falls, or stops; do not treat unvested or illiquid value as an emergency fund.",
    lead: "",
    sections: [
      editorial("Build a household picture that can answer a decision", `Begin with money that is available now: bank balances and other funds you could access without depending on an employer, a buyer or a favourable market. Keep emergency savings separate from money reserved for fees, taxes, a home payment or a family obligation. Equity awards, future bonuses and unvested benefits belong on a different page. They may matter to long-term wealth, but they cannot reliably pay next month’s bill until they are accessible and converted.

List recurring costs from recent records rather than memory. Include housing, food, transport, care responsibilities, insurance, debt payments and predictable annual bills divided into a monthly planning amount. Mark which expenses are essential, which can be paused, and which require notice to change. For each loan, keep the actual repayment schedule, rate-change conditions and any prepayment terms. Do not collapse a long-term loan into one monthly number if the rate or payment can change.

The result is not a universal affordability score. It is a map of timing and choices. If the income change happens, which bills continue, which can be renegotiated, and how many months of accessible cash remain under the assumptions you chose? The answer depends on your household, dependants, access to support and the reliability of the next income source. Write those assumptions where you can see them.`),
      editorial("Use the ₹20 lakh to ₹14 lakh example carefully", `The worked example below comes from the site’s salary-change model. It uses a ₹20 lakh current CTC, a ₹14 lakh offer, a stated variable-pay share, a ₹90,000 monthly cost baseline and a six-month buffer. Those inputs describe an illustration, not a recommended budget or a universal safety rule. If your actual fixed pay, variable share, essential costs or loan payment differs, the table is not your answer.

To adapt it, replace each input with a value from a document or a recent account record. Separate annual headline salary from monthly fixed cash. Then test the lower-income case first. Ask whether the chosen cost baseline includes annual expenses, family support and irregular bills. If the model shows a shortfall, identify the first change you could realistically make and the date you would need to make it. Avoid assuming that an expense can be cut instantly when a contract, school term or care responsibility says otherwise.

Next, rerun the comparison with variable pay at zero. If the decision still works, the plan is less dependent on a target. If it works only with a bonus, write down what happens if the payout is delayed or absent. A second version can model the target, but label it clearly. The two cases are useful precisely because they do not pretend to predict which one will occur.`),
      editorial("Loans and equity need their own decision records", `A loan changes the number of choices available after a career shock. Before a new borrowing commitment, read the sanction letter and repayment schedule, identify a rate-reset mechanism, and ask how missed or early payments are treated. Compare the obligation with essential spending, not just with a hopeful future salary. A lender’s approved amount is not a personal recommendation to borrow that amount.

Employer equity has different risks. Ask what is granted, what has vested, what remains conditional, what cash is needed to exercise, whether a sale is possible, and what happens when employment ends. Do not value an unlisted or restricted award as if it were cash in a savings account. For a household decision, show an equity-free case first. You can make a separate long-term scenario for equity, with the conditions visible.

Keep the documents that support each input. A salary letter supports one line; a bank statement supports another; the loan schedule supports a third. If a number has no document, give it a range or label it as an estimate. This is not bureaucratic work. It tells you which uncertainty deserves a conversation before the move, and which one can be revisited after a new payslip arrives.`),
      editorial("Illustrative scenarios and common mistakes", `Illustrative scenario: A worker compares a higher package with a longer commute and a larger monthly loan payment. The decision sheet includes travel cost and time as separate lines, rather than hiding them in a single “better offer” feeling. The worker can then ask whether the additional fixed cash still covers the extra commitments in a zero-variable case.

Illustrative scenario: A household sees a valuable employer equity award and considers increasing its home budget. They first build the same plan without that award. The equity remains a possible long-term outcome, not a source for the deposit or monthly payment. If the no-equity version is not workable, the household knows exactly which assumption the purchase depends on.

Illustrative scenario: Someone leaves a stable role to test a new field. They reserve accessible cash for a chosen period, list a lower-income plan, and set a date for reviewing applications and essential expenses. The review date is not a promise that a new job will arrive; it is a moment to update the decision from evidence instead of letting the experiment drift.

Common mistakes include using gross CTC as monthly money, counting unvested equity in the buffer, forgetting annual bills, treating a six-month reserve as right for every household, and assuming a loan payment will never change. Another mistake is planning only for the expected case. A simple zero-variable or delayed-income case can reveal a commitment that depends on optimism.

Review the plan with another adult who shares the obligations, if that is appropriate for your household. Challenge the timing: which bill arrives before the next expected income, which savings are already earmarked, and who can act if the main earner is unavailable? This is not a substitute for individual consent about a loan or job move. It can expose assumptions about shared money, care work and access that a single spreadsheet owner may miss. Record disagreements as open questions rather than hiding them in an average monthly-cost figure.`),
      editorial("Questions people ask", `Q: What counts as liquid money? A: Use money you can access in time for the obligation without relying on an employer, a buyer or a future market price. Keep restricted awards and unvested benefits separate.

Q: Is a six-month buffer always the correct target? A: No single period fits every household. Treat it as an example planning window, then choose a period based on obligations, income reliability, dependants and access to support.

Q: Should I include employer equity in a job-change comparison? A: Show its vesting, exercise, sale and exit conditions separately. Build a conservative decision without it before considering an upside scenario.

Q: Does the runway tool tell me whether to resign? A: No. It compares assumptions you enter; it cannot predict hiring, family events or future income. Use it to identify the next evidence you need.

Q: What should I bring to a loan review? A: Keep the sanction letter, repayment schedule, current balance and written rate-change or prepayment terms together.`, [
        { url: "/layoff-runway", label: "Layoff runway worksheet" },
        { url: "/salary-drop", label: "Salary-change model" },
        { url: "/home-loan-stress-test", label: "Home-loan stress test" },
        { url: "/guides/read-the-offer-beyond-ctc/", label: "Read the offer beyond CTC" },
      ]),
    ],
    faqs: [
      { question: "What counts as liquid money?", answer: "Count funds available when needed without relying on an employer or uncertain sale." },
      { question: "Is a six-month buffer right for everyone?", answer: "No. It is an example planning window; choose based on obligations and income reliability." },
      { question: "Should employer equity count as emergency cash?", answer: "No. Show its vesting, exercise and sale conditions separately from accessible funds." },
      { question: "Does a runway calculator decide whether I should resign?", answer: "No. It compares your assumptions and cannot predict future income or household events." },
    ],
    nextSteps: [],
    relatedLinks: [
      { url: "/layoff-runway", label: "Layoff runway worksheet" },
      { url: "/salary-drop", label: "Salary-change model" },
      { url: "/home-loan-stress-test", label: "Home-loan stress test" },
      { url: "/guides/read-the-offer-beyond-ctc/", label: "Read the offer beyond CTC" },
    ],
  },
  "independent-work-without-romanticising-it": {
    editorialFrame: "Freelancing is a change in how work is found, scoped, delivered and paid; it is not an automatic increase in freedom or income. Test a small piece of paid demand, protect the time needed to deliver it, and write down what happens if the client delays, expands the scope or does not return.",
    lead: "",
    sections: [
      editorial("Treat the first project as evidence, not a new identity", `Start with one customer problem you can solve and one deliverable you can describe without promising an outcome outside your control. “Help with marketing” is too broad to estimate. A defined deliverable, such as reviewing a set of campaign materials and returning an annotated revision, gives both sides something to inspect. The exact project is yours to choose; the principle is to make the boundary visible before work begins.

Talk to potential buyers before building a large portfolio or leaving employment. Ask what they currently do, what breaks, who approves a purchase and how a provider is selected. Listen for a real commitment: a paid pilot, a written request, or an agreed next conversation with the decision-maker. Compliments, likes and a friend’s encouragement are not the same evidence as a buyer allocating money and time. Keep each signal labelled so enthusiasm does not turn into a forecast.

Check your employment agreement and workplace policy before taking outside work. Protect employer confidential information, customer data, code, methods and equipment. The ethical boundary is not only “after office hours”; a side project can still create a conflict of interest or use restricted material. If the policy is unclear, ask the appropriate person in writing and wait for the answer before relying on the side work.`),
      editorial("Write the commercial terms before delivery begins", `A short written scope should name the deliverable, what is excluded, who supplies inputs, how feedback works, how many revision rounds are included, and when the work is accepted. Add a payment schedule that identifies the amount, due date, invoicing method and what happens when the client pauses. If the work depends on access or approval, state who is responsible for providing it and how a delay changes the timetable.

Set a change process. When a “quick” request adds a new deliverable, pause and agree on the revised scope, fee and date before doing the additional work. This is easier to do before trust and urgency are mixed together. Keep messages, approvals, invoices and delivery records in an orderly place. A verbal promise can be misunderstood by either side; a plain written recap helps make expectations testable.

Estimate the whole time cost, not only the visible production hours. Include finding the client, sales conversations, brief review, revisions, invoicing, follow-up and time spent waiting for missing inputs. Your test can be successful even if it shows that the quoted fee does not cover the time. That information is a reason to change the scope or price before scaling, not a personal failure.`),
      editorial("Plan cash gaps and delivery capacity", `An invoice is a request for payment, not money already received. Keep a record of completed work, invoice dates, expected payment dates and unresolved questions. A delayed payment can affect the next project and household budget even when the client is satisfied. Do not spend expected project income twice: once as earned money and again as a future retainer.

For a side experiment, set a weekly time ceiling and protect sleep, family duties and the responsibilities of your primary job. If the only way to meet the deadline is to use unpaid nights indefinitely, the model is not yet workable. Write a stop rule in advance: for example, stop accepting new scope when the agreed hours are used, or pause if an invoice remains disputed. The rule should protect the person doing the work as well as the client.

If demand grows, check capacity before taking more projects. A single client can provide useful first evidence but also makes income dependent on one decision-maker. Ask how repeatable the work is, whether referrals are real, and how much time new projects require. Keep personal tax, registration, insurance and contract questions separate from the career decision; they depend on facts that a career-planning worksheet does not establish.`),
      editorial("Illustrative scenarios and common mistakes", `Illustrative scenario: A designer gets a request to “make the deck better” before a client meeting. They respond with a one-page scope: the number of slides, the deadline, the source materials required and what will count as one revision. The client may decline; that answer is still useful evidence about demand and working terms.

Illustrative scenario: An analyst agrees to a small paid data-cleaning project but receives a file that includes information they are not authorised to handle. They stop, do not upload it to a personal tool, and request an approved data route. The project pauses. That pause protects both parties and reveals an operational requirement a portfolio sample would never show.

Illustrative scenario: An engineer finishes a weekend project and waits for payment longer than expected. They compare the written terms with the invoice and delivery record, send a factual reminder, and stop accepting additional work until the open invoice is resolved. They do not count the expected amount as a dependable monthly salary.

Common mistakes include doing a large unpaid sample, accepting vague deliverables, treating a verbal “yes” as a budget, leaving revision limits unstated, and pricing only for execution hours. Another mistake is assuming that several small projects prove a stable pipeline. A test should answer a narrow question about demand, payment, fit or time; it should not be forced to prove that independent work is safe for every future month.

Check how the work is obtained as well as how it is delivered. If every project came through the same person, that shows one useful channel but not whether another buyer can find you. Record the source of each lead, follow-up time, why a prospect declined, and whether the paid scope matched the original discussion. This can show whether the next experiment should improve the offer, client group or sales conversation. Keep tax or registration obligations as a separate question for a qualified adviser who knows your actual arrangement.`),
      editorial("Questions people ask", `Q: Should I quit before looking for freelance clients? A: Not necessarily. A small, policy-compliant test can reveal buyer behaviour and delivery effort before you give up recurring income.

Q: Does a positive client response prove demand? A: It is a signal, not proof of repeatable revenue. Look for a specific commitment and record the buyer, scope and payment terms.

Q: What belongs in a simple scope? A: Define the deliverable, exclusions, inputs, deadline, review rounds, fee, payment dates and the process for changes.

Q: Can I use work created for my employer as a portfolio sample? A: Do not expose confidential material or use employer resources without permission. Create a redacted or independent sample and explain its limits.

Q: How should I evaluate a side project? A: Compare the planned hours with actual sales, delivery, revision and payment time. Decide in advance what evidence would justify continuing.`, [
        { url: "/escape-plan", label: "Bounded career experiment planner" },
        { url: "/resign-or-stay", label: "Resign-or-stay worksheet" },
        { url: "/guides/getting-hired-through-evidence-and-conversations/", label: "Show work without oversharing" },
      ]),
    ],
    faqs: [
      { question: "Should I quit before testing freelance demand?", answer: "A small, policy-compliant paid test can reveal more before recurring income is replaced." },
      { question: "Does a positive response prove repeatable demand?", answer: "No. Record specific buyer commitments, scope, payment and repeat behaviour separately." },
      { question: "What belongs in a written scope?", answer: "Define deliverable, exclusions, inputs, deadline, feedback rounds, fee and change process." },
      { question: "Can I publish work made for my employer?", answer: "Protect confidential information and get permission; use an independent or approved sample." },
    ],
    nextSteps: [],
    relatedLinks: [
      { url: "/escape-plan", label: "Bounded career experiment planner" },
      { url: "/resign-or-stay", label: "Resign-or-stay worksheet" },
      { url: "/guides/getting-hired-through-evidence-and-conversations/", label: "Getting hired through evidence and conversations" },
    ],
  },
  "career-switches-and-education": {
    editorialFrame: "A course is one possible route into different work, not the outcome itself. Before paying or leaving a role, name the tasks you want to do, find out how newcomers demonstrate competence, and create a small work sample. Compare learning routes by cost, time, feedback and the evidence they leave behind.",
    lead: "",
    sections: [
      editorial("Begin with the work, then choose the learning route", `Replace a broad destination such as “move into technology” with a set of tasks you want to perform. A role title can hide very different work across employers. Read actual role descriptions, speak with people who do the work, and ask what occupies an ordinary week, which decisions are owned, and what a beginner is expected to do without supervision. Write down what you heard separately from what you inferred.

Then identify the gap between your current evidence and the task. Is the missing piece a method, a tool, a portfolio example, a recognised qualification, or access to practice? A course can help with structure and feedback. A degree can provide breadth, time and a formal credential. A small independent project can test interest and execution. An employer project can produce evidence under real constraints. None is automatically best; each solves a different problem and has a different cost.

Before choosing, define what evidence would change your mind. For a technical transition, it may be a working sample plus review from someone who understands the task. For a regulated or credential-dependent route, it may be confirmation from an official body or hiring manager that the credential is required. If the answer depends on employer practice, ask more than one practitioner and mark disagreement rather than averaging guesses.`),
      editorial("Compare the full cost and the feedback path", `List tuition, examination fees, equipment, travel, financing costs, and paid work you may give up. Include the weekly hours the programme expects and the time needed for independent practice. If you borrow, read the repayment terms and ask when payments begin. A brochure’s placement language is not the same as a guaranteed role; find the written terms and ask how outcomes are described and measured.

Inspect a sample lesson, syllabus, assessment and feedback cycle before enrolling. Ask whether projects receive substantive review, whether the instructor is available, how missing foundations are handled, and whether the schedule fits your current obligations. For peer learning, ask what participants actually produce. For a credential, verify who awards it and whether your target employers recognize it. Keep the answer in a document rather than remembering the most confident sales conversation.

A lower-cost experiment can reduce uncertainty before a larger commitment. Choose a small task that resembles the work, set a time limit and ask a practitioner to review the result. Record what felt engaging, where you needed help and whether the feedback points toward a learnable gap. The experiment cannot prove future employability, but it can test whether the next investment is aimed at a real task rather than a course catalogue.`),
      editorial("Illustrative scenarios and common mistakes", `Illustrative scenario: A support professional is considering a data course because several roles mention analytics. Before enrolling, they ask a hiring manager what a junior person would actually deliver and build a small report from public, non-sensitive data. Feedback reveals whether the gap is spreadsheet practice, problem framing or something else.

Illustrative scenario: A parent considering a full-time programme includes lost salary, care arrangements and loan repayment dates beside tuition. They ask the institution for the attendance rules, refund schedule and assessment calendar. The route may still be worthwhile, but the family is comparing the whole commitment rather than only the advertised fee.

Illustrative scenario: A graduate has completed multiple online courses but cannot explain how the learning applies to a job task. They choose one narrow project, document the question, decisions and limitations, and request feedback from someone doing the work. The next step depends on that review rather than on another certificate purchased to relieve uncertainty.

Common mistakes include buying an expensive programme before checking the target work, treating a certificate as a job guarantee, ignoring practice time, and comparing tuition while excluding foregone earnings. Another trap is calling a small experiment a failure because it did not instantly create a new job. Its purpose is to improve the next decision: continue, change learning route, ask a different question, or stop.`),
      editorial("Build a decision record before you commit", `Write a one-page comparison with three routes: current-role learning, a bounded work-sample test, and the formal course or degree. For each route, record cost, calendar time, weekly effort, feedback quality, evidence produced, prerequisites and what would make you stop. Use the same target task for every option. Otherwise the comparison may reward the route with the most persuasive brochure rather than the one that closes your actual gap.

Request the syllabus, total fee schedule, financing terms, withdrawal or refund policy, assessment rubric and an example of feedback. Ask alumni what they built and what support was available, without treating a single account as a forecast. Ask employers how they assess applicants with adjacent experience. If a qualification is legally or formally required, verify the rule through the issuing body or official source; do not infer it from an advertisement.

Set a review point before the next payment or resignation date. Bring the work sample, external feedback and a revised cost sheet. If the evidence does not support the course, pause before signing the next instalment. If it does support the route, you will know why that commitment is more useful than another credential. The goal is not to avoid risk; it is to buy learning that changes a decision.

Ask how the programme handles a learner whose schedule changes or who needs to repeat a module. A route affordable only if every class is attended and every assessment is passed on the first attempt carries a different risk from one with clear rescheduling and support terms. Include those options in the comparison rather than assuming a disruption means abandoning the route or paying the full fee again. A sound decision record names both the intended path and a practical fallback if work hours or care duties change.`),
      editorial("Questions people ask", `Q: Is a degree better than a short course? A: It depends on the target tasks, credential requirements, cost, time and feedback. Compare the evidence each route produces rather than its label.

Q: How can I test a career switch cheaply? A: Choose one representative task, make a bounded work sample and seek review from a practitioner or hiring team.

Q: Do certificates guarantee interviews? A: No. They show participation or assessment under stated terms; they do not establish fit for every employer.

Q: What should I ask a course provider? A: Request the syllabus, total costs, assessment method, feedback process, withdrawal terms and precise wording behind placement claims.

Q: When should I pause a programme? A: Revisit the decision before a new financial commitment if the instruction, feedback or work evidence does not match the promise you relied on.`, [
        { url: "/escape-plan", label: "Plan a bounded career experiment" },
        { url: "/compass", label: "Career decision compass" },
        { url: "/guides/getting-hired-through-evidence-and-conversations/", label: "Getting hired through evidence and conversations" },
      ]),
    ],
    faqs: [
      { question: "Is a degree better than a short course?", answer: "Compare credential need, task practice, feedback, total cost and time for your target work." },
      { question: "How can I test a switch before paying?", answer: "Complete one representative task and request specific feedback from a practitioner." },
      { question: "Do certificates guarantee interviews?", answer: "No. They document participation or assessment, not a hiring outcome." },
      { question: "What should I request from a course provider?", answer: "Ask for the syllabus, total fees, assessment, feedback, withdrawal terms and placement wording." },
    ],
    nextSteps: [],
    relatedLinks: [
      { url: "/escape-plan", label: "Career experiment planner" },
      { url: "/compass", label: "Career decision compass" },
      { url: "/guides/getting-hired-through-evidence-and-conversations/", label: "Getting hired through evidence and conversations" },
    ],
  },
  "getting-hired-through-evidence-and-conversations": {
    editorialFrame: "A strong interview is a clear account of what you did, how you decided, and what the evidence cannot show. Prepare a few work examples, protect confidential information, and use the conversation to test the role as well as present yourself. A portfolio, referral or polished answer can open a discussion; none guarantees a hire.",
    lead: "",
    sections: [
      editorial("Choose examples that make your contribution legible", `Select work that resembles the responsibilities in the role. For each example, write the situation, the constraint, your own contribution, the decision you made, the result you can support and one limitation. Distinguish “I” from what the team did. If several people contributed, explain the boundary rather than claiming the whole result. A hiring team needs to understand how you think, not just the scale of the project.

Prepare a short version and a longer version. The short account gives context, your decision and the evidence in a few minutes. The longer account explains alternatives, trade-offs and what you would change. Practise answering a follow-up without memorising a speech. If you do not know, say what information you would need and how you would test it. Honest uncertainty can be more useful than a confident guess presented as fact.

A portfolio is optional for many roles and must respect confidentiality. Do not publish a former employer’s data, customer details, internal screenshots or code unless you are authorised. You can create a fictionalized or public-data demonstration that shows your method, but label it clearly as an independent sample. Explain what is simulated and what was not tested so a reviewer can assess the evidence without mistaking it for production work.`),
      editorial("Ask questions that reveal the actual job", `Read the role description and mark each responsibility that is unclear. Ask the hiring team what work would occupy the first months, how priorities are set, who reviews the work, which decisions the role can make, and what happens when a deadline conflicts with quality. Ask for an example of a recent project and which parts this role owned. Specific questions surface differences between a polished description and the work a manager needs done.

Ask how success is evaluated and when feedback occurs. A vague promise to “grow quickly” is difficult to compare. A useful answer identifies the work, decision-maker, evidence and review point. If interviewers disagree, treat the mismatch as information to resolve before accepting. Ask who the direct manager is, how the team coordinates, and what support exists when requirements are incomplete.

The interview is also a chance to check fit. Notice whether your questions receive concrete answers, whether people describe the same role, and whether the process respects time and privacy. One awkward moment does not prove a team is harmful; repeated contradictions or pressure to disclose confidential information deserve follow-up. Record what happened and ask the recruiter for clarification rather than turning a single signal into a broad conclusion.`),
      editorial("Illustrative scenarios and common mistakes", `Illustrative scenario: A candidate is asked about a project with a measurable result but cannot share the client’s numbers. They explain the constraint, describe the method at a safe level, and offer a public-data sample that demonstrates the same reasoning. They do not reveal private information to appear impressive.

Illustrative scenario: Two interviewers describe different first-month responsibilities. The candidate writes a brief, neutral follow-up to the recruiter asking which scope is current and who owns each decision. The answer helps them compare the actual role; silence remains an unresolved risk rather than an invitation to assume the more attractive version.

Illustrative scenario: A candidate receives a referral but prepares no examples, expecting the introduction to carry the conversation. They instead build two concise work stories and ask the referrer which team problem led to the opening. The referral provides context; the candidate still needs to show relevant judgement and verify the role.

Common mistakes include presenting team outcomes as solely personal, over-polishing a story until it sounds memorised, sharing confidential material, and treating every question as a test with one hidden correct answer. A pile of certificates is not a substitute for explaining decisions. Another trap is asking only about salary before understanding the components and responsibilities; pay matters, but so do reporting line, location, hours, review process and written terms.`),
      editorial("From interview to offer: preserve the details", `After a useful conversation, write down the role scope, manager, location, work schedule, decision authority, review criteria and open questions. If a recruiter provides a new promise, ask for it in the written offer or relevant policy. Compare the offer line by line rather than relying on memory of a verbal explanation. Use the offer-comparison tool for headline amounts, then inspect variable-pay conditions, joining bonus and the terms that affect actual cash.

Before sharing a reference or work sample, confirm what the other person may disclose and what material is safe to send. Keep a copy of the final version you submitted and the date. If a company requests personal data, ask why it is needed, who will receive it and how it will be handled. Never send credentials, confidential work or private records through an unapproved channel.

A rejection does not tell you exactly why the decision was made. If appropriate, ask for one specific area to improve and record whether the response is actionable. Do not turn one outcome into a verdict about your ability or the whole market. Review your examples and questions against the next role, keeping only feedback that is concrete enough to change your preparation.

Before sharing a reference contact’s details, ask whether that person is comfortable being contacted and which projects they can discuss. Send the role description and a brief reminder of the work you did together, but do not script an endorsement. If the hiring process asks for references unusually early, clarify the stage and how the information will be used before sharing someone else’s details. This respects the reference’s time and reduces the risk that an outdated or misunderstood example becomes the only account the hiring team receives.`),
      editorial("Questions people ask", `Q: Do I need a public portfolio? A: Not always. Use a relevant work example, a safe redacted sample or a private explanation that respects confidentiality.

Q: How many interview stories should I prepare? A: Prepare a small set that covers different kinds of work and can be explained with your contribution, decision, evidence and limitation.

Q: What if I do not know an interview answer? A: State what you do know, identify the missing information and describe a responsible way to test the question.

Q: What should I ask the hiring team? A: Clarify actual tasks, decision rights, manager, success evidence, feedback timing and the terms that will appear in writing.

Q: Does a referral guarantee a job? A: No. It can create a conversation; the team still evaluates the role match and the candidate still needs to review the offer.`, [
        { url: "/offer-comparison", label: "Compare written offer amounts" },
        { url: "/compass", label: "Career decision compass" },
        { url: "/guides/read-the-offer-beyond-ctc/", label: "Read the offer beyond CTC" },
      ]),
    ],
    faqs: [
      { question: "Do I need a public portfolio?", answer: "No. Use relevant examples while protecting confidential and personal information." },
      { question: "What if I do not know an interview answer?", answer: "Name what is missing and explain how you would verify or test it." },
      { question: "What should I ask the hiring team?", answer: "Clarify tasks, decision rights, manager, review evidence and written terms." },
      { question: "Does a referral guarantee a job?", answer: "No. It may open a conversation but does not replace role evaluation." },
    ],
    nextSteps: [],
    relatedLinks: [
      { url: "/offer-comparison", label: "Offer comparison" },
      { url: "/compass", label: "Career decision compass" },
      { url: "/guides/read-the-offer-beyond-ctc/", label: "Read the offer beyond CTC" },
    ],
  },
  "performance-reviews-and-career-choices": {
    editorialFrame: "A promotion decision is easier to evaluate when the scope, decision-maker and evidence are explicit. Do not reduce readiness to a rating or title. Ask what work would demonstrate the next level, who will review it, what support is available, and when the decision will be revisited.",
    lead: "",
    sections: [
      editorial("Translate a broad promise into observable work", `“Show more leadership” or “operate at the next level” is not yet a plan. Ask what decisions you would own, which people or systems depend on those decisions, and how the work differs from your current responsibilities. Seek examples of outputs rather than a personality description. The aim is not to turn every part of a job into a score; it is to make expectations discussable before a review period passes.

Ask who decides, who provides evidence, and who can approve the change. A manager may collect examples but lack authority over a level or budget. A promotion committee may consider scope, sustained outcomes, peer feedback or business need. These processes differ by employer. Do not assume that one positive review guarantees a title change or that a delay proves your work is poor. Ask what the decision process is at your workplace and request the current written criteria.

Agree on a review point and what evidence will be available then. Examples might include a decision record, customer outcome, operational change, mentoring commitment or work delivered through others. Choose evidence that fits the role, not an impressive metric that distorts the work. If the expectation changes, note the change and ask how that affects the review date. A fair comparison requires stable criteria or a written explanation for a change.`),
      editorial("Build a record that reflects contribution and limits", `Keep a compact log of work that mattered: the problem, constraint, your role, the action, the result you can support, and who else contributed. Include work that prevented a failure or reduced uncertainty, not only visible launches. Record trade-offs and follow-up work; a polished outcome without context can hide the effort or the cost. Use documents you are authorised to retain and avoid copying confidential information into personal storage.

At a regular check-in, bring two or three examples and ask which expectation they demonstrate. If the manager sees a gap, ask for one concrete example of the missing behaviour and a chance to practise it. Translate broad feedback into an observable next step and a date. If feedback concerns a dependency outside your control, record who owns the dependency and what support is needed. This makes a review about work conditions as well as personal effort.

Ask for feedback before the formal cycle. A review is a poor time to learn that the evidence was considered incomplete. Request a short check-in after a meaningful assignment or decision. If your manager cannot provide a path, ask what alternative work or role could build the needed scope. Keep the answer factual. You are gathering evidence about the current path, not demanding that a manager promise an outcome they cannot control.`),
      editorial("Compare staying, changing scope and changing employers", `A career choice can include staying in the current role, asking for a different assignment, moving to another team, shifting between manager and individual-contributor work, or applying outside. Compare options using the same questions: What work will I do? Which decisions will I own? Who will support the transition? What evidence will I gain? What are the written pay, schedule and location terms? A title alone answers none of these.

Consider the cost of delay and the cost of leaving. If the current role offers useful scope but has an unclear review process, a time-bounded experiment may be reasonable. If the work repeatedly grows without authority, support or recognition, record those patterns and discuss boundaries. An external offer can reveal a different scope, but it also has a manager, workload, probation terms and expectations that need checking. Use the offer-comparison tool for written compensation, not as a judgement of career quality.

Choose a date to review evidence rather than waiting indefinitely. Decide what would make the current path more credible: a written scope, a sponsor, a review date, a project or a clear answer about decision rights. Also decide what would cause you to change course. A trigger is not a prediction; it is a way to avoid moving the goalposts each time you feel uncertain.`),
      editorial("Illustrative scenarios and common mistakes", `Illustrative scenario: An analyst is asked to demonstrate “strategic thinking” but receives only routine reporting. They ask the manager for one decision the team needs help with, agree on a bounded analysis, and request feedback from the person who will use it. This creates evidence and tests whether the role can provide the promised scope.

Illustrative scenario: A manager is considering an individual-contributor path. They ask which technical decisions the role would own, how influence is measured without direct reports, and what support exists for deep work. They compare the answers with an external role instead of assuming that management is the only form of progression.

Illustrative scenario: A review is delayed because a project dependency changed. The employee records the dependency, asks which work can still be evaluated, and agrees on a revised date. If the criteria also change, they request an explanation in writing. The record helps separate a changing business condition from an unspoken judgement about readiness.

Common mistakes include treating one rating as a complete career forecast, assuming good work automatically produces promotion, and accepting a vague promise without decision-maker or date. Another mistake is logging only wins while omitting constraints and team contributions. A third is using a new title to avoid asking about authority, workload or pay. Keep the evidence honest, include the conditions under which it was produced, and do not claim results that others delivered.

Ask whether review criteria are applied consistently across people doing comparable work, and how the record can be corrected if it contains a factual mistake. Do not infer bias, or its absence, from one rating alone. If a review includes an inaccurate statement, point to the specific project record and ask for a correction or response path. Keep your account, the manager’s feedback and the employer’s final decision distinct. That gives you a clearer basis for deciding whether to keep building scope there or take your evidence elsewhere.`),
      editorial("Questions people ask", `Q: Does a strong review guarantee promotion? A: Not necessarily. Ask how decisions are made, who approves them, and what evidence is considered.

Q: What should I ask before accepting expanded responsibility? A: Clarify decision rights, workload, support, compensation review and the date when scope will be assessed.

Q: How do I document work without exposing company information? A: Keep authorised records and describe your contribution at a safe level; do not copy confidential material into a personal portfolio.

Q: Is moving to management the only progression path? A: No. Ask what individual-contributor scope exists and how technical or specialist decisions are recognised at your employer.

Q: When should I revisit the decision to stay? A: Set a date and identify evidence that would change your view, such as clear criteria, a project, support or a written scope.`, [
        { url: "/compass", label: "Career decision compass" },
        { url: "/resign-or-stay", label: "Resign-or-stay worksheet" },
        { url: "/offer-comparison", label: "Compare written offer amounts" },
        { url: "/guides/getting-hired-through-evidence-and-conversations/", label: "Getting hired through evidence and conversations" },
      ]),
    ],
    faqs: [
      { question: "Does a strong review guarantee promotion?", answer: "No. Ask who decides, what criteria apply and what evidence will be reviewed." },
      { question: "What should I clarify before accepting more scope?", answer: "Confirm decisions, workload, support, compensation review and reassessment date." },
      { question: "Is management the only progression path?", answer: "No. Ask about specialist or individual-contributor scope at your employer." },
      { question: "How do I keep a useful work record?", answer: "Record your role, constraints and supported outcomes without copying confidential information." },
    ],
    nextSteps: [],
    relatedLinks: [
      { url: "/compass", label: "Career decision compass" },
      { url: "/resign-or-stay", label: "Resign-or-stay worksheet" },
      { url: "/offer-comparison", label: "Offer comparison" },
      { url: "/guides/getting-hired-through-evidence-and-conversations/", label: "Getting hired through evidence and conversations" },
    ],
  },
};
