import sourceRecords from "@/data/company-verification-sources.json";

export type VerificationStatus = "not-started" | "verified" | "mismatch" | "couldnt-verify";
export type VerificationStep = {
  id: string;
  title: string;
  why: string;
  actions: string[];
  match: string;
  mismatch: string;
  next: string;
  sourceIds: string[];
};

export type SourceRecord = {
  id: string;
  label: string;
  url: string;
  purpose: string;
  checkedOn: string;
  check: string;
};

export const verificationSources = sourceRecords as SourceRecord[];

export const verificationSteps: VerificationStep[] = [
  {
    id: "identity",
    title: "Confirm the legal identity",
    why: "A familiar brand name and a registered legal entity are different things. First establish which entity is actually making the offer.",
    actions: [
      "Ask for the complete legal entity name on the offer letter, not only the brand or product name.",
      "Compare it with the company or LLP record on MCA. Search by the exact name and, if supplied, CIN or LLPIN.",
      "Check that the registered name and company type are plausible for the entity you were told would employ you.",
      "If the entity name differs from the brand, ask HR to explain the relationship in writing (subsidiary, group company, staffing firm, or client).",
    ],
    match: "The legal name and identifier consistently point to the entity named in the offer; HR can explain any brand-to-entity relationship.",
    mismatch: "The identifier belongs to a different entity, the employer cannot name the employing entity, or a recruiter resists basic written clarification.",
    next: "Pause before sharing sensitive documents or resigning. Ask HR to correct or explain the record using an official company-domain contact.",
    sourceIds: ["mca-master-data", "mca-find-cin"],
  },
  {
    id: "domain",
    title: "Check the official domain and contact route",
    why: "Lookalike domains and personal email accounts can impersonate real employers. A website alone does not prove who controls a mailbox.",
    actions: [
      "Type or independently find the company website; do not rely only on a recruiter-supplied link.",
      "Compare the recruiter email domain character by character with the domain published on the company’s official site.",
      "Check whether the address is exactly the domain or a legitimate subdomain; watch for extra words, swapped characters, hyphens, and unfamiliar suffixes.",
      "Call a phone number published independently by the company and ask to confirm the recruiter and requisition.",
    ],
    match: "The contact path is independently corroborated by the company, and the email domain is consistent with its published contact details.",
    mismatch: "The address is a free-mail account or lookalike, the website has no corroborating company identity, or the company cannot confirm the recruiter.",
    next: "Do not reply with documents or click payment links. Verify via an independently located company contact.",
    sourceIds: ["mca-master-data", "cybercrime-job-advisory"],
  },
  {
    id: "listed",
    title: "For listed companies: read public filings",
    why: "Filings can provide context about the company’s public disclosures. They do not verify a particular recruiter, team, job opening, or future solvency.",
    actions: [
      "If the employer is listed, locate its exact legal name and exchange symbol from an independent source.",
      "Search recent announcements on NSE and BSE for material updates relevant to your questions.",
      "Read the filing itself and note the date, entity, and what it actually says; do not treat silence as proof of health.",
      "If the employer is private or its listing status is unclear, skip this step rather than infer from another similarly named company.",
    ],
    match: "The listing identity is consistent and the filing context does not conflict with what the employer has told you.",
    mismatch: "The claimed listed identity does not match the filings, or an important claim attributed to a filing cannot be found.",
    next: "Ask the employer to point to the exact filing and explain the difference. A filing is context, not an individual-offer check.",
    sourceIds: ["nse-filings", "bse-announcements"],
  },
  {
    id: "registrations",
    title: "Ask about tax, MSME and workforce registrations",
    why: "Some records are searchable; others may not be publicly searchable or may not apply. An absent result is not proof of wrongdoing.",
    actions: [
      "Where appropriate, compare a supplied GSTIN and legal name using the official GST taxpayer search.",
      "If the employer says it is Udyam-registered, ask for the number and check it on the official Udyam verification page.",
      "For PF or ESIC questions, ask which legal entity and establishment code applies to your work location, then use the official search where available.",
      "For a smaller or non-public employer, ask HR these exact questions: “Which legal entity will employ and pay me?” “What is the establishment’s PF code, if applicable?” “Will I be enrolled in PF/ESI for this role, and from what date?” “Which GSTIN or Udyam number, if any, is relevant to the contracting entity?” “Which state registration applies to this work location?” “What is the shop / establishment registration reference and the name and state under which it is registered, if applicable?”",
      "Shop / establishment registration can be state-specific. Ask for the issuing state, establishment name and registration reference; confirm with the relevant state authority if needed.",
    ],
    match: "The employer gives a clear, internally consistent explanation and any supplied identifiers match the entity and location claimed.",
    mismatch: "The records point to another legal entity or location, or HR gives conflicting answers about who employs and pays you.",
    next: "Ask for a written explanation and the exact code / state / entity to check. Do not assume a registration must exist for every employer or role.",
    sourceIds: ["gst-search", "gst-manual", "udyam-verify", "epfo-establishment", "esic-employer"],
  },
  {
    id: "legal",
    title: "Search legal and distress records carefully",
    why: "Search results can share names with unrelated people or entities. This is a lead for careful reading, not a company verdict.",
    actions: [
      "Search IBBI public announcements for an exact corporate-debtor name where relevant.",
      "Search NCLT by party name and bench; inspect each matching record for identity, role, date and procedural status.",
      "Use eCourts to investigate an exact party-name match. A name-only result is not enough to identify the employer.",
      "If relevant, search SEBI enforcement orders for the exact entity and read the order or proceeding itself.",
      "Record no result as “not found in this search”, not “no legal issues”. Search coverage, indexing and name variation limit what absence means.",
    ],
    match: "No relevant, identity-matched record was found in the searches you made—or an exact record is understood in its specific procedural context.",
    mismatch: "A credible record appears to concern the exact employing entity and materially conflicts with a claim made to you.",
    next: "Check identifiers and case details, then ask a qualified professional if the issue could affect your decision. Never infer guilt or distress from a name collision.",
    sourceIds: ["ibbi-announcements", "nclt-party-search", "ecourts", "sebi-orders"],
  },
  {
    id: "workforce",
    title: "Test the role and workforce story",
    why: "A real company can still have a poorly defined role. Direct, specific answers about the work are more useful than broad reputation claims.",
    actions: [
      "Ask the hiring manager what the first 30, 60 and 90 days should produce.",
      "Ask who your manager is, where the team sits, and how success and performance are reviewed.",
      "Ask why the role is open, how many people are on the team, and whether headcount is approved.",
      "For a role replacing someone, ask what changed in the scope—not for confidential personal details.",
      "Cross-check public employee or company signals only as context; profiles may be incomplete, stale, or self-reported.",
    ],
    match: "The role, reporting line, work location, success measures and approved headcount form a coherent account across recruiter and manager.",
    mismatch: "The work, manager, location or headcount repeatedly changes, or nobody can describe the role beyond urgency and compensation.",
    next: "Request a short written role summary and a conversation with the future manager before making an irreversible move.",
    sourceIds: [],
  },
  {
    id: "offer",
    title: "Verify the offer, documents and payment requests",
    why: "The offer itself must be checked through a trusted channel. A polished document or real company name can still be misused.",
    actions: [
      "Confirm the offer with HR using a contact route you found independently, not only the number or link in the message.",
      "Read the employing entity, role, location, start date, compensation structure, probation, notice period and conditions together.",
      "Compare the written offer with what the recruiter and manager said; request corrections before accepting.",
      "Never pay a recruiter for an interview, job, security deposit, training seat or equipment through a personal account. Verify any unusual request independently.",
      "Share identity, banking and tax documents only through a verified employer process and only when needed. Never share OTPs, passwords, or remote-access codes.",
    ],
    match: "An independently confirmed HR contact verifies the offer, key terms match the conversations, and no unexplained payment or credential request exists.",
    mismatch: "The employer denies the offer, asks for money or credentials, or important terms differ without a credible written explanation.",
    next: "Pause, preserve messages and payment details, and use the official reporting options below if you suspect fraud.",
    sourceIds: ["cybercrime-job-advisory", "cybercrime-portal"],
  },
];

export type CinParse = {
  input: string;
  normalized: string;
  length: number;
  shapeLooksLikeCIN: boolean;
  message: string;
};

export function parseCinShape(value: string): CinParse {
  const normalized = value.toUpperCase().replace(/[\s-]/g, "");
  const shapeLooksLikeCIN = normalized.length === 21 && /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/.test(normalized);
  if (!shapeLooksLikeCIN) {
    return {
      input: value,
      normalized,
      length: normalized.length,
      shapeLooksLikeCIN: false,
      message: normalized.length === 21
        ? "This does not match the local 21-character pattern checked here. Formatting only; confirm the identifier with MCA."
        : `The local CIN pattern checked here expects 21 characters; this has ${normalized.length}. This check does not validate a registration.`,
    };
  }
  return {
    input: value,
    normalized,
    length: 21,
    shapeLooksLikeCIN: true,
    message: "The text matches the local 21-character CIN pattern checked here. No MCA-published reference defining the pattern's segments was found in the sources checked. This is not an MCA lookup or confirmation that the company exists or is active.",
  };
}

export type LlpShape = { normalized: string; looksLikeLLPIN: boolean; message: string };
export function checkLlpShape(value: string): LlpShape {
  const normalized = value.toUpperCase().replace(/[\s-]/g, "");
  const looksLikeLLPIN = /^[A-Z]{3}[0-9]{4}$/.test(normalized);
  return {
    normalized,
    looksLikeLLPIN,
    message: looksLikeLLPIN
      ? "This text matches a commonly used LLPIN shape (three letters followed by four digits). It is not checked against MCA and does not confirm a registered LLP."
      : "This does not match the simple 7-character LLPIN shape checked here. Formatting only; confirm the identifier on MCA.",
  };
}

export type OfferFinding = { id: string; label: string; severity: "caution" | "high"; explanation: string };
const offerPatterns: Array<{ id: string; label: string; severity: OfferFinding["severity"]; regex: RegExp; explanation: string }> = [
  { id: "job-fee", label: "Upfront job or interview fee", severity: "high", regex: /\b(registration|processing|interview|placement|job|security|refundable)\s+(fee|charge|deposit|payment)\b|\bpay\s+(to|for)\s+(the\s+)?(job|interview|offer|registration)\b/i, explanation: "A request for money to obtain or secure a job deserves independent verification; do not pay under pressure." },
  { id: "guaranteed", label: "Guaranteed selection or unusually certain outcome", severity: "caution", regex: /\b(guaranteed|100\s*%|sure[- ]?shot)\s+(job|selection|offer|placement|salary|hiring)\b/i, explanation: "Absolute guarantees are not proof of a scam, but should prompt questions about the process and written terms." },
  { id: "otp", label: "OTP, password or credential request", severity: "high", regex: /\b(share|send|tell|provide|forward)\b.{0,35}\b(otp|one[- ]time password|password|pin|cvv|login code)\b|\b(otp|one[- ]time password|password|pin|cvv)\b.{0,35}\b(share|send|tell|provide|forward)\b/i, explanation: "Never disclose an OTP, password, PIN or CVV to a recruiter. Contact the institution through its official channel." },
  { id: "personal-transfer", label: "Payment to a personal account or wallet", severity: "high", regex: /\b(personal|individual|recruiter'?s?|employee'?s?)\s+(bank\s+)?(account|upi|wallet)\b|\b(send|transfer|pay)\b.{0,45}\b(upi|personal account|wallet)\b/i, explanation: "Do not transfer money to a personal account to secure employment. Verify any charge through independently sourced HR." },
  { id: "equipment", label: "Equipment purchase or cheque-forwarding request", severity: "high", regex: /\b(buy|purchase|order)\b.{0,35}\b(laptop|equipment|workstation|software|gift card)\b|\b(deposit|cash|cheque|check)\b.{0,35}\b(forward|transfer|return|send back)\b/i, explanation: "Requests to buy equipment from a nominated seller or forward money can expose you to loss. Pause and verify independently." },
  { id: "no-interview", label: "Offer without a meaningful selection process", severity: "caution", regex: /\b(no|without|skip|waive)\s+(interview|screening|assessment)\b|\b(selected|offer)\s+(without|before)\s+(an?\s+)?interview\b/i, explanation: "Some legitimate hiring processes are brief, but verify an unexpected offer with the employer directly." },
  { id: "urgent", label: "Pressure to act immediately", severity: "caution", regex: /\b(within|in)\s+(the\s+)?(next\s+)?(one|1|two|2|few)\s+(hour|hours|minute|minutes)\b|\b(urgent|immediately|act now|today only|last chance)\b/i, explanation: "Urgency can reduce careful checking. Ask for time to verify and do not let a deadline override safe process." },
  { id: "unpaid-training", label: "Unpaid training or paid placement claim", severity: "caution", regex: /\b(unpaid|free)\s+(training|internship)\b|\b(pay|fee|charge)\b.{0,30}\b(training|certification|placement)\b/i, explanation: "Clarify whether training is required, paid, optional and part of a written employment agreement." },
  { id: "document-pressure", label: "Sensitive documents requested unusually early", severity: "caution", regex: /\b(send|share|upload|whatsapp)\b.{0,35}\b(aadhaar|pan card|passport|bank statement|cancelled cheque|identity documents)\b/i, explanation: "Confirm the employer and secure document process before sending sensitive identity or financial information." },
  { id: "remote-access", label: "Remote access or app-install request", severity: "high", regex: /\b(install|download)\b.{0,35}\b(anydesk|teamviewer|remote access|screen sharing)\b|\b(remote access|screen sharing)\b.{0,35}\b(bank|account|phone)\b/i, explanation: "Do not grant remote access to devices or financial accounts as part of recruitment." },
  { id: "crypto", label: "Crypto, gift card or investment payment", severity: "high", regex: /\b(crypto|cryptocurrency|bitcoin|gift card|investment)\b.{0,55}\b(pay|fee|deposit|purchase|transfer)\b|\b(pay|fee|deposit|purchase|transfer)\b.{0,55}\b(crypto|bitcoin|gift card)\b/i, explanation: "A recruitment payment through crypto, gift cards or investment schemes should be treated as a serious warning." },
  { id: "salary-claim", label: "Unusually high pay claim without role detail", severity: "caution", regex: /\b(no experience|no skills|no interview)\b.{0,50}\b(lakh|lpa|salary|per month|package)\b|\b(earn|salary|package)\b.{0,30}\b(lakh|lpa)\b.{0,25}\b(no experience|guaranteed)\b/i, explanation: "Compare compensation to responsibilities and get the full structure in writing; the text alone cannot establish legitimacy." },
];

export function scanOfferText(text: string): OfferFinding[] {
  return offerPatterns.filter(({ regex }) => regex.test(text)).map(({ regex: _regex, ...finding }) => finding);
}

export type DomainAssessment = {
  status: "not-entered" | "exact-or-subdomain" | "free-mail" | "lookalike" | "unfamiliar-tld" | "unfamiliar";
  message: string;
};
const freeMailDomains = new Set(["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "proton.me", "protonmail.com", "rediffmail.com", "yahoo.co.in"]);
const familiarTlds = new Set(["com", "in", "co.in", "org", "net", "io", "ai", "co", "com.au", "uk", "co.uk", "tech", "careers"]);
function cleanDomain(value: string): string {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#:\s]/)[0].replace(/\.$/, "");
}
function editDistanceOne(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1 || a === b) return false;
  let i = 0; let j = 0; let differences = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    differences++;
    if (differences > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else { i++; j++; }
  }
  return differences + (i < a.length || j < b.length ? 1 : 0) === 1;
}
export function assessRecruiterDomain(officialValue: string, recruiterValue: string): DomainAssessment {
  const official = cleanDomain(officialValue);
  const recruiter = cleanDomain(recruiterValue);
  if (!recruiter) return { status: "not-entered", message: "Enter the official website domain and recruiter email domain to compare locally." };
  if (freeMailDomains.has(recruiter)) return { status: "free-mail", message: "This is a commonly used free-mail domain. That does not prove fraud, but the recruiter and offer need confirmation through an independently found company channel." };
  if (official && (recruiter === official || recruiter.endsWith(`.${official}`))) return { status: "exact-or-subdomain", message: "The recruiter domain is an exact match or subdomain of the entered domain. This is only a string comparison; it does not prove mailbox ownership or authenticity." };
  const officialRoot = official.split(".")[0] ?? "";
  const recruiterRoot = recruiter.split(".")[0] ?? "";
  if (officialRoot && recruiterRoot && (editDistanceOne(officialRoot, recruiterRoot) || officialRoot.includes(recruiterRoot) || recruiterRoot.includes(officialRoot))) {
    return { status: "lookalike", message: "The domain text resembles the entered company domain but is not an exact match or subdomain. Independently contact the employer before replying." };
  }
  const parts = recruiter.split(".");
  const suffix = parts.slice(-2).join(".");
  const tld = familiarTlds.has(suffix) ? suffix : parts[parts.length - 1] ?? "";
  if (tld && !familiarTlds.has(tld)) return { status: "unfamiliar-tld", message: "This domain uses a suffix not recognized by this small local reference list. That is not a risk verdict; verify independently." };
  return { status: "unfamiliar", message: "The entered domains do not match. This is not proof of impersonation; verify the recruiter using a company contact you found independently." };
}

export const audiences = ["Tech", "Sales", "Operations / BPO", "Freshers", "Startup", "MNC", "Staffing agency", "Contract / consultant"] as const;
export type Audience = typeof audiences[number];
export const employerTypes = ["Private limited", "Public / listed", "LLP", "Sole proprietor / partnership", "Staffing agency", "Non-profit / trust", "Startup", "Government / PSU", "Not sure"] as const;

export const questionBank: Record<Audience, string[]> = {
  Tech: [
    "What will I own in the first 90 days, and how will success be measured?",
    "Which team, product area and repositories will I work with?",
    "Who reviews code and makes architecture decisions?",
    "What is the on-call rotation, frequency and compensation or time-off policy?",
    "How does the team handle production incidents and post-incident learning?",
    "What is the current deployment cadence and release approval process?",
    "Which technologies are essential on day one versus learnable?",
    "How are security, access and customer data handled for this role?",
    "Is this a replacement or new headcount, and is it approved?",
    "What are the working hours, location expectations and remote-work terms?",
  ],
  Sales: [
    "What is the territory, customer segment and product scope?",
    "How is the quota set, and how often can it change?",
    "What percentage of the team achieved quota in the most recent completed period?",
    "How are commission, accelerators, clawbacks and payment timing documented?",
    "Are leads provided, self-sourced, or a mix?",
    "What is the expected sales cycle and average deal size?",
    "How are ramp targets handled during the first months?",
    "Which CRM and reporting expectations apply?",
    "What travel is required, and who pays approved expenses?",
    "Why is the position open, and what does success at 90 days look like?",
  ],
  "Operations / BPO": [
    "What process, client account and shift will I support?",
    "Are shifts fixed, rotating or night shifts, and how are changes communicated?",
    "What are the targets for quality, productivity and attendance?",
    "How are breaks, weekly offs and overtime handled?",
    "What training is paid, and is any training bond or repayment term proposed?",
    "What is the escalation path for customer or safety issues?",
    "Is transport provided for late shifts, and what are the terms?",
    "Who is the legal employer: the service provider or client?",
    "What equipment and access will the employer provide?",
    "How are performance reviews and target changes documented?",
  ],
  Freshers: [
    "What does the training plan cover and how long does it last?",
    "Is the training paid, and will I be an employee during training?",
    "What role and team will I enter after training?",
    "Are there bonds, fees, deposits or repayment clauses? Can I review them before accepting?",
    "Who will manage and mentor me?",
    "What does a normal first month look like?",
    "How is performance assessed during probation?",
    "What are fixed pay, variable pay, deductions and the expected in-hand components?",
    "Where will I work, and can location or project assignment change?",
    "Can I speak with a future teammate or recent graduate hire?",
  ],
  Startup: [
    "Which legal entity employs me, and how is it related to the product brand?",
    "Is the role and headcount approved, and who owns the budget?",
    "What are the priorities for the next two quarters and this role’s part in them?",
    "How will success be measured while priorities may change?",
    "What is the compensation split between fixed pay, variable pay and equity?",
    "If equity is offered, what instrument, vesting schedule and documents apply?",
    "How often are salaries paid, and who can confirm payroll operations?",
    "Who is the manager, and how large is the immediate team?",
    "What is the expected working pattern during launches or incidents?",
    "What runway or operating assumptions can the company share with candidates?",
  ],
  MNC: [
    "Which Indian legal entity will employ and pay me?",
    "Is this a local team, global team or client-facing assignment?",
    "Who is the India manager and who sets my priorities?",
    "Which time zones and recurring meeting hours are expected?",
    "What location, hybrid and travel terms apply in writing?",
    "How are performance ratings, promotion and compensation reviews handled?",
    "What is the probation and notice period under the local offer?",
    "Will I handle data or systems outside India, and what training is provided?",
    "How are global restructuring or team changes communicated to this role?",
    "Can HR confirm the requisition through an official company contact?",
  ],
  "Staffing agency": [
    "Which entity will be the legal employer and issue my payslips?",
    "Who is the client, and can the assignment be confirmed by the client contact?",
    "What is the assignment duration, renewal process and end-of-assignment notice?",
    "What happens to pay and benefits between assignments?",
    "Who handles leave, appraisal, grievance and workplace safety?",
    "What is the work location and who can change it?",
    "Are any fees, deposits, training charges or document charges requested?",
    "Which entity provides equipment and access?",
    "What are the PF/ESI arrangements and relevant establishment identifiers, if applicable?",
    "What terms apply if the client ends the assignment early?",
  ],
  "Contract / consultant": [
    "Which entity signs the contract and which entity receives the services?",
    "What are the exact deliverables, acceptance criteria and change-control process?",
    "What is the fee, invoice schedule, tax treatment and payment due date?",
    "Who owns intellectual property and pre-existing work?",
    "What confidentiality, data-security and device requirements apply?",
    "Can I work for other clients, and what restrictions are written?",
    "What expenses are reimbursable and who approves them?",
    "How can either party terminate, and what notice or payment applies?",
    "Am I being asked to pay any amount to obtain this contract?",
    "Who is the operational contact if scope or invoices are disputed?",
  ],
};

export const employerTypeGuide = [
  { type: "Private limited", note: "Confirm the legal name and CIN on MCA. The brand may be different; ask which entity signs and pays." },
  { type: "Public / listed", note: "Do the company identity check first, then use NSE/BSE filings as dated context. Filings do not authenticate a recruiter or role." },
  { type: "LLP", note: "Ask for the registered LLP name and LLPIN; search MCA. Do not treat a locally formatted identifier as registry validation." },
  { type: "Sole proprietor / partnership", note: "Not every business has a company CIN. Ask which proprietor or partnership is contracting and what state / tax details apply." },
  { type: "Staffing agency", note: "Separate the agency as legal employer from the client workplace. Confirm assignment, pay, benefits, manager and end-of-assignment terms." },
  { type: "Non-profit / trust", note: "Ask for the exact registered entity and the source of the role’s funding. Different legal forms use different registration systems." },
  { type: "Startup", note: "Verify the actual employing entity, approved headcount, payroll contact, scope and written equity terms if offered." },
  { type: "Government / PSU", note: "Use the official department / PSU recruitment page and independently published contact route; beware lookalike recruitment notices." },
  { type: "Not sure", note: "Ask the recruiter to name the employing legal entity in writing before relying on a brand, logo or domain." },
];

export const employerTypePrompts: Record<string, string[]> = {
  "Private limited": ["Which company entity appears on the offer, and can HR confirm its CIN on MCA?", "Is the role employed by the named entity or another group company?"],
  "Public / listed": ["Which exchange-listed legal entity is relevant to this role?", "Can you point me to the exact dated filing that supports this material claim?"],
  LLP: ["What is the registered LLP name and LLPIN for the entity signing the offer?", "Who is the designated employer contact for payroll and statutory benefits?"],
  "Sole proprietor / partnership": ["Which proprietor or partnership is the contracting employer?", "Which state registration and payment details apply to this work location?"],
  "Staffing agency": ["Which agency is my legal employer, and which client is the assignment with?", "What happens to pay and benefits if the client assignment ends early?"],
  "Non-profit / trust": ["Which registered entity employs and pays staff for this role?", "Which funding or programme is the position attached to, and how is continuity communicated?"],
  Startup: ["Is the hiring headcount approved and who owns the budget?", "What exact equity instrument and signed plan apply if equity is part of the offer?"],
  "Government / PSU": ["Where is this vacancy published on the department or PSU’s official recruitment page?", "Can I verify the requisition with an independently listed office contact?"],
  "Not sure": ["Which exact legal entity will sign, employ and pay me?", "Can you explain the relationship between the brand, recruiter and employer in writing?"],
};

export const faqItems = [
  { q: "Does this checklist rate or certify a company?", a: "No. CareerReality publishes no employer score, rating or verdict here. The checklist helps you compare evidence and record open questions for your own decision." },
  { q: "Does a company appearing on MCA prove that my offer is real?", a: "No. MCA company or LLP master data can help identify a legal entity. It cannot authenticate a recruiter, email, role, or offer." },
  { q: "Is a CIN format check an official validation?", a: "No. The local helper only checks a common text shape and displays a cautious breakdown. Search the identifier on MCA for registry information." },
  { q: "What if the brand name and legal employer are different?", a: "That can happen with group companies, subsidiaries or staffing arrangements. Ask which legal entity signs the offer, employs you, pays you and handles benefits; get the relationship in writing." },
  { q: "Should I pay a recruitment or interview fee?", a: "Pause before paying. Independently contact the employer through a route you found yourself and verify any claimed charge. Never transfer money to a recruiter’s personal account under pressure." },
  { q: "Does no result in a court or regulator search mean there are no issues?", a: "No. Search coverage, spelling, indexing, timing and entity collisions limit what a search can establish. Record only what you searched and what you found." },
  { q: "Do all employers need a GSTIN, Udyam number, PF code or ESIC code?", a: "Not necessarily. Applicability depends on the entity, activity, location, workforce and circumstances. Ask the employer which registration applies instead of assuming an absent listing is a red flag." },
  { q: "Can I check an employer’s PF passbook before joining?", a: "The listed EPFO member passbook is for a member’s own account after joining; it is not a pre-joining employer-verification tool. The sources include a separate EPFO establishment search." },
  { q: "Is a free email address proof of a scam?", a: "No. It is a reason to independently verify the recruiter and offer through an official company contact. This page does not make a diagnostic determination." },
  { q: "Are public filings a financial-health or job-security guarantee?", a: "No. Filings provide dated disclosures, not a guarantee about future performance, team budgets, layoffs, payroll or your role." },
  { q: "What should I do if I already sent money?", a: "Contact your bank or payment provider immediately through its official channel. For financial cyber fraud in India, the official Cyber Crime Portal record advises calling 1930 promptly and filing a report on the portal. Preserve evidence." },
  { q: "Does the offer-text scanner send my text anywhere?", a: "No. Scanning is local in the browser. Pasted text is not submitted to this page’s server, stored by this tool, or sent to an external scanner. Avoid pasting unnecessary personal information." },
  { q: "Are my company details saved?", a: "No. Company name, identifiers, domain, role, city, answers, notes and pasted text are held in page memory only. Reloading or clearing the page removes the entered data." },
  { q: "Can a WhatsApp share happen automatically?", a: "No. The page prepares a short share draft only after you choose the share control. It does not open WhatsApp or send anything automatically." },
  { q: "What if HR will not answer these questions?", a: "Record the unanswered item and ask for an appropriate contact or a written explanation. A refusal is context to weigh, not a standalone finding about the employer." },
];

export const workedExample = {
  title: "Worked example — entirely fictional",
  text: "Suppose “Nimble Mango Labs” sends a candidate a contract from a staffing partner, while the interview described work at a larger customer. The candidate records the staffing partner as the proposed legal employer, checks its exact entity details, asks the partner to confirm who pays salary and who handles PF/leave, and asks the client to confirm the assignment through an independently found contact. One answer is unclear, so the status stays “Couldn’t verify” and the candidate requests the assignment and notice terms in writing. This fictional example does not describe a real employer, record or outcome.",
};

export function buildHrQuestions(input: { legalName?: string; role?: string; city?: string; employerType?: string }): string {
  const context = [input.legalName, input.role, input.city].filter(Boolean).join(" · ");
  return `Hello,\n\nI’m reviewing the ${input.role || "role"}${input.city ? ` in ${input.city}` : ""}${input.legalName ? ` with ${input.legalName}` : ""}. Before I make a decision, could you please confirm:\n\n1. Which legal entity will sign my offer, employ me and pay my salary?\n2. Is this role and headcount approved, and who will be my manager?\n3. What are the first 90-day expectations, work location and working hours?\n4. Could you share the complete written compensation structure and key conditions?\n5. Which PF/ESI or other establishment arrangements apply to this role, if applicable?\n6. Can you confirm the recruiter and requisition through an official company contact?\n\n${input.employerType === "Staffing agency" ? "7. Please also confirm the client assignment, duration, renewal and end-of-assignment terms.\n\n" : ""}Thank you${context ? `,\n${context}` : ""}`;
}

export function buildEmailSubject(legalName?: string): string {
  return `Request to confirm role and employing entity${legalName ? ` — ${legalName}` : ""}`;
}
