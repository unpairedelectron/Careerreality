export const JOB_POSTING_TEXT_LIMIT = 20_000;
export const RESUME_TEXT_LIMIT = 30_000;

export type JobEvidenceStatus =
  | "direct"
  | "transferable"
  | "partial"
  | "not-documented"
  | "confirmed-gap"
  | "unresolved";

export type JobRequirementCategory =
  | "responsibility"
  | "essential-competency"
  | "eligibility"
  | "qualification"
  | "preferred"
  | "contextual-tool"
  | "unclear";

export type JobEvidenceSource = "candidate-authored" | "role-text" | "unknown";

export type JobRequirement = {
  id: string;
  text: string;
  category: JobRequirementCategory;
  signal: "mandatory" | "preferred" | "ambiguous";
  confidence: "high" | "medium" | "low";
  evidenceStatus: JobEvidenceStatus;
  evidenceQuote: string | null;
  evidenceQuoteSource: JobEvidenceSource | null;
  conflictingDenialQuote: string | null;
  conflictingDenialQuoteSource: JobEvidenceSource | null;
  evidenceReason: string;
  flags: string[];
  nextStep: string;
  recruiterQuestion: string;
};

export type JobPostingAnalysis = {
  requirements: JobRequirement[];
  notes: string[];
  warnings: string[];
};

export class ResumeTextNeedsReviewError extends Error {
  constructor() {
    super("Review or correct the resume text before classifying evidence.");
    this.name = "ResumeTextNeedsReviewError";
  }
}

const headings = new Set([
  "about the role", "about you", "responsibilities", "what you will do",
  "what you will bring", "requirements", "qualifications", "must have",
  "nice to have", "preferred qualifications", "our expectations",
]);

const stopWords = new Set([
  "and", "the", "for", "with", "from", "that", "this", "your", "you", "our",
  "will", "have", "has", "are", "was", "were", "into", "using", "use", "work",
  "working", "years", "year", "experience", "ability", "strong", "excellent",
  "good", "proven", "required", "preferred", "must", "should", "plus", "such",
  "including", "across", "within", "team", "teams", "role", "responsible",
  "responsibilities", "build", "building", "develop", "developing", "design",
  "designing", "manage", "managing", "lead", "leading", "deliver", "delivering",
  "maintain", "maintaining", "support", "supporting", "create", "creating",
]);

const knownTerms = [
  "javascript", "typescript", "python", "java", "sql", "postgresql", "kubernetes",
  "docker", "terraform", "machine learning", "data engineering", "data analysis",
  "stakeholder management", "project management", "communication", "cloud",
  "aws", "azure", "gcp", "react", "node.js", "power bi", "tableau", "excel",
  "salesforce", "rest api", "jira", "selenium", "cypress", "healthcare domain knowledge",
  "requirements gathering", "user stories", "test planning", "regression testing",
  "data cleaning", "dashboards", "stakeholder communication",
];

const termAliases: Record<string, string[]> = {
  sql: ["sql", "structured query language", "writing sql queries", "sql queries"],
  postgresql: ["postgres", "postgresql"],
  kubernetes: ["kubernetes", "k8s"],
  javascript: ["javascript", "js"],
  typescript: ["typescript", "ts"],
  "rest api": ["rest api", "rest apis", "restful api", "restful apis"],
  "node.js": ["node.js", "nodejs", "node js"],
  "requirements gathering": ["requirements gathering", "gathering requirements", "gather business requirements"],
  "user stories": ["user stories"],
  "test planning": ["test planning", "test plans"],
  "regression testing": ["regression testing", "regression tests"],
  "data cleaning": ["data cleaning", "cleaning data", "cleaned data", "cleaned datasets", "cleaning datasets"],
  dashboards: ["dashboards", "dashboard"],
  "stakeholder communication": ["stakeholder communication", "stakeholder communications"],
};

const semanticEvidenceVariants: Record<string, RegExp[]> = {
  "test planning": [
    /\bcreat(?:e|es|ed|ing)\b[^.!?;\n]{0,32}\btest plans?\b/i,
  ],
  "regression testing": [
    /\b(?:execut(?:e|es|ed|ing)|run|runs|ran)\b[^.!?;\n]{0,32}\b(?:manual )?regression tests?\b/i,
  ],
  "data cleaning": [
    /\bclean(?:s|ed|ing)?\b[^.!?;\n]{0,24}\b(?:data|datasets?)\b/i,
    /\b(?:data|datasets?)\b[^.!?;\n]{0,24}\bclean(?:s|ed|ing)?\b/i,
  ],
  "stakeholder communication": [
    /\b(?:communicat(?:e|es|ed|ing)|partner(?:s|ed|ing) with|coordinat(?:e|es|ed|ing))\b[^.!?;\n]{0,36}\b(?:key |cross-functional )?stakeholders?\b/i,
  ],
  "data analysis": [
    /\b(?:analy[sz](?:e|es|ed|ing)|interpret(?:s|ed|ing)?|review(?:s|ed|ing)?)\b[^.!?;\n]{0,48}\b(?:data|records|metrics|datasets?|survey results|financial results)\b/i,
    /\b(?:summari[sz](?:e|es|ed|ing)|identif(?:y|ies|ied|ying)|spot(?:s|ted|ting)?)\b[^.!?;\n]{0,32}\b(?:trends|patterns|insights)\b[^.!?;\n]{0,24}\b(?:from|in|across)\b[^.!?;\n]{0,32}\b(?:data|records|metrics|datasets?|sales|customer|survey)\b/i,
  ],
  "project management": [
    /\b(?:coordinat(?:e|es|ed|ing)|plan(?:s|ned|ning)|track(?:s|ed|ing))\b[^.!?;\n]{0,36}\b(?:project )?(?:timelines|milestones|deliverables|workstreams)\b/i,
    /\b(?:manage[sd]?|led|lead(?:s|ing)?)\b[^.!?;\n]{0,20}\bprojects?\b[^.!?;\n]{0,32}\b(?:timelines|milestones|deliverables|workstreams)\b/i,
  ],
  "stakeholder management": [
    /\b(?:manage[sd]?|coordinat(?:e|es|ed|ing)|align(?:s|ed|ing)?|engag(?:e|es|ed|ing)|consult(?:s|ed|ing)|partner(?:s|ed|ing) with)\b[^.!?;\n]{0,36}\b(?:key |cross-functional )?stakeholders?\b/i,
  ],
};

const clouds = ["aws", "azure", "gcp"];
const actionPattern = /\b(built|build|designed|design|developed|develop|led|managed|delivered|implemented|operated|maintained|analyzed|analysed|summarized|summarised|interpreted|reviewed|identified|spotted|planned|tracked|coordinated|coordinating|aligned|engaged|consulted|partnered|launched|improved|reduced|increased|automated|mentored|owned|created|creating|deployed|supported|gathered|gathering|wrote|write|writing|cleaned|cleaning|communicated|communicating)\b/i;
const injectionPattern = /\b(ignore (all )?(previous|prior|above) instructions|system prompt|developer message|reveal (the )?(prompt|instructions)|output only|do not analyze (this|the) job)\b/i;
const vaguePattern = /\b(rockstar|ninja|culture fit|fast[- ]paced|self[- ]starter|good attitude|wear many hats)\b/i;
const eligibilityPattern = /\b(work authori[sz]ation|right to work|visa|relocat(?:e|ion)|on[- ]site|shift|night shift|travel|work permit|eligible to work)\b/i;
const qualificationPattern = /\b(degree|bachelor|master|ph\.?d|certification|certified|licen[cs]e|diploma|qualification)\b/i;
const responsibilityPattern = /\b(own|build|design|develop|deliver|lead|manage|operate|maintain|analy[sz]e|drive|implement|support|mentor|coordinate|create|improve|reduce|increase|scale|launch|gather|write|communicate|(?:be\s+)?responsible\s+for|accountable\s+for|take\s+ownership\s+of)\b/i;
const preferredPattern = /\b(preferred|nice to have|bonus|desirable|ideally|a plus|good to have)\b/i;
const mandatoryPattern = /\b(must|required|mandatory|minimum|at least|need to)\b/i;
const organizationContextPattern = /^(?:(?:our|the|this)\s+)?(?:(?:internal|company|engineering|product|software|technology|tech|business|customer)\s+)*(?:prototype|product|platform|application|app|system|tool|service|script|stack|codebase|repository|team|company|organization)\b/i;

const singleWordKnownTerms = knownTerms.filter((term) => /^[a-z0-9]+$/i.test(term));
const digitLookalikes: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
};

export function isResumeTextLikelyGarbled(resumeText: string): boolean {
  const knownTermsSet = new Set(singleWordKnownTerms);
  const words: string[] = resumeText.match(/[\p{L}\p{N}+#.]+/gu) ?? [];
  const hasDigitSubstitution = words.some((word) => {
    if (!/\d/.test(word)) return false;
    const normalized = word.toLocaleLowerCase().replace(/[013457]/g, (digit) => digitLookalikes[digit]);
    return normalized !== word.toLocaleLowerCase() && knownTermsSet.has(normalized);
  });
  if (hasDigitSubstitution) return true;

  return singleWordKnownTerms.some((term) => {
    const splitTermPattern = term.split("").map((character) => (
      character.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    )).join("\\s*");
    const match = resumeText.match(new RegExp(`(^|[^a-z0-9])(${splitTermPattern})([^a-z0-9]|$)`, "i"));
    return Boolean(match?.[2]?.includes(" "));
  });
}

function normalize(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim();
}

function isHeading(line: string): boolean {
  return headings.has(line.toLocaleLowerCase().replace(/[:.]+$/, "").trim());
}

const MAX_REQUIREMENT_CLAUSE_LENGTH = 280;
const explicitCandidateDutyStartPattern = /\b(?:(?:you|the\s+(?:successful\s+)?candidate|candidates?|applicants?)\s+(?:(?:will|must|should|are|is\s+expected\s+to|are\s+expected\s+to)\s+)?|(?:this|the)\s+(?:role|position)\s+(?:(?:will|must|should|is|are\s+expected\s+to)\s+)?)(?:be\s+)?(?:own|build|design|develop|deliver|lead|manage|operate|maintain|analy[sz]e|drive|implement|support|mentor|coordinate|create|improve|reduce|increase|scale|launch|gather|write|communicate|responsible\s+for|accountable\s+for|take\s+ownership\s+of)\b/i;

function statementParts(text: string): { parts: string[]; overlongRequirementCount: number } {
  const parts: string[] = [];
  let overlongRequirementCount = 0;
  for (const rawLine of text.normalize("NFKC").split(/\r?\n/)) {
    const line = rawLine.replace(/^\s*(?:[-*•‣▪]|\d+[.)])\s*/, "").trim();
    if (!line || isHeading(line)) continue;
    if (injectionPattern.test(line)) continue;
    const sentences = line.split(/(?<=[.!?])\s+(?=[\p{L}\d])/u);
    for (const sentence of sentences) {
      for (const clause of sentence.split(/\s*[;•]\s*/)) {
        const fragments = clause.length > MAX_REQUIREMENT_CLAUSE_LENGTH
          ? clause.split(/,\s*|\s+(?=(?:and|but|while)\s+(?:you|the\s+role|this\s+(?:role|position)|applicants?|candidates?)\b)/i)
          : [clause];
        for (const fragment of fragments) {
          const original = fragment.trim().replace(/[.!?]+$/, "");
          const dutyStart = original.length > MAX_REQUIREMENT_CLAUSE_LENGTH
            ? explicitCandidateDutyStartPattern.exec(original)
            : null;
          const cleaned = dutyStart?.index
            ? original.slice(dutyStart.index).trim()
            : original;
          if (cleaned.length > MAX_REQUIREMENT_CLAUSE_LENGTH) {
            if (looksLikeRequirement(original)) overlongRequirementCount += 1;
            continue;
          }
          if (cleaned.length >= 12 && looksLikeRequirement(cleaned)) {
            parts.push(cleaned);
          } else if (cleaned !== original && looksLikeRequirement(original)) {
            overlongRequirementCount += 1;
          }
        }
      }
    }
  }
  return { parts, overlongRequirementCount };
}

type RequirementCandidate = {
  text: string;
  signal?: JobRequirement["signal"];
};

function requirementCandidates(statement: string): RequirementCandidate[] {
  const prefix = statement.match(/^(?:responsibilities|requirements|preferred|nice to have|required)\s*:\s*/i)?.[0] ?? "";
  const content = statement.slice(prefix.length).trim();
  const signal: JobRequirement["signal"] | undefined = preferredPattern.test(statement)
    ? "preferred"
    : mandatoryPattern.test(statement) ? "mandatory" : undefined;
  const splitItems = content.includes(",")
    ? content.replace(/,\s*and\s+/gi, ",").split(",").map((item) => item.trim().replace(/^and\s+/i, ""))
    : [content];
  const cleanedItems = splitItems
    .map((item) => item.replace(/\s+(?:are|is)\s+(?:required|preferred)$/i, "").trim())
    .filter(Boolean);

  if (cleanedItems.length === 1) return [{ text: content, signal }];
  return cleanedItems
    .filter((item) => looksLikeRequirement(item))
    .map((item) => ({ text: item, signal }));
}

function looksLikeRequirement(text: string): boolean {
  const hasClearSignal = mandatoryPattern.test(text)
    || preferredPattern.test(text)
    || responsibilityPattern.test(text)
    || qualificationPattern.test(text)
    || eligibilityPattern.test(text);
  if (organizationContextPattern.test(text) && !hasClearSignal) return false;
  return hasClearSignal
    || knownTerms.some((term) => text.toLocaleLowerCase().includes(term))
    || /\b\d+\+?\s+years?\b/i.test(text);
}

function canonicalKey(text: string): string {
  const normalized = text.toLocaleLowerCase()
    .replace(/\b(postgres)\b/g, "postgresql")
    .replace(/\b(k8s)\b/g, "kubernetes")
    .replace(/\b(nodejs|node js)\b/g, "node.js")
    .replace(/\b(restful apis?)\b/g, "rest api")
    .replace(/[^\p{L}\p{N}.+/# ]/gu, " ");
  return normalized.split(/\s+/).filter(Boolean).filter((word) => !stopWords.has(word)).sort().join(" ");
}

function requirementKey(text: string): string {
  const normalized = text.toLocaleLowerCase().replace(/[^\p{L}\p{N} ]/gu, " ").replace(/\s+/g, " ").trim();
  if (/^(?:sql|structured query language|writing sql queries|sql queries)$/.test(normalized)) return "sql";
  return canonicalKey(text);
}

function strongerSignal(
  left: JobRequirement["signal"] | undefined,
  right: JobRequirement["signal"] | undefined,
): JobRequirement["signal"] | undefined {
  const rank = { ambiguous: 0, preferred: 1, mandatory: 2 } as const;
  if (!left) return right;
  if (!right) return left;
  return rank[right] > rank[left] ? right : left;
}

function anchorsFor(text: string): string[] {
  const lower = text.toLocaleLowerCase();
  const known = knownTerms.filter((term) => termPresent(text, term));
  if (known.length) {
    return [...new Set(known.filter((term) => !known.some((other) => other.length > term.length && other.includes(term))))];
  }
  return [...new Set(
    lower.match(/[\p{L}\p{N}+#.]{4,}/gu)?.filter((word) => !stopWords.has(word)) ?? [],
  )].slice(0, 3);
}

function termPresent(text: string, term: string): boolean {
  const lower = text.toLocaleLowerCase();
  const aliases = termAliases[term] ?? [term];
  return aliases.some((alias) => new RegExp(`(^|[^a-z0-9])${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i").test(lower));
}

function termHasPositiveContext(text: string, term: string): boolean {
  const lower = text.toLocaleLowerCase();
  const aliases = termAliases[term] ?? [term];
  const isNegatedAt = (index: number, aliasLength: number) => {
    const before = lower.slice(Math.max(0, index - 100), index);
    const after = lower.slice(index + aliasLength, index + aliasLength + 90);
    const negativeBefore = /\b(?:not|never|no|zero|without|did(?:n['’]t| not)|does(?:n['’]t| not)|do(?:n['’]t| not)|has(?:n['’]t| not)|have(?:n['’]t| not)|lack(?:s|ed)?)\b[^.!?;]{0,100}$/i.test(before);
    const negativeAfter = /^\s+(?:(?:is|was)\s+not|isn't|wasn't)\s+(?:part\s+of|in|within)\s+my\s+background\b/i.test(after);
    return negativeBefore || negativeAfter;
  };

  return aliases.some((alias) => {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = lower.matchAll(new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "gi"));
    for (const match of matches) {
      const aliasStart = (match.index ?? 0) + match[1].length;
      const after = lower.slice(aliasStart + alias.length, aliasStart + alias.length + 90);
      const explicitlyOmitted = /\b(?:is|was|are|were)?\s*not\s+(?:documented|listed|mentioned|included|provided|shown)\b/i.test(after);
      if (!isNegatedAt(aliasStart, alias.length) && !explicitlyOmitted) return true;
    }
    return false;
  }) || (semanticEvidenceVariants[term] ?? []).some((pattern) => {
    for (const match of lower.matchAll(new RegExp(pattern.source, "gi"))) {
      if (!isNegatedAt(match.index ?? 0, match[0].length)) return true;
    }
    return false;
  });
}

function termHasExplicitNegativeContext(
  text: string,
  term: string,
  attribution: "candidate" | "unattributed" = "candidate",
  roleContextPrecedes = false,
): boolean {
  const aliases = termAliases[term] ?? [term];
  return aliases.some((alias) => {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    for (const match of text.matchAll(new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "gi"))) {
      const matchIndex = match.index ?? 0;
      const aliasIndex = matchIndex + match[1].length;
      const before = text.slice(Math.max(0, aliasIndex - 140), aliasIndex);
      const insideQuote = (() => {
        const prefix = text.slice(0, aliasIndex);
        const straightQuoteCount = (prefix.match(/"/g) ?? []).length;
        const straightQuoted = straightQuoteCount % 2 === 1 && text.indexOf('"', matchIndex + 1) >= 0;
        const curlyDoubleQuoted = prefix.lastIndexOf("“") > prefix.lastIndexOf("”") && text.indexOf("”", matchIndex + 1) >= 0;
        const curlySingleQuoted = prefix.lastIndexOf("‘") > prefix.lastIndexOf("’") && text.indexOf("’", matchIndex + 1) >= 0;
        const asciiSingleQuoted = [...text.matchAll(/(?:^|[\s:(])'[^'\r\n]{1,180}'(?=$|[\s.,!?;:)])/g)].some((quote) => {
          const quoteStart = (quote.index ?? 0) + (quote[0].startsWith("'") ? 0 : 1);
          const quoteEnd = (quote.index ?? 0) + quote[0].length - 1;
          return quoteStart < matchIndex && matchIndex < quoteEnd;
        });
        return straightQuoted || curlyDoubleQuoted || curlySingleQuoted || asciiSingleQuoted;
      })();
      const candidateAttribution = /\b(?:candidate|applicant)\b[\s\S]{0,80}\b(?:confirm\w*|stat\w*|report\w*|say|said)\b/i;
      const openingQuote = Math.max(
        text.lastIndexOf('"', aliasIndex),
        text.lastIndexOf("“", aliasIndex),
        text.lastIndexOf("‘", aliasIndex),
      );
      const attributionOutsideQuote = candidateAttribution.test(before)
        && (!insideQuote || (openingQuote >= 0 && candidateAttribution.test(text.slice(0, openingQuote))));
      const standaloneNoExperience = /^\s*(?:no|zero|without)\s+(?:(?:hands[- ]on|practical|professional|prior|work|industry)\s+){0,2}experience\b/i.test(text);
      const personalBackgroundDenial = /\bmy\s+background\b/i.test(text);
      const attributed = attributionOutsideQuote || (!insideQuote && (
        /(?:^|[\r\n.!?]\s*)(?:candidate|applicant)\s+(?:has|have|had|lacks?|lacked)\b/i.test(text)
        || /(?:^|[\r\n.!?]\s*)i\b/i.test(text)
        || personalBackgroundDenial
        || (standaloneNoExperience && !roleContextPrecedes)
      ));
      const afterStart = aliasIndex + alias.length;
      const after = text.slice(afterStart, afterStart + 90);
      const experienceRelation = "(?:with|in|using|on)";
      const experiencePhrase = `(?:(?:hands[- ]on|practical|professional|prior|work|industry)\\s+){0,2}experience\\s+${experienceRelation}`;
      const trailingSkillWords = "(?:[\\p{L}\\p{N}+#.-]+\\s*){0,4}";
      const explicitLack =
        new RegExp(`\\b(?:(?:have|has|had|did|do|does)\\s+not|haven't|hasn't|hadn't|didn't|don't|doesn't|never)\\s+(?:used|worked\\s+(?:with|on)|familiar\\s+with|experienced\\s+with|experienced\\s+in|${experiencePhrase})\\s*$`, "i").test(before)
        || new RegExp(`\\b(?:(?:do|does|did)\\s+not|don't|doesn't|didn't)\\s+have\\s+(?:any\\s+)?${experiencePhrase}\\s*${trailingSkillWords}$`, "iu").test(before)
        || new RegExp(`\\b(?:no|zero|without)\\s+(?:(?:hands[- ]on|practical|professional|prior|work|industry)\\s+){0,2}experience\\s+${experienceRelation}\\s*${trailingSkillWords}$`, "iu").test(before)
        || new RegExp(`\\b(?:lack|lacks|lacked)\\s+(?:any\\s+)?${experiencePhrase}\\s*${trailingSkillWords}$`, "iu").test(before)
        || (
          new RegExp(`\\b(?:(?:do|does|did)\\s+not|don['’]t|doesn['’]t|didn['’]t)\\s+have(?:\\s+any)?\\s*$`, "i").test(before)
          && /^\s+(?:any\s+)?(?:(?:hands[- ]on|practical|professional|prior|work|industry)\s+){0,2}experience\b/i.test(after)
        )
        || /^\s+(?:(?:is|was)\s+not|isn't|wasn't)\s+(?:part\s+of|in|within)\s+my\s+background\b/i.test(after);
      const attributionMatches = attribution === "candidate" ? attributed : !attributed;
      if (attributionMatches && explicitLack) return true;
    }
    return false;
  });
}

function evidenceLine(resume: string, terms: string[]): string | null {
  const lines = resume.split(/\r?\n|(?<=[.!?]["'”’])\s+|(?<=[.!?])\s+/).map((line) => line.trim()).filter(Boolean);
  return lines.find((line) => terms.some((term) => termHasPositiveContext(line, term)))?.slice(0, 220) ?? null;
}

function explicitGapLine(
  resume: string,
  terms: string[],
  attribution: "candidate" | "unattributed" = "candidate",
): string | null {
  const lines = resume.split(/\r?\n|(?<=[.!?]["'”’])\s+|(?<=[.!?])\s+/).map((line) => line.trim()).filter(Boolean);
  for (const [index, line] of lines.entries()) {
    const precedingContext = lines.slice(Math.max(0, index - 4), index).join(" ");
    const roleContextPrecedes = /\b(?:job|role|position|posting|listing|description|employer|company)\b/i.test(precedingContext)
      && (/\b(?:says?|states?|lists?|includes?|requires?|seeks?|expects?|calls?\s+for|describes?|copied|pasted|taken)\b/i.test(precedingContext)
        || /\bfrom\s+(?:the\s+)?(?:job|role|position|posting|listing|description)\b/i.test(precedingContext));
    for (const term of terms) {
      if (!termHasExplicitNegativeContext(line, term, attribution, roleContextPrecedes)) continue;
      if (line.length <= 220) return line;
      const aliases = termAliases[term] ?? [term];
      for (const alias of aliases) {
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        for (const match of line.matchAll(new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "gi"))) {
          const matchEnd = (match.index ?? 0) + match[0].length;
          const closingQuotes = line.slice(matchEnd).match(/^[\"'”’)]*/)?.[0].length ?? 0;
          const end = matchEnd + closingQuotes;
          const excerpt = line.slice(Math.max(0, end - 220), end);
          if (termHasExplicitNegativeContext(excerpt, term, attribution)) return excerpt;
        }
      }
    }
  }
  return null;
}

function evidenceSource(
  quote: string | null,
  resume: string,
  jobText: string,
  candidateConfirmed = false,
): JobEvidenceSource | null {
  if (!quote) return null;

  const normalizedQuote = normalize(quote).toLocaleLowerCase();
  const normalizedJobText = normalize(jobText).toLocaleLowerCase();
  if (
    normalizedQuote.length >= 20
    && normalizedJobText.includes(normalizedQuote)
  ) return "role-text";

  const quoteIndex = resume.indexOf(quote);
  const precedingLine = quoteIndex >= 0
    ? resume.slice(0, quoteIndex).split(/\r?\n/).at(-1) ?? ""
    : "";
  const quoteLineStart = quoteIndex >= 0 ? resume.lastIndexOf("\n", quoteIndex - 1) + 1 : -1;
  const quotePrefix = quoteIndex >= 0
    ? resume.slice(Math.max(quoteLineStart, quoteIndex - 180), quoteIndex)
    : "";
  const roleContext = /\b(?:job|role|position|posting|listing|description)\b[\s\S]{0,100}\b(?:says?|states?|lists?|includes?|requires?|seeks?|expects?|calls?\s+for|describes?|copied|pasted|taken|excerpt)\b/i;
  const roleLanguage = /\b(?:applicants?\s+with|position\s+is\s+open\s+to|role\s+requirement|the\s+candidate\s+should)\b/i
    .test(quote)
    || /\b(?:no|zero|without)\s+(?:(?:hands[- ]on|practical|professional|prior|work|industry)\s+){0,2}experience\b[^.!?;]{0,80}\bis\s+required\b/i.test(quote);
  if (roleContext.test(quote) || roleContext.test(quotePrefix)) return "role-text";

  if (candidateConfirmed) return "candidate-authored";

  if (roleContext.test(precedingLine)) return "role-text";

  if (roleLanguage) return "role-text";

  if (
    /\b(?:i|we)\b[\s\S]{0,50}\b(?:built|build|designed|developed|led|managed|delivered|implemented|operated|maintained|analyzed|analysed|created|deployed|supported|wrote|communicated|used|worked)\b/i.test(quote)
    || /\b(?:candidate|applicant)\b[\s\S]{0,80}\b(?:confirms?|states?|reports?|says?|has|had|lacks?)\b/i.test(quote)
    || actionPattern.test(quote)
  ) return "candidate-authored";

  return "unknown";
}

function categoryFor(text: string, signal: JobRequirement["signal"]): JobRequirementCategory {
  if (vaguePattern.test(text)) return "unclear";
  if (eligibilityPattern.test(text)) return "eligibility";
  if (qualificationPattern.test(text)) return "qualification";
  if (responsibilityPattern.test(text)) return "responsibility";
  if (signal === "preferred") return "preferred";
  if (knownTerms.some((term) => text.toLocaleLowerCase().includes(term))) {
    return signal === "mandatory" ? "essential-competency" : "contextual-tool";
  }
  return "unclear";
}

function createRequirement(
  text: string,
  duplicate: boolean,
  resume: string,
  jobText: string,
  resumeSourceText: string,
  signalOverride?: JobRequirement["signal"],
): JobRequirement {
  const signal: JobRequirement["signal"] = signalOverride ?? (preferredPattern.test(text)
    ? "preferred"
    : mandatoryPattern.test(text) ? "mandatory" : "ambiguous");
  const category = categoryFor(text, signal);
  const anchors = anchorsFor(text);
  const matched = anchors.filter((term) => evidenceLine(resume, [term]) !== null);
  const denied = anchors.filter((term) => explicitGapLine(resume, [term]) !== null);
  const gapQuote = explicitGapLine(resume, anchors);
  const conflictingDenialTerms = matched.filter((term) => denied.includes(term));
  const conflictingDenialQuote = conflictingDenialTerms.length
    ? explicitGapLine(resume, conflictingDenialTerms)
    : null;
  const confirmedGap = !matched.length && gapQuote !== null;
  const unconfirmedDenialQuote = !matched.length && !confirmedGap
    ? explicitGapLine(resume, anchors, "unattributed")
    : null;
  const cloudInRequirement = clouds.find((cloud) => termPresent(text, cloud));
  const differentCloud = cloudInRequirement
    ? clouds.find((cloud) => cloud !== cloudInRequirement && termPresent(resume, cloud))
    : undefined;
  const quote = matched.length
    ? evidenceLine(resume, matched)
    : confirmedGap ? gapQuote
      : differentCloud ? evidenceLine(resume, [differentCloud])
        : unconfirmedDenialQuote;
  const quoteSource = evidenceSource(quote, resumeSourceText, jobText, confirmedGap);
  const conflictingDenialQuoteSource = evidenceSource(
    conflictingDenialQuote,
    resumeSourceText,
    jobText,
    Boolean(conflictingDenialQuote),
  );
  let evidenceStatus: JobEvidenceStatus;
  let evidenceReason: string;

  if (confirmedGap) {
    evidenceStatus = "confirmed-gap";
    evidenceReason = "The supplied resume explicitly states that the candidate has no experience with this skill. This is candidate-confirmed, not inferred from missing details.";
  } else if (differentCloud) {
    evidenceStatus = "transferable";
    evidenceReason = `The resume mentions ${differentCloud}, a different cloud platform. That may be relevant background, but does not establish ${cloudInRequirement} experience.`;
  } else if (!anchors.length || (category === "unclear" && !matched.length)) {
    evidenceStatus = "unresolved";
    evidenceReason = "The wording or available resume evidence is too unclear to classify reliably.";
  } else if (!matched.length) {
    evidenceStatus = "not-documented";
    evidenceReason = "No matching evidence was found in the supplied resume text. This does not mean the candidate lacks the skill.";
  } else if (matched.length < anchors.length) {
    evidenceStatus = "partial";
    evidenceReason = "Some relevant terms appear, but the supplied resume text does not support the full requirement.";
  } else if (quote && actionPattern.test(quote)) {
    evidenceStatus = "direct";
    evidenceReason = "A matching term appears alongside an action or outcome in the supplied resume text.";
  } else {
    evidenceStatus = "partial";
    evidenceReason = "A matching term appears, but the supplied text does not show enough context or depth to establish direct evidence.";
  }
  if (unconfirmedDenialQuote) {
    evidenceReason = `The supplied text includes no-experience wording, but does not clearly attribute it to the candidate. It is not treated as a confirmed gap. ${evidenceReason}`;
  }
  if (conflictingDenialQuote) {
    evidenceReason = `The resume has positive evidence for this skill and also explicitly denies experience with it. Review both excerpts; the denial is not counted as positive evidence. ${evidenceReason}`;
  }

  const flags: string[] = [];
  if (duplicate) flags.push("Repeated wording");
  if (conflictingDenialQuote) flags.push("Conflicting resume statements");
  if (vaguePattern.test(text)) flags.push("Ambiguous wording");
  if (category === "contextual-tool" && signal === "ambiguous") flags.push("Potentially low-signal item");
  if (!responsibilityPattern.test(text) && signal === "ambiguous" && category !== "unclear") {
    flags.push("Weak link to a stated responsibility");
  }

  const nextStepByStatus: Record<JobEvidenceStatus, string> = {
    direct: "Bring this example forward and state your role and outcome.",
    transferable: "Name the platform you used and explain what transfers; verify platform-specific expectations.",
    partial: "Add a concrete task, scope, or outcome if you can substantiate it.",
    "not-documented": "If you have this experience, add a truthful example; absence from this text is not proof of a gap.",
    "confirmed-gap": "Decide whether to build evidence or ask whether the skill can be learned on the job.",
    unresolved: "Clarify the wording before treating it as a candidate gap.",
  };

  return {
    id: canonicalKey(text).replace(/\s+/g, "-").slice(0, 72) || `requirement-${text.length}`,
    text,
    category,
    signal,
    confidence: category === "unclear" ? "low" : signal === "ambiguous" ? "medium" : "high",
    evidenceStatus,
    evidenceQuote: quote,
    evidenceQuoteSource: quoteSource,
    conflictingDenialQuote,
    conflictingDenialQuoteSource,
    evidenceReason,
    flags,
    nextStep: nextStepByStatus[evidenceStatus],
    recruiterQuestion: signal === "preferred"
      ? `Which parts of “${text}” matter most in the first few months?`
      : `Is “${text}” a day-one requirement, or can it be learned after joining?`,
  };
}

export function analyzeJobPosting(
  jobText: string,
  resumeText: string,
  options: { resumeTextReviewed?: boolean } = {},
): JobPostingAnalysis {
  if (typeof jobText !== "string" || !normalize(jobText)) throw new Error("Paste the job description to continue.");
  if (typeof resumeText !== "string" || !normalize(resumeText)) throw new Error("Paste the resume text to continue.");
  if (jobText.length > JOB_POSTING_TEXT_LIMIT) throw new Error(`Keep the job description under ${JOB_POSTING_TEXT_LIMIT.toLocaleString()} characters.`);
  if (resumeText.length > RESUME_TEXT_LIMIT) throw new Error(`Keep the resume text under ${RESUME_TEXT_LIMIT.toLocaleString()} characters.`);
  const resumeTextIsGarbled = isResumeTextLikelyGarbled(resumeText);
  if (resumeTextIsGarbled && !options.resumeTextReviewed) throw new ResumeTextNeedsReviewError();

  const warnings: string[] = [];
  if (injectionPattern.test(jobText)) warnings.push("Instruction-like text in the posting was ignored; it cannot change how this browser-only analysis works.");
  if (resumeTextIsGarbled) warnings.push("You confirmed this resume text after a possible copying or extraction error. Verify each evidence excerpt before relying on it.");
  const evidenceResumeText = resumeText.normalize("NFKC")
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n");
  const extractedStatements = statementParts(jobText);
  const statements = extractedStatements.parts;
  const grouped = new Map<string, { text: string; duplicates: number; signal?: JobRequirement["signal"] }>();
  for (const statement of statements) {
    for (const candidate of requirementCandidates(statement)) {
      const key = requirementKey(candidate.text);
      if (!key) continue;
      const existing = grouped.get(key);
      if (existing) {
        existing.duplicates += 1;
        existing.signal = strongerSignal(existing.signal, candidate.signal);
      } else {
        grouped.set(key, { text: candidate.text, duplicates: 1, signal: candidate.signal });
      }
    }
  }

  const requirements = [...grouped.values()]
    .map(({ text, duplicates, signal }) => createRequirement(
      text,
      duplicates > 1,
      evidenceResumeText,
      normalize(jobText),
      evidenceResumeText,
      signal,
    ))
    .slice(0, 40);
  const notes: string[] = [];
  const duplicates = requirements.filter((item) => item.flags.includes("Repeated wording")).length;
  const ambiguous = requirements.filter((item) => item.signal === "ambiguous" || item.flags.includes("Ambiguous wording")).length;
  const lowSignal = requirements.filter((item) => item.flags.includes("Potentially low-signal item")).length;
  const mandatoryCount = requirements.filter((item) => item.signal === "mandatory").length;
  if (duplicates) notes.push(`${duplicates} requirement(s) repeat substantially similar wording; repetition alone does not increase importance.`);
  if (ambiguous) notes.push(`${ambiguous} requirement(s) have ambiguous wording or status and may need clarification.`);
  if (lowSignal) notes.push(`${lowSignal} item(s) appear without a clear link to a stated responsibility; this is a prompt to review, not a finding that they are irrelevant.`);
  const lowConfidence = requirements.filter((item) => item.confidence === "low").length;
  if (lowConfidence) notes.push(`${lowConfidence} low-confidence item(s) were excluded from the score; review them under all extracted requirements.`);
  if (mandatoryCount >= 10) notes.push("The posting contains a long list of explicitly mandatory items. Review whether each is truly essential; the count alone does not establish inflation.");
  if (extractedStatements.overlongRequirementCount) {
    warnings.push("Some long requirement-like wording could not be separated into clear items, so it was left out of the score. Review the original posting manually.");
  }
  if (!requirements.length) warnings.push("No clear requirements were extracted. Add clearer job text or review the posting manually.");
  if (requirements.length === 40) warnings.push("Only the first 40 extracted requirements are shown.");

  return { requirements, notes, warnings };
}
