/**
 * Payslip-style ledger: earnings, deductions and take-home in two comparable columns.
 * Built as a real table so screen readers announce row and column headers.
 */
type Pair = readonly [number | null, number | null];

export type LedgerRow = {
  label: string;
  note?: string;
  values: Pair;
  /** Deductions are shown with a minus sign. */
  deduct?: boolean;
  testId?: string;
};

export type LedgerSection = {
  title: string;
  rows: LedgerRow[];
  subtotal: { label: string; values: Pair; deduct?: boolean };
};

type PayslipLedgerProps = {
  caption: string;
  kicker: string;
  columns: readonly [string, string];
  sections: LedgerSection[];
  total: { label: string; values: Pair };
  monthly: { label: string; values: Pair };
  footnote: string;
  format: (value: number) => string;
};

const MINUS = "−";

function Amount({ value, deduct, format }: { value: number | null; deduct?: boolean; format: (value: number) => string }) {
  if (value === null) return <span aria-label="Not applicable">—</span>;
  return <>{deduct && value > 0 ? `${MINUS}${format(value)}` : format(value)}</>;
}

export function PayslipLedger({ caption, kicker, columns, sections, total, monthly, footnote, format }: PayslipLedgerProps) {
  const cell = "w-[1%] whitespace-nowrap py-2.5 pl-3 text-right align-top font-data tabular-nums";
  return (
    <div className="min-w-0 rounded-[16px_16px_16px_4px] border border-border bg-background/70 p-4 sm:p-5" data-testid="payslip-ledger">
      <p className="font-data text-[9px] uppercase tracking-[.15em] text-primary">{kicker}</p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[300px] border-collapse text-left text-[11px] sm:text-[12px]">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-foreground/25 text-muted-foreground">
              <th scope="col" className="py-2 pr-2 font-data text-[9px] font-medium uppercase tracking-[.12em]">Item · per year</th>
              {columns.map((column) => <th key={column} scope="col" className="w-[1%] whitespace-nowrap py-2 pl-3 text-right font-data text-[9px] font-medium uppercase tracking-[.12em]">{column}</th>)}
            </tr>
          </thead>
          {sections.map((section) => (
            <tbody key={section.title}>
              <tr>
                <th scope="colgroup" colSpan={3} className="pb-1 pt-4 font-data text-[9px] font-semibold uppercase tracking-[.15em] text-foreground">{section.title}</th>
              </tr>
              {section.rows.map((row) => (
                <tr key={row.label} className="border-b border-dashed border-border" data-testid={row.testId}>
                  <th scope="row" className="py-2.5 pr-2 align-top font-normal">
                    <span className="font-semibold">{row.label}</span>
                    {row.note && <span className="mt-0.5 block text-[10px] leading-[1.45] text-muted-foreground">{row.note}</span>}
                  </th>
                  {row.values.map((value, index) => <td key={index} className={cell}><Amount value={value} deduct={row.deduct} format={format} /></td>)}
                </tr>
              ))}
              <tr className="border-t border-foreground/40">
                <th scope="row" className="py-2.5 pr-2 text-left font-semibold">{section.subtotal.label}</th>
                {section.subtotal.values.map((value, index) => <td key={index} className={`${cell} font-semibold`}><Amount value={value} deduct={section.subtotal.deduct} format={format} /></td>)}
              </tr>
            </tbody>
          ))}
          <tfoot>
            <tr className="border-t-[3px] border-double border-foreground/70" data-testid="ledger-annual-take-home">
              <th scope="row" className="pb-1 pr-2 pt-3 text-left font-display text-[1.05rem] font-normal tracking-[-.02em] sm:text-[1.2rem]">{total.label}</th>
              {total.values.map((value, index) => <td key={index} className={`${cell} pt-3 text-[12px] font-bold text-primary sm:text-[13px]`}><Amount value={value} format={format} /></td>)}
            </tr>
            <tr data-testid="ledger-monthly-take-home">
              <th scope="row" className="pb-1 pr-2 text-left font-normal text-muted-foreground">{monthly.label}</th>
              {monthly.values.map((value, index) => <td key={index} className={`${cell} py-1 font-semibold text-foreground`}><Amount value={value} format={format} /></td>)}
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="mt-3 border-t border-border pt-3 text-[10px] leading-[1.55] text-muted-foreground">{footnote}</p>
    </div>
  );
}
