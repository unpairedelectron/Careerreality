export const defaultLcpBudgetMs = 2_000;
export const defaultClsBudget = 0.1;
export const runCount = 3;
export const observationWindowMs = 8_000;

export function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

export function range(values, divisor = 1, digits = 2) {
  return `${(Math.min(...values) / divisor).toFixed(digits)}–${(Math.max(...values) / divisor).toFixed(digits)}`;
}

function numeric(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`Lighthouse report is missing a valid ${label}.`);
  }
  return value;
}

export function evaluateAudits(runs, lcpBudgetMs = defaultLcpBudgetMs, clsBudget = defaultClsBudget) {
  if (runs.length < runCount) throw new Error("At least three Lighthouse runs are required.");
  if (!Number.isFinite(lcpBudgetMs) || lcpBudgetMs <= 0) throw new Error("Invalid LCP budget.");
  if (!Number.isFinite(clsBudget) || clsBudget < 0) throw new Error("Invalid CLS budget.");
  const metrics = { scores: [], lcp: [], fcp: [], cls: [] };
  const clerkUrls = new Set();
  for (const { report, devtoolsLog } of runs) {
    if (report.runtimeError) throw new Error(`Lighthouse runtime error: ${report.runtimeError.message}`);
    metrics.scores.push(numeric(report.categories?.performance?.score, "performance score") * 100);
    for (const [key, id] of [
      ["lcp", "largest-contentful-paint"],
      ["fcp", "first-contentful-paint"],
      ["cls", "cumulative-layout-shift"],
    ]) {
      metrics[key].push(numeric(report.audits?.[id]?.numericValue, id));
    }
    // The raw request events also catch failed requests absent from completed-resource audits.
    if (!Array.isArray(devtoolsLog) || !devtoolsLog.some((entry) => entry.method === "Network.requestWillBeSent")) {
      throw new Error("Lighthouse is missing raw network request events; cannot verify the Clerk boundary.");
    }
    for (const entry of devtoolsLog) {
      const url = entry.method === "Network.requestWillBeSent" ? entry.params?.request?.url : null;
      if (typeof url === "string" && /clerk/i.test(url)) clerkUrls.add(url);
    }
  }
  const medianLcpMs = median(metrics.lcp);
  const maxCls = Math.max(...metrics.cls);
  const failures = [];
  if (medianLcpMs > lcpBudgetMs) {
    failures.push(`median LCP ${(medianLcpMs / 1000).toFixed(2)} s exceeded the ${(lcpBudgetMs / 1000).toFixed(2)} s budget`);
  }
  if (maxCls > clsBudget) {
    failures.push(`CLS ${maxCls.toFixed(3)} exceeded the ${clsBudget.toFixed(3)} budget in at least one run`);
  }
  if (clerkUrls.size) failures.push(`Clerk request(s) observed: ${[...clerkUrls].join(", ")}`);
  return { ...metrics, medianLcpMs, maxCls, lcpBudgetMs, clsBudget, clerkUrls: [...clerkUrls], failures };
}
