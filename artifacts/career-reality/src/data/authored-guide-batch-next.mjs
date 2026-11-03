const editorial = (heading, content, sourceLinks = []) => ({ heading, content, sourceLinks });
const incomeTaxResidence = {
  url: "https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/non-resident",
  label: "Income Tax Department — Non-resident and tax-residency guidance",
  year: "2026",
};

export default {
  "engineering-careers-without-the-title-trap": {
    dateModified: "2026-10-31",
    keepDecisionSupport: true,
    editorialFrame: "Choose an engineering path by the decisions you can own and the consequences you can manage, not by whether the title says individual contributor or manager. Compare scope, authority, mentoring and operational work in the actual role.",
    sections: [
      editorial("Compare the work, not the ladder", `An individual-contributor path can include architecture, technical direction, mentoring and coordination without owning performance reviews. A management path adds responsibility for people, priorities and team conditions, but may reduce time spent building. Neither label tells you how much influence a person has: one company may give a staff engineer broad design authority, while another reserves consequential decisions for a manager or committee.

Write down the work you want to do repeatedly. Separate technical depth, cross-team influence, coaching, hiring, planning and incident response. Put each on a page beside the work you would prefer to do less often. This is more useful than asking whether you are “technical enough” to manage or “leadership material” to stay an engineer. Your answer can change as the work and responsibilities change.`),
      editorial("Trace authority and accountability", `For a recent project, note who framed the problem, chose the design, approved the risk, coordinated dependencies and handled the result. Then ask which of those decisions the proposed role will own. If accountability expands but approval remains elsewhere, the role may involve influence without formal authority; that can be satisfying, but it should be named and supported rather than sold as control.

Ask for one concrete example of a decision made by someone at the level you are considering. Who could disagree, what evidence mattered, and who resolved the conflict? Ask how the organization recognizes prevention, maintenance and technical mentoring, which are less visible than a launch. Request the role expectations or level guide and compare its examples with actual recent work, not a title borrowed from another employer.`),
      editorial("Illustrative scenarios and common traps", `Illustrative scenario: An engineer enjoys design reviews and coaching but does not want staffing and performance conversations to dominate the week. They ask to see a senior individual contributor’s calendar and decision record, then request a scoped project that tests the path before changing roles.

Illustrative scenario: A new technical lead is expected to own reliability but cannot approve capacity or change a dependency. They document the escalation path and ask the manager who can commit the resources. The answer distinguishes a supported leadership role from responsibility without a route to act.

Illustrative scenario: A manager misses hands-on coding and considers returning to an IC role. They compare the tasks they miss with the actual level expectations, including mentoring and cross-team work, rather than assuming an IC role means solitary implementation. A title change is not itself evidence of a better fit.`),
      editorial("Make the decision test practical", `Before accepting a path, ask how success is assessed, who provides feedback, what authority comes with the scope, and how operational load is shared. Keep a short record of commitments: named decisions, partners, mentoring expectations, on-call duties and review date. After a bounded project, compare the planned work with the work that actually occupied your time. If the role requires influence, look for access to decision-makers and a way to resolve blocked work.

Do not treat a promotion rubric as a promise that a particular person will be promoted. Use it to identify evidence the employer values, then ask who applies it and when. A useful next step is a written role conversation that names both what you want to own and what support you need. The career experiment planner can help bound the time for gathering examples; its hours do not measure readiness.`),
      editorial("Questions to ask and records to keep", `Ask for the level expectations, a recent example of role-sized work, decision rights, mentoring expectations and the team's approach to incidents. Keep project briefs, design decisions, feedback and examples of work that changed after review. Exclude confidential code and customer details from any sample you share. When a title and the written responsibilities disagree, ask for the responsibilities to be clarified before treating the label as a commitment.`),
      editorial("Review the path after real work", `At the end of a project, compare the decisions you actually made with the level description. Which choices were yours, which required approval, and which consequences did you manage? Ask a peer to identify a decision you handled well and one area where you needed support. Keep the feedback tied to an observable example so that “leadership” does not become a vague personality judgement.

If the path still looks right, ask for a next assignment that stretches one dimension at a time: a larger system boundary, a mentoring responsibility or a planning decision. Do not accept every kind of extra work at once just to demonstrate ambition. A bounded increase makes it easier to see whether the organization provides authority, time and recognition alongside responsibility. If the role changes but the expected reward does not, ask how the discrepancy will be reviewed and by whom.`),
      editorial("Prepare for a level conversation", `Bring two examples: one that shows the scope you already own and one where another person or system constrained the outcome. For each, explain the context, your decision, the result and what you would do differently. Ask the manager which expectation remains unmet and what evidence would change that assessment. A clear answer lets you decide whether the gap is learnable, dependent on opportunity or outside your control.

Agree on a follow-up date and the work that can reasonably produce the evidence. Record who will review it and how the result will be considered. If the criteria change later, ask what changed and why. This is not a guarantee of promotion; it is a way to make career development less dependent on informal signals and a title that may mean something different elsewhere.`),
    ],
    faqs: [
      { question: "Does management mean less technical work?", answer: "Often the mix changes, but the actual calendar and expectations vary by employer." },
      { question: "Can an IC lead without managing people?", answer: "Yes; verify the role's decision rights, recognition and cross-team support." },
      { question: "What if accountability exceeds authority?", answer: "Ask who can approve resources and how blocked decisions are escalated." },
      { question: "How do I test a path before switching?", answer: "Take a bounded project and compare its real tasks with the written expectations." },
    ],
    relatedLinks: [
      { url: "/career-reality-index", label: "Career decision compass" },
      { url: "/escape-plan", label: "Career experiment planner" },
    ],
  },
  "ai-at-work-questions-to-ask": {
    dateModified: "2026-10-31",
    keepDecisionSupport: true,
    editorialFrame: "Decide what to learn by examining a real workflow: which task changes, how the output is checked, what information may be exposed and who remains answerable. A tool demonstration is not evidence that an entire job will disappear or improve.",
    sections: [
      editorial("Start with a task map", `Choose one recurring piece of work rather than asking whether a whole occupation is “safe.” Write down the request, inputs, decisions, output, reviewer and consequence of an error. Mark which steps require context, permission, negotiation or judgement. This shows where a tool might help and where human review remains essential. Keep the current method as a baseline so the comparison does not confuse novelty with improvement.

Test only material you are allowed to use. Before pasting work into a service, ask the employer which tools are approved, what data may be entered and how outputs are stored or reused. A task involving customer records, confidential plans or personal data needs a privacy review before a productivity experiment. Do not copy sensitive material into a personal account to make a test convenient.`),
      editorial("Measure quality as well as speed", `Define what a good result means before testing: completeness, correctness, tone, traceable sources, accessibility or fewer handoffs. Use the same kind of task for the current workflow and the assisted workflow. Record review time, rework, omissions and the kinds of errors a reviewer caught. A faster first draft can still take longer overall if verification is heavy or if mistakes are difficult to detect.

Ask who signs off on the output and what happens when the system is wrong. If the person using the tool remains responsible, the workflow must leave time and access for meaningful review. Ask whether the organization has an escalation process and how it handles disputed outputs. A course is worth considering when it teaches a capability tied to your work, such as evaluation, data handling or domain judgement; a certificate alone does not show that you can safely perform a task.`),
      editorial("Illustrative scenarios and common traps", `Illustrative scenario: A support worker tests a draft-response assistant on approved, non-sensitive examples. They compare factual errors, tone and editing time with the existing template, then ask a supervisor whether the remaining review can fit into the queue.

Illustrative scenario: An analyst is asked to summarize internal customer feedback with a public tool. They pause and ask for an approved environment rather than removing names and assuming the remaining details are harmless. The delay reveals a governance question the team needs to answer before adoption.

Illustrative scenario: A designer uses generation for early options but finds that the client still needs a human to check brand rules, licensing and production constraints. They choose to learn the review and handoff skills rather than presenting a generated draft as finished work.

Common mistakes include treating a demo as a measured result, comparing different tasks, counting output volume but not rework, and assuming that a tool's confident tone proves accuracy.`),
      editorial("Choose an upskilling experiment", `Ask your manager which task the team expects to change, what quality standard will remain, and who owns review. Select one safe task, agree on the comparison criteria and record the result with limitations. If the tool improves a narrow step, learn how to supervise that step; if it creates extra checking, investigate evaluation or process design. If the result is inconclusive, keep the uncertainty visible rather than buying a course to feel prepared.

Keep a dated note of the workflow, allowed inputs, test method, reviewer feedback and unresolved risks. Do not put employer material in a public portfolio. For a shareable sample, build a synthetic example and label the limits. The AI task prompts can help generate questions, while an experiment planner can bound your practice time; neither predicts demand for a particular role.`),
      editorial("Questions to ask and evidence to retain", `Ask what information is prohibited, which tool is approved, what output needs human sign-off, how errors are reported and whether the task definition is changing. Keep only records allowed by your employer's policy. A useful learning plan connects one skill to an observable work sample and a reviewer who can assess it. Revisit the decision if the task, policy or accountability changes; do not infer a career outcome from general headlines.`),
      editorial("Decide whether more learning is worth it", `After the experiment, sort what you observed into tool capability, workflow fit, quality risk and skill gap. If the tool handled a narrow step but needed careful checking, the next useful skill may be evaluation rather than prompt writing. If the workflow is blocked by permissions or missing data, training alone will not fix it. Ask the person responsible for the process which change is possible and what evidence they would accept.

Set a stop condition as carefully as a success condition. Stop if approved access is unavailable, sensitive inputs cannot be protected, errors cannot be caught in time or review responsibility is unclear. A decision to pause is useful evidence about the operating environment. Keep a short record of the task and method without retaining prohibited data; that record can guide a later discussion without exposing the work.`),
      editorial("Discuss the workflow with your team", `Ask colleagues who receive the output what makes it usable and what they currently correct. Ask the person accountable for the final result which errors are unacceptable and how they are discovered. These conversations can reveal that the main bottleneck is unclear instructions, missing context or an overloaded reviewer rather than slow drafting. Do not promise a speed gain until the complete workflow has been observed.

If the process changes, update the task map and get approval for the new handling of information. Keep a version note so that a later reviewer can distinguish the tested process from an earlier one. A result from one task or team should not be generalized to a different workload without checking the inputs and standards again.`),
    ],
    faqs: [
      { question: "Will AI replace my role?", answer: "A task test cannot predict a role outcome; inspect the work and employer decisions directly." },
      { question: "What should I learn first?", answer: "Choose a skill tied to a real task, a review standard and an allowed workflow." },
      { question: "Can I test with work data?", answer: "Only when the employer approves the tool and the information for that use." },
      { question: "How do I judge a tool's result?", answer: "Compare quality, errors and review effort with the existing process." },
    ],
    relatedLinks: [
      { url: "/ai", label: "AI task prompts" },
      { url: "/escape-plan", label: "Bounded learning experiment" },
    ],
  },
  "data-science-career-claims": {
    dateModified: "2026-10-31",
    keepDecisionSupport: true,
    editorialFrame: "A data-science title does not reveal the daily work. Ask what a junior person will clean, measure, explain or maintain, and use a reproducible sample to show how you reason rather than claiming expertise from a polished chart.",
    sections: [
      editorial("Translate the title into tasks", `Read several role descriptions and highlight verbs: collect, clean, validate, query, model, explain, deploy or monitor. Separate required work from preferred tools and broad team aspirations. Then ask a hiring manager which deliverable a new teammate would be expected to complete first. If the answer is only a list of software names, ask what decision the work supports and who uses the result.

“Data scientist” can describe work ranging from reporting and data quality to experimentation or production modelling. Do not assume one employer's title defines the field. A junior role may involve substantial preparation, documentation and communication before any complex model. That is not a lesser career; it is part of making evidence usable. The task fit matters more than whether a description sounds advanced.`),
      editorial("Build a sample that can be checked", `Choose a dataset you may lawfully share, or create synthetic data. State the question, the source, the transformations, missing values, assumptions and limits. Show a simple baseline before a more complex technique. Explain how you checked whether the result changes under a different reasonable choice. A reviewer should be able to follow the path from input to conclusion without trusting a screenshot.

Keep analysis separate from recommendation. A correlation or pattern may support a question, not a causal claim. Show who might be absent from the data and what decision the analysis cannot settle. If you use a chart, label units and population and provide a text explanation. A clean notebook or short memo can demonstrate care more effectively than extra charts that obscure the reasoning.`),
      editorial("Illustrative scenarios and common traps", `Illustrative scenario: A graduate is told that a junior role needs “machine learning.” They ask for the first project's deliverable and learn it involves reconciling inconsistent operational records. They make a small validation sample before buying an advanced course.

Illustrative scenario: An applicant shares a dashboard built from public data. The interviewer asks why a category is missing. The applicant points to the cleaning note, explains the choice and names an alternative check. The limitation becomes evidence of method, not an embarrassment to hide.

Illustrative scenario: A team advertises ownership of models but the manager describes mostly recurring reports. The applicant asks whether the role can change the source data and how the team reviews model performance. They compare the answer with their interests instead of accepting the title as a promise.

Common mistakes include copying a tutorial without explaining decisions, using sensitive employer data in a portfolio, reporting a metric without its denominator, and treating a tool list as the job.`),
      editorial("Verify hiring evidence before acting", `For each claim about entry-level hiring, note who made it, what roles and employers it covers, when it was observed and how “junior” is defined. A single listing can describe one opening, not demand across a market. Compare the claim with current role descriptions and conversations with practitioners; record disagreements rather than blending them into a false average.

Ask about onboarding, review of analysis, access to data, production responsibility and how success is assessed. Keep the exact vacancy, questions, sample and feedback together so you can refine your next application. The compass can help reflect on role fit; the offer tool can compare written amounts later. Neither turns an unsupported market statement into a reliable benchmark.`),
      editorial("Questions and documents", `Request the role brief, a first-project example, the team's review process and any portfolio rules. Ask whether the work is exploratory, operational or customer-facing and how data access is approved. Keep a version of your sample, readme and feedback. If the employer uses a take-home exercise, clarify expected time, ownership and whether the work will be used. Do not provide unpaid production work on an unclear brief.`),
      editorial("Turn feedback into a next step", `Read reviewer comments beside the exact part of the analysis they concern. Separate a method issue from a communication issue, and ask for an example when feedback is broad. Revise one part of the sample and note what changed. This makes a second conversation more specific than asking whether the portfolio is “good.” If a reviewer cannot assess the topic, look for someone with relevant experience rather than collecting more general praise.

For interviews, explain why you selected a method, what alternatives you considered and what additional data could change the conclusion. Be ready to describe a failed check and how you responded. These details show working habits without claiming that a small project proves production experience. If a hiring process asks for a substantial assignment, clarify scope and ownership before investing significant time.`),
      editorial("Evaluate the role after the interview", `After a conversation, write down the actual task described and compare it with the job post. Note which skills the manager expects on entry, what can be learned with support and how the first work will be reviewed. If the account differs materially from the listing, ask for an updated description before deciding. An interview impression is useful, but a specific role conversation is stronger evidence than an attractive title.

Also decide whether the conditions suit your learning style. Some people want frequent review; others need uninterrupted analysis or customer contact. Ask how feedback arrives and how much context the team shares. This does not create a perfect forecast, but it helps you choose a role with eyes open rather than treating every offer in the field as equivalent.`),
    ],
    faqs: [
      { question: "Does a data-science title guarantee modelling work?", answer: "No; ask about recurring tasks and the first deliverable." },
      { question: "What makes a useful junior portfolio?", answer: "A reproducible sample with context, checks, limitations and clear writing." },
      { question: "Should I learn every tool in a listing?", answer: "Prioritize the task and foundational method; ask which tools are used day to day." },
      { question: "Can I publish workplace analysis?", answer: "Only with permission; otherwise make a separate sample from public or synthetic data." },
    ],
    relatedLinks: [
      { url: "/career-reality-index", label: "Career decision compass" },
      { url: "/offer-comparison", label: "Compare written offers" },
    ],
  },
  "cybersecurity-and-green-work": {
    dateModified: "2026-10-31",
    keepDecisionSupport: true,
    editorialFrame: "Cybersecurity and environmental work are broad labels, not guaranteed routes into stable jobs. Verify the actual tasks, entry requirements, funding and authority in a specific role before investing in a credential or treating a sector headline as a personal forecast.",
    sections: [
      editorial("Separate field language from the job", `Cybersecurity work may centre on monitoring, identity, risk, response, product security, audit or policy. Environmental roles can involve measurement, operations, engineering, reporting, procurement or community work. The labels overlap, but the daily tasks and required evidence differ. Start with a specific vacancy or employer project and identify what someone must deliver, who uses it and what mistakes would matter.

Ask whether a credential is legally required, preferred by that employer, or merely common in a course advertisement. Find the issuing body and assessment format before paying. A certificate may structure learning but cannot substitute for supervised practice, access to appropriate systems or a role that lets you use the skill. For any claim of impact, ask what is measured and who verifies it.`),
      editorial("Check the evidence behind opportunity claims", `When a report says a field is growing, inspect its date, geography, occupation definition and method. Employment projections, vacancies, training enrolments and investment are different measures. A global trend cannot tell an applicant how many suitable openings exist near them or whether a specific employer has budget to hire. Keep each source attached to the claim it actually supports and preserve its stated limits.

Talk to people in different functions, not only recruiters selling a course. Ask what work consumes an ordinary week, how newcomers are trained, what decisions they can make and what makes someone effective. If answers vary, note which employer or role they describe. That variation is information: a sector label hides different operating models.`),
      editorial("Illustrative scenarios and common traps", `Illustrative scenario: An IT support worker sees a security certificate advertised as a direct route into a security job. They inspect local role descriptions and find that the desired work also expects incident documentation and access-control judgement. They practise those tasks in a permitted lab before paying for an additional course.

Illustrative scenario: An engineer is attracted to a sustainability role because the mission sounds meaningful. They ask what data is measured, who owns the operational change and how results are checked. The answers reveal whether the work is technical delivery, reporting or stakeholder coordination.

Illustrative scenario: A job post claims a role will “protect the environment” but does not explain the project or authority. The candidate asks for the team's deliverables and funding source. They keep the mission statement separate from evidence about day-to-day work.

Do not confuse a compelling cause with a funded role, or a fast-growing label with an easy entry point.`),
      editorial("Run a low-risk role test", `Choose one task from a real vacancy and create a small artifact using public or approved material. For security, that might be a threat-model note or a clear incident timeline; for environmental work, it could be a transparent measurement plan with assumptions stated. Ask a practitioner to critique accuracy, ethics and practical usefulness. The goal is to identify a learning gap, not to claim professional authority from a short exercise.

Compare the time and cost of a course with the evidence it produces, the quality of feedback and whether target employers recognize it. Keep a record of unanswered questions about safety, data access, field conditions or travel. If a claim cannot be verified, remove it from your decision rather than replacing it with confidence. A bounded experiment planner can help manage the research time; it cannot forecast vacancies.`),
      editorial("Questions and documents to request", `Ask who funds the role, which tasks are performed by a new hire, what training is available, what credential is required and who signs off on risk or impact claims. Request the role brief, relevant policy or project description, and the assessment criteria. For a technical or field role, ask about safe access, supervision and the boundary of your responsibility. Keep official evidence distinct from employer marketing.`),
      editorial("Check whether the role can support the work", `For security, ask whether the person doing analysis can raise a finding without being asked to approve their own work, and how urgent concerns reach someone with authority. For environmental work, ask who maintains the measurement process and what happens when results do not support the preferred story. These questions concern the operating design, not whether colleagues are well-intentioned.

When a course or employer advertises impact, ask what artifact a learner or new hire will actually produce. Look for assessment that tests judgement and clear documentation rather than attendance alone. If access to equipment, field sites or restricted systems is required, verify how it is supervised before starting. Keep your personal experiment small enough that a missing permission or resource does not create pressure to work around a safety rule.`),
      editorial("Compare alternatives without overclaiming", `Look at adjacent roles that use some of the same skills: risk analysis, quality, compliance, energy operations, data stewardship or environmental measurement. A neighbouring role may provide relevant experience, but do not describe it as equivalent to the target job unless the tasks match. Write down which capabilities transfer and which still need supervised practice.

When you speak with a practitioner, ask what a newcomer did that made the team trust their work. Ask about documentation, review and mistakes, not only tools. If the answer depends on a formal credential, verify the requirement directly with an official body or employer. Preserve the source and wording so that a course's sales claim does not become a fact in your own career plan.`),
    ],
    faqs: [
      { question: "Are these fields guaranteed career paths?", answer: "No; verify a specific role, employer, requirement and funding." },
      { question: "Should I buy a certificate first?", answer: "Check whether target employers require it and what practice it includes." },
      { question: "Can a global growth report predict local hiring?", answer: "Not by itself; inspect its geography, definitions and measurement." },
      { question: "What can I test before switching?", answer: "Build a small, safe work sample and get feedback from a practitioner." },
    ],
    relatedLinks: [
      { url: "/career-reality-index", label: "Career decision compass" },
      { url: "/escape-plan", label: "Plan a bounded experiment" },
    ],
  },
  "layoff-recovery-and-employment-documents": {
    keepDecisionSupport: true,
    dateModified: "2026-11-03",
    editorialFrame: "After a layoff, first separate confirmed pay, unresolved amounts, documents and next decisions. This guide organizes records and follow-up; for a focused breakdown of severance, notice pay, leave, and deductions, see the final-pay guide. Reconcile each item against the contract and employer records; general guidance cannot determine your individual entitlement or guarantee a recovery timeline.",
    sections: [
      editorial("Make a dated record before chasing answers", `Save the termination notice, offer and amendments, recent payslips, leave balance, benefits statements, tax records and messages about the end date. Keep original files and note when each was received. Do not forward confidential company material to a personal portfolio. If access is being removed, ask which permitted records you may retain and where employment documents will be delivered.

Build a reconciliation sheet with one row per expected item: salary through the last working date, approved expenses, leave treatment, incentive terms, deductions and any amount the employer says is pending. Mark each as confirmed, disputed or unknown. Do not merge a statutory or contractual question into a single net figure. The final-pay estimator can help organize supported inputs, but it cannot decide whether an employer's figure is legally correct.`),
      editorial("Ask for the calculation, not just the total", `Request an itemized statement showing the period, component, basis and payment timing. Compare the statement with the written terms and your own records. If a figure differs, point to the exact line and ask which document or policy explains it. A calm written question makes the disagreement easier to track and gives the employer a chance to correct a clerical mismatch.

For leave encashment or gratuity questions, open the relevant rules-library page and read the linked official source and scope notes. Eligibility and wage definitions depend on facts; do not assume a calculator output establishes them. If the issue remains material or contested, speak with a qualified adviser who can review the actual contract and employment details.` , [
        { url: "/rules/leave-encashment", label: "Leave encashment rules and source" },
        { url: "/rules/gratuity-wages", label: "Gratuity wage rules and source" },
      ]),
      editorial("Illustrative scenarios and common mistakes", `Illustrative scenario: A worker receives a final statement that omits an approved expense. They attach the approval and receipt, ask payroll to confirm whether the claim missed the cutoff, and keep the reply with the statement.

Illustrative scenario: Someone is unsure whether a leave balance will be paid. They preserve the policy version that applied, request the calculation basis and review the rules-library source before treating the amount as available cash.

Illustrative scenario: A former employee is asked to sign a broad acknowledgment while still waiting for a breakdown. They ask what the signature confirms, request a copy and seek qualified advice if the wording could waive a disputed claim.

Common mistakes include budgeting on an unconfirmed incentive, deleting work records before saving allowed documents, relying on a verbal date, and treating a generic severance story as an individual rule.`),
      editorial("Plan the first weeks without promising an outcome", `Separate cash already received from expected amounts and the household runway. The site model can show a lower-income scenario, but use your real fixed costs and accessible funds. Prioritize immediate administrative actions: update contact details for documents, confirm benefit end dates with the provider, and make a list of people who can provide references. Do not assume a future job arrives on a chosen schedule.

For the search, select a manageable next action: describe the work you want, update one sample, contact a specific person or review a suitable role. A pause may be necessary for health, care or family responsibilities. Keep uncertainty visible and revisit the plan as written evidence arrives. A timeline is a tool for organizing actions, not a prediction of how quickly recovery will happen.`),
      editorial("Questions and documents to keep", `Ask when final pay will be processed, how each component was calculated, whether any item is pending approval, how to obtain employment letters and whom to contact about benefits. Retain the notice, contract, payslips, statements, leave records and written replies in a private location. For disputed pay, use official sources and qualified advice; do not publish employer documents or another person's private details.`),
      editorial("Organize follow-up without losing the record", `Keep a contact log with the date, department, question, document supplied and promised response. If you send a follow-up, refer to the earlier message and repeat the specific item still open. Avoid sending a full personal history when a single payslip or clause answers the question. Store identity and bank details only through the employer's approved channel, not in a public post or unapproved form.

Ask for employment verification documents in a way that states the recipient, purpose and preferred delivery method. Save the response and check names, dates and role descriptions before sharing the document with another party. If something is wrong, request a correction and retain both versions. A tidy record helps with future applications and reduces repeated requests; it does not require you to disclose sensitive circumstances in a public explanation of the layoff.`),
      editorial("Protect cash decisions from uncertainty", `Make a household list that separates cash already received, amounts with a confirmed date and items still being reviewed. Use the salary-change example only to test a lower-income scenario after replacing its assumptions; do not insert a disputed final-pay amount as guaranteed savings. If an expense or debt payment is due before an answer arrives, ask the provider about available options rather than waiting on an unconfirmed employer promise.

A layoff can also affect routines and confidence. Choose an immediate next action that is small enough to complete, such as requesting one document or contacting one reference. Avoid comparing your timeline with a stranger's story online. Recovery depends on circumstances that this guide cannot know. Revisit the plan when the employer responds or your cash position changes.`),
    ],
    faqs: [
      { question: "Does a final-pay worksheet decide what I am owed?", answer: "No; it organizes inputs and cannot determine contractual or statutory eligibility." },
      { question: "What should I ask payroll for?", answer: "Request an itemized calculation, the basis for each line and expected timing." },
      { question: "Can I count an expected incentive as cash?", answer: "Keep it separate until the written terms and payment are confirmed." },
      { question: "Where can I check leave or gratuity questions?", answer: "Use the linked rules-library entry and its dated official source, then seek advice for disputes." },
    ],
    relatedLinks: [
      { url: "/final-pay-estimator", label: "Final-pay estimator" },
      { url: "/layoff-runway", label: "Layoff runway planner" },
      { url: "/rules/leave-encashment", label: "Leave encashment rules" },
      { url: "/rules/gratuity-wages", label: "Gratuity wage rules" },
      { url: "/guides/severance-notice-leave-after-layoff", label: "Break down final-pay items" },
    ],
  },
  "notice-period-and-return-to-office": {
    keepDecisionSupport: true,
    dateModified: "2026-11-03",
    editorialFrame: "Before resigning or changing work location, read the operative written terms for notice, buyout, leave, attendance and exit documents. This guide covers the broader exit and location terms; for the specific approval, calculation, and timing of a notice buyout, see the buyout guide. Ask the employer to resolve conflicts in writing; a general guide cannot interpret your individual contract.",
    sections: [
      editorial("Collect the documents that control your decision", `Put the signed offer, later amendments, current employment policy, location letter and relevant written instructions together. Note which version is current and who issued it. A company announcement can describe a broad direction while the individual terms or a later agreement set details for a particular role. Do not assume a conversation has changed a written condition unless the employer confirms it through the proper process.

For notice, identify the required notice, who can approve a shorter period, whether pay in lieu is available, how leave is treated and when the final date is confirmed. These terms can vary by contract and circumstance. Ask for a calculation showing the dates and components rather than applying an informal rule found online. Link questions about leave payment to the dated rules-library page, not an unsupported formula.` , [
        { url: "/rules/leave-encashment", label: "Leave encashment rules and source" },
      ]),
      editorial("Clarify location and return-to-office terms", `Ask which work location is recorded, what attendance is expected, how exceptions are requested and who approves them. If a move affects travel, care or expenses, explain the practical constraint and ask whether the employer has a written process. Keep the request factual and avoid assuming that one team's practice applies to another role.

Before submitting notice, ask how handover, equipment return, access closure and employment letters are sequenced. Request the expected date and recipient for the relieving or experience document. If a new employer needs proof of release, confirm what interim document is acceptable. Keep each response with the relevant policy version so a later change can be traced.`),
      editorial("Illustrative scenarios and common mistakes", `Illustrative scenario: An employee's manager says unused leave will reduce notice, but HR's written policy is unclear. The employee asks which clause applies, requests a date calculation and avoids booking a start date until the employer confirms the last working day.

Illustrative scenario: A team announces more office attendance while a worker's offer records another location. They ask whether the change is a policy expectation or an amendment to the individual arrangement, and who can approve an exception.

Illustrative scenario: A new employer asks for a relieving letter before the former employer issues it. The worker asks HR for a dated status note and checks whether the new employer will accept that interim record.

Common mistakes include resigning on a verbal promise, counting unapproved leave as notice credit, assuming a buyout is automatic, and treating an online sample letter as legal advice.`),
      editorial("Use a written exit checklist", `Create a table with the question, controlling document, person responsible, requested answer, date and status. Include final date, salary cutoff, leave, variable pay, expenses, equipment, benefits and letters. Separate what is confirmed from what you hope will happen. The final-pay estimator can organize leave and pay inputs that you have verified; it does not interpret a disputed term or guarantee a payment.

If dates conflict, write a concise note quoting the relevant clause and asking the employer to confirm the operative date. Save the reply and any revised document. If the answer affects a large amount or a planned start date and remains unresolved, seek qualified advice before making an irreversible commitment. A careful record protects both clarity and your ability to explain the sequence later.`),
      editorial("Questions and records to request", `Ask for current notice terms, leave treatment, buyout approval, work-location expectations, final-pay timing and the process for employment letters. Keep a copy of your resignation, acknowledgement, handover, asset return and written confirmations. Read the rules-library source for statutory leave questions, but do not apply a general page as a conclusion about a specific employment arrangement.`),
      editorial("Check timing before making a dependent commitment", `Write down each date that another decision relies on: proposed start date, expected release, final-pay processing, equipment return and delivery of letters. Mark which dates are confirmed and which are estimates. If a new employer, landlord or travel booking depends on the release date, ask what alternative proof is acceptable when the final document is delayed. Do not promise a date that the current employer has not confirmed.

When a policy changes during notice, preserve the prior version and ask which version governs your case. Request a written explanation of any revised calculation. If the answer changes a significant payment or creates a dispute, pause before signing an acknowledgement that could be read more broadly than intended and obtain qualified advice. A calendar can expose a conflict early, but only the employer's operative written response can settle its administrative schedule.`),
      editorial("Keep the handover proportionate", `List the work that must be handed over, the records the employer requires and the person receiving each item. Clarify whether the handover changes your final date or only describes work during the existing notice. Do not keep customer data, code or internal files as personal evidence. Ask how to document work you may discuss later without retaining restricted material.

If you need a reference, ask who can provide it and what details they are comfortable confirming. Keep the request separate from a disagreement about pay or leave. A professional handover can help colleagues while preserving your own boundaries; it does not require agreeing with every calculation or waiving a question. Keep separate records for operational transition and any unresolved employment terms.`),
    ],
    faqs: [
      { question: "Can unused leave automatically shorten notice?", answer: "Check the contract and current policy; obtain written approval for any adjustment." },
      { question: "Is a verbal last date enough?", answer: "Ask HR to confirm the date and calculation in writing." },
      { question: "Does the estimator decide my leave entitlement?", answer: "No; enter verified inputs and check the linked official rules." },
      { question: "What if the new employer needs a relieving letter?", answer: "Ask the former employer for a status note and confirm acceptable interim proof." },
    ],
    relatedLinks: [
      { url: "/final-pay-estimator", label: "Final-pay estimator" },
      { url: "/rules/leave-encashment", label: "Leave encashment rules" },
      { url: "/resign-or-stay", label: "Resign-or-stay worksheet" },
      { url: "/guides/notice-period-buyout-india", label: "Check notice buyout terms" },
    ],
  },
  "cross-border-and-remote-pay": {
    dateModified: "2026-10-31",
    keepDecisionSupport: true,
    editorialFrame: "Compare a remote or cross-border offer only after identifying who employs you, where you will work, what currency the contract uses and which obligations require qualified tax advice. A converted headline is not a net-pay estimate.",
    sections: [
      editorial("Identify the actual arrangement", `Start with the contract, not the job-board label “remote.” Ask which legal entity signs, whether you are an employee or contractor, where services are performed, which currency and pay period apply, and who handles payroll and benefits. A company headquartered abroad can hire through a local entity, use an intermediary or contract directly; those arrangements are not interchangeable. Get the proposed structure in writing before comparing totals.

Record residence and work location separately. A temporary trip, a move, a permanent home and a payroll location may raise different questions. Do not guess how a tax treaty, withholding rule or employment law applies to your facts. Ask the employer which adviser can explain the arrangement, and consult a qualified professional for your own residency, filing and cross-border obligations. This guide does not calculate a personal tax result.`, [incomeTaxResidence]),
      editorial("Normalize the offer before comparing", `Create separate lines for gross compensation, currency, pay frequency, payment date, variable terms, benefits, employer contributions, insurance, expenses and fees you may carry yourself. Note who bears exchange conversion costs and which rate or date is used if a payment is converted. A spot conversion of a headline does not account for changes in rates, deductions or benefits. Keep a same-currency view before considering any conversion.

Use the offer-comparison tool only with amounts that share a currency and period. Its headline comparison cannot model a foreign payroll, worker classification or personal tax. The tax-regime comparison has its own eligibility and input limits; it is not a cross-border calculator. A useful table labels each missing item as unknown rather than turning an incomplete offer into a precise-looking take-home figure.`),
      editorial("Illustrative scenarios and common traps", `Illustrative scenario: A worker is offered compensation in a foreign currency but lives and works in India. They ask which entity pays, whether the contract is employment or services, what benefits apply and how conversion is handled before comparing the figure with a local offer.

Illustrative scenario: A remote employee is planning to move after starting. They ask the employer whether payroll and benefits can continue from the new location, then seek advice on the consequences before buying a ticket or ending a lease.

Illustrative scenario: A contractor sees a larger gross amount than an employee offer. They list unpaid leave, insurance, equipment, invoicing gaps and professional costs separately instead of assuming the difference is spendable income.

Common traps include converting one headline with today's rate, comparing monthly net with annual gross, treating a contractor as an employee because the work feels integrated, and assuming the employer has handled the worker's personal filings.`),
      editorial("Ask before accepting", `Request the draft contract, employing entity, classification, currency, pay calendar, benefit summary, expense policy, termination terms and the name of the payroll contact. Ask who can confirm tax withholding and what happens if location or residence changes. If two documents conflict, ask for a corrected version rather than choosing the more favourable sentence.

For your comparison, show a conservative case with variable pay excluded and costs visible. Mark estimates as estimates. Ask a qualified adviser to review the contract and relevant location facts; bring the written offer and your actual circumstances, not a screenshot of a salary converter. Revisit the calculation if entity, work location, currency or classification changes. The tool can compare selected figures, but it cannot resolve those missing facts.`),
      editorial("Keep the comparison auditable", `Save the offer version, benefit schedule, written answers, conversion assumptions and advice you receive. Keep personal tax documents private and do not paste them into unapproved services. If the employer changes the employing entity or payment route, check whether benefits, deductions or responsibilities also change. A short record of assumptions makes later payslips easier to reconcile and prevents a market headline from becoming a promise about your own net pay.`),
      editorial("Treat uncertainty as a decision input", `Make a list of what is known, what the employer has promised in writing and what remains dependent on a future answer. Build a conservative view using only confirmed compensation and leave uncertain benefits outside it. That does not mean rejecting the opportunity; it shows what you would be relying on if an estimate changes. Ask the employer to identify the contact who can explain payroll and the process for correcting an error.

If advice differs, compare the facts each adviser assumed rather than choosing the answer that produces the larger net figure. A change in residence, employment status or work location can change the question itself. Keep the contract and factual timeline available for a qualified adviser, and revisit the comparison when a material fact changes. The site calculator is useful only within its stated inputs; a confident numerical output cannot fill missing legal or tax facts.`),
      editorial("Ask for a complete payment calendar", `Request the regular pay date, first expected payment, invoice or payroll cutoff, treatment of holidays and the process for correcting a missed transfer. Ask whether benefits begin on the same date as salary and whether any waiting period or employee contribution applies. These details affect planning even when the annual amount appears clear.

Build a month-by-month view using confirmed dates and mark uncertain items visibly. Keep an emergency plan that does not depend on an assumed exchange rate or a client paying early. If the arrangement is contractor-based, include time for invoicing and follow-up. This does not predict the actual conversion or tax result; it reveals timing questions to settle before relying on the income.`),
    ],
    faqs: [
      { question: "Is remote gross pay the same as take-home?", answer: "No; entity, status, location, currency and deductions matter." },
      { question: "Can I compare salaries after a quick currency conversion?", answer: "Use the conversion only as a labelled estimate, not a net-pay result." },
      { question: "Who should answer personal tax questions?", answer: "A qualified adviser who can review your actual residence and contract facts." },
      { question: "Does the site tax tool handle foreign payroll?", answer: "No; its stated inputs and eligibility limits do not establish cross-border tax." },
    ],
    relatedLinks: [
      { url: "/offer-comparison", label: "Compare written offers" },
      { url: "/salary-calculator", label: "Estimate an Indian payroll scenario" },
      { url: "/tax-regime-comparison", label: "Review tax-tool scope" },
    ],
  },
  "senior-engineering-and-operations-work": {
    dateModified: "2026-10-31",
    keepDecisionSupport: true,
    editorialFrame: "Assess a senior engineering or operations role by the systems it owns, the incidents it must absorb, its authority to prevent recurrence and the time left for deep work. Salary or title alone cannot show whether the operating model is sustainable.",
    sections: [
      editorial("Map planned work against interruption work", `Ask how the team divides feature delivery, maintenance, customer escalation, incident response and follow-up. Request an example of a recent incident review and how its actions were assigned. If the role includes on-call duty, ask who shares the rotation, how escalation works, what backup exists and how interrupted work is rescheduled. Avoid accepting “we all pitch in” as a complete description of coverage.

Compare the responsibility to change a system with the authority to do so. A senior engineer who is accountable for reliability may still need another team to approve a dependency change or provide capacity. That can be workable if the route is clear. Ask who owns the decision, how competing priorities are resolved and whether recurring causes are funded for remediation. Repeated incidents without a path to fix them are a property of the system, not an individual's failure to care enough.`),
      editorial("Protect depth and recovery", `Ask what uninterrupted time looks like in practice and how incident work affects commitments. Deep work is not simply a calendar preference when the role must investigate complex failures or design durable changes. Ask how the manager distinguishes urgent work from work that can wait and who communicates a revised plan to partners.

Clarify how recovery after difficult operations periods is handled. Do not assume a particular schedule or policy; ask the team to describe its actual practice and check any written terms. For senior roles, mentoring, reviews and coordination may also consume time. Ask which responsibilities are expected every week and which arise only during an event. The answer helps you compare real capacity rather than imagine that every responsibility fits into a normal sprint.`),
      editorial("Illustrative scenarios and common traps", `Illustrative scenario: A candidate is told that the team values reliability but cannot get a clear answer about incident follow-up. They ask who approves corrective work and whether an engineer can show an example of a change made after a review.

Illustrative scenario: An experienced engineer likes difficult operations work but wants less chronic interruption. They compare the rotation, staffing and rescheduling practice with their own constraints instead of treating fatigue as proof they lack commitment.

Illustrative scenario: A new senior hire is accountable for service quality but lacks access to the teams that own key dependencies. They ask for an escalation route and a first-quarter decision they would be empowered to make.

Common mistakes include treating “high ownership” as a support plan, confusing incident volume with impact, and assuming that compensation compensates for an undefined on-call burden.`),
      editorial("Make the role test observable", `Use a recent system change or incident as a case study. Trace detection, response, decision authority, communication, recovery and follow-up. Ask what the role would have changed and which partners it could call on. If access is restricted, accept a high-level explanation; do not ask for confidential logs. Compare the answer with the written responsibility and escalation expectations.

Before accepting, agree on the scope, shared coverage, success measures and review cadence. During the first project, track planned work displaced by interruptions and note whether follow-up actions received owners. A bounded experiment can help you examine the role, but hours spent are not a measure of seniority. Keep examples of your own contribution private unless the employer approves a sanitized account.`),
      editorial("Questions and documents to request", `Ask for the on-call description, incident process, escalation map, role expectations, maintenance allocation and how operational work appears in review. Request a conversation with a likely peer as well as the manager. Keep notes of specific examples, not confidential technical details. If duties sound broader than decision rights, ask who can approve changes and what happens when priorities conflict before you accept the accountability.`),
      editorial("Watch what happens after an incident", `A blameless discussion is not enough by itself; ask whether findings lead to owners, dates and follow-up capacity. Notice whether corrective work is postponed repeatedly and whether the same failure mode returns. If you join, track one improvement from observation through approval and completion. This is a practical way to learn whether senior operations work has the authority and staffing described during hiring.

When evaluating a current role, distinguish a difficult event from a pattern. Note how often interruption work displaces planned work, who communicates the trade-off and whether recovery time is respected. Share concerns through the team's established process, not by publishing internal incident material. If responsibility remains high while the route to reduce risk is blocked, document the dependency and ask the manager to make ownership explicit.`),
      editorial("Separate leadership from constant availability", `Senior work can include coaching, design review, stakeholder explanation and long-term system care. Ask how those responsibilities are prioritized when an incident arrives. If the answer is that everything remains urgent, ask who can reset commitments and how the role is protected from becoming the default owner for every unresolved problem.

During a peer conversation, ask what work the person stopped doing after moving into the role. Their answer may show the real trade-off more clearly than a list of responsibilities. Clarify which tasks are shared, which are temporary and which are part of the ongoing role. A title that implies influence should come with access to the people and forums where operational priorities are decided.`),
    ],
    faqs: [
      { question: "Does a senior title guarantee decision authority?", answer: "No; ask who approves consequential changes and how blocked work is escalated." },
      { question: "What should I ask about on-call work?", answer: "Clarify coverage, escalation, follow-up ownership and rescheduling of interrupted work." },
      { question: "How can I assess deep-work capacity?", answer: "Ask for a recent week and how urgent work changed planned commitments." },
      { question: "Should I accept reliability accountability without control?", answer: "First identify the resources and decision path that make the responsibility actionable." },
    ],
    relatedLinks: [
      { url: "/career-reality-index", label: "Career decision compass" },
      { url: "/resign-or-stay", label: "Compare staying and moving" },
      { url: "/escape-plan", label: "Plan a bounded role investigation" },
    ],
  },
  "skills-passion-and-career-constraints": {
    keepDecisionSupport: true,
    dateModified: "2026-11-03",
    editorialFrame: "A useful career experiment fits the time, money and responsibilities you actually have. This guide helps shape an experiment around those constraints; if you are deciding whether to pay for a course or credential, see the education-route guide. Start with a task you want to try, then choose the smallest learning step that can produce evidence without pretending that interest alone guarantees a job.",
    sections: [
      editorial("Separate interest from evidence and feasibility", `Write three separate notes: work that holds your attention, skills you can demonstrate, and conditions the next step must fit. The lists may overlap, but they answer different questions. Enjoying a topic does not prove there are suitable roles nearby; having a skill does not mean you want to use it every day. Treat each as a hypothesis that can be tested.

Name a specific task instead of a broad field. “Work in design” could mean research, interaction, visual systems, accessibility or coordination. Look at real descriptions and ask practitioners what occupies their week. Then identify what is missing: foundational knowledge, practice, feedback, access, a credential or simply a clearer view of the work. Do not purchase a course until you know which gap it is meant to close.`),
      editorial("Design around real constraints", `Put available weekly time beside work hours, travel, care responsibilities, rest and any fixed commitments. Include the full cost: fees, equipment, connectivity, travel and income you might give up. If the experiment only works by borrowing money or losing sleep indefinitely, reduce its size. Constraints are part of the design, not evidence that you lack ambition.

Choose a small artifact: a written analysis, prototype, lesson plan, repair, public-data project or supervised work sample that reflects the target task. Set a finish condition and identify a reviewer. A certificate can document completion; it does not automatically show judgement or fit. Ask how the learning route handles feedback and whether the output can be reviewed by someone who understands the work.`),
      editorial("Illustrative scenarios and common traps", `Illustrative scenario: A parent wants to move into data work but has short study windows. They choose one small analysis using public data and ask a practitioner for feedback before enrolling in a long program.

Illustrative scenario: A worker is passionate about a cause but finds the target role requires frequent travel that conflicts with current care duties. They ask about adjacent roles and actual travel expectations rather than treating the conflict as a personal flaw.

Illustrative scenario: A learner has completed multiple courses but has no work sample. They stop adding credentials temporarily and use their next study block to build one artifact that demonstrates a task.

Common mistakes include making a plan that assumes perfect weeks, counting spent hours as progress, and treating a course purchase as a decision already made. A smaller plan that produces feedback can be more informative than an ambitious plan abandoned halfway.`),
      editorial("Set a review rule before starting", `Write what evidence would make you continue, change direction or pause. A useful review considers the quality of the work, feedback, energy, cost and whether the next step is possible within your constraints. Set a spending ceiling and choose a review date that does not depend on a predicted hiring outcome. If feedback says the work needs a different foundation, adapt the experiment instead of protecting the original plan.

Keep interest and employability questions separate: “Would I enjoy doing this?” is not the same as “Can I show the task?” or “Can I afford this route now?” The career experiment planner calculates planned hours from the inputs you choose; it cannot decide whether the hours fit your life. Revisit the plan when responsibilities change and count rest and care as legitimate needs.`),
      editorial("Questions and records", `Ask practitioners about the task, feedback standards and entry evidence. Keep the brief, version of your sample, reviewer comments, time actually spent and costs. Before paying, save the syllabus, refund terms, schedule and credential description. If a route needs a formal qualification, verify that requirement with an official body or target employer. Do not use motivational claims as a substitute for a clear next step.`),
      editorial("Make the plan resilient to an ordinary week", `Choose a minimum version of the experiment that can continue when work or care needs increase. That may mean fewer sessions, a smaller sample or a later review date. Decide what can be paused without penalty and which costs are refundable before enrolling. If another person shares the time or financial impact, discuss the commitment rather than assuming their availability.

At review, compare planned hours with hours actually available and identify what displaced them. Do not respond to a missed week by doubling the next one automatically. Reduce scope, seek different feedback or pause. The aim is to learn about the work while protecting current responsibilities. A feasible experiment can still return a negative answer; discovering that a route does not fit now is a valid result, not wasted effort.`),
      editorial("Choose a decision you can change", `Before starting, identify the point at which you would need to make a larger commitment: paying tuition, changing shifts, reducing paid hours or accepting a new role. Do not let a small experiment silently become that commitment. Ask what evidence is needed at the decision point and who can provide it. If the answer depends on a future opening, keep the opening as unknown rather than treating interest as an offer.

Record the opportunity cost in plain language. What will receive less time while you learn? What support would make the trade-off manageable? A plan is not realistic because the spreadsheet adds up; it is realistic when the people and obligations affected can accommodate it. Reassess when the trade-off changes, not only when the study window ends.`),
    ],
    faqs: [
      { question: "Should I choose passion or employability?", answer: "Keep interest, evidence and financial feasibility as separate parts of the decision." },
      { question: "How large should a first experiment be?", answer: "Small enough to finish within your real time and money limits." },
      { question: "Does completing a course prove I can do the job?", answer: "No; create a relevant sample and seek feedback on the work itself." },
      { question: "What if my available time changes?", answer: "Reduce or pause the experiment and update the review rule rather than forcing an unsafe schedule." },
    ],
    relatedLinks: [
      { url: "/career-reality-index", label: "Career decision compass" },
      { url: "/escape-plan", label: "Career experiment planner" },
      { url: "/resign-or-stay", label: "Review a stay-or-move decision" },
      { url: "/guides/career-switches-and-education", label: "Compare education routes" },
    ],
  },
  "culture-fit-and-product-management": {
    dateModified: "2026-10-31",
    keepDecisionSupport: true,
    editorialFrame: "Test a product role by the decisions it owns, the evidence that changes priorities and the relationships that make delivery possible. Replace vague culture-fit claims with observable practices instead of trying to guess whether you resemble the team.",
    sections: [
      editorial("Make product work concrete", `Ask what the role will decide and what it will influence without controlling. Product work can involve customer discovery, prioritization, writing, coordination, measurement and trade-offs; a title does not guarantee authority over each. Ask for a recent example where evidence changed a roadmap or a planned release. Who raised the evidence, who could disagree and who made the final decision?

Clarify the partnership with design, engineering, support and commercial teams. Ask who owns technical quality, what happens when delivery capacity conflicts with a requested date, and how decisions are recorded. A product manager can be accountable for clarity without having direct authority over every contributor. The role is more workable when escalation and trade-offs are understood, not hidden behind “influence.”`),
      editorial("Replace culture-fit with work practices", `“Culture fit” may refer to real norms, but it can also reward similarity or comfort without explaining the job. Ask behavior-based questions: how feedback is given, what happens when estimates change, how disagreement is handled and how priorities are revisited. Request examples rather than adjectives such as “fast,” “collaborative” or “low ego.”

Use comparable questions with the manager and a prospective peer. Differences can reveal that people experience the same team differently; they are not a reason to assume one person is dishonest. Ask about onboarding, meeting load, written decision records and how mistakes are reviewed. A team that can describe a difficult trade-off clearly gives you more evidence than a polished mission statement.`),
      editorial("Illustrative scenarios and common traps", `Illustrative scenario: An engineer considering product management asks how a recent feature was prioritized. The manager describes customer evidence and delivery constraints; a peer describes who resolved the final trade-off. The candidate compares both accounts with the role's stated authority.

Illustrative scenario: A team says it values disagreement, but interviewers cannot describe how dissent changes a decision. The candidate asks for an example involving a missed assumption and notes the response without assigning a score to the team.

Illustrative scenario: A prestigious product title comes with unclear ownership of metrics and delivery. The applicant asks who sets the goal, who can stop a launch and who explains a change to customers before accepting.

Common mistakes include equating prestige with influence, treating “fit” as a personality test, and assuming a product manager controls every technical or commercial decision.`),
      editorial("Evaluate the operating model", `Make a small decision map: problem framing, evidence, priority, trade-off, approval and communication. Ask which part the role owns and which partner can block or change it. Clarify how a new priority affects work already promised. A well-described process will not eliminate conflict, but it can show how the team handles it.

Write down the questions that remain unanswered and ask who can answer each one. A bounded role investigation can include reading a product brief, speaking with a peer and reflecting on one observed decision; it should not require unpaid work that the employer may use. Keep the notes factual and private. If the role's authority remains vague, compare it with what you want to own before letting a strong title settle the decision.`),
      editorial("Questions to ask", `Ask what the role decides, which evidence guides priorities, how engineering trade-offs are resolved, what success means and how the team handles a missed assumption. Request the role description and an example of its decision process. Ask for a peer conversation and use the same prompts with each person. Do not ask candidates to disclose confidential product plans; a high-level description of practices is enough.`),
      editorial("Compare promises with the work sample", `If the hiring process includes a product exercise, ask what the reviewer will assess, the expected effort and whether the scenario is fictional. Use the assignment to show problem framing, trade-offs and communication rather than proposing a large roadmap from limited information. State which facts you would need before making a real decision. Acknowledging uncertainty is more credible than inventing user research.

After conversations, compare the manager's account with the peer's example. Differences may point to role ambiguity, a recent change or distinct responsibilities; ask a follow-up before drawing a conclusion. Record what evidence would matter to you: access to users, a clear escalation path, defined success measures or authority to sequence work. If the role cannot describe these, decide whether you are willing to accept the ambiguity instead of assuming it will resolve itself.`),
      editorial("Set expectations for the first assignment", `Ask what decisions the first assignment can make, what information is available and how success will be reviewed. A new product manager may need to learn users, systems and constraints before changing priorities. Agreeing on a learning period prevents early activity from being mistaken for impact. Ask who will provide context and when you can revisit the scope.

If stakeholders disagree, find out who resolves the conflict and how the decision is communicated. A role with no escalation path can spend its time collecting opinions without moving work forward. Ask whether the manager expects written recommendations, facilitated decisions or direct ownership. These are different styles of work; clarify which is expected rather than trying to infer it from a title or interview exercise.`),
    ],
    faqs: [
      { question: "Does a product manager own the roadmap?", answer: "Ask who proposes, approves and communicates priorities in that organization." },
      { question: "How can I assess culture fit fairly?", answer: "Ask about observable practices instead of similarity, style or personality." },
      { question: "What should I ask a product peer?", answer: "Request a recent decision example and how disagreement affected the outcome." },
      { question: "Does a product title guarantee authority?", answer: "No; clarify decision rights, escalation and partner responsibilities." },
    ],
    relatedLinks: [
      { url: "/career-reality-index", label: "Career decision compass" },
      { url: "/resign-or-stay", label: "Compare role options" },
      { url: "/escape-plan", label: "Plan a bounded role test" },
    ],
  },
  "workplace-culture-and-boundaries": {
    dateModified: "2026-10-31",
    keepDecisionSupport: true,
    editorialFrame: "Assess culture through repeated evidence about workload, disagreement and boundaries. One joke, one intense week or one polished interview cannot establish how a team will treat people across ordinary work.",
    sections: [
      editorial("Look for patterns rather than a single signal", `Notice how people respond when someone asks for clarification, names a risk or says a deadline is not feasible. Does the discussion stay on the work, or does it become personal? Are jokes reciprocal, and can someone opt out without becoming the next joke? A single moment deserves context; a repeated pattern across settings is stronger evidence.

Ask more than one person how urgent work is assigned, how after-hours messages are treated and what happens when a commitment must move. Compare interview answers with public role expectations and your own observations, but do not assume that an interview can reveal everything. Different functions may experience workload differently. Note who spoke, what they described and what remains unknown rather than turning impressions into a numerical rating.`),
      editorial("Clarify boundaries in the actual role", `Ask about core hours, escalation, customer coverage, leave handoffs, meeting expectations and how workload is raised. “Flexible” can mean useful control or continual availability; ask for a concrete example of how a boundary was handled. If the work crosses time zones or involves incidents, ask which coverage is planned and who shares it.

Think about your own non-negotiables before the conversation. You do not need to disclose private health or family information to ask how scheduling works. State the practical condition you need and ask whether the role can support it. If the answer is vague, identify what document or person could clarify. Do not rely on a promise from someone who cannot approve the arrangement.`),
      editorial("Illustrative scenarios and common traps", `Illustrative scenario: An interviewer makes a joke about late-night work. The candidate does not infer the entire culture from one remark, but asks how the team handles after-hours requests and whether the coverage is shared.

Illustrative scenario: A hiring manager says the team is “like a family.” The applicant asks how feedback, disagreements and missed deadlines are handled. The answer gives more useful evidence than the metaphor.

Illustrative scenario: A worker sees the same colleague repeatedly praised for being available at all hours. They ask how the team protects planned time and how urgent work is distinguished from avoidable planning gaps.

Common mistakes include treating one anecdote as proof, accepting “everyone is passionate” as a workload policy, and assuming a stated boundary is enforceable without knowing who supports it.`),
      editorial("Use a private evidence log", `After each conversation or observation, write the date, setting, exact behavior and alternative explanations. Keep it private; do not record other people's personal details or confidential company information. Compare what different people say about the same practice. If accounts conflict, ask a neutral follow-up rather than selecting the answer that best matches your hope.

Before accepting, restate any arrangement that matters to you and ask the responsible person to confirm it in writing. During the role, review whether the observed pattern matches the agreement. If it does not, consider a safe conversation, documentation or qualified support appropriate to the situation. The resign-or-stay worksheet can organize a decision, but it cannot score a workplace or make a safety judgement for you.`),
      editorial("Questions and records", `Ask how workload is reprioritized, how after-hours contact is handled, how leave is covered and whether people can challenge a deadline. Keep role terms, location expectations and approved arrangements. Avoid secretly collecting sensitive material. If behavior raises a serious concern, use appropriate internal or external support rather than treating this guide as an investigation or legal remedy.`),
      editorial("Use a safe, proportionate response", `When a concern arises, write down what you observed, the date, the work impact and the action you took. Keep the note factual and stored privately. If you choose to raise it, ask a specific question about the practice or requested change rather than making a broad claim about someone's character. Consider who has authority to respond and whether an internal channel is appropriate for the concern.

If the issue involves safety, harassment or retaliation, ordinary interview questions may not be enough; seek appropriate support and review the relevant workplace process. Do not share another person's details or internal records publicly. When deciding whether to stay, change teams or leave, consider immediate safety and financial constraints alongside culture observations. A worksheet can organize trade-offs but cannot determine the safest action for your circumstances.`),
      editorial("Notice the difference between policy and practice", `A written policy can describe a formal process while daily habits reveal whether people can use it. Ask how requests are handled when a deadline is close, a manager is unavailable or a team is short-staffed. Look for examples across more than one person and context. Do not assume that a policy is meaningless because one person ignored it, but do not assume that a policy is followed because it exists.

If you are already employed, choose a low-risk way to clarify expectations: ask where an urgent request should go or how to reschedule committed work. Observe the response and whether it is consistent later. This is not a secret test of coworkers; it is a way to understand the system you rely on. Keep notes factual and avoid turning a few observations into a public rating of individuals.`),
    ],
    faqs: [
      { question: "Does one bad joke prove a toxic culture?", answer: "It is a signal to examine, not a complete description; look for patterns and response." },
      { question: "How can I ask about workload?", answer: "Request a recent example of reprioritization, urgent coverage and leave handoff." },
      { question: "Should I share private reasons for a boundary?", answer: "You can ask about the work condition without disclosing personal details." },
      { question: "Can the worksheet rate a company culture?", answer: "No; it helps organize your evidence and questions, not produce a culture score." },
    ],
    relatedLinks: [
      { url: "/career-reality-index", label: "Career decision compass" },
      { url: "/resign-or-stay", label: "Resign-or-stay worksheet" },
      { url: "/escape-plan", label: "Plan a bounded conversation" },
    ],
  },
  "how-to-read-salary-and-hiring-claims": {
    dateModified: "2026-10-31",
    keepDecisionSupport: true,
    editorialFrame: "Read a salary or hiring claim by checking its source, date, level, location, sample and definition. Keep market context separate from a written offer and never turn a headline into a personal pay promise.",
    sections: [
      editorial("Build a claim record", `Copy the exact wording and save the original source. Record who published it, when the data was collected, when the page was updated, which workers or employers are included and what the number means. A salary figure might describe base pay, total compensation, an advertised range or a self-reported amount. A hiring claim might count postings, survey responses, planned roles or completed hires. Those are different objects.

Check whether the source links to its method and sample. Look for exclusions, geography, job level, currency, time period and how duplicate postings are treated. If the article repeats a number but not the underlying research, trace it back. A company announcement can accurately describe that company's plan without establishing what the whole market will do.`),
      editorial("Check comparability before interpreting", `Compare like with like: role family, seniority, location, pay period, currency and whether the figure is base or CTC. If the source groups very different occupations, its average may not describe the role you are considering. If the sample is self-selected or limited to one employer, keep that boundary visible. Do not derive an individual probability from a sector total.

For salary, request a component-wise written offer and compare its defined amounts with your own current terms. The site's offer tool compares inputs; it does not verify a market benchmark or determine what an employer must pay. For hiring, look at current vacancies and ask what tasks the role covers. A count is a prompt for questions, not evidence that you personally can secure a specific role.`),
      editorial("Illustrative scenarios and common traps", `Illustrative scenario: A social post says salaries rose sharply but links only to a summary. The reader searches for the original report, finds no sample or pay definition and records the claim as unverified rather than using it in a negotiation.

Illustrative scenario: A headline reports many openings across a broad technology category. An applicant checks the location and seniority mix, then compares the roles with their own skills instead of dividing the total by all job seekers.

Illustrative scenario: Two offers display similar annual totals, but one includes variable pay and employer costs. The candidate asks for the breakup and uses the comparison tool only after entering comparable definitions.

Common errors include comparing gross with net, mixing old and current periods, quoting a range midpoint as an entitlement, and treating a forecast as completed hiring.`),
      editorial("Keep a source trail", `Use a small table with claim, source, publication and data dates, population, definition, caveat and your confidence. If a field is missing, write “not stated.” Check whether an update changed the underlying data or only the page text. Prefer primary reports or official datasets for factual claims, while recognizing that primary status does not make every conclusion universal.

Before repeating a statistic in a portfolio, interview or negotiation, verify that its wording matches the source and retain the link and capture date. If the source disappears, do not invent a replacement citation. Ask the employer for role-specific evidence and use the written offer for your own decision. A claim that cannot be scoped should remain a question, not a number presented as fact.`),
      editorial("Questions to ask", `Ask who was counted, when data were collected, how “salary,” “job” or “growth” was defined, which locations and levels are included and what the source leaves out. For an offer, ask which components are guaranteed and how variable amounts are treated. Keep the original report, not only a social summary, alongside your comparison notes.`),
      editorial("Check the claim before you repeat it", `Before using a number in a presentation or interview, write a one-sentence version that includes its scope. If that sentence becomes too qualified to be useful, the source may not support the claim you hoped to make. Keep a note of whether the number was observed, projected, surveyed or advertised; never change one category into another for a stronger headline.

When two sources disagree, compare their definitions and collection periods before deciding that one is wrong. They may be describing different populations. Prefer the source that explains its method and matches the question, but keep uncertainty if no source resolves the difference. A saved link and date help another reader check your reasoning. Do not fill a missing methodology with an invented sample size or a convenient conversion.`),
      editorial("Distinguish a market context from your negotiation", `A market report can help you ask whether an offer is unusual, but it cannot show what an employer will pay for a particular scope or candidate. Compare written responsibilities, location, seniority and total package, then ask for the employer's pay band or level where appropriate. Do not present a broad mean as a legal minimum or an amount every peer receives.

If you share research in an interview, explain the source and caveat in the same breath. This signals that you can use evidence without overstating it. Keep a copy of the actual report and check whether the page has changed since you first read it. If a recruiter challenges the figure, return to the definition and sample rather than defending an unsourced summary.`),
    ],
    faqs: [
      { question: "Is an advertised salary range a promise?", answer: "No; confirm the written offer, level, components and conditions." },
      { question: "What does a hiring number need?", answer: "A source, date, population, geography and clear definition of what was counted." },
      { question: "Can I use a market average to negotiate?", answer: "Use it as context only after checking comparability; ask for role-specific terms." },
      { question: "What if the source has no method?", answer: "Label the claim unverified and do not repeat it as established fact." },
    ],
    relatedLinks: [
      { url: "/offer-comparison", label: "Compare written offer amounts" },
      { url: "/salary-calculator", label: "Estimate payroll assumptions" },
    ],
  },
};
