export const runwayExpenseCategories = [
  { id: "housing", label: "Housing" },
  { id: "food", label: "Food and household" },
  { id: "utilities", label: "Utilities and phone" },
  { id: "transport", label: "Transport" },
  { id: "healthcare", label: "Healthcare and care" },
  { id: "debt", label: "Loan payments" },
  { id: "other", label: "Other essentials" },
] as const;

export type RunwayExpenseId = (typeof runwayExpenseCategories)[number]["id"];
export type RunwayMonthlyExpenses = Record<RunwayExpenseId, number>;

export type RunwayCashFlowInput = {
  startingCash: number;
  startMonth: string;
  oneTimePay: number;
  oneTimePayMonth: number;
  monthlyIncome: number;
  incomeThroughMonth: number;
  monthlyExpenses: RunwayMonthlyExpenses;
};

export type RunwayMonth = {
  month: number;
  label: string;
  openingBalance: number;
  income: number;
  oneTimePay: number;
  expenses: number;
  closingBalance: number;
};

export type RunwayProjection = {
  monthlyEssentials: number;
  monthlyIncome: number;
  monthlyNetChange: number;
  endBalance: number;
  firstShortfall: RunwayMonth | null;
  rows: RunwayMonth[];
};

const asNonNegativeAmount = (value: number) =>
  Number.isFinite(value) ? Math.max(0, value) : 0;

export function isValidRunwayStartMonth(value: string): boolean {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  return year >= 1900 && year <= 9999;
}

export function projectRunwayCashFlow(input: RunwayCashFlowInput): RunwayProjection {
  if (!isValidRunwayStartMonth(input.startMonth)) {
    throw new RangeError("Choose a valid starting month for the cash-flow projection.");
  }

  const [yearText, monthText] = input.startMonth.split("-");
  const startDate = new Date(Date.UTC(Number(yearText), Number(monthText) - 1, 1));
  const startingCash = asNonNegativeAmount(input.startingCash);
  const monthlyIncome = asNonNegativeAmount(input.monthlyIncome);
  const oneTimePay = asNonNegativeAmount(input.oneTimePay);
  const oneTimePayMonth = Math.trunc(input.oneTimePayMonth);
  const incomeThroughMonth = Math.max(0, Math.min(12, Math.trunc(input.incomeThroughMonth)));
  const monthlyEssentials = Object.values(input.monthlyExpenses)
    .reduce((total, amount) => total + asNonNegativeAmount(amount), 0);

  let openingBalance = startingCash;
  const rows = Array.from({ length: 12 }, (_, index): RunwayMonth => {
    const month = index + 1;
    const date = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + index, 1));
    const income = month <= incomeThroughMonth ? monthlyIncome : 0;
    const payout = month === oneTimePayMonth ? oneTimePay : 0;
    const closingBalance = openingBalance + income + payout - monthlyEssentials;
    const row: RunwayMonth = {
      month,
      label: new Intl.DateTimeFormat("en-IN", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(date),
      openingBalance,
      income,
      oneTimePay: payout,
      expenses: monthlyEssentials,
      closingBalance,
    };
    openingBalance = closingBalance;
    return row;
  });

  return {
    monthlyEssentials,
    monthlyIncome,
    monthlyNetChange: monthlyIncome - monthlyEssentials,
    endBalance: rows[rows.length - 1].closingBalance,
    firstShortfall: rows.find((row) => row.closingBalance < 0) ?? null,
    rows,
  };
}
