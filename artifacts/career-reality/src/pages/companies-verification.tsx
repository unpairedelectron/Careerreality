import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "@/components/shared/app-link";
import { ArrowUpRight, Check, Clipboard, Printer, RotateCcw, Share2 } from "lucide-react";
import { PublicPage } from "@/components/shared/public-shell";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  assessRecruiterDomain,
  audiences,
  buildEmailSubject,
  buildHrQuestions,
  checkLlpShape,
  employerTypeGuide,
  employerTypePrompts,
  employerTypes,
  faqItems,
  parseCinShape,
  questionBank,
  scanOfferText,
  verificationSources,
  verificationSteps,
  workedExample,
  type Audience,
  type VerificationStatus,
} from "@/lib/company-verification-model";
import "./companies-verification.css";

type Intake = {
  legalName: string;
  cinLlpIn: string;
  officialDomain: string;
  recruiterDomain: string;
  role: string;
  city: string;
  employerType: string;
  offerChannel: string;
};

const defaultValues: Intake = {
  legalName: "", cinLlpIn: "", officialDomain: "", recruiterDomain: "",
  role: "", city: "", employerType: "", offerChannel: "",
};

const sourceById = (id: string) => verificationSources.find((source) => source.id === id);
const statusLabel: Record<VerificationStatus, string> = {
  "not-started": "Not started",
  verified: "Verified",
  mismatch: "Mismatch",
  "couldnt-verify": "Couldn’t verify",
};
const statusOptions: Array<{ value: Exclude<VerificationStatus, "not-started">; label: string }> = [
  { value: "verified", label: "Verified" },
  { value: "mismatch", label: "Mismatch" },
  { value: "couldnt-verify", label: "Couldn’t verify" },
];

function ExternalSource({ id }: { id: string }) {
  const source = sourceById(id);
  if (!source) return null;
  return <a data-testid={`link-source-${source.id}`} href={source.url} target="_blank" rel="noopener noreferrer">{source.label}<ArrowUpRight size={13} aria-hidden="true" /></a>;
}

function Field({ name, label, placeholder, hint, type = "text" }: { name: keyof Intake; label: string; placeholder?: string; hint?: string; type?: string }) {
  return (
    <FormField name={name} render={({ field }) => (
      <FormItem className="cv-field">
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <input {...field} type={type} placeholder={placeholder} data-testid={`input-${name}`} />
        </FormControl>
        {hint && <p className="cv-help">{hint}</p>}
        <FormMessage />
      </FormItem>
    )} />
  );
}

export function CompaniesVerificationPage() {
  const form = useForm<Intake>({ defaultValues });
  const [statuses, setStatuses] = useState<Record<string, VerificationStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [offerText, setOfferText] = useState("");
  const [audience, setAudience] = useState<Audience>("Tech");
  const [copied, setCopied] = useState("");
  const [shareDraft, setShareDraft] = useState("");
  const values = form.watch();
  const cin = useMemo(() => parseCinShape(values.cinLlpIn || ""), [values.cinLlpIn]);
  const llpin = useMemo(() => checkLlpShape(values.cinLlpIn || ""), [values.cinLlpIn]);
  const domainCheck = useMemo(() => assessRecruiterDomain(values.officialDomain || "", values.recruiterDomain || ""), [values.officialDomain, values.recruiterDomain]);
  const findings = useMemo(() => scanOfferText(offerText), [offerText]);
  const counts = useMemo(() => verificationSteps.reduce((total, step) => {
    const status = statuses[step.id] || "not-started";
    total[status] = (total[status] || 0) + 1;
    return total;
  }, {} as Record<VerificationStatus, number>), [statuses]);
  const hrText = useMemo(() => buildHrQuestions({
    legalName: values.legalName, role: values.role, city: values.city, employerType: values.employerType,
  }), [values.legalName, values.role, values.city, values.employerType]);

  const setStepStatus = (id: string, status: VerificationStatus) => {
    setStatuses((current) => ({ ...current, [id]: status }));
  };
  const clearAll = () => {
    form.reset(defaultValues);
    setStatuses({});
    setNotes({});
    setOfferText("");
    setShareDraft("");
    setCopied("");
  };
  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 2400);
    } catch {
      setCopied("Copy unavailable — select and copy the text manually.");
    }
  };
  const makeShareDraft = () => {
    const lines = verificationSteps.map((step) => `${step.title}: ${statusLabel[statuses[step.id] || "not-started"]}`);
    const body = `Employer and offer check — my current notes\n\n${lines.join("\n")}\n\nThis is a personal evidence checklist, not a company rating or verdict. I have not included the employer name or private notes.`;
    setShareDraft(body);
  };
  const shareOnWhatsApp = () => {
    if (!shareDraft) return;
    const url = sourceById("whatsapp-share")?.url;
    if (url) window.open(`${url}?text=${encodeURIComponent(shareDraft)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <PublicPage
      eyebrow="CareerReality / private employer check"
      title="Check the employer behind the offer."
      intro="A practical, evidence-first checklist for Indian job seekers. Verify the entity, confirm the offer, and keep open questions visible—without turning a company into a score."
      seo={{
        title: "Verify an Indian Employer and Job Offer | CareerReality",
        description: "Check an Indian employer and job offer privately with official sources, role-specific questions, and evidence notes. No company score, rating, or verdict.",
        path: "/companies/",
        breadcrumbs: [
          { name: "Home", path: "/" },
          { name: "Tools", path: "/tools" },
          { name: "Employer check", path: "/companies/" },
        ],
        faqs: faqItems.map(({ q, a }) => ({ question: q, answer: a })),
      }}
    >
      <div className="cv-page" data-testid="page-companies-verification">
        <section className="cv-hero" aria-labelledby="cv-hero-title" data-testid="section-verification-hero">
          <p className="cv-kicker">A field checklist, not a directory</p>
          <h2 id="cv-hero-title">Ten minutes to ask better questions.</h2>
          <p className="cv-lede">Work through the seven checks in order. Start with the legal employer, then independently confirm the person and the offer. You decide what the evidence means.</p>
          <div className="cv-hero-meta">
            <span className="cv-pill">7 guided checks</span>
            <span className="cv-pill">No company rating</span>
            <span className="cv-pill">Nothing saved or sent</span>
          </div>
          <div className="cv-actions" style={{ marginTop: "1.35rem" }}>
            <a className="cv-button" href="#cv-checklist" data-testid="link-start-verification">Start the checklist <ArrowUpRight size={15} aria-hidden="true" /></a>
            <a className="cv-button secondary" href="#cv-immediate-response" data-testid="link-response-plan">If money was requested</a>
          </div>
        </section>

        <div className="cv-layout">
          <div className="cv-main-column">
            <section id="cv-checklist" className="cv-panel" aria-labelledby="cv-intake-title" data-testid="section-intake">
              <div className="cv-subhead">01 / Start with what you know</div>
              <h2 id="cv-intake-title" className="cv-section-title" style={{ margin: ".55rem 0 .7rem" }}>Keep the offer in context.</h2>
              <p className="cv-help" style={{ maxWidth: "64ch", marginBottom: "1rem" }}>These details personalize only the question draft and local format checks. They are kept in page memory only; do not paste confidential information here.</p>
              <Form {...form}>
                <form className="cv-field-grid" onSubmit={(event) => event.preventDefault()} data-testid="form-company-intake">
                  <Field name="legalName" label="Legal employer name" placeholder="As written on the offer" />
                  <Field name="cinLlpIn" label="CIN / LLPIN (optional)" placeholder="Enter the identifier" hint="A local shape helper appears below. It does not contact or validate MCA." />
                  <Field name="officialDomain" label="Official website domain" placeholder="example.in" hint="Enter the domain you independently identify as official." />
                  <Field name="recruiterDomain" label="Recruiter email domain" placeholder="example.in or gmail.com" />
                  <Field name="role" label="Role or title" placeholder="e.g. QA Engineer" />
                  <Field name="city" label="Work city" placeholder="e.g. Pune" />
                  <FormField name="employerType" render={({ field }) => (
                    <FormItem className="cv-field">
                      <FormLabel>Employer type</FormLabel>
                      <FormControl><select {...field} data-testid="select-employer-type"><option value="">Choose if known</option>{employerTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name="offerChannel" render={({ field }) => (
                    <FormItem className="cv-field">
                      <FormLabel>How did the offer arrive?</FormLabel>
                      <FormControl><select {...field} data-testid="select-offer-channel"><option value="">Choose one</option><option>Email</option><option>Company careers portal</option><option>Staffing agency</option><option>Messaging app</option><option>Job platform</option><option>Other / not sure</option></select></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </form>
              </Form>
              {values.cinLlpIn && <div className="cv-inline-result" style={{ marginTop: ".8rem" }} data-testid="status-identifier-shape">
                <strong>Local format helper:</strong> {cin.length === 21 ? cin.message : llpin.message}
                {cin.shapeLooksLikeCIN && <p className="cv-mono" style={{ margin: ".35rem 0 0" }}>Local pattern match · 21 characters</p>}
                <p className="cv-help" style={{ margin: ".4rem 0 0" }}>No suitable MCA-published reference defining CIN segment meanings was found in the sources checked. The linked MCA pages let you search for the identifier; use those records to confirm it. This local pattern check is not an MCA-validated decoder.</p>
              </div>}
              <div style={{ marginTop: "1rem" }}>
                <p className="cv-label">Domain comparison</p>
                <div id="cv-recruiter-domain-result" className="cv-inline-result" style={{ marginTop: ".35rem" }} data-testid="status-domain-check">{domainCheck.message}</div>
              </div>
              <p className="cv-privacy" style={{ marginTop: "1rem" }}>PRIVATE BY DESIGN · This tool makes no requests with your entries, uses no browser storage, and has no analytics event for your answers. Clear all to remove in-memory entries.</p>
            </section>

            <section className="cv-panel" aria-labelledby="cv-status-title" style={{ marginTop: "1rem" }} data-testid="section-status-summary">
              <div className="cv-two-col" style={{ alignItems: "center" }}>
                <div>
                  <div className="cv-subhead">Your notes, your call</div>
                  <h2 id="cv-status-title" className="cv-section-title" style={{ margin: ".55rem 0" }}>A status summary, not a verdict.</h2>
                  <p className="cv-help">Mark each step only after you have reviewed the evidence. A “Mismatch” is a question to resolve—not a finding of fraud.</p>
                </div>
                <div className="cv-status-counts" aria-live="polite" data-testid="summary-verification-status">
                  <span className="cv-status-chip" data-status="verified">{counts.verified || 0} Verified</span>
                  <span className="cv-status-chip" data-status="mismatch">{counts.mismatch || 0} Mismatch</span>
                  <span className="cv-status-chip">{counts["couldnt-verify"] || 0} Couldn’t verify</span>
                  <span className="cv-status-chip">{counts["not-started"] || 0} Not started</span>
                </div>
              </div>
            </section>

            <section style={{ marginTop: "1.1rem" }} aria-labelledby="cv-steps-title">
              <div className="cv-subhead">02 / The seven checks</div>
              <h2 id="cv-steps-title" className="cv-section-title" style={{ margin: ".55rem 0 1rem" }}>Follow the evidence, one question at a time.</h2>
              <div style={{ display: "grid", gap: ".7rem" }}>
                {verificationSteps.map((step, index) => {
                  const currentStatus = statuses[step.id] || "not-started";
                  return (
                    <details className="cv-step" key={step.id} open={index === 0} data-testid={`step-verification-${step.id}`}>
                      <summary>
                        <span className="cv-step-index">{String(index + 1).padStart(2, "0")}</span>
                        <span className="cv-step-title">{step.title}</span>
                        <span className={`cv-step-status cv-status-${currentStatus}`} data-testid={`status-step-${step.id}`}>{statusLabel[currentStatus]}</span>
                      </summary>
                      <div className="cv-step-body">
                        <div className="cv-step-grid">
                          <div>
                            <p><strong>Why this matters</strong><br />{step.why}</p>
                            <strong>What to do</strong>
                            <ol>{step.actions.map((action, actionIndex) => <li key={`${step.id}-action-${actionIndex}`}>{action}</li>)}</ol>
                          </div>
                          <div>
                            <p><strong>What a match can look like</strong><br />{step.match}</p>
                            <p><strong>What a mismatch can look like</strong><br />{step.mismatch}</p>
                            <div className="cv-inline-result"><strong>Next step:</strong> {step.next}</div>
                            <div className="cv-action-row" role="group" aria-label={`Set status for ${step.title}`}>
                              {statusOptions.map((option) => <button type="button" key={option.value} onClick={() => setStepStatus(step.id, option.value)} className={`cv-button quiet ${currentStatus === option.value ? "is-selected" : ""}`} aria-pressed={currentStatus === option.value} data-testid={`button-${option.value}-${step.id}`}>{option.value === "verified" && <Check size={14} aria-hidden="true" />}{option.label}</button>)}
                            </div>
                            <label className="cv-field">
                              <span className="cv-label">Private note for this step</span>
                              <textarea value={notes[step.id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [step.id]: event.target.value }))} placeholder="What did you check? What is still open?" data-testid={`textarea-note-${step.id}`} />
                            </label>
                            {step.sourceIds.length > 0 && <div className="cv-source-row" style={{ marginTop: ".8rem" }}><strong>Official source links</strong>{step.sourceIds.map((sourceId) => <ExternalSource id={sourceId} key={sourceId} />)}</div>}
                          </div>
                        </div>
                      </div>
                    </details>
                  );
                })}
              </div>
            </section>

            <section id="cv-immediate-response" className="cv-panel" style={{ marginTop: "1.2rem" }} aria-labelledby="cv-response-title" data-testid="section-immediate-response">
              <div className="cv-subhead">03 / If the offer feels wrong</div>
              <h2 id="cv-response-title" className="cv-section-title" style={{ margin: ".55rem 0 .85rem" }}>Pause first. Use a channel you trust.</h2>
              <div className="cv-alert">
                <strong>Already sent money or suspect financial cyber fraud?</strong>
                Contact your bank or payment provider promptly through a phone number or app you independently know is official. The National Cyber Crime Reporting Portal source record advises calling <strong>1930 promptly for financial cyber fraud</strong> and using the portal to report. Preserve messages, account details, transaction references and dates. This page cannot promise a response time or outcome.
              </div>
              <ul className="cv-list">
                <li><ExternalSource id="cybercrime-portal" /> — report cybercrime; the destination could not be independently verified on 28 Oct 2026. Confirm current instructions on the official portal before relying on them.</li>
                <li><ExternalSource id="cybercrime-job-advisory" /> — official fake-job and recruitment-scam advisory; the document could not be independently verified on 28 Oct 2026. Confirm its current contents before relying on it.</li>
                <li>Report the listing or recruiter through the job platform’s own report / safety flow, and preserve the listing URL and messages. Use the platform where you found the role; no platform-specific destination is supplied here.</li>
              </ul>
              <p className="cv-sticky-note">Never share an OTP or password with a recruiter. If a payment is requested, stop and independently verify the request before taking any action.</p>
            </section>

            <section className="cv-panel" style={{ marginTop: "1.2rem" }} aria-labelledby="cv-scanner-title" data-testid="section-offer-scanner">
              <div className="cv-subhead">04 / A local text check</div>
              <h2 id="cv-scanner-title" className="cv-section-title" style={{ margin: ".55rem 0 .8rem" }}>Look for patterns—not a diagnosis.</h2>
              <p className="cv-help">Paste only text you are comfortable reviewing in this browser. The scanner checks for common wording about fees, personal transfers, OTPs, equipment purchases, urgency, guaranteed outcomes, no-interview offers, unpaid training, early document requests, remote access, crypto / gift cards, and salary claims. It does not send, save, or judge the message.</p>
              <label className="cv-field" style={{ marginTop: ".8rem" }}>
                <span className="cv-label">Recruiter message (optional)</span>
                <textarea className="cv-textarea" value={offerText} onChange={(event) => setOfferText(event.target.value)} placeholder="Paste a short excerpt after removing personal details…" data-testid="textarea-offer-text" />
              </label>
              <div className="cv-scan" style={{ marginTop: ".8rem" }} aria-live="polite" data-testid="results-offer-scan">
                {!offerText.trim() ? <div className="cv-scan-result">No text entered. The full message may contain context a pattern check cannot understand.</div> : findings.length === 0 ? <div className="cv-scan-result">No listed wording pattern matched. This does not establish that the offer or sender is safe.</div> : findings.map((finding) => <div className="cv-scan-result" key={finding.id} data-testid={`finding-offer-${finding.id}`}><strong>{finding.severity === "high" ? "Pause and verify" : "Worth checking"} · {finding.label}</strong><br />{finding.explanation}</div>)}
              </div>
              <p className="cv-privacy" style={{ marginTop: ".8rem" }}>This is a local, rule-based pattern scan—not an AI detector, fraud finding, legal opinion, or guarantee.</p>
            </section>

            <section className="cv-panel" style={{ marginTop: "1.2rem" }} aria-labelledby="cv-questions-title" data-testid="section-hr-questions">
              <div className="cv-subhead">05 / Ask the people doing the work</div>
              <h2 id="cv-questions-title" className="cv-section-title" style={{ margin: ".55rem 0 .8rem" }}>Questions that fit the role.</h2>
              <div className="cv-two-col" style={{ alignItems: "end" }}>
                <label className="cv-field">
                  <span className="cv-label">Question set</span>
                  <select className="cv-select" value={audience} onChange={(event) => setAudience(event.target.value as Audience)} data-testid="select-question-audience">{audiences.map((item) => <option key={item} value={item}>{item}</option>)}</select>
                </label>
                <label className="cv-field">
                  <span className="cv-label">Employer context</span>
                  <select className="cv-select" value={values.employerType || ""} onChange={(event) => form.setValue("employerType", event.target.value, { shouldDirty: true })} data-testid="select-question-employer">
                    <option value="">Any / not sure</option>{employerTypes.map((item) => <option value={item} key={item}>{item}</option>)}
                  </select>
                </label>
              </div>
              <p className="cv-help" style={{ marginTop: ".7rem" }}>Choose an audience for a focused set. Each set has ten prompts. Employer type helps frame the questions; it does not remove any due-diligence step.</p>
              <ol className="cv-question-list" data-testid={`list-questions-${audience.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>{questionBank[audience].map((question, index) => <li key={`${audience}-${index}`}>{question}</li>)}</ol>
              {values.employerType && <div className="cv-inline-result" data-testid="list-employer-type-questions"><strong>For this employer type ({values.employerType}), also ask:</strong><ol style={{ marginBottom: 0 }}>{(employerTypePrompts[values.employerType] || []).map((question) => <li key={question}>{question}</li>)}</ol></div>}
              <div className="cv-panel" style={{ padding: "1rem", marginTop: "1rem", background: "hsl(var(--secondary) / .26)" }}>
                <h3 style={{ fontFamily: "var(--app-font-serif)", fontSize: "1.35rem" }}>A note you can adapt for HR</h3>
                <p className="cv-mono" style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }} data-testid="text-generated-hr-email">{buildEmailSubject(values.legalName)}{"\n\n"}{hrText}</p>
                <div className="cv-actions">
                  <button className="cv-button quiet" type="button" onClick={() => void copyText(`${buildEmailSubject(values.legalName)}\n\n${hrText}`, "HR email copied")} data-testid="button-copy-hr-email"><Clipboard size={14} /> Copy email draft</button>
                  <button className="cv-button secondary" type="button" onClick={() => void copyText(questionBank[audience].map((question, index) => `${index + 1}. ${question}`).join("\n"), "Questions copied")} data-testid="button-copy-questions"><Clipboard size={14} /> Copy these questions</button>
                </div>
                {copied && <p role="status" className="cv-success" data-testid="status-copy">{copied}</p>}
              </div>
            </section>

            <section className="cv-panel" style={{ marginTop: "1.2rem" }} aria-labelledby="cv-type-guide-title" data-testid="section-employer-type-guide">
              <div className="cv-subhead">06 / Know what kind of employer is in front of you</div>
              <h2 id="cv-type-guide-title" className="cv-section-title" style={{ margin: ".55rem 0 .9rem" }}>Different legal forms, different checks.</h2>
              <p className="cv-table-hint">Swipe horizontally to see all columns.</p>
              <div className="cv-table-wrap" role="region" aria-label="Scrollable employer type comparison table" tabIndex={0}><table className="cv-table">
                <thead><tr><th>Employer type</th><th>What to verify / ask</th></tr></thead>
                <tbody>{employerTypeGuide.map((item) => <tr key={item.type}><th scope="row">{item.type}</th><td>{item.note}</td></tr>)}</tbody>
              </table></div>
            </section>

            <section className="cv-panel" style={{ marginTop: "1.2rem" }} aria-labelledby="cv-flags-title" data-testid="section-flags">
              <div className="cv-subhead">07 / Read the pattern, then verify</div>
              <h2 id="cv-flags-title" className="cv-section-title" style={{ margin: ".55rem 0 .9rem" }}>Signals are prompts, not proof.</h2>
              <div className="cv-flag">
                <div>
                  <h3>Green: useful evidence to collect</h3>
                  <ul className="cv-list">
                    <li>Offer, legal entity and recruiter can be confirmed through independently found channels.</li>
                    <li>Role, manager, location, pay structure and start conditions are consistent in writing.</li>
                    <li>HR answers reasonable questions without asking for a fee, OTP or password.</li>
                    <li>Identifiers and official records align with the entity and location claimed.</li>
                    <li>Unclear points are acknowledged and have a specific follow-up owner.</li>
                  </ul>
                </div>
                <div>
                  <h3>Red: pause and resolve</h3>
                  <ul className="cv-list">
                    <li>Recruitment, interview, equipment or training money is requested without independent confirmation.</li>
                    <li>Urgency is used to stop you verifying the sender, payment route or written terms.</li>
                    <li>Personal UPI / bank transfers, OTPs, passwords, remote access or gift cards are requested.</li>
                    <li>Employer identity, job scope, manager or work location changes repeatedly.</li>
                    <li>Records appear to describe another entity; verify identity before drawing conclusions.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="cv-panel" style={{ marginTop: "1.2rem" }} aria-labelledby="cv-example-title" data-testid="section-fictional-example">
              <div className="cv-subhead">An example of careful uncertainty</div>
              <h2 id="cv-example-title" className="cv-section-title" style={{ margin: ".55rem 0 .8rem" }}>{workedExample.title}</h2>
              <p style={{ fontSize: ".87rem", lineHeight: 1.8 }}>{workedExample.text}</p>
            </section>

            <section className="cv-panel" style={{ marginTop: "1.2rem" }} aria-labelledby="cv-docs-title" data-testid="section-offer-documents">
              <div className="cv-subhead">Before you accept</div>
              <h2 id="cv-docs-title" className="cv-section-title" style={{ margin: ".55rem 0 .85rem" }}>Offer and document checklist.</h2>
              <ul className="cv-list">
                <li>Legal employer on letter, legal name behind the brand, and who pays salary.</li>
                <li>Role title, responsibilities, reporting manager, location, work mode and travel expectations.</li>
                <li>Fixed and variable compensation, payout terms, benefits, deductions, probation and review cycle.</li>
                <li>Joining date, conditions, notice period, termination terms, and any bond or repayment clause.</li>
                <li>For contractor / agency arrangements: client, assignment period, employer responsibilities and end-of-assignment process.</li>
                <li>Document process and secure submission route. Do not share passwords, OTPs or unnecessary financial data.</li>
              </ul>
              <p className="cv-help">Useful CareerReality tools and guides:</p>
              <div className="cv-actions">
                <Link className="cv-button secondary" href="/salary-calculator/">Compare take-home pay <ArrowUpRight size={14} /></Link>
                <Link className="cv-button secondary" href="/resign-or-stay/">Think through a career move <ArrowUpRight size={14} /></Link>
                <Link className="cv-button secondary" href="/layoff-runway/">Plan a financial runway <ArrowUpRight size={14} /></Link>
                <Link className="cv-button secondary" href="/guides/">Browse career guides <ArrowUpRight size={14} /></Link>
              </div>
            </section>

            <section className="cv-panel cv-faq" style={{ marginTop: "1.2rem" }} aria-labelledby="cv-faq-title" data-testid="section-faq">
              <div className="cv-subhead">Questions people ask</div>
              <h2 id="cv-faq-title" className="cv-section-title" style={{ margin: ".55rem 0 .7rem" }}>Clear limits matter.</h2>
              {faqItems.map((item, index) => <details key={item.q} data-testid={`faq-company-${index + 1}`}><summary>{item.q}</summary><p>{item.a}</p></details>)}
            </section>

            <section className="cv-panel" style={{ marginTop: "1.2rem" }} aria-labelledby="cv-glossary-title" data-testid="section-glossary">
              <div className="cv-subhead">Small glossary</div>
              <h2 id="cv-glossary-title" className="cv-section-title" style={{ margin: ".55rem 0 .8rem" }}>Terms worth knowing.</h2>
              <dl className="cv-list">
                <div><dt><strong>CIN</strong></dt><dd className="cv-help">Corporate Identity Number used for a company record. The local shape helper is not an official validation.</dd></div>
                <div><dt><strong>LLPIN</strong></dt><dd className="cv-help">Limited Liability Partnership Identification Number. Confirm details through MCA.</dd></div>
                <div><dt><strong>Legal employer</strong></dt><dd className="cv-help">The entity that formally employs you; it may differ from the product brand or client location.</dd></div>
                <div><dt><strong>Establishment code</strong></dt><dd className="cv-help">An identifier associated with an establishment record; ask which entity and location it applies to.</dd></div>
                <div><dt><strong>Variable pay</strong></dt><dd className="cv-help">Compensation that depends on documented conditions, targets or discretion. Ask for calculation and payout terms.</dd></div>
                <div><dt><strong>Lookalike domain</strong></dt><dd className="cv-help">A web or email domain designed to resemble another. Text resemblance is a warning to check—not proof of who sent a message.</dd></div>
              </dl>
            </section>

            <section className="cv-panel" style={{ marginTop: "1.2rem" }} aria-labelledby="cv-sources-title" data-testid="section-source-table">
              <div className="cv-subhead">Evidence desk / reference list</div>
              <h2 id="cv-sources-title" className="cv-section-title" style={{ margin: ".55rem 0 .7rem" }}>Official source links and limits.</h2>
              <p className="cv-help">These official links were checked on the dates shown. The notes explain what we could confirm and where information was unavailable. A checked link is not an endorsement or a guarantee it will remain available.</p>
              <p className="cv-table-hint">Swipe horizontally to see all columns.</p>
              <div className="cv-table-wrap" style={{ marginTop: ".8rem" }} role="region" aria-label="Scrollable official source references table" tabIndex={0}><table className="cv-table">
                <thead><tr><th>Source</th><th>Use it for</th><th>Checked</th><th>What we could confirm</th></tr></thead>
                <tbody>{verificationSources.map((source) => <tr key={source.id}><th scope="row"><a href={source.url} target="_blank" rel="noopener noreferrer" data-testid={`table-source-${source.id}`}>{source.label}<ArrowUpRight size={12} aria-hidden="true" /></a></th><td>{source.purpose}</td><td>{source.checkedOn}</td><td>{source.check}</td></tr>)}</tbody>
              </table></div>
            </section>
          </div>

          <aside className="cv-aside" aria-label="Checklist actions and privacy">
            <section className="cv-panel" data-testid="panel-your-checklist">
              <p className="cv-subhead">Your working note</p>
              <h2 className="cv-section-title" style={{ fontSize: "1.7rem", margin: ".45rem 0 .7rem" }}>Keep control of the next step.</h2>
              <p className="cv-help">This checklist is not saved. Print a copy for your own records or clear the current page’s entries.</p>
              <div className="cv-actions" style={{ marginTop: ".9rem" }}>
                <button className="cv-button quiet" type="button" onClick={() => window.print()} data-testid="button-print-checklist"><Printer size={14} /> Print</button>
                <button className="cv-button danger" type="button" onClick={clearAll} data-testid="button-clear-all"><RotateCcw size={14} /> Clear all</button>
              </div>
              <hr style={{ border: 0, borderTop: "1px solid hsl(var(--border))", margin: "1rem 0" }} />
              <p className="cv-label">WhatsApp share draft</p>
               <p className="cv-help">Creates a status-by-step summary only. It excludes your company name, identifiers, offer text, and private notes. Nothing opens or sends until you choose the next button.</p>
              <div className="cv-actions" style={{ marginTop: ".6rem" }}>
                <button type="button" className="cv-button secondary" onClick={makeShareDraft} data-testid="button-create-share-draft"><Share2 size={14} /> Prepare text</button>
              </div>
              {shareDraft && <div style={{ marginTop: ".7rem" }}>
                <textarea className="cv-textarea" value={shareDraft} onChange={(event) => setShareDraft(event.target.value)} aria-label="Editable WhatsApp share text" data-testid="textarea-share-draft" />
                <div className="cv-actions" style={{ marginTop: ".5rem" }}>
                  <button type="button" className="cv-button quiet" onClick={() => void copyText(shareDraft, "Share text copied")} data-testid="button-copy-share"><Clipboard size={14} /> Copy text</button>
                  <button type="button" className="cv-button" onClick={shareOnWhatsApp} data-testid="button-open-whatsapp">Open WhatsApp <ArrowUpRight size={14} /></button>
                </div>
              </div>}
              {copied && <p role="status" className="cv-success" data-testid="status-aside-copy">{copied}</p>}
            </section>
            <section className="cv-panel" style={{ marginTop: ".8rem" }} data-testid="panel-method">
              <p className="cv-subhead">Method / boundaries</p>
              <ul className="cv-list">
                <li>Follow official sources for records; contact the employer independently for the offer.</li>
                <li>Record dates, identifiers, exact answers and unanswered items.</li>
                <li>Do not infer a company outcome from a missing result or a shared name.</li>
                <li>Statuses are your own notes. There is no score, ranking, or automated verdict.</li>
              </ul>
              <p className="cv-privacy">No company details, identifiers, domain, role, city, employer type, channel, status, notes or pasted message are placed in a URL, local storage, request, or analytics event by this page.</p>
            </section>
            <section className="cv-panel" style={{ marginTop: ".8rem" }} data-testid="panel-open-questions">
              <p className="cv-subhead">Leave these open until answered</p>
              <ul className="cv-list">
                <li>Who exactly signs and pays?</li>
                <li>Can the employer confirm this recruiter and requisition?</li>
                <li>What remains different between the spoken and written offer?</li>
                <li>Which registration applies to this entity, location and role?</li>
                <li>What must be clarified before you resign, relocate or pay?</li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </PublicPage>
  );
}

export default CompaniesVerificationPage;
