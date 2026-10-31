import { useMemo, useState } from "react";
import "./layoff-response-planner.css";

export type LayoffResponsePlannerProps = {
  company: string;
  geography: string;
  status: string;
  summary: string;
  coverageNote: string;
};

type RoleFamily =
  | "engineering-data"
  | "product-design"
  | "sales-advisory"
  | "support"
  | "operations"
  | "finance-people-compliance"
  | "other";

type MatchConfidence = "yes" | "partial" | "not-sure";
type MoneyField = "cash" | "pay" | "essentials";

const roleOptions: { value: RoleFamily; label: string }[] = [
  { value: "engineering-data", label: "Engineering / data" },
  { value: "product-design", label: "Product / design" },
  { value: "sales-advisory", label: "Sales / client advisory" },
  { value: "support", label: "Customer support" },
  { value: "operations", label: "Operations / supply chain" },
  { value: "finance-people-compliance", label: "Finance / people / compliance" },
  { value: "other", label: "Other" },
];

const roleGuidance: Record<RoleFamily, { heading: string; detail: string }> = {
  "engineering-data": {
    heading: "Prepare a work-safe technical story",
    detail:
      "Refresh your skills inventory and write down outcomes you can discuss publicly. Do not copy source code, datasets, credentials, or internal architecture.",
  },
  "product-design": {
    heading: "Prepare a public-safe case study",
    detail:
      "Outline the problem, your role, and the outcome using information you are permitted to share. Rebuild examples from memory or public materials; do not export internal files or customer research.",
  },
  "sales-advisory": {
    heading: "Map portable client-facing strengths",
    detail:
      "Record your own achievements in broad, non-confidential terms and refresh your professional profile. Do not take customer lists, deal notes, pricing, or account records.",
  },
  support: {
    heading: "Make your service strengths easy to see",
    detail:
      "Note the types of issues you resolved, tools you know, and service outcomes you can describe without customer details. Do not copy tickets, transcripts, or customer data.",
  },
  operations: {
    heading: "Document transferable operating skills",
    detail:
      "List processes, systems, and measurable improvements you can discuss at a high level. Do not export operational plans, supplier terms, routing data, or internal procedures.",
  },
  "finance-people-compliance": {
    heading: "Keep your preparation strictly non-sensitive",
    detail:
      "Summarise your own responsibilities and outcomes without retaining payroll, employee, financial, audit, or compliance records. Use only material you are authorised to share.",
  },
  other: {
    heading: "Describe your work without taking work product",
    detail:
      "Write a short skills and outcomes inventory from memory. Keep company documents, customer information, and confidential materials where they belong.",
  },
};

const statusMeaning = (status: string) => {
  const normalized = status.trim().toLowerCase();
  if (normalized === "confirmed") {
    return "Confirmed describes the source's account of a company confirmation. It does not establish the final number affected, which roles or locations are in scope, or whether your position is affected.";
  }
  if (normalized === "reported") {
    return "Reported means a named source published this information. It is not the same as direct company confirmation, and it does not establish whether your role or team is affected.";
  }
  if (normalized === "rumour") {
    return "Rumour means this claim is unverified. It does not establish that a layoff has happened or will happen; avoid making irreversible decisions on this record alone.";
  }
  return "This status describes how the report is characterised here. It does not establish whether your role, team, or location is affected.";
};

function formatRupees(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function runwayBand(months: number) {
  if (months < 1) return "under one month";
  if (months < 3) return "one to three months";
  if (months < 6) return "three to six months";
  return "more than six months";
}

function runwaySteps(months: number, match: MatchConfidence) {
  const steps: string[] = [];
  if (match === "yes") {
    steps.push(
      "Ask your manager or HR for a direct, written clarification about your team, location, role scope, and timing. Keep the question factual and specific.",
    );
  } else if (match === "partial") {
    steps.push(
      "Check which part overlaps: team, location, reporting line, or role family. Ask an appropriate company contact to clarify the exact scope before treating the report as personal confirmation.",
    );
  } else {
    steps.push(
      "Treat this as an open question, not a personal signal. Check a reliable internal channel for team- and location-specific information, and note what remains unconfirmed.",
    );
  }

  if (months < 1) {
    steps.push(
      "Prioritise immediate cash-flow visibility: list near-term essentials and due dates, pause non-essential commitments where practical, and check what support or benefits are actually available to you.",
      "Set aside a short block today to update your CV and contact a few trusted people. Avoid rushed decisions based only on a company-level report.",
    );
  } else if (months < 3) {
    steps.push(
      "Run a focused search alongside a review of near-term commitments. Update your CV, identify a small set of relevant roles, and reconnect with trusted professional contacts.",
      "Confirm any applicable final-pay, notice, or benefit details directly with HR and qualified local advisers; your circumstances and documents matter.",
    );
  } else if (months < 6) {
    steps.push(
      "Give yourself a measured search cadence: refresh your profile, shortlist roles, and schedule regular outreach while keeping a close view of monthly essentials.",
      "Use the time to verify any employment or benefits questions with the relevant company contact or a qualified local adviser.",
    );
  } else {
    steps.push(
      "You have room to prepare deliberately. Refresh your work-safe profile and explore roles or skill gaps without assuming this report predicts your employment outcome.",
      "Revisit your cash and essential-spend assumptions if circumstances change; this estimate is a snapshot, not a guarantee.",
    );
  }
  return steps;
}

export function LayoffResponsePlanner({
  company,
  geography,
  status,
  summary,
  coverageNote,
}: LayoffResponsePlannerProps) {
  const [role, setRole] = useState<RoleFamily | "">("");
  const [match, setMatch] = useState<MatchConfidence | "">("");
  const [money, setMoney] = useState<Record<MoneyField, string>>({
    cash: "",
    pay: "",
    essentials: "",
  });

  const runway = useMemo(() => {
    const hasAllValues = Object.values(money).every((value) => value.trim() !== "");
    const cash = Number(money.cash);
    const pay = Number(money.pay);
    const essentials = Number(money.essentials);
    if (
      !hasAllValues ||
      !Number.isFinite(cash) ||
      !Number.isFinite(pay) ||
      !Number.isFinite(essentials) ||
      cash < 0 ||
      pay < 0 ||
      essentials <= 0
    ) {
      return null;
    }
    return { months: (cash + pay) / essentials, cash, pay, essentials };
  }, [money]);

  const handleMoneyChange = (field: MoneyField, value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setMoney((current) => ({ ...current, [field]: value }));
    }
  };

  const missingMoney = [
    money.cash.trim() === "" && "accessible cash",
    money.pay.trim() === "" && "expected one-time pay",
    money.essentials.trim() === "" && "essential monthly spend",
  ].filter(Boolean);

  return (
    <section className="crp" aria-labelledby="crp-title" data-testid="section-layoff-response-plan">
      <header className="crp__header">
        <p className="crp__eyebrow">PERSONAL RESPONSE / PRIVATE TO THIS PAGE</p>
        <div className="crp__headline">
          <div>
            <h2 id="crp-title">Make a plan from <em>what you know.</em></h2>
            <p className="crp__intro">
              A company report is not a personal outcome. Add only what you want to use here;
              these answers stay in this page's React memory and are not saved or sent.
            </p>
          </div>
          <div className="crp__record" aria-label="Report context">
            <span>REPORT CONTEXT</span>
            <strong>{company}</strong>
            <small>{geography} · {status}</small>
          </div>
        </div>
      </header>

      <div className="crp__layout">
        <div className="crp__inputs">
          <fieldset className="crp__field">
            <legend><span>01</span> Which role family is closest to yours?</legend>
            <label className="crp__select-label" htmlFor="crp-role">Role family</label>
            <select id="crp-role" data-testid="select-layoff-role" value={role} onChange={(event) => setRole(event.target.value as RoleFamily | "")}>
              <option value="">Choose a role family</option>
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </fieldset>

          <fieldset className="crp__field">
            <legend><span>02</span> Does this report match your team or location?</legend>
            <div className="crp__choices">
              {([
                ["yes", "Yes", "It matches what I know"],
                ["partial", "Partly", "Some details overlap"],
                ["not-sure", "Not sure", "I cannot confirm the match"],
              ] as const).map(([value, label, description]) => (
                <label className={`crp__choice${match === value ? " is-selected" : ""}`} key={value}>
                  <input
                    type="radio"
                    name="crp-match"
                    value={value}
                    data-testid={`choice-layoff-match-${value}`}
                    checked={match === value}
                    onChange={() => setMatch(value)}
                  />
                  <span className="crp__choice-mark" aria-hidden="true" />
                  <span><strong>{label}</strong><small>{description}</small></span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="crp__field crp__money-fields">
            <legend><span>03</span> A simple view of your monthly runway</legend>
            <p className="crp__field-note">Use your own estimate. No salary, account, or employer details are needed.</p>
            {([
              ["cash", "Accessible cash", "Savings you could use now"],
              ["pay", "Expected one-time pay", "Enter 0 if none is expected"],
              ["essentials", "Essential monthly spend", "Housing, food, bills, and other essentials"],
            ] as const).map(([field, label, hint]) => (
              <div className="crp__money-row" key={field}>
                <label htmlFor={`crp-${field}`} className="crp__money-label">
                  <strong>{label}</strong><small>{hint}</small>
                </label>
                <div className="crp__amount">
                  <span aria-hidden="true">₹</span>
                  <input
                    id={`crp-${field}`}
                    data-testid={`input-layoff-${field}`}
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={money[field]}
                    onChange={(event) => handleMoneyChange(field, event.target.value)}
                    aria-label={`${label}, in rupees`}
                  />
                </div>
              </div>
            ))}
          </fieldset>
        </div>

        <aside className="crp__plan" aria-live="polite" aria-atomic="true">
          <div className="crp__plan-top">
            <span className="crp__eyebrow">YOUR WORKING PLAN</span>
            <span className="crp__plan-index">CR / 01</span>
          </div>
          <section className="crp__evidence" aria-labelledby="crp-evidence-title">
            <p className="crp__section-label" id="crp-evidence-title">What this record establishes</p>
            <p className="crp__summary">{summary}</p>
            <p className="crp__boundary">{statusMeaning(status)}</p>
            <p className="crp__coverage"><strong>Coverage note</strong>{coverageNote}</p>
          </section>

          <section className="crp__runway" aria-labelledby="crp-runway-title">
            <p className="crp__section-label" id="crp-runway-title">Runway estimate</p>
            {runway ? (
              <>
                <strong className="crp__runway-value" data-testid="text-layoff-runway">
                  {runway.months < 1 ? "<1" : runway.months.toFixed(1)}
                  <small> months</small>
                </strong>
                <p className="crp__runway-context">
                  {formatRupees(runway.cash + runway.pay)} available against{" "}
                  {formatRupees(runway.essentials)} in monthly essentials · {runwayBand(runway.months)}.
                </p>
              </>
            ) : (
                <div className="crp__incomplete" data-testid="status-layoff-runway-incomplete">
                <strong>Not enough to estimate yet.</strong>
                <p>
                  {missingMoney.length
                    ? `Add ${missingMoney.join(", ")}${missingMoney.length === 1 ? "" : ""} to see an estimate.`
                    : "Enter monthly essentials above zero to calculate a meaningful estimate."}
                </p>
                <small>A zero cash or pay entry is valid when it reflects your situation.</small>
              </div>
            )}
            <p className="crp__method">Method: runway = (accessible cash + expected one-time pay) ÷ monthly essentials.</p>
          </section>

          <section className="crp__next" aria-labelledby="crp-next-title">
            <p className="crp__section-label" id="crp-next-title">Next steps</p>
            {!match ? (
              <p className="crp__waiting">Choose how closely the report matches your team or location to see relevant next steps.</p>
            ) : runway ? (
              <ol data-testid="list-layoff-next-steps">
                {runwaySteps(runway.months, match).map((step) => <li key={step}>{step}</li>)}
              </ol>
            ) : (
              <ol data-testid="list-layoff-next-steps">
                {runwaySteps(3, match).slice(0, 1).map((step) => <li key={step}>{step}</li>)}
                <li>Complete the runway inputs for practical steps calibrated to your estimate; no prediction is made from this report.</li>
              </ol>
            )}
            {role ? (
              <div className="crp__role-note">
                <span className="crp__section-label">PREPARE FOR YOUR ROLE</span>
                <strong>{roleGuidance[role].heading}</strong>
                <p>{roleGuidance[role].detail}</p>
              </div>
            ) : (
              <p className="crp__waiting crp__role-waiting">Select a role family for practical, confidentiality-safe preparation guidance.</p>
            )}
          </section>

          <p className="crp__disclaimer">
            This is a planning aid, not a layoff prediction or individualized legal or financial advice.
            Verify personal employment questions with an appropriate company contact or qualified local adviser.
          </p>
        </aside>
      </div>
    </section>
  );
}

export default LayoffResponsePlanner;
