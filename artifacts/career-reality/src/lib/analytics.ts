type AnalyticsData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: {
      track(name: string, data?: AnalyticsData): void;
    };
  }
}

export function trackEvent(name: string, data?: AnalyticsData): void {
  if (typeof window === "undefined") return;

  try {
    window.umami?.track(name, data);
  } catch {
    // Analytics must never interrupt a user flow.
  }
}

export function trackNextAction(_catalogSlug?: string): void {
  if (typeof window === "undefined") return;

  trackEvent("next_action_selected", {
    route: window.location.pathname,
  });
}

const measurableToolIds = new Set([
  "ctc-calculator",
  "offer-comparison",
  "tax-regime-comparison",
  "gratuity-estimator",
  "final-pay-estimator",
  "layoff-runway",
  "home-loan-stress-test",
  "resign-or-stay",
  "employer-due-diligence",
]);

/** Completion events contain only a fixed tool ID; never pass form values here. */
export function trackDecisionToolCompletion(toolId: string): void {
  if (!measurableToolIds.has(toolId)) return;
  trackEvent("decision_tool_completed", { tool_id: toolId, platform: "web" });
}