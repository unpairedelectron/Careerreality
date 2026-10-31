import { CircleAlert, Database, RefreshCw, ShieldCheck } from "lucide-react";

export type EvidenceMeta = {
  dataset: string;
  refreshedAt: string | null;
  source?: string;
  methodology?: string;
  confidence: string;
  sampleSize?: number;
  coverage?: "complete" | "partial" | "empty";
  qualityNotes?: string[];
};

function formatRefresh(value: string | null): string {
  if (!value) return "Source retrieval date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) || date.getFullYear() < 2000
    ? "Source retrieval date unavailable"
    : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

export function ToolEvidence({
  meta,
  isPending = false,
  isError = false,
  onRetry,
  label = "Live evidence",
}: {
  meta?: EvidenceMeta;
  isPending?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  label?: string;
}) {
  if (isPending) {
    return (
      <div className="mt-5 rounded-[18px] border border-border bg-secondary/25 p-5" data-testid="live-evidence" aria-live="polite">
        <div className="flex items-center gap-2 font-data text-[9px] uppercase tracking-[.15em] text-primary"><RefreshCw size={13} className="animate-spin" /> Refreshing {label.toLowerCase()}</div>
        <p className="mt-3 text-[11px] text-muted-foreground">The result will only appear after the current source responds.</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-5 rounded-[18px] border border-destructive/25 bg-destructive/5 p-5" data-testid="live-evidence" role="alert">
        <div className="flex items-center gap-2 font-data text-[9px] uppercase tracking-[.15em] text-destructive"><CircleAlert size={13} /> {label} unavailable</div>
        <p className="mt-3 text-[12px] leading-[1.65]">No stale result is being shown. Retry when the source is available so the decision does not rely on an unlabelled old signal.</p>
        {onRetry && <button type="button" onClick={onRetry} className="mt-4 inline-flex items-center gap-2 text-[11px] font-bold text-primary" data-testid="button-retry-live-evidence"><RefreshCw size={13} /> Retry source</button>}
      </div>
    );
  }

  if (!meta) return null;

  return (
    <details className="mt-5 rounded-[18px] border border-border bg-card" data-testid="live-evidence">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
        <span className="flex items-center gap-2 font-data text-[9px] uppercase tracking-[.15em] text-primary"><ShieldCheck size={13} /> Evidence behind this result</span>
        <span className="text-right text-[10px] font-bold text-muted-foreground">{meta.confidence} confidence · {formatRefresh(meta.refreshedAt)}</span>
      </summary>
      <div className="grid gap-4 border-t border-border px-5 py-5 text-[11px] leading-[1.65] sm:grid-cols-[.8fr_1.2fr]">
        <div className="space-y-3">
          <p><span className="font-bold">Dataset:</span> <span className="font-data">{meta.dataset}</span></p>
          <p><span className="font-bold">Source:</span> {meta.source ?? "Source details unavailable"}</p>
          <p><span className="font-bold">Latest source retrieval:</span> {formatRefresh(meta.refreshedAt)}</p>
          <p><span className="font-bold">Coverage:</span> {meta.coverage ?? (meta.sampleSize ? "complete" : "empty")}</p>
          <p className="flex items-center gap-2"><Database size={13} className="text-primary" /><span><span className="font-bold">Rows in this read:</span> {meta.sampleSize?.toLocaleString("en-IN") ?? "Unavailable"}</span></p>
        </div>
        <div className="space-y-3 text-muted-foreground">
          <p><span className="font-bold text-foreground">Methodology:</span> {meta.methodology ?? "Methodology details unavailable for this response."}</p>
          {meta.qualityNotes?.map((note) => <p key={note} className="text-destructive"><span className="font-bold">Data quality note:</span> {note}</p>)}
          {meta.coverage === "empty" && <p className="text-destructive">No rows matched this read. Broaden the selection before treating the absence of evidence as evidence of absence.</p>}
        </div>
      </div>
    </details>
  );
}