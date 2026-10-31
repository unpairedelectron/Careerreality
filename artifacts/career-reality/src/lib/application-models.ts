import { calculateCtc } from "./ctc-calculator";

export type ResignationOfferStatus =
  | "Written offer"
  | "Verbal offer only"
  | "No offer";

export type ResignationPlanInput = {
  noticeDays: 30 | 60 | 90;
  hasRepaymentClause: boolean;
  offerStatus: ResignationOfferStatus;
  cashRunwayMonths: number;
};

export type ResignationPlan = {
  noticeDays: number;
  hasRepaymentClause: boolean;
  offerStatus: ResignationOfferStatus;
  cashRunwayMonths: number;
  nextSteps: string[];
};

export function createResignationPlan(
  input: ResignationPlanInput,
): ResignationPlan | { error: string } {
  if (
    !Number.isFinite(input.cashRunwayMonths) ||
    input.cashRunwayMonths < 0 ||
    input.cashRunwayMonths > 60
  ) {
    return { error: "Enter cash runway from 0 to 60 months." };
  }

  const nextSteps = [
    input.offerStatus === "Written offer"
      ? "Check that role, fixed and variable pay, conditions, and joining date match the written offer."
      : input.offerStatus === "Verbal offer only"
        ? "Ask for the complete offer and joining date in writing before relying on a verbal commitment."
        : "If you need another job, decide whether to secure a written offer before giving notice; this tool cannot judge that trade-off for you.",
    `Review your ${input.noticeDays}-day notice terms, final-pay timing, leave balance, and benefits with the documents that apply to your role.`,
    input.hasRepaymentClause
      ? "Have the exact bond or repayment clause reviewed by a qualified professional before relying on an estimate of its cost."
      : "Confirm whether any repayment, training, joining-bonus, or notice-buyout clause applies; none was selected here.",
    `You entered ${input.cashRunwayMonths} months of cash runway. Recheck it against essential spending, debt, dependants, and any gap before a new salary begins.`,
  ];

  return {
    noticeDays: input.noticeDays,
    hasRepaymentClause: input.hasRepaymentClause,
    offerStatus: input.offerStatus,
    cashRunwayMonths: input.cashRunwayMonths,
    nextSteps,
  };
}

export type SalaryDropInput = {
  currentCtc: string;
  newCtc: string;
  variablePayPercent: string;
  monthlyCostBaseline: string;
  bufferMonths: string;
};

export type SalaryDropCalculation = {
  currentCtc: number;
  newCtc: number;
  variablePayPercent: number;
  monthlyCostBaseline: number;
  bufferMonths: number;
  currentAssumedFixedCash: number;
  newAssumedFixedCash: number;
  currentNetTakeHomeAtZeroVariable: number;
  newNetTakeHomeAtZeroVariable: number;
  takeHomeScenarios: Array<{
    realizationPercent: 0 | 50 | 100;
    currentAnnualTakeHome: number;
    newAnnualTakeHome: number;
    annualTakeHomeDelta: number;
    monthlyTakeHomeDelta: number;
  }>;
  monthlyCashDelta: number;
  annualCashDelta: number;
  monthlyTargetTakeHomeDelta: number;
  selectedBufferAmount: number;
  monthlyCostChangePercent: number;
};

export function calculateSalaryDrop(
  input: SalaryDropInput,
):
  | { ok: true; calculation: SalaryDropCalculation }
  | { ok: false; error: string } {
  const fields = [
    {
      raw: input.currentCtc,
      label: "Current annual CTC",
      min: 1,
      max: 100_000_000,
    },
    {
      raw: input.newCtc,
      label: "New annual CTC",
      min: 1,
      max: 100_000_000,
    },
    {
      raw: input.variablePayPercent,
      label: "Variable-pay share",
      min: 0,
      max: 100,
    },
    {
      raw: input.monthlyCostBaseline,
      label: "Monthly cost baseline",
      min: 1,
      max: 10_000_000,
    },
    {
      raw: input.bufferMonths,
      label: "Buffer period",
      min: 0,
      max: 24,
    },
  ];

  const values: number[] = [];
  for (const field of fields) {
    if (field.raw.trim() === "") {
      return { ok: false, error: `${field.label} is required.` };
    }
    const value = Number(field.raw);
    if (!Number.isFinite(value) || value < field.min || value > field.max) {
      return {
        ok: false,
        error: `${field.label} must be between ${field.min.toLocaleString("en-IN")} and ${field.max.toLocaleString("en-IN")}.`,
      };
    }
    values.push(value);
  }

  const [
    currentCtc,
    newCtc,
    variablePayPercent,
    monthlyCostBaseline,
    bufferMonths,
  ] = values;
  const fixedShare = 1 - variablePayPercent / 100;
  const currentAssumedFixedCash = currentCtc * fixedShare;
  const newAssumedFixedCash = newCtc * fixedShare;
  const calculateTakeHome = (
    ctc: number,
    fixedCash: number,
    realizationPercent: number,
  ) => calculateCtc({
    annualCtc: ctc,
    annualFixedPay: fixedCash,
    annualVariablePay: ctc * (variablePayPercent / 100) * (realizationPercent / 100),
    basicPercentOfFixed: 50,
    annualEmployeePfAtZeroVariable: 0,
    annualEmployeePfAtTarget: 0,
    annualEmployerPfAtTarget: 0,
    employerPfIncluded: false,
    stateOrUt: "",
    annualProfessionalTax: 0,
    annualGratuityInCtc: 0,
    annualOtherEmployerCosts: 0,
  }).annualTakeHomeAtTarget;
  const takeHomeScenarios = ([0, 50, 100] as const).map((realizationPercent) => {
    const currentAnnualTakeHome = calculateTakeHome(
      currentCtc,
      currentAssumedFixedCash,
      realizationPercent,
    );
    const newAnnualTakeHome = calculateTakeHome(
      newCtc,
      newAssumedFixedCash,
      realizationPercent,
    );
    const annualTakeHomeDelta = newAnnualTakeHome - currentAnnualTakeHome;
    return {
      realizationPercent,
      currentAnnualTakeHome,
      newAnnualTakeHome,
      annualTakeHomeDelta,
      monthlyTakeHomeDelta: annualTakeHomeDelta / 12,
    };
  });
  const zeroVariableScenario = takeHomeScenarios[0];
  const targetVariableScenario = takeHomeScenarios[2];
  const currentNetTakeHomeAtZeroVariable = zeroVariableScenario.currentAnnualTakeHome;
  const newNetTakeHomeAtZeroVariable = zeroVariableScenario.newAnnualTakeHome;
  const monthlyCashDelta = zeroVariableScenario.monthlyTakeHomeDelta;
  const annualCashDelta = zeroVariableScenario.annualTakeHomeDelta;

  return {
    ok: true,
    calculation: {
      currentCtc,
      newCtc,
      variablePayPercent,
      monthlyCostBaseline,
      bufferMonths,
      currentAssumedFixedCash,
      newAssumedFixedCash,
      currentNetTakeHomeAtZeroVariable,
      newNetTakeHomeAtZeroVariable,
      takeHomeScenarios,
      monthlyCashDelta,
      annualCashDelta,
      monthlyTargetTakeHomeDelta: targetVariableScenario.monthlyTakeHomeDelta,
      selectedBufferAmount: Math.abs(Math.min(monthlyCashDelta, 0)) * bufferMonths,
      monthlyCostChangePercent: (monthlyCashDelta / monthlyCostBaseline) * 100,
    },
  };
}

export type CtcComparison =
  | { ok: true; currentCtc: number; offerCtc: number; annualDifference: number }
  | { ok: false; error: string };

export function compareCtcAmounts(
  currentCtc: string,
  offerCtc: string,
): CtcComparison {
  const current = Number(currentCtc);
  const offer = Number(offerCtc);
  if (
    currentCtc.trim() === "" ||
    !Number.isFinite(current) ||
    current < 0 ||
    current > 100_000_000
  ) {
    return { ok: false, error: "Enter a valid current annual CTC." };
  }
  if (
    offerCtc.trim() === "" ||
    !Number.isFinite(offer) ||
    offer < 0 ||
    offer > 100_000_000
  ) {
    return { ok: false, error: "Enter a valid offer annual CTC." };
  }
  return {
    ok: true,
    currentCtc: current,
    offerCtc: offer,
    annualDifference: offer - current,
  };
}

export type CompassDecisionKey = "offer" | "move" | "stay";

export type CompassDecisionReadout = {
  title: string;
  detail: string;
  read: string;
  signals: Array<{ label: string; value: string }>;
};

export type CompassDecisionInput = {
  role: string;
  city: string;
  currentCtc: string;
  offerCtc: string;
  noticePeriodDays: number;
  salaryEvidence: string;
  companyEvidence: string;
  layoffEvidence: string;
};

function formatCtcAmount(value: number | undefined): string {
  if (value === undefined) return "Not entered";
  return `₹${(value / 100_000).toFixed(2)}L annual CTC`;
}

export function createCompassDecisionReadouts(
  input: CompassDecisionInput,
): Record<CompassDecisionKey, CompassDecisionReadout> {
  const comparison = compareCtcAmounts(input.currentCtc, input.offerCtc);
  const current = comparison.ok ? comparison.currentCtc : undefined;
  const offer = comparison.ok ? comparison.offerCtc : undefined;
  const difference = comparison.ok
    ? `${comparison.annualDifference < 0 ? "−" : comparison.annualDifference > 0 ? "+" : ""}${formatCtcAmount(Math.abs(comparison.annualDifference))}`
    : "Unavailable until both CTC inputs are valid";

  return {
    offer: {
      title: "Compare this offer",
      detail: `${input.role} in ${input.city}`,
      read: "This is a comparison prompt, not an accept-or-reject recommendation. Review the written package, role scope, benefits, and employer evidence separately; market ranges do not predict your outcome.",
      signals: [
        { label: "Offer annual CTC", value: formatCtcAmount(offer) },
        { label: "Current annual CTC", value: formatCtcAmount(current) },
        { label: "Package CTC difference", value: difference },
        { label: "Salary evidence", value: input.salaryEvidence },
      ],
    },
    move: {
      title: "Check the move",
      detail: `${input.noticePeriodDays}-day notice period entered`,
      read: `Your entered notice period is ${input.noticePeriodDays} days. It is a contractual detail to verify, not a measure of switching difficulty. Confirm the new start date and any offer conditions before comparing options.`,
      signals: [
        { label: "Notice period", value: `${input.noticePeriodDays} days entered` },
        { label: "Employer evidence", value: input.companyEvidence },
        { label: "Layoff evidence", value: input.layoffEvidence },
      ],
    },
    stay: {
      title: "Compare staying",
      detail: "Set a review point using the same criteria",
      read: "The Compass cannot forecast the result of staying. Compare what your current role can realistically offer next with one concrete external option, then revisit the choice at a date you select.",
      signals: [
        { label: "Current annual CTC", value: formatCtcAmount(current) },
        { label: "Role context", value: `${input.role} · ${input.city}` },
        { label: "Market evidence", value: input.salaryEvidence },
        { label: "Employer evidence", value: input.companyEvidence },
      ],
    },
  };
}

export type CareerIndexReflectionInputs = {
  pay: string;
  stability: string;
  optionality: string;
  ai: string;
};

export type CareerIndexReflection = {
  verdict: string;
  truth: string;
  evidence: string;
  lever: string;
  next: string;
  questions: string[];
  nextTools: { label: string; href: string }[];
};

export function createCareerRealityIndexReflection(
  responses: CareerIndexReflectionInputs,
): CareerIndexReflection {
  const signals = [
    {
      key: "pay",
      label: "Current pay",
      response: responses.pay,
      href: "/salary-calculator",
      tool: "Review compensation components",
      question: "Which written pay component or recent outcome would help you check this?",
    },
    {
      key: "stability",
      label: "Company confidence",
      response: responses.stability,
      href: "/companies",
      tool: "Check employer evidence",
      question: "What recent, verifiable information would change your view of the employer?",
    },
    {
      key: "optionality",
      label: "Ability to move",
      response: responses.optionality,
      href: "/escape-plan",
      tool: "Plan a low-risk career test",
      question: "What small work sample or conversation could test an alternative?",
    },
    {
      key: "ai",
      label: "AI readiness",
      response: responses.ai,
      href: "/ai",
      tool: "Assess task-level AI changes",
      question: "Which task, review step, or responsibility is changing in your work?",
    },
  ];
  const concerns = signals.filter(({ response }) =>
    ["Not satisfied", "Somewhat satisfied"].includes(response),
  );
  const uncertain = signals.filter(({ response }) => response === "Neutral");
  const focused = concerns.length ? concerns : uncertain;
  const nextTools = (focused.length ? focused : signals).map(({ href, tool }) => ({
    label: tool,
    href,
  }));
  const focusedLabels = focused.map(({ label }) => label);

  if (concerns.length) {
    const areaList = focusedLabels.join(", ");
    return {
      verdict: `You flagged ${areaList} for a closer look.`,
      truth: `You reported lower satisfaction in ${areaList}. That is a useful question to investigate, not evidence that the employer, pay, or career outlook is objectively poor; this check cannot verify those conditions.`,
      evidence: `Your responses are self-reported: pay ${responses.pay} · company confidence ${responses.stability} · ability to move ${responses.optionality} · AI readiness ${responses.ai}.`,
      lever: `Check one recent fact for ${areaList}; this reflection does not rank these areas.`,
      next: "Use the relevant tool below to organize the next check. Verify important details with current documents or conversations before making a decision.",
      questions: focused.map(({ question }) => question).slice(0, 3),
      nextTools,
    };
  }

  if (uncertain.length) {
    const areaList = focusedLabels.join(", ");
    return {
      verdict: `You left ${areaList} as open questions.`,
      truth: `You selected Neutral for ${areaList}. The check cannot fill in those unknowns or verify your other answers.`,
      evidence: `Your responses are self-reported: pay ${responses.pay} · company confidence ${responses.stability} · ability to move ${responses.optionality} · AI readiness ${responses.ai}.`,
      lever: `Choose one neutral area and identify the evidence that would make your answer clearer.`,
      next: "Use a focused tool below to prepare that check; no score or stay-or-leave recommendation is produced.",
      questions: focused.map(({ question }) => question).slice(0, 3),
      nextTools,
    };
  }

  return {
    verdict: "Your answers are positive; test one assumption.",
    truth: "You reported satisfaction across these four areas. Positive self-reports still cannot verify market pay, employer plans, outside options, or how work may change.",
    evidence: `Your responses are self-reported: pay ${responses.pay} · company confidence ${responses.stability} · ability to move ${responses.optionality} · AI readiness ${responses.ai}.`,
    lever: "Choose the assumption that would matter most if new evidence changed your view. The check does not rank or score these areas.",
    next: "Use a focused tool below to check the area you care about. Do not use this reflection alone to make a resignation or financial decision.",
    questions: [
      "What recent fact supports the answer I selected?",
      "What observation could change my view?",
      "What personal constraints or people should I consider before acting?",
    ],
    nextTools,
  };
}

export type AiTaskReadoutInput = {
  taskName: string;
  repeatability: string;
  errorImpact: string;
  humanReview: string;
};

export type AiTaskReadout = {
  taskName: string;
  label: string;
  detail: string;
  checks: string[];
};

export function createAiTaskReadout(
  input: AiTaskReadoutInput,
): AiTaskReadout | { error: string } {
  const taskName = input.taskName.trim();
  if (taskName.length < 3 || taskName.length > 180) {
    return { error: "Describe the task in 3 to 180 characters." };
  }
  if (!["Repeatable", "Mixed", "Context-heavy"].includes(input.repeatability)) {
    return { error: "Choose how repeatable the task is." };
  }
  if (!["Low", "Moderate", "High"].includes(input.errorImpact)) {
    return { error: "Choose the impact if an output is wrong." };
  }
  if (!["Yes, always", "Sometimes", "No"].includes(input.humanReview)) {
    return { error: "Choose how often a person reviews the output." };
  }

  const needsHumanControl =
    input.errorImpact === "High" ||
    input.repeatability === "Context-heavy" ||
    input.humanReview !== "Yes, always";
  return {
    taskName,
    label: needsHumanControl
      ? "Keep a person accountable; test assistance only"
      : input.repeatability === "Repeatable"
        ? "Candidate for a bounded, supervised pilot"
        : "Map the workflow before testing",
    detail: needsHumanControl
      ? "These inputs point to context, review, or error-impact limits. They do not measure AI exposure; keep decisions and final approval with a person."
      : input.repeatability === "Repeatable"
        ? "A repeatable task with consistent human review may be suitable for a small comparison. This does not predict time saved, role change, or job security."
        : "Mixed workflows need their inputs, exceptions, and review steps mapped before an AI-assisted trial can be evaluated.",
    checks: [
      `Write down the permitted source material and expected output for “${taskName}”.`,
      "Choose a recent baseline example and define what a correct result looks like.",
      input.errorImpact === "High"
        ? "Require a qualified person to verify every consequential output before anyone acts on it."
        : "Record a known failure case and the person responsible for catching it.",
      input.humanReview === "No"
        ? "Do not rely on output without an identified reviewer and a correction path."
        : "Track who reviews the output and how corrections are made.",
    ],
  };
}

export const escapePlanGoals = [
  "A better role",
  "More money",
  "A healthier team",
  "A different career",
] as const;
export type EscapePlanGoal = (typeof escapePlanGoals)[number];

export const escapePlanWeeks = ["4 weeks", "8 weeks", "12 weeks"] as const;

const escapePlanTasks: Record<EscapePlanGoal, readonly string[]> = {
  "A better role": [
    "Write the target role, location, and non-negotiables in one sentence.",
    "Collect three measurable outcomes from recent work.",
    "Choose five target roles and compare their requirements.",
    "Ask two people in those roles about team scope and hiring process.",
    "Tailor one proof-of-work example and application to a live role.",
  ],
  "More money": [
    "Separate fixed pay, variable pay, and employer-paid CTC items.",
    "Collect three documented outcomes linked to business value.",
    "Compare your role and level against sourced salary evidence.",
    "Write a compensation ask and a realistic alternative.",
    "Schedule the conversation and record what is confirmed in writing.",
  ],
  "A healthier team": [
    "Define the work conditions and behaviours that need to change.",
    "Separate direct evidence from assumptions about the team.",
    "Prepare questions about workload, manager support, and escalation.",
    "Speak privately with a trusted reference where appropriate.",
    "Compare the current role with one concrete alternative.",
  ],
  "A different career": [
    "Choose one target role to test instead of a broad industry.",
    "Identify the first skill or credential gap.",
    "Complete a small project or shadowing experiment.",
    "Talk with two practitioners about their day-to-day work.",
    "Review the evidence and decide whether to deepen, pivot, or pause.",
  ],
};

export function getEscapePlanTasks(goal: EscapePlanGoal): readonly string[] {
  return escapePlanTasks[goal];
}

export function calculateEscapePlanHours(
  weeklyHours: string,
  weeks: string,
): { ok: true; totalHours: number } | { ok: false; error: string } {
  const hours = Number(weeklyHours);
  const durationWeeks = Number.parseInt(weeks, 10);
  if (!Number.isFinite(hours) || hours < 1 || hours > 40) {
    return { ok: false, error: "Enter a weekly time budget from 1 to 40 hours." };
  }
  if (![4, 8, 12].includes(durationWeeks)) {
    return { ok: false, error: "Choose a 4, 8, or 12 week planning window." };
  }
  return { ok: true, totalHours: hours * durationWeeks };
}
