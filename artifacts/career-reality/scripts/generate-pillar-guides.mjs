import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const artifactDir = path.resolve(scriptDir, "..");
const workspaceDir = path.resolve(artifactDir, "../..");
const registryPath = path.join(artifactDir, "src/data/route-registry.json");
const sourceMapPath = path.join(artifactDir, "src/data/pillar-guide-sources.json");
const outputPath = path.join(artifactDir, "src/data/generated-pillar-guides.json");
const splitOutputDir = path.join(artifactDir, "src/data/generated-pillar-guides/by-slug");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const sourceMap = JSON.parse(fs.readFileSync(sourceMapPath, "utf8"));
const authoredBatch = {
  ...(await import("../src/data/authored-guide-batch.mjs")).default,
  ...(await import("../src/data/authored-guide-batch-next.mjs")).default,
  ...(await import("../src/data/authored-guide-batch-phase-one.mjs")).default,
  ...(await import("../src/data/authored-guide-batch-phase-two.mjs")).default,
};
const guideRoutes = registry.routes.filter((route) => route.kind === "guide");
const guideBySlug = new Map(guideRoutes.map((route) => [route.guideSlug, route]));
const sourceOwners = new Map();

const editorialFrames = {
  "read-the-offer-beyond-ctc": {
    intro: "An offer's headline package can combine fixed cash, conditional pay, reimbursements, and deferred equity into one figure. A useful comparison names each component, its timing, and the condition attached to it. Bring the promise back to the document: what is paid, when it is paid, and what changes if plans change. Treat a target as a scenario, not money already in your account.",
    next: [
      "Ask for the written compensation breakup and identify guaranteed cash separately from target or discretionary pay.",
      "Read joining-bonus recovery, notice, and payout clauses before using a first-year total in your household plan.",
      "Compare the recurring fixed amount first; then decide whether conditional components fit your actual risk tolerance.",
    ],
  },
  "runway-debt-and-big-decisions": {
    intro: "A career decision sits inside a household budget. Liquid cash, recurring obligations, and employer-linked equity behave differently when income changes. This guide keeps those categories separate so a large future number cannot quietly replace money available today. The point is not to discourage a home, a startup, or a career move; it is to make the trade-offs visible before the commitment becomes difficult to reverse.",
    next: [
      "List cash that can be accessed now separately from equity, bonuses, and money dependent on an employer.",
      "Model monthly obligations under a lower-income scenario you choose, and state what the model leaves out.",
      "Before signing a loan or equity plan, get the payment schedule, vesting rules, exercise terms, and exit conditions in writing.",
    ],
  },
  "independent-work-without-romanticising-it": {
    intro: "Freelancing, side work, and career changes can create room to experiment, but they also move more responsibility onto the worker. Client acquisition, delivery, payment timing, benefits, and downtime all matter alongside the advertised freedom. Evaluate the specific work and the support around it rather than treating independence as either liberation or failure. A small, reversible test can produce better evidence than a dramatic announcement.",
    next: [
      "Define the smallest paid or portfolio project that would test demand without risking essential income.",
      "Write down delivery scope, payment milestones, revision limits, and ownership before beginning client work.",
      "Choose a review date and evidence threshold in advance so a side project does not become an open-ended obligation.",
    ],
  },
  "career-switches-and-education": {
    intro: "A degree or course is an input, not the career change itself. The useful question is what work the learning makes possible, what proof you will produce, and what the transition costs while you build that proof. Compare a formal program with lower-cost experiments using the same criteria. This guide treats education as a decision under constraints, not a universal shortcut or a moral test of ambition.",
    next: [
      "Name the target tasks and ask people doing that work what evidence they use to assess newcomers.",
      "Calculate the full cost of the route you are considering, including time away from paid work and financing terms.",
      "Build one small work sample before committing to a longer course, then compare the feedback with your assumptions.",
    ],
  },
  "getting-hired-through-evidence-and-conversations": {
    intro: "A portfolio, a referral, and an interview conversation are different kinds of evidence; none guarantees a hire. Their value depends on whether they help another person understand your decisions, contribution, and fit for a particular role. Keep confidential work private and explain the limits of any public sample. The practical goal is not to perform confidence. It is to make the relevant work legible and ask questions that reduce uncertainty on both sides.",
    next: [
      "Select a work sample that shows a decision, the constraints, your contribution, and what changed after feedback.",
      "Prepare a concise account of one outcome and one unresolved limitation rather than claiming universal expertise.",
      "Ask the hiring team how success, authority, collaboration, and review work in this specific role.",
    ],
  },
  "performance-reviews-and-career-choices": {
    intro: "Reviews and job changes are imperfect signals about a career. A rating reflects a particular process and context; a new title reflects what an employer is willing to name. Neither alone settles whether the next year will offer better work. Separate the evidence you have from the interpretation you are making, then identify which conversation or document could change that interpretation.",
    next: [
      "Bring specific work examples and ask what scope or outcome would demonstrate readiness for the next step.",
      "Compare the actual responsibilities and support of a new role, not only its title or the story attached to leaving.",
      "Record what is still unknown and who can answer it before treating a review or recruiter comment as a promise.",
    ],
  },
  "engineering-careers-without-the-title-trap": {
    intro: "Engineering titles vary across employers. The useful comparison is the work: the scope of decisions, the systems affected, the authority to change them, and the support available when something fails. Technical depth and organizational influence can both matter, but they are not interchangeable labels. This guide asks what a proposed path lets you own and how that ownership will be recognized, without prescribing a single senior-career ladder.",
    next: [
      "Ask for examples of decisions the role owns and which decisions still require another team's approval.",
      "Clarify how reliability, mentoring, design, and incident work are recognized in the performance process.",
      "Compare the role's authority and accountability; be cautious when responsibility grows without a matching decision path.",
    ],
  },
  "ai-at-work-questions-to-ask": {
    intro: "A tool can change a task without making a reliable prediction about an individual job. Broad workforce research describes populations and trends; it cannot tell one person which employer will reorganize, which tasks will remain, or whether a specific course will pay off. Start with the workflow in front of you: what is delegated, what still needs judgement, and who remains accountable for the result.",
    next: [
      "Map a real task from input to review and identify where accuracy, privacy, or accountability changes the process.",
      "Ask the team what evidence would show that a tool improved the work rather than only increasing visible activity.",
      "Choose learning that produces a reviewable work sample; avoid treating a certificate as proof of future demand.",
    ],
  },
  "data-science-career-claims": {
    intro: "A job title can conceal a wide range of work: reporting, data cleaning, experimentation, stakeholder support, modelling, or production ownership. Early-career applicants need to know which of those tasks are actually available and how they will be assessed. Read a role description as a set of claims to test, not as a guarantee that every advertised skill will be used or taught.",
    next: [
      "Ask which datasets, tools, and decisions a new hire will work with during the first project.",
      "Inspect a portfolio task for reproducibility, context, and explanation instead of optimizing only for a polished chart.",
      "Compare the role's stated responsibilities with the manager's description and record any material difference.",
    ],
  },
  "cybersecurity-and-green-work": {
    intro: "A growing field does not automatically make every role accessible, stable, or suitable. Cybersecurity and environmental work both span technical and non-technical functions, and the skills required depend on the employer's actual work. Keep global trend reports in their stated scope and test each local opportunity against its responsibilities, training, authority, and funding rather than extrapolating a market headline to one person's outcome.",
    next: [
      "Separate the job's recurring tasks from the field label, then identify which skills are required on day one.",
      "Ask who owns training, risk decisions, and the work's budget; a broad mission statement is not a job description.",
      "Verify any growth or impact claim against a dated source that defines its population and geography.",
    ],
  },
  "layoff-recovery-and-employment-documents": {
    intro: "After a role ends, people often have several practical questions at once: what money is due, which records to keep, what an employer has confirmed, and what to do next. This guide separates those questions instead of predicting a recovery timeline. Employment documents and payment terms depend on the individual's contract and circumstances, so keep the original records and use official guidance where the issue is legal or statutory.",
    next: [
      "Keep the termination communication, payslips, tax records, benefit statements, and written answers together.",
      "Reconcile the final statement against the terms you signed; ask for a written explanation of any difference.",
      "Set a short list of next actions around cash, references, and search activity without treating a timeline as guaranteed.",
    ],
  },
  "culture-fit-and-product-management": {
    intro: "“Culture fit” can describe real working expectations or hide an unexamined preference. A prestigious title can also obscure the daily work and the authority attached to it. Replace both shortcuts with concrete questions: what decisions will you make, who will disagree with you, how is conflict handled, and what work will occupy most of the week? The answer should come from the team and the role, not a title alone.",
    next: [
      "Ask for a recent example of a product decision, who made it, and how evidence changed the plan.",
      "Clarify the role's decision rights, engineering partnership, success measures, and escalation path.",
      "Probe culture through observable practices such as feedback, meeting norms, and how mistakes are handled.",
    ],
  },
  "notice-period-and-return-to-office": {
    intro: "Exit documents and office policies are often discussed informally, but a worker needs the operative terms and the responsible employer. Preserve written communications and distinguish a company-wide announcement from a condition in an individual offer or contract. This guide does not resolve an employment dispute; it helps organize the questions, identify the source that controls, and prepare a clear written request before a deadline or move.",
    next: [
      "Check the signed offer and current policy for notice, leave, location, and any process needed at exit.",
      "Ask HR to confirm the requested document, expected date, and any missing step in writing.",
      "For a disputed statutory entitlement, use current official labour guidance or obtain qualified advice rather than relying on a social post.",
    ],
  },
  "cross-border-and-remote-pay": {
    intro: "A remote salary headline is not the same as an employment arrangement. Currency, payroll entity, worker classification, benefits, tax treatment, and location can change what a person receives and what obligations apply. The right comparison is a written offer for the actual country and status, not a converted number copied from another market. Keep cross-border legal and tax questions separate from the career question of whether the work itself is a fit.",
    next: [
      "Ask which legal entity will employ or contract with you and where payroll, benefits, and required filings sit.",
      "Compare net and gross figures only with the relevant location, currency, pay period, and status stated.",
      "Get qualified advice for tax or employment obligations that depend on residency or cross-border facts.",
    ],
  },
  "senior-engineering-and-operations-work": {
    intro: "Senior engineering and operations work can look attractive in a title or compensation headline while hiding the actual on-call load, decision rights, and support model. Examine who shares incidents, how recovery work is recognized, and whether the role can change the systems that create the work. A role's sustainability cannot be inferred from a salary figure or a generic description of reliability engineering.",
    next: [
      "Ask for the on-call rotation, escalation path, incident review practice, and the authority to address recurring causes.",
      "Clarify the balance between planned engineering and interruption-driven work using the team's own description.",
      "Compare scope and accountability with the compensation terms in writing; do not substitute a market headline for an offer.",
    ],
  },
  "skills-passion-and-career-constraints": {
    intro: "Interest and learning matter, but neither removes constraints such as time, money, caregiving, or access to relevant work. An upskilling plan becomes more useful when it is tied to a task, a work sample, and feedback from someone who understands the target role. This guide avoids a universal formula for passion and focuses on decisions you can test without assuming that more courses automatically produce a better job.",
    next: [
      "Choose one target task and define the smallest artifact that would demonstrate your current ability.",
      "Set a time and cost limit for learning, then review whether the work sample received useful feedback.",
      "Keep personal interest, employability evidence, and financial feasibility as separate questions in the decision.",
    ],
  },
  "workplace-culture-and-boundaries": {
    intro: "A joke, a busy period, or a story about high performance cannot describe the full working environment. Look for repeated, observable practices: how people respond to disagreement, whether workload can be discussed, and what happens when a person sets a boundary. Research from another country or occupation can raise a useful question, but it does not establish what happens in a particular Indian workplace.",
    next: [
      "Ask more than one person how deadlines, after-hours messages, and urgent work are handled in practice.",
      "Notice whether humour is reciprocal and whether people can decline participation without a penalty.",
      "Compare the stated workload with the role's staffing, escalation, and leave practices before accepting broad assurances.",
    ],
  },
  "how-to-read-salary-and-hiring-claims": {
    intro: "A salary or hiring-growth headline is only useful when its source, date, population, geography, and definition are visible. A report about one segment should not be treated as a benchmark for every role or employer. This guide uses published evidence as context and keeps it separate from an individual's offer. If a source does not say what it measured, treat the number as a prompt to investigate rather than an answer.",
    next: [
      "Record who produced the figure, when it was published, which workers it covers, and what counts as a job or salary.",
      "Check whether the underlying report is primary research, a company release, sponsored content, or a secondary summary.",
      "Use an offer document and role-specific evidence for a personal decision; do not infer an individual outcome from a market total.",
    ],
  },
};

const decisionExercises = {
  "read-the-offer-beyond-ctc": "Make three columns: current guaranteed annual take-home, new offer with variable pay set to zero, and new offer at full target. Subtract only documented first-year clawback, notice and move costs. Mark every unreconciled CTC component as unknown; do not promote target pay into the guaranteed column.",
  "runway-debt-and-big-decisions": "Write a baseline budget and one lower-income scenario using liquid funds only. For each, list the first obligation you could renegotiate, the cash you would preserve, and the date you would review the decision. Keep equity, unconfirmed severance and expected future income outside the available-cash total.",
  "independent-work-without-romanticising-it": "Design a four-week test with one defined service, one prospective client group, a maximum hours budget, and a written payment milestone. Decide what evidence would justify another month, what result means stop, and how you will protect essential work and rest time during the test.",
  "career-switches-and-education": "Choose one target task and compare a course, a smaller project, and staying in the current role while learning. For each route, record cash cost, time cost, proof produced, feedback source, and the next decision the proof could change. Set a spending ceiling before you enrol.",
  "getting-hired-through-evidence-and-conversations": "For one target role, select a sample that can be shared lawfully and write a short note naming the problem, your contribution, constraints, and result. List one limitation and one question for the interviewer. If the work is confidential, create a synthetic example rather than exposing employer material.",
  "performance-reviews-and-career-choices": "Separate the review into observed evidence, the manager's interpretation, and the action available to you. Ask what specific scope or result would change the assessment, who decides, and when it will be reviewed. Compare those written conditions with a new role's actual duties before treating either title as progress.",
  "engineering-careers-without-the-title-trap": "Pick a recent technical decision and map who proposed it, who could approve it, who owned the consequences, and who supported recovery. Compare that map with the target role. Ask for one example of authority matching accountability before accepting a broader title or on-call obligation.",
  "ai-at-work-questions-to-ask": "Choose one recurring task and record its inputs, tool output, human review, failure cost, sensitive data, and accountable owner. Compare one small trial with the current process using the same quality checks. Stop if review cannot catch consequential errors or if confidential data lacks an approved path.",
  "data-science-career-claims": "Ask the hiring manager to describe the first real dataset, decision, and user a new hire would support. Then test a portfolio sample for reproducible steps, data limits, a clear baseline, and a written conclusion. Record any mismatch between the role description and that concrete example.",
  "cybersecurity-and-green-work": "Take one advertised role and replace the field label with a weekly task list. For each task, ask what training is provided, which decisions the worker can make, who funds the work, and how success is checked. Treat a growth headline as background, not evidence that this opening is secure or suitable.",
  "layoff-recovery-and-employment-documents": "Create a document checklist with the termination notice, contract, latest payslips, benefit records, and final settlement. Make a separate list of questions requiring a written employer answer. Keep cash planning, job-search steps, and any legal entitlement question as different workstreams rather than assuming one timeline resolves all three.",
  "culture-fit-and-product-management": "Ask two interviewers the same scenario: describe a recent decision that changed after disagreement. Compare who had authority, what evidence mattered, and how dissent was handled. Add the role's weekly work, success measures, and escalation path. A positive culture label without examples stays an unverified claim.",
  "notice-period-and-return-to-office": "Put the signed offer, current written policy, and requested change side by side. Record which document controls each point, who can confirm it, and the deadline for a written answer. Separate a policy announcement from an individual contractual term; get qualified advice if the documents conflict.",
  "cross-border-and-remote-pay": "Before comparing amounts, write the currency, pay period, employing entity, worker status, work location, benefits, and who handles payroll withholding. Leave net pay blank until a qualified source covers the actual residency and contract facts. Compare the role and the legal arrangement as two separate decisions.",
  "senior-engineering-and-operations-work": "Draw the incident path from alert through recovery and follow-up. Mark who is on call, who can change the system, how repeat causes get prioritised, and what work is displaced during an incident. Ask the team for a recent example before inferring sustainability from the title or salary.",
  "skills-passion-and-career-constraints": "Pick one skill tied to a target task and cap the learning plan by both hours and cost. Define the artifact you will produce, who can give useful feedback, and the evidence that would justify continuing. Include schedule, caregiving, and income constraints in the plan instead of treating them as afterthoughts.",
  "workplace-culture-and-boundaries": "Ask about one normal week, one urgent week, and how a person can decline work or social participation. Compare answers from more than one team member, then note what you observed versus what was promised. A single joke or polished interview cannot establish how a boundary is treated over time.",
  "how-to-read-salary-and-hiring-claims": "For each headline, record publisher, publication date, geography, population, definition, sample and whether the source is primary or sponsored. Then write one conclusion the evidence supports and one it cannot support. Do not translate an aggregate trend into a personal pay expectation without role-specific evidence.",
};

const decisionRechecks = {
  "read-the-offer-beyond-ctc": "Before signing, ask which written term would materially change the result: variable-pay conditions, a clawback clause, payout timing, or an employer-cost item that reduces cash. If the answer is not in the offer or a confirmed addendum, keep that amount out of the reliable-case comparison.",
  "runway-debt-and-big-decisions": "Set a review trigger before the next commitment: a lower income, an unexpected expense, or a minimum cash reserve. At that point, update the inputs rather than defending the original plan. A calculation helps expose a constraint; it does not tell you when a job search or purchase will succeed.",
  "independent-work-without-romanticising-it": "Renew the test only if the work is paid on the agreed terms, delivery fits the hours budget, and the next client is not dependent on a single referral. If demand appears only after unpaid scope expands, revise the offer or stop; do not call more hours proof of a viable business.",
  "career-switches-and-education": "Review the route after the work sample receives feedback from someone familiar with the target task. Continue only if the feedback changes a concrete skill plan or produces a credible next assignment. If it only confirms that the course was completed, pause before paying for another credential.",
  "getting-hired-through-evidence-and-conversations": "After the conversation, record what the team actually answered about scope, success, collaboration and review. If those answers conflict across interviewers, resolve that mismatch before accepting. A polished interview or referral can open a conversation but does not replace written role terms.",
  "performance-reviews-and-career-choices": "Set a date to revisit the review using the promised criteria and work examples. If the criteria change, the decision-maker is unclear, or the scope is unavailable, record that as new evidence. Compare the alternative role against the same standard rather than moving the goalposts.",
  "engineering-careers-without-the-title-trap": "Revisit the map after one project or incident. Did the role gain authority to change the system, or only responsibility when it failed? If accountability grows without decision rights or support, raise that mismatch before treating a promotion or title change as a complete answer.",
  "ai-at-work-questions-to-ask": "Decide in advance what result ends the trial: an undetected consequential error, an unapproved data path, or review time that erases the benefit. Keep the current process available until the team can show quality and accountability under real conditions; visible speed alone is not enough.",
  "data-science-career-claims": "Compare the manager's answer with the written role and, where possible, the first assignment. If data access, review, or stakeholder contact is materially different, ask how the role will be evaluated. Do not build a career plan around tools listed in an advertisement but absent from actual work.",
  "cybersecurity-and-green-work": "Recheck the opportunity when the budget, manager, or responsibilities change. A mission statement cannot substitute for funded work, an accountable decision-maker, and training for the tasks assigned. Keep any sector-wide number separate from what this particular employer can support.",
  "layoff-recovery-and-employment-documents": "Update the checklist when a document arrives or an employer gives a written correction. Keep disputed items separate from amounts confirmed in the final statement, and use a qualified source for unresolved statutory questions. A general recovery story cannot settle an individual contract or payment dispute.",
  "culture-fit-and-product-management": "Use the same questions with the manager and a prospective peer, then compare concrete examples rather than ratings such as 'collaborative'. If decision rights, workload, or feedback practices remain vague, identify the person who can clarify them before you rely on the title or team story.",
  "notice-period-and-return-to-office": "Recheck the written record when the policy changes, an exit date moves, or a new document is issued. Keep dated versions and ask for a written explanation of conflicts. Do not treat an informal assurance as a replacement for a signed term or qualified advice.",
  "cross-border-and-remote-pay": "Revisit the comparison if your residence, employing entity, currency, or worker classification changes. Those facts can alter withholding, benefits, and obligations, so do not carry one estimated net figure into a different arrangement. Ask a qualified adviser to review the actual contract and location facts.",
  "senior-engineering-and-operations-work": "Revisit the incident map after an on-call cycle: who carried interruption work, what recovery was deferred, and which root causes changed? If the same incidents recur without authority or capacity to fix them, that is evidence about the operating model—not a personal failure to manage time.",
  "skills-passion-and-career-constraints": "At the review date, compare the artifact and feedback with the target task, not with time already spent. If the next step requires money or hours you cannot safely commit, reduce the experiment. A plan that respects current constraints is more useful than a larger plan you cannot sustain.",
  "workplace-culture-and-boundaries": "Recheck your view after observing ordinary work, not only an interview or a busy week. Note whether people can ask for workload changes and decline nonessential participation without retaliation. If your experience contradicts the promise, decide what documentation or conversation would make the next step safer.",
  "how-to-read-salary-and-hiring-claims": "Revisit the source when its population, date range, or definition changes. Keep a claim only if the underlying document is reachable and supports the wording you use. If the source cannot answer a question, mark it unknown instead of filling the gap with a converted headline or social post.",
};

for (const [slug, authored] of Object.entries(authoredBatch)) {
  editorialFrames[slug] ??= { intro: authored.editorialFrame, next: authored.nextSteps ?? [] };
  decisionExercises[slug] ??= "Use the guide's document checklist and questions to identify which facts are confirmed and which need a written answer. Record the source, date, responsible contact, and next step for every unresolved item so a rough estimate is not mistaken for an official decision.";
  decisionRechecks[slug] ??= "Recheck the documents and official sources when dates, terms, or rules change; keep unresolved individual questions separate from general guidance. If an individual contract, benefit, or statutory question remains unclear, ask a qualified adviser to review the relevant facts before you act.";
}

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function textFromHtml(value) {
  return decodeHtml(
    value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/(?:p|li|h[1-6]|blockquote)>/gi, " ")
      .replace(/<[^>]*>/g, " "),
  ).replace(/\s+/g, " ").trim();
}

function wordCount(value) {
  return value.match(/\b[\p{L}\p{N}][\p{L}\p{N}'’.-]*\b/gu)?.length ?? 0;
}

function normalizedParagraph(value) {
  return value.toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function parseSources(body) {
  const notes = [...body.matchAll(/<p\b[^>]*class=["'][^"']*snapshot-source-note[^"']*["'][^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => textFromHtml(match[1]))
    .filter(Boolean);
  const links = [...body.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => ({
      url: decodeHtml(match[1]).trim(),
      label: textFromHtml(match[2]) || decodeHtml(match[1]).trim(),
    }))
    .filter((source) => /^https:\/\//i.test(source.url))
    .filter((source) => !/\/(?:intent|share|mailto:)/i.test(source.url));
  const unique = new Map();
  for (const source of links) {
    const key = source.url.replace(/\/+$/, "");
    if (!unique.has(key)) {
      const dateMatch = `${source.label} ${notes.join(" ")}`.match(/\b(?:19|20)\d{2}\b/);
      unique.set(key, {
        ...source,
        year: dateMatch?.[0] ?? null,
        provenance: "Preserved source link from the archived article note",
      });
    }
  }
  return { links: [...unique.values()], notes };
}

function parseArticle(article) {
  const filePath = path.resolve(workspaceDir, article.archiveFile);
  const archived = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const body = String(archived.body ?? "");
  const sourceNotes = parseSources(body);
  const sections = [...body.matchAll(/<section\b[^>]*>([\s\S]*?)<\/section>/gi)].map((match, index) => {
    const html = match[1];
    const headingMatch = html.match(/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/i);
    const heading = headingMatch ? textFromHtml(headingMatch[1]) : `Archived section ${index + 1}`;
    const paragraphs = [...html.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi)]
      .filter((paragraph) => !/snapshot-source-note/i.test(paragraph[1]))
      .map((paragraph) => textFromHtml(paragraph[2]))
      .filter((paragraph) => wordCount(paragraph) >= 15);
    return { heading, paragraphs };
  }).filter((section) => section.paragraphs.length > 0);
  return {
    slug: article.slug,
    title: archived.title,
    description: archived.description,
    sections,
    sources: sourceNotes.links,
    sourceNotes: sourceNotes.notes,
  };
}

const archiveRecords = new Map(registry.drafts.articles.map((article) => [article.slug, article]));
if (guideRoutes.length !== 28 || Object.keys(sourceMap).length !== guideRoutes.length) {
  throw new Error("The public guide route count and source map must both be 28.");
}
if (registry.drafts.articles.length !== 44) {
  throw new Error("The preserved archive must contain exactly 44 article records.");
}
for (const route of guideRoutes) {
  if (!sourceMap[route.guideSlug] || !editorialFrames[route.guideSlug] || !decisionExercises[route.guideSlug] || !decisionRechecks[route.guideSlug]) {
    throw new Error(`Missing source group or editorial framing for ${route.guideSlug}.`);
  }
}
for (const [guideSlug, articleSlugs] of Object.entries(sourceMap)) {
  if (!guideBySlug.has(guideSlug)) throw new Error(`Unregistered guide source group: ${guideSlug}.`);
  for (const articleSlug of articleSlugs) {
    if (!archiveRecords.has(articleSlug)) throw new Error(`Unknown archived article: ${articleSlug}.`);
    if (sourceOwners.has(articleSlug)) throw new Error(`Archived article is assigned more than once: ${articleSlug}.`);
    sourceOwners.set(articleSlug, guideSlug);
  }
}
if (sourceOwners.size !== registry.drafts.articles.length) {
  throw new Error(`Guide groups cover ${sourceOwners.size} of ${registry.drafts.articles.length} archived articles.`);
}
for (const article of registry.drafts.articles) {
  const redirect = registry.redirects.find((entry) => entry.from === `/article/${article.slug}/`);
  if (redirect) {
    throw new Error(`Archived article URL must remain in place pending editorial approval: ${article.slug}.`);
  }
}

const guides = guideRoutes.map((route) => {
  const frame = editorialFrames[route.guideSlug];
  const questions = frame.next.join("\n\n");
  const uncertainty = "This guide cannot settle individual facts. Verify the documents and current rules that apply to your situation before making a commitment.";
  const sections = [
    {
      heading: "A practical decision test",
      sourceTitle: "CareerReality Editorial",
      sourceSlug: `editorial-${route.guideSlug}`,
      content: decisionExercises[route.guideSlug],
      sourceLinks: [],
      sourceNotes: [],
    },
    {
      heading: "Evidence that should change your view",
      sourceTitle: "CareerReality Editorial",
      sourceSlug: `editorial-${route.guideSlug}`,
      content: decisionRechecks[route.guideSlug],
      sourceLinks: [],
      sourceNotes: [],
    },
    {
      heading: "What remains uncertain",
      sourceTitle: "CareerReality Editorial",
      sourceSlug: `editorial-${route.guideSlug}`,
      content: uncertainty,
      sourceLinks: [],
      sourceNotes: [],
    },
  ];
  const totalWords = [frame.intro, "Use these prompts to identify the evidence and questions that matter in your situation.", questions, decisionExercises[route.guideSlug], decisionRechecks[route.guideSlug], uncertainty].reduce((sum, text) => sum + wordCount(text), 0);
  if (totalWords < 220) throw new Error(`Guide ${route.guideSlug} is too short to publish (${totalWords} words).`);
  return {
    slug: route.guideSlug,
    path: route.path.endsWith("/") ? route.path : `${route.path}/`,
    title: route.title,
    description: route.description,
    lead: "Use these prompts to identify the evidence and questions that matter in your situation.",
    editorialFrame: frame.intro,
    sections,
    nextSteps: frame.next,
    sources: [],
    sourceDisclosure: "This is general editorial guidance, not legal, tax, compensation, or job-market advice. It does not determine individual facts. Current factual claims require a dated primary source verified for the specific claim.",
    wordCount: totalWords,
  };
});

for (const guide of guides) {
  const authored = authoredBatch[guide.slug];
  if (!authored) continue;
  const decisionSupport = authored.keepDecisionSupport
    ? guide.sections.filter((section) => section.heading !== "What remains uncertain")
    : [];
  Object.assign(guide, authored, {
    datePublished: authored.datePublished ?? null,
    dateModified: authored.dateModified ?? null,
    sources: authored.sources ?? [],
    sourceDisclosure: authored.sourceDisclosure ?? "",
    sections: [
      ...decisionSupport,
      ...authored.sections.filter((section) => section.heading !== "Questions people ask").map((section, index) => ({
        ...section,
        sourceTitle: "CareerReality Editorial",
        sourceSlug: `authored-${guide.slug}-${index + 1}`,
        sourceNotes: [],
        sourceLinks: section.sourceLinks ?? [],
      })),
    ],
  });
  delete guide.keepDecisionSupport;
  guide.wordCount = [
    guide.editorialFrame,
    ...guide.sections.map((section) => section.content),
    ...(guide.faqs ?? []).flatMap((faq) => [faq.question, faq.answer]),
  ].reduce((sum, text) => sum + wordCount(text), 0);
}

const longParagraphOwners = new Map();
for (const guide of guides) {
  const paragraphs = [
    guide.editorialFrame,
    ...guide.sections.map((section) => section.content),
    ...guide.nextSteps,
    ...(guide.faqs ?? []).flatMap((faq) => [faq.question, faq.answer]),
  ].flatMap((text) => text.split(/\n{2,}/));
  for (const paragraph of paragraphs) {
    const normalized = paragraph.toLocaleLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
    if (wordCount(normalized) < 25) continue;
    const existingOwner = longParagraphOwners.get(normalized);
    if (existingOwner) {
      throw new Error(`Repeated long editorial paragraph in ${existingOwner} and ${guide.slug}.`);
    }
    longParagraphOwners.set(normalized, guide.slug);
  }
}

const result = {
  generatedOn: "2026-10-10",
  guides,
};
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
fs.mkdirSync(splitOutputDir, { recursive: true });
const generatedGuideFiles = new Set();
for (const guide of guides) {
  const guidePath = path.join(splitOutputDir, `${guide.slug}.json`);
  generatedGuideFiles.add(path.basename(guidePath));
  fs.writeFileSync(guidePath, `${JSON.stringify(guide)}\n`);
}
for (const fileName of fs.readdirSync(splitOutputDir)) {
  if (fileName.endsWith(".json") && !generatedGuideFiles.has(fileName)) {
    fs.unlinkSync(path.join(splitOutputDir, fileName));
  }
}
process.stdout.write(`Generated ${guides.length} editorial guides without republishing archived article body text.\n`);
