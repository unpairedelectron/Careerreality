import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import {
  isValidRunwayStartMonth,
  projectRunwayCashFlow,
  runwayExpenseCategories,
  type RunwayExpenseId,
  type RunwayMonthlyExpenses,
} from "@/lib/layoff-cashflow";

type RunwayFormState = {
  cash: string;
  oneTimePay: string;
  oneTimePayMonth: string;
  monthlyIncome: string;
  incomeThroughMonth: string;
  startMonth: string;
  expenses: Record<RunwayExpenseId, string>;
};

const emptyExpenses: Record<RunwayExpenseId, string> = {
  housing: "",
  food: "",
  utilities: "",
  transport: "",
  healthcare: "",
  debt: "",
  other: "",
};

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function amount(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function formatRupees(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function MonthSelect({ label, value, onChange, allowNone = false, testId }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  allowNone?: boolean;
  testId: string;
}) {
  return (
    <label className="runway-detail-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} data-testid={testId}>
        {allowNone && <option value="0">No continuing income</option>}
        {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
          <option value={month} key={month}>{allowNone ? `Through month ${month}` : `Month ${month}`}</option>
        ))}
      </select>
    </label>
  );
}

export function LayoffRunwayCalculator() {
  const [form, setForm] = useState<RunwayFormState>(() => ({
    cash: "",
    oneTimePay: "",
    oneTimePayMonth: "1",
    monthlyIncome: "",
    incomeThroughMonth: "0",
    startMonth: currentMonth(),
    expenses: { ...emptyExpenses },
  }));

  const numericExpenses = useMemo(() => Object.fromEntries(
    runwayExpenseCategories.map(({ id }) => [id, amount(form.expenses[id])]),
  ) as RunwayMonthlyExpenses, [form.expenses]);
  const hasFinancialInput = amount(form.cash) > 0
    || amount(form.oneTimePay) > 0
    || amount(form.monthlyIncome) > 0
    || Object.values(numericExpenses).some((value) => value > 0);
  const validStartMonth = isValidRunwayStartMonth(form.startMonth);
  const projection = useMemo(() => {
    if (!hasFinancialInput || !validStartMonth) return null;
    return projectRunwayCashFlow({
      startingCash: amount(form.cash),
      startMonth: form.startMonth,
      oneTimePay: amount(form.oneTimePay),
      oneTimePayMonth: Number(form.oneTimePayMonth),
      monthlyIncome: amount(form.monthlyIncome),
      incomeThroughMonth: Number(form.incomeThroughMonth),
      monthlyExpenses: numericExpenses,
    });
  }, [form, hasFinancialInput, numericExpenses, validStartMonth]);

  function setField<K extends keyof Omit<RunwayFormState, "expenses">>(key: K, value: RunwayFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setExpense(id: RunwayExpenseId, value: string) {
    setForm((current) => ({ ...current, expenses: { ...current.expenses, [id]: value } }));
  }

  return (
    <div className="money-calculator" data-testid="calculator-monthly-cash-flow">
      <div className="money-card-head">
        <span>YOUR PRIVATE WORKSHEET</span>
        <span>12-MONTH CASH FLOW · ₹</span>
      </div>

      <div className="runway-input-section">
        <p className="runway-section-label">01 / Starting position</p>
        <div className="runway-start-grid">
          <label className="runway-detail-field">
            <span>Cash you can access</span>
            <small>Savings available for living costs</small>
            <div className="money-input"><span>₹</span><input type="number" min="0" step="1" inputMode="numeric" value={form.cash} onChange={(event) => setField("cash", event.target.value)} placeholder="0" data-testid="input-money-cash" /></div>
          </label>
          <label className="runway-detail-field">
            <span>Starting month</span>
            <small>The first month in the projection</small>
            <input type="month" value={form.startMonth} onChange={(event) => setField("startMonth", event.target.value)} data-testid="input-runway-start-month" />
          </label>
          <label className="runway-detail-field">
            <span>Expected one-time pay</span>
            <small>Only include an amount you have a basis to expect</small>
            <div className="money-input"><span>₹</span><input type="number" min="0" step="1" inputMode="numeric" value={form.oneTimePay} onChange={(event) => setField("oneTimePay", event.target.value)} placeholder="0" data-testid="input-money-severance" /></div>
          </label>
          <MonthSelect label="Expected payment month" value={form.oneTimePayMonth} onChange={(value) => setField("oneTimePayMonth", value)} testId="select-runway-payout-month" />
        </div>
      </div>

      <div className="runway-input-section">
        <p className="runway-section-label">02 / Monthly money in</p>
        <div className="runway-start-grid">
          <label className="runway-detail-field">
            <span>Continuing monthly income</span>
            <small>Net income you expect to receive</small>
            <div className="money-input"><span>₹</span><input type="number" min="0" step="1" inputMode="numeric" value={form.monthlyIncome} onChange={(event) => setField("monthlyIncome", event.target.value)} placeholder="0" data-testid="input-runway-monthly-income" /></div>
          </label>
          <MonthSelect label="Income continues through" value={form.incomeThroughMonth} onChange={(value) => setField("incomeThroughMonth", value)} allowNone testId="select-runway-income-end-month" />
        </div>
      </div>

      <div className="runway-input-section">
        <p className="runway-section-label">03 / Essential monthly spending</p>
        <p className="runway-helper">Break the total into categories so you can see which assumptions drive the projection.</p>
        <div className="runway-expense-grid">
          {runwayExpenseCategories.map(({ id, label }) => (
            <label className="runway-detail-field" key={id}>
              <span>{label}</span>
              <div className="money-input"><span>₹</span><input type="number" min="0" step="1" inputMode="numeric" value={form.expenses[id]} onChange={(event) => setExpense(id, event.target.value)} placeholder="0" data-testid={`input-runway-expense-${id}`} /></div>
            </label>
          ))}
        </div>
      </div>

      <section className="runway-forecast" aria-labelledby="runway-forecast-title" data-testid="section-runway-forecast">
        <div className="runway-forecast-head">
          <div>
            <p className="runway-section-label">04 / Month-by-month view</p>
            <h3 id="runway-forecast-title">See what changes over time.</h3>
          </div>
          <span className="runway-horizon">12 MONTHS</span>
        </div>

        {!validStartMonth ? (
          <p className="runway-empty" role="status">Choose a starting month to build the projection.</p>
        ) : !projection ? (
          <p className="runway-empty" role="status">Add cash, income, or one expense amount to see the monthly projection.</p>
        ) : (
          <>
            <div className="runway-summary-grid" aria-live="polite">
              <div><span>Monthly essentials</span><strong>{formatRupees(projection.monthlyEssentials)}</strong></div>
              <div><span>Monthly income</span><strong>{formatRupees(projection.monthlyIncome)}</strong></div>
              <div><span>Cash after month 12</span><strong className={projection.endBalance < 0 ? "is-negative" : ""}>{formatRupees(projection.endBalance)}</strong></div>
            </div>
            <p className={`runway-outcome${projection.firstShortfall ? " is-negative" : ""}`} data-testid="text-runway-outcome">
              {projection.firstShortfall
                ? `At these inputs, the month-end balance first falls below ₹0 in ${projection.firstShortfall.label}. The projected gap is ${formatRupees(Math.abs(projection.firstShortfall.closingBalance))} at that month end.`
                : "At these inputs, the projection stays at or above ₹0 through month 12."}
            </p>
            <p className="runway-table-hint">Scroll horizontally to see all columns on a small screen.</p>
            <div className="runway-table-wrap" role="region" aria-label="Scrollable 12-month cash-flow projection" tabIndex={0}>
              <table className="runway-table" data-testid="table-runway-projection">
                <thead><tr><th scope="col">Month</th><th scope="col">Opening</th><th scope="col">Income</th><th scope="col">One-time pay</th><th scope="col">Essentials</th><th scope="col">Month end</th></tr></thead>
                <tbody>
                  {projection.rows.map((row) => (
                    <tr key={row.month} className={row.closingBalance < 0 ? "is-shortfall" : ""} data-testid={`row-runway-month-${row.month}`}>
                      <th scope="row">{row.label}</th>
                      <td>{formatRupees(row.openingBalance)}</td>
                      <td>{formatRupees(row.income)}</td>
                      <td>{formatRupees(row.oneTimePay)}</td>
                      <td>{formatRupees(row.expenses)}</td>
                      <td>{formatRupees(row.closingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <p className="runway-assumption-note">This is a month-level arithmetic projection. It holds monthly income and essentials constant, does not model tax or exact payment dates within a month, and cannot predict when you will find work.</p>
      <p className="money-privacy"><ShieldCheck size={14} aria-hidden="true" /> Your entries stay in page memory only. They are not saved, shared in a link, sent to an API, or added to analytics; reloading clears them.</p>
    </div>
  );
}
