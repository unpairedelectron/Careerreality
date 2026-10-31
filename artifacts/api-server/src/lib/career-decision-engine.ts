import type { CareerBrief } from "@workspace/api-zod";

type Confidence = CareerBrief["confidence"];
type Evidence = CareerBrief["evidence"][number];
type CareerDecision = Omit<CareerBrief, "whatChanged">;

export type DecisionProfile = {
  role: string;
  company: string;
  city: string;
  experience: string;
  ctc: string;
  situation: string;
  target: string;
  resumeStatus?: string | null;
  resumeData?: unknown;
  resumeUpdatedAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

export type SalarySignal = {
  role: string;
  city: string;
  experienceBand: string;
  p25: number;
  median: number;
  p75: number;
  sampleSize: number;
  source: string;
  confidence: string;
  refreshedAt: Date | string;
};

export type CompanySignal = {
  name: string;
  stability: number;
  momentum: string;
  signal: string;
  source: string;
  confidence: string;
  refreshedAt: Date | string;
};

export type WatchSignal = {
  company: string;
  signal: string;
  type: string;
  source: string;
  confidence: string;
  refreshedAt: Date | string;
};

export type LiveJobMarketSignal = {
  status: "available" | "unavailable";
  count: number;
  scope: string;
  source: string;
  confidence: string;
  refreshedAt?: Date | string;
};

type ResumeSignals = {
  skills: string[];
  roles: string[];
  employers: string[];
  yearsExperience: number | null;
};

type SalaryMatch = {
  signal: SalarySignal;
  kind: "role" | "experience";
  score: number;
  roleSimilarity: number;
  cityMatch: boolean;
  experienceMatch: boolean;
};

type Direction = "expand" | "switch" | "stay" | "independent" | "relocate" | "observe";
type Situation = "urgent" | "searching" | "stable" | "unclear";

const ROLE_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "at",
  "for",
  "in",
  "lead",
  "level",
  "manager",
  "of",
  "role",
  "senior",
  "the",
  "to",
]);

const ROLE_ALIASES: Record<string, string> = {
  developer: "engineer",
  developers: "engineer",
  engineering: "engineer",
  "software development": "engineer",
  pm: "product",
  "product owner": "product",
  sre: "devops",
  "user experience": "ux",
  "user interface": "ui",
};

function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9\s/+.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value: string): string[] {
  const normalized = normalize(value);
  const expanded = Object.entries(ROLE_ALIASES).reduce(
    (result, [alias, canonical]) => result.replace(alias, canonical),
    normalized,
  );
  return [
    ...new Set(
      expanded
        .split(/[\s/+.&-]+/)
        .filter((token) => token.length > 1 && !ROLE_STOP_WORDS.has(token)),
    ),
  ];
}

function roleSimilarity(left: string, right: string): number {
  const leftTokens = tokens(left);
  const rightTokens = tokens(right);
  if (!leftTokens.length || !rightTokens.length) return 0;
  const overlap = leftTokens.filter((token) => rightTokens.includes(token)).length;
  const score = overlap / Math.max(leftTokens.length, rightTokens.length);
  return normalize(left).includes(normalize(right)) || normalize(right).includes(normalize(left))
    ? Math.max(score, 0.8)
    : score;
}

function cityKey(value: string): string {
  const city = normalize(value);
  if (city.includes("bengaluru") || city.includes("bangalore")) return "bengaluru";
  if (city.includes("mumbai") || city.includes("bombay")) return "mumbai";
  if (city.includes("delhi") || city.includes("new delhi") || city.includes("ncr")) return "delhi ncr";
  if (city.includes("hyderabad")) return "hyderabad";
  if (city.includes("pune")) return "pune";
  return city;
}

function experienceBand(value: string): string {
  const years = Number(normalize(value).match(/\d+(?:\.\d+)?/)?.[0] ?? 0);
  if (years <= 2) return "0–2 years";
  if (years <= 5) return "3–5 years";
  if (years <= 8) return "5–8 years";
  return "9+ years";
}

function parseAnnualCtc(value: string): number | null {
  const normalized = normalize(value).replace(/,/g, "");
  const amount = Number(normalized.match(/\d+(?:\.\d+)?/)?.[0] ?? 0);
  if (!amount) return null;
  if (normalized.includes("crore") || normalized.includes(" cr")) return amount * 10_000_000;
  if (normalized.includes("lakh") || normalized.includes(" lac") || normalized.includes(" lpa") || /\b\d+(?:\.\d+)?\s*l\b/.test(normalized)) {
    return amount * 100_000;
  }
  return amount >= 100_000 ? amount : amount * 100_000;
}

function ageLabel(value: Date | string, now: Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Freshness unknown";
  const days = Math.max(0, Math.round((now.getTime() - date.getTime()) / 86_400_000));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 20)
    : [];
}

function readResumeSignals(value: unknown): ResumeSignals | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const signals = {
    skills: asStringArray(data.skills),
    roles: asStringArray(data.roles),
    employers: asStringArray(data.employers),
    yearsExperience: typeof data.yearsExperience === "number" ? data.yearsExperience : null,
  };
  return signals.skills.length || signals.roles.length || signals.employers.length ? signals : null;
}

function classifyDirection(target: string): Direction {
  const value = normalize(target);
  if (/(switch|change|pivot|transition|new domain|move into)/.test(value)) return "switch";
  if (/(freelance|consult|independent|founder|startup)/.test(value)) return "independent";
  if (/(relocat|remote|abroad|overseas|move to)/.test(value)) return "relocate";
  if (/(stay|same role|deepen|individual contributor|ic|continue)/.test(value)) return "stay";
  if (/(promot|manager|lead|director|head|bigger scope|larger remit|principal|staff)/.test(value)) return "expand";
  return "observe";
}

function classifySituation(situation: string): Situation {
  const value = normalize(situation);
  if (/(laid off|jobless|unemployed|notice period|role ended|redundant)/.test(value)) return "urgent";
  if (/(not looking|not searching|happy|satisfied|stable|secure)/.test(value)) return "stable";
  if (/(interview|searching|looking|applying|offer|between jobs)/.test(value)) return "searching";
  return "unclear";
}

function matchSalary(profile: DecisionProfile, rows: SalarySignal[]): SalaryMatch | null {
  const band = experienceBand(profile.experience);
  const direction = classifyDirection(profile.target);
  const city = cityKey(profile.city);
  const candidates = rows
    .map((signal) => {
      const currentSimilarity = roleSimilarity(profile.role, signal.role);
      const targetSimilarity = roleSimilarity(profile.target, signal.role);
      const roleScore = direction === "switch"
        ? Math.max(targetSimilarity, currentSimilarity * 0.55)
        : Math.max(currentSimilarity, targetSimilarity * 0.45);
      const cityMatch = cityKey(signal.city) === city;
      const experienceMatch = signal.experienceBand === band;
      const score = roleScore * 60 + (cityMatch ? 25 : 0) + (experienceMatch ? 15 : 0);
      return { signal, kind: roleScore >= 0.25 ? "role" as const : "experience" as const, score, roleSimilarity: roleScore, cityMatch, experienceMatch };
    })
    .filter((candidate) => candidate.cityMatch && candidate.experienceMatch && candidate.roleSimilarity >= 0.25)
    .sort((left, right) => right.score - left.score);
  if (candidates[0]) return candidates[0];

  const experienceFallback = rows
    .map((signal) => ({
      signal,
      kind: "experience" as const,
      score: (cityKey(signal.city) === city ? 20 : 0) + (signal.experienceBand === band ? 10 : 0),
      roleSimilarity: 0,
      cityMatch: cityKey(signal.city) === city,
      experienceMatch: signal.experienceBand === band,
    }))
    .filter((candidate) => candidate.cityMatch && candidate.experienceMatch)
    .sort((left, right) => right.score - left.score);
  return experienceFallback[0] ?? null;
}

function compensationPosition(ctc: number | null, signal: SalarySignal): "below" | "within" | "above" | null {
  if (ctc === null) return null;
  if (ctc < signal.p25) return "below";
  if (ctc > signal.p75) return "above";
  return "within";
}

function signalConfidence(value: string, sampleSize?: number): Evidence["confidence"] {
  if (sampleSize !== undefined && sampleSize < 10) return "Low";
  if (value === "High" || value === "Medium" || value === "Low" || value === "Mixed") return value;
  return "Low";
}

function overallConfidence(
  match: SalaryMatch | null,
  company: CompanySignal | undefined,
  watch: WatchSignal | undefined,
  liveJobMarket: LiveJobMarketSignal | undefined,
): Confidence {
  const strongMarket = Boolean(match?.kind === "role" && match.signal.sampleSize >= 10 && match.signal.confidence === "High");
  const corroborated = Boolean(company || watch || liveJobMarket?.status === "available");
  if (strongMarket && corroborated) return "High";
  if (match?.kind === "role" || corroborated) return "Medium";
  return "Low";
}

function directionLabel(direction: Direction): string {
  return {
    expand: "a larger remit",
    switch: "a role change",
    stay: "deeper leverage where you are",
    independent: "independent or consulting work",
    relocate: "a location change",
    observe: "your next direction",
  }[direction];
}

export function buildCareerDecision(input: {
  profile: DecisionProfile;
  salaryRows: SalarySignal[];
  company?: CompanySignal;
  watch?: WatchSignal;
  liveJobMarket?: LiveJobMarketSignal;
  now?: Date;
}): CareerDecision {
  const { profile, salaryRows, company, watch, liveJobMarket } = input;
  const now = input.now ?? new Date();
  const direction = classifyDirection(profile.target);
  const situation = classifySituation(profile.situation);
  const match = matchSalary(profile, salaryRows);
  const ctc = parseAnnualCtc(profile.ctc);
  const payPosition = match ? compensationPosition(ctc, match.signal) : null;
  const resume = profile.resumeStatus === "ready" ? readResumeSignals(profile.resumeData) : null;
  const evidence: Evidence[] = [];

  if (match) {
    const scope = match.kind === "role"
      ? `${match.signal.role} in ${match.signal.city} for ${match.signal.experienceBand}`
      : `${match.signal.city} ${match.signal.experienceBand} baseline; role match is not precise`;
    const payPositionText = payPosition === "below"
      ? " Your stated CTC is below the lower quartile."
      : payPosition === "above"
        ? " Your stated CTC is above the upper quartile."
        : "";
    evidence.push({
      label: "Market pay",
      value: `₹${Math.round(match.signal.median / 100000) / 10}L median for ${scope}.${payPositionText}`,
      source: match.signal.source,
      freshness: ageLabel(match.signal.refreshedAt, now),
      confidence: signalConfidence(match.signal.confidence, match.signal.sampleSize),
    });
  }
  if (company) {
    evidence.push({
      label: "Company signal",
      value: `${company.momentum} momentum · ${company.stability}/100 stability · ${company.signal}`,
      source: company.source,
      freshness: ageLabel(company.refreshedAt, now),
      confidence: signalConfidence(company.confidence),
    });
  }
  if (watch) {
    evidence.push({
      label: "Company watch",
      value: `${watch.type}: ${watch.signal}`,
      source: watch.source,
      freshness: ageLabel(watch.refreshedAt, now),
      confidence: signalConfidence(watch.confidence),
    });
  }
  if (liveJobMarket?.status === "available") {
    evidence.push({
      label: "Live role demand",
      value: `${liveJobMarket.count} direct-employer listings matched ${liveJobMarket.scope} in the last 14 days. This is a demand signal, not a hiring guarantee.`,
      source: liveJobMarket.source,
      freshness: liveJobMarket.refreshedAt ? ageLabel(liveJobMarket.refreshedAt, now) : "Freshness unknown",
      confidence: signalConfidence(liveJobMarket.confidence, liveJobMarket.count),
    });
  } else if (liveJobMarket?.status === "unavailable") {
    evidence.push({
      label: "Live role demand",
      value: `Current listings for ${liveJobMarket.scope} could not be verified. No stale demand signal is shown.`,
      source: liveJobMarket.source,
      freshness: "Unavailable",
      confidence: "Low",
    });
  }
  if (resume) {
    const details = [
      resume.skills.length ? `${resume.skills.length} skills` : "",
      resume.roles.length ? `${resume.roles.length} role signals` : "",
      resume.employers.length ? `${resume.employers.length} employer signals` : "",
    ].filter(Boolean).join(" · ");
    evidence.push({
      label: "Resume context",
      value: `Resume extraction found ${details || "career evidence"}; use it to test fit, not to infer outcomes.`,
      source: "Resume extraction",
      freshness: profile.resumeUpdatedAt ? ageLabel(profile.resumeUpdatedAt, now) : "Freshness unknown",
      confidence: "Medium",
    });
  }
  if (!evidence.length) {
    evidence.push({
      label: "Profile baseline",
      value: "No scoped market signal matched this profile yet. Unknown is kept visible.",
      source: "CareerReality profile",
      freshness: profile.updatedAt ? ageLabel(profile.updatedAt, now) : "Freshness unknown",
      confidence: "Low",
    });
  }

  const riskSignal = Boolean(watch || (company && (company.stability <= 45 || /declin|weak|freeze|restructur/i.test(company.momentum))));
  const urgencyPrefix = situation === "urgent"
    ? "Your immediate priority is runway and credible options, not a promotion case."
    : situation === "searching"
      ? "Because you are already searching, the next test should produce evidence you can use in live applications."
      : "";
  const marketSentence = match
    ? payPosition === "below"
      ? `Your stated compensation sits below the lower quartile of the ${match.signal.role} range in ${match.signal.city}; scope and measurable impact are the evidence needed to close that gap.`
      : payPosition === "above"
        ? `Your stated compensation is already above the ${match.signal.role} upper quartile in ${match.signal.city}; the next move should be justified by scope, not a market-number chase.`
        : `Your stated compensation sits inside the ${match.signal.role} range in ${match.signal.city}; the next move should be judged by scope and direction, not title motion alone.`
    : "The market read is not precise enough to compare compensation honestly; improve the role or location match before acting on a number.";
  const companySentence = riskSignal
    ? `A current company watch signal raises the value of verifying runway and keeping an external option warm.`
    : company
      ? `The company signal is ${company.momentum.toLowerCase()} with ${company.stability}/100 stability; it is context, not proof of your team-level reality.`
      : "No current company signal matched, so team-level risk remains unknown.";
  const demandSentence = liveJobMarket?.status === "available"
    ? `Live role demand returned ${liveJobMarket.count} direct-employer listings for ${liveJobMarket.scope}; availability is a demand signal, not proof of fit or an offer.`
    : "Live role demand could not be verified for this read, so no current listing signal is treated as fact.";
  const resumeSentence = resume
    ? `Your resume adds ${resume.skills.length ? `${resume.skills.length} skill` : "some"} evidence, but it does not establish sponsorship, impact, or hiring demand by itself.`
    : "Manager sponsorship, team conditions, and the strength of your proof remain unknown.";

  let headline = "Make the next move easier to defend.";
  if (situation === "urgent" || riskSignal) headline = "Protect your runway before you optimize the move.";
  else if (direction === "switch") headline = "Build a proof-backed path into the new role.";
  else if (direction === "independent") headline = "Turn your repeatable value into independent leverage.";
  else if (direction === "relocate") headline = "Compare the move before you commit to the location.";
  else if (direction === "expand") headline = "Turn current impact into a larger remit.";
  else if (payPosition === "below") headline = "Close the compensation gap with evidence.";
  else if (direction === "stay") headline = "Use current momentum to deepen your leverage.";

  let nextMove: string;
  if (situation === "urgent") {
    nextMove = `Set a minimum runway and produce one ${directionLabel(direction)} proof point this week; use it to target three credible options without resigning on a single public signal.`;
  } else if (direction === "switch") {
    nextMove = `Translate your ${profile.role} experience into one case study for ${profile.target}, then test that proof against three real roles before investing in a broad switch.`;
  } else if (direction === "independent") {
    nextMove = `Package one repeatable outcome from your ${profile.role} work, speak to three potential buyers, and record what they would actually pay for.`;
  } else if (direction === "relocate") {
    nextMove = `Compare the same role across ${profile.city} and your target location on pay, demand, and runway before treating relocation as the solution.`;
  } else if (direction === "stay") {
    nextMove = `Choose one measurable outcome in your current role, make its scope visible, and use it to decide whether staying creates more leverage than moving.`;
  } else if (payPosition === "below") {
    nextMove = `Document one measurable outcome that connects your ${profile.role} work to ${directionLabel(direction)}, then use it to test three roles and a compensation conversation.`;
  } else {
    nextMove = `Document one measurable outcome that connects your ${profile.role} to ${directionLabel(direction)}, then test it against three real roles this month.`;
  }

  const newest = evidence
    .map((item) => item.freshness)
    .find((value) => value !== "Freshness unknown") ?? "Freshness unknown";
  return {
    headline,
    diagnosis: [urgencyPrefix, marketSentence, companySentence, demandSentence, resumeSentence].filter(Boolean).join(" "),
    nextMove,
    freshness: newest,
    confidence: overallConfidence(match, company, watch, liveJobMarket),
    evidence,
  };
}