import { useRef, useState } from "react";
import { useFetchPublicJobLink } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { AlertTriangle, FileText, RotateCcw, ShieldCheck, Upload, X } from "lucide-react";
import { PublicPage } from "@/components/shared/public-shell";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { extractResumeDocument, MAX_RESUME_FILE_BYTES } from "@/lib/resume-document-extractor";
import {
  analyzeJobPosting,
  calculateJobPostingReadiness,
  isResumeTextLikelyGarbled,
  JOB_POSTING_TEXT_LIMIT,
  RESUME_TEXT_LIMIT,
  type JobEvidenceSource,
  type JobEvidenceStatus,
  type JobPostingAnalysis,
  type JobRequirement,
} from "@workspace/career-tools";

type FormValues = {
  resumeText: string;
  jobText: string;
  jobTitle: string;
  company: string;
  location: string;
  employmentType: string;
};

const statusLabels: Record<JobEvidenceStatus, string> = {
  direct: "Direct evidence",
  transferable: "Transferable evidence",
  partial: "Partial evidence",
  "not-documented": "Not documented",
  "confirmed-gap": "Confirmed gap",
  unresolved: "Unresolved",
};

const evidenceSourceLabels: Record<JobEvidenceSource, string> = {
  "candidate-authored": "Candidate-authored",
  "role-text": "Role text",
  unknown: "Unknown source",
};

const evidenceSourceOptions: JobEvidenceSource[] = [
  "candidate-authored",
  "role-text",
  "unknown",
];

const categoryLabels: Record<JobRequirement["category"], string> = {
  responsibility: "Responsibility or outcome",
  "essential-competency": "Explicit competency",
  eligibility: "Employment eligibility or condition",
  qualification: "Qualification",
  preferred: "Preferred item",
  "contextual-tool": "Contextual tool or skill",
  unclear: "Needs clarification",
};

const statusNextSteps: Record<JobEvidenceStatus, string> = {
  direct: "Bring this example forward and state your role and outcome.",
  transferable: "Explain what transfers from your experience and verify platform-specific expectations.",
  partial: "Add a concrete task, scope, or outcome if you can substantiate it.",
  "not-documented": "If you have this experience, add a truthful example. Missing text is not proof of a gap.",
  "confirmed-gap": "Decide whether to build evidence or ask whether the skill can be learned on the job.",
  unresolved: "Clarify the wording before treating it as a candidate gap.",
};

const statusOptions: JobEvidenceStatus[] = [
  "direct", "transferable", "partial", "not-documented", "confirmed-gap", "unresolved",
];

export default function JobPostingRealityCheckPage() {
  const form = useForm<FormValues>({
    defaultValues: { resumeText: "", jobText: "", jobTitle: "", company: "", location: "", employmentType: "" },
  });
  const [analysis, setAnalysis] = useState<JobPostingAnalysis | null>(null);
  const [overrides, setOverrides] = useState<Record<string, JobEvidenceStatus>>({});
  const [sourceOverrides, setSourceOverrides] = useState<Record<string, JobEvidenceSource>>({});
  const [error, setError] = useState("");
  const [matchAnnouncement, setMatchAnnouncement] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [jobLinkConsent, setJobLinkConsent] = useState(false);
  const [jobLinkError, setJobLinkError] = useState("");
  const [jobLinkNotice, setJobLinkNotice] = useState("");
  const [jobReviewPending, setJobReviewPending] = useState(false);
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumeFileError, setResumeFileError] = useState("");
  const [resumeReviewPending, setResumeReviewPending] = useState(false);
  const [resumeTextReviewConfirmed, setResumeTextReviewConfirmed] = useState<string | null>(null);
  const [isExtractingResume, setIsExtractingResume] = useState(false);
  const watchedResumeText = form.watch("resumeText");
  const resumeTextNeedsReview = isResumeTextLikelyGarbled(watchedResumeText);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fetchJobLink = useFetchPublicJobLink();
  const showJobLinkFetch = import.meta.env.VITE_JOB_LINK_FETCH_ENABLED === "true";
  const readiness = calculateJobPostingReadiness(analysis?.requirements ?? [], overrides);
  const includedRequirements = readiness.includedRequirements;
  const excludedCount = (analysis?.requirements.length ?? 0) - includedRequirements.length;
  const breakdown = includedRequirements.reduce((counts, requirement) => {
    const status = overrides[requirement.id] ?? requirement.evidenceStatus;
    if (status in counts) counts[status as keyof typeof counts] += 1;
    return counts;
  }, { direct: 0, transferable: 0, partial: 0, "not-documented": 0, "confirmed-gap": 0 });
  const { score, verdict, nextAction, mandatoryGapConfirmedByUser } = readiness;
  const highlightedRequirements = [...includedRequirements]
    .sort((left, right) => {
      const leftStatus = overrides[left.id] ?? left.evidenceStatus;
      const rightStatus = overrides[right.id] ?? right.evidenceStatus;
      const priority = (requirement: JobRequirement, status: JobEvidenceStatus) => {
        if (requirement.signal === "mandatory" && (status === "not-documented" || status === "confirmed-gap")) return 0;
        if (status === "direct") return 1;
        if (status === "transferable") return 2;
        if (status === "partial") return 3;
        return 4;
      };
      return priority(left, leftStatus) - priority(right, rightStatus);
    })
    .slice(0, 3);
  const highlightedIds = new Set(highlightedRequirements.map((requirement) => requirement.id));
  const lowConfidenceRequirements = analysis?.requirements.filter((requirement) => requirement.confidence === "low") ?? [];
  const remainingRequirements = analysis?.requirements.filter((requirement) => !highlightedIds.has(requirement.id)) ?? [];
  const otherRequirements = remainingRequirements.filter((requirement) => requirement.confidence !== "low");
  const allRequirementsRef = useRef<HTMLDetailsElement>(null);

  function renderRequirement(requirement: JobRequirement, index: number) {
    const status = overrides[requirement.id] ?? requirement.evidenceStatus;
    const evidenceSourceKey = `${index}:evidence`;
    const evidenceSource = sourceOverrides[evidenceSourceKey] ?? requirement.evidenceQuoteSource ?? "unknown";
    const denialSourceKey = `${index}:denial`;
    const denialSource = sourceOverrides[denialSourceKey] ?? requirement.conflictingDenialQuoteSource ?? "unknown";
    return (
      <article key={requirement.id} className="rounded-2xl border border-border bg-card p-4 sm:p-5" data-testid={`job-requirement-${index}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[.14em] text-primary">
                {requirement.signal} · {categoryLabels[requirement.category]}
              </p>
              {requirement.confidence === "low" && (
                <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-300" data-testid={`job-requirement-low-confidence-${index}`}>
                  Low confidence · excluded from score
                </span>
              )}
            </div>
            <h3 className="mt-1.5 break-words font-display text-lg leading-snug">{requirement.text}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {status === "not-documented"
                ? "Resume evidence is not documented here. If you have the experience, add a truthful example before deciding."
                : statusNextSteps[status]}
            </p>
          </div>
          <label className="block w-full shrink-0 space-y-1.5 sm:w-52">
            <span className="text-xs font-semibold">Evidence status</span>
            <select
              value={status}
              onChange={(event) => updateEvidenceStatus(requirement.id, event.target.value as JobEvidenceStatus)}
              className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              aria-label={`Evidence status for ${requirement.text}`}
              data-testid={`select-evidence-status-${index}`}
            >
              {statusOptions.map((option) => <option key={option} value={option}>{statusLabels[option]}</option>)}
            </select>
            <span className="block text-[11px] leading-4 text-muted-foreground">A confirmed gap is your choice, never inferred.</span>
          </label>
        </div>
        <details className="mt-3 border-t border-border/80 pt-3">
          <summary className="w-fit cursor-pointer text-sm font-semibold text-primary underline-offset-4 hover:underline">
            Review evidence and source
          </summary>
          <div className="mt-3 min-w-0 space-y-3">
            <div className="min-w-0 rounded-xl bg-muted/45 p-3" data-testid={`job-evidence-excerpts-${index}`}>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Resume excerpt</p>
              {requirement.evidenceQuote ? (
                <>
                  <p className="mt-2 text-xs font-semibold text-muted-foreground">Evidence source: {evidenceSourceLabels[evidenceSource]}</p>
                  <label className="mt-2 flex w-full min-w-0 flex-col gap-1 text-xs font-medium text-muted-foreground">
                    <span>Correct source label</span>
                    <select
                      value={evidenceSource}
                      onChange={(event) => setSourceOverrides((current) => ({ ...current, [evidenceSourceKey]: event.target.value as JobEvidenceSource }))}
                      className="box-border min-h-10 w-full min-w-0 max-w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                      aria-label={`Correct evidence source label for ${requirement.text}`}
                      data-testid={`select-evidence-source-${index}`}
                    >
                      {evidenceSourceOptions.map((option) => <option key={option} value={option}>{evidenceSourceLabels[option]}</option>)}
                    </select>
                  </label>
                  <blockquote className="mt-2 break-words border-l-2 border-primary/50 pl-3 text-sm leading-6">“{requirement.evidenceQuote}”</blockquote>
                </>
              ) : <p className="mt-2 text-sm leading-6 text-muted-foreground">No matching excerpt found. That is not proof the experience is absent.</p>}
              {requirement.conflictingDenialQuote && (
                <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3" role="note" data-testid={`conflicting-resume-denial-${index}`}>
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">Separate explicit denial</p>
                  <p className="mt-2 text-xs font-semibold text-muted-foreground">Evidence source: {evidenceSourceLabels[denialSource]}</p>
                  <label className="mt-2 flex w-full min-w-0 flex-col gap-1 text-xs font-medium text-muted-foreground">
                    <span>Correct source label</span>
                    <select
                      value={denialSource}
                      onChange={(event) => setSourceOverrides((current) => ({ ...current, [denialSourceKey]: event.target.value as JobEvidenceSource }))}
                      className="box-border min-h-10 w-full min-w-0 max-w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                      aria-label={`Correct denial source label for ${requirement.text}`}
                      data-testid={`select-denial-source-${index}`}
                    >
                      {evidenceSourceOptions.map((option) => <option key={option} value={option}>{evidenceSourceLabels[option]}</option>)}
                    </select>
                  </label>
                  <blockquote className="mt-2 break-words border-l-2 border-amber-600/50 pl-3 text-sm leading-6">“{requirement.conflictingDenialQuote}”</blockquote>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">Shown for context, not counted as positive evidence.</p>
                </div>
              )}
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{requirement.evidenceReason}</p>
            </div>
            <p className="text-sm leading-6"><span className="font-semibold">Recruiter question:</span> {requirement.recruiterQuestion}</p>
          </div>
        </details>
      </article>
    );
  }

  function fetchJobDescription() {
    setJobLinkError("");
    setJobLinkNotice("");
    fetchJobLink.mutate({
      data: { url: jobUrl, consent: jobLinkConsent },
    }, {
      onSuccess: (result) => {
        form.setValue("jobText", result.text, { shouldDirty: true, shouldValidate: true });
        clearResults();
        setJobReviewPending(true);
        setJobLinkNotice(result.truncated
          ? "The page was shortened to fit the checker. Review the text before analysis."
          : "Fetched text is ready. Review it before analysis.");
        setJobUrl("");
        setJobLinkConsent(false);
      },
      onError: () => setJobLinkError("We couldn't fetch that page. Check the URL and try a supported public job page."),
    });
  }

  function clearResults() {
    setAnalysis(null);
    setOverrides({});
    setSourceOverrides({});
    setMatchAnnouncement("");
    setError("");
  }

  function showLowConfidenceRequirements() {
    const allRequirements = allRequirementsRef.current;
    if (!allRequirements) return;
    allRequirements.open = true;
    window.requestAnimationFrame(() => {
      document.getElementById("job-check-low-confidence")?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }

  function updateEvidenceStatus(requirementId: string, status: JobEvidenceStatus) {
    const nextOverrides = { ...overrides, [requirementId]: status };
    setOverrides(nextOverrides);
    if (!analysis) return;

    const nextResult = calculateJobPostingReadiness(analysis.requirements, nextOverrides);
    setMatchAnnouncement(nextResult.score === null
      ? `Match result updated. ${nextResult.verdict}.`
      : `Match score updated to ${nextResult.score} percent. Recommendation: ${nextResult.verdict}.`);
  }

  async function handleResumeFile(file?: File) {
    setResumeFileError("");
    if (!file) return;
    setIsExtractingResume(true);
    try {
      const extracted = await extractResumeDocument(file);
      form.setValue("resumeText", extracted.text, { shouldDirty: true, shouldValidate: true });
      setResumeFileName(file.name);
      setResumeReviewPending(true);
      setResumeTextReviewConfirmed(null);
      clearResults();
    } catch (cause) {
      setResumeFileError(cause instanceof Error ? cause.message : "We couldn't read that file. Paste your resume text instead.");
      setResumeFileName("");
    } finally {
      setIsExtractingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeResumeFile() {
    setResumeFileName("");
    setResumeFileError("");
    setResumeReviewPending(false);
    setResumeTextReviewConfirmed(null);
    form.setValue("resumeText", "", { shouldDirty: true, shouldValidate: true });
    clearResults();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function submit(values: FormValues) {
    setError("");
    if (resumeReviewPending) {
      setError("Review the extracted resume text and confirm it before analysis.");
      return;
    }
    if (jobReviewPending) {
      setError("Review the fetched job text and confirm it before analysis.");
      return;
    }
    try {
      setAnalysis(analyzeJobPosting(values.jobText, values.resumeText, {
        resumeTextReviewed: values.resumeText === resumeTextReviewConfirmed,
      }));
      setOverrides({});
      setSourceOverrides({});
      setMatchAnnouncement("");
    } catch (cause) {
      setAnalysis(null);
      setSourceOverrides({});
      setMatchAnnouncement("");
      setError(cause instanceof Error ? cause.message : "Check the text and try again.");
    }
  }

  return (
    <PublicPage
      eyebrow="Decision tool / evidence first"
      title="Job Posting Reality Check"
      intro="Compare resume evidence with a role’s must-haves. Get a match score and a practical apply-or-pause next step; missing text alone is not proof you lack a skill."
      seo={{
        title: "Job Posting Reality Check | CareerReality",
        description: "Match resume evidence to job requirements, get an apply-or-pause recommendation, and review why. Missing text alone is not proof you lack the experience.",
        path: "/job-posting-reality-check",
        breadcrumbs: [
          { name: "Home", path: "/" },
          { name: "Tools", path: "/tools" },
          { name: "Job Posting Reality Check", path: "/job-posting-reality-check" },
        ],
      }}
    >
      <div className="space-y-8">
        <section className="rounded-[24px] border border-border bg-card p-5 shadow-sm sm:p-8" aria-labelledby="job-check-input-title">
          <div className="mb-6 flex items-start gap-3">
            <span className="rounded-xl bg-primary/10 p-3 text-primary"><ShieldCheck size={20} aria-hidden="true" /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Resume text stays in this browser</p>
              <h2 id="job-check-input-title" className="mt-2 font-display text-2xl">Start with your resume and the job description.</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Your pasted or locally extracted resume text stays in this browser tab: it is never sent to a server or AI model, and is not saved. Refreshing or closing clears it.
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {showJobLinkFetch
                  ? "Optional job-link fetching is separate and requires your consent."
                  : "PDF/DOCX files are read locally. Paste the posting text here; link fetching is unavailable."}
              </p>
            </div>
          </div>

          <Form {...form}>
            <form className="space-y-5" onSubmit={form.handleSubmit(submit)} data-testid="form-job-posting-reality-check">
              <div className="grid gap-5 lg:grid-cols-2">
                <FormField
                  control={form.control}
                  name="resumeText"
                  rules={{ required: "Paste resume text to continue." }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your resume text</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          onChange={(event) => {
                            field.onChange(event);
                            setResumeTextReviewConfirmed(null);
                            clearResults();
                          }}
                          placeholder="Paste the experience, projects, skills, and qualifications already written in your resume."
                          className="min-h-64 resize-y"
                          maxLength={RESUME_TEXT_LIMIT}
                          data-testid="input-job-check-resume"
                        />
                      </FormControl>
                      <FormDescription>Paste text above or choose a PDF/DOCX below. Up to {RESUME_TEXT_LIMIT.toLocaleString()} characters.</FormDescription>
                      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          className="sr-only"
                          aria-label="Choose a PDF or DOCX resume"
                          tabIndex={-1}
                          data-testid="input-job-check-resume-file"
                          onChange={(event) => void handleResumeFile(event.target.files?.[0])}
                        />
                        <div className="flex flex-wrap items-center gap-3">
                          <Button type="button" variant="outline" disabled={isExtractingResume} onClick={() => fileInputRef.current?.click()}>
                            <Upload size={15} aria-hidden="true" />
                            {resumeFileName ? "Replace file" : "Choose PDF or DOCX"}
                          </Button>
                          {resumeFileName && (
                            <span className="inline-flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                              <FileText size={15} aria-hidden="true" />
                              <span className="max-w-56 truncate">{resumeFileName}</span>
                              <button type="button" onClick={removeResumeFile} className="rounded p-1 text-foreground hover:bg-muted" aria-label="Remove resume file">
                                <X size={15} aria-hidden="true" />
                              </button>
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          Files are read on this device only. Maximum size {Math.round(MAX_RESUME_FILE_BYTES / (1024 * 1024))} MB. Scanned PDFs are not OCR-processed; paste their text instead.
                        </p>
                        {isExtractingResume && <p className="mt-2 text-sm" role="status">Extracting text in your browser…</p>}
                        {resumeFileError && <p className="mt-2 text-sm text-destructive" role="alert" data-testid="resume-file-error">{resumeFileError}</p>}
                        {resumeReviewPending && (
                          <div className="mt-3 rounded-lg bg-primary/5 p-3" role="status" data-testid="resume-extraction-review">
                            <p className="text-sm font-medium">Review and correct the extracted text below before analysis. Extraction can miss or misread content.</p>
                            <Button type="button" className="mt-3" variant="outline" onClick={() => setResumeReviewPending(false)}>
                              I’ve reviewed this text
                            </Button>
                          </div>
                        )}
                      </div>
                      {resumeTextNeedsReview && (
                        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3" role="alert" data-testid="resume-quality-review">
                          <p className="text-sm leading-6">
                            Some resume text may have been misread, such as a skill name split apart or letters replaced by numbers. Correct it above, or review the text and confirm it before any evidence is classified. Resume text stays in this browser.
                          </p>
                          {resumeTextReviewConfirmed === watchedResumeText ? (
                            <p className="mt-2 text-sm font-medium" role="status">You confirmed this text. You can now review requirements.</p>
                          ) : (
                            <Button
                              type="button"
                              className="mt-3"
                              variant="outline"
                              onClick={() => setResumeTextReviewConfirmed(watchedResumeText)}
                              data-testid="button-confirm-resume-text"
                            >
                              Confirm text and continue
                            </Button>
                          )}
                        </div>
                      )}
                      <FormMessage role="alert" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="jobText"
                  rules={{ required: "Paste job-description text to continue." }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job-posting text</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          onChange={(event) => {
                            field.onChange(event);
                            clearResults();
                          }}
                          placeholder="Paste the posting’s responsibilities, required qualifications, and preferred criteria."
                          className="min-h-64 resize-y"
                          maxLength={JOB_POSTING_TEXT_LIMIT}
                          data-testid="input-job-check-description"
                        />
                      </FormControl>
                      <FormDescription>Include the full posting when possible. Up to {JOB_POSTING_TEXT_LIMIT.toLocaleString()} characters.</FormDescription>
                      {jobReviewPending && (
                        <div className="rounded-lg bg-primary/5 p-3" role="status" data-testid="job-extraction-review">
                          <p className="text-sm font-medium">Review and correct the fetched posting text below before analysis.</p>
                          <Button type="button" className="mt-3" variant="outline" onClick={() => setJobReviewPending(false)}>
                            I’ve reviewed this posting
                          </Button>
                        </div>
                      )}
                      <FormMessage role="alert" />
                    </FormItem>
                  )}
                />
              </div>
              {showJobLinkFetch && (
                <section className="rounded-2xl border border-border bg-muted/30 p-4" aria-label="Fetch public job page">
                  <h3 className="font-semibold">Fetch a public job page</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    With your consent, the URL and public page content go to CareerReality’s first-party server for temporary processing. Your resume text is never sent; the page is not stored, credentials are not forwarded, and content is not sent to an AI service. Only reviewed Greenhouse, Lever, and Ashby pages are supported.
                  </p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <input
                      type="url"
                      value={jobUrl}
                      onChange={(event) => setJobUrl(event.target.value)}
                      placeholder="https://jobs.lever.co/company/job-id"
                      aria-label="Public job-page URL"
                      className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm"
                      maxLength={2048}
                    />
                    <Button type="button" variant="outline" disabled={!jobUrl || !jobLinkConsent || fetchJobLink.isPending} onClick={fetchJobDescription}>
                      {fetchJobLink.isPending ? "Fetching…" : "Fetch job text"}
                    </Button>
                  </div>
                  <label className="mt-3 flex items-start gap-2 text-sm leading-6">
                    <input type="checkbox" checked={jobLinkConsent} onChange={(event) => setJobLinkConsent(event.target.checked)} className="mt-1" />
                    <span>I agree to send this URL and its public page content to CareerReality’s server for temporary processing.</span>
                  </label>
                  {jobLinkError && <p role="alert" className="mt-2 text-sm text-destructive">{jobLinkError}</p>}
                  {jobLinkNotice && <p role="status" className="mt-2 text-sm text-muted-foreground">{jobLinkNotice}</p>}
                </section>
              )}
              <details className="rounded-2xl border border-border bg-muted/20 px-4">
                <summary className="cursor-pointer py-3 text-sm font-semibold text-muted-foreground hover:text-foreground">
                  Add optional role details
                </summary>
                <section className="border-t border-border/80 pb-4 pt-3" aria-label="Structured job details">
                  <p className="text-sm leading-6 text-muted-foreground">Optional context only; only the job-posting text is analyzed for requirements.</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {([
                      ["jobTitle", "Role title"],
                      ["company", "Company"],
                      ["location", "Location"],
                      ["employmentType", "Employment type"],
                    ] as const).map(([name, label]) => (
                      <FormField
                        key={name}
                        control={form.control}
                        name={name}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{label}</FormLabel>
                            <FormControl>
                              <input
                                {...field}
                                onChange={(event) => {
                                  field.onChange(event);
                                  clearResults();
                                }}
                                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                                maxLength={160}
                                data-testid={`input-job-check-${name}`}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </section>
              </details>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="submit"
                  disabled={
                    isExtractingResume
                    || resumeReviewPending
                    || jobReviewPending
                    || (resumeTextNeedsReview && resumeTextReviewConfirmed !== watchedResumeText)
                  }
                  data-testid="button-analyze-job-posting"
                >
                  Get my match score
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  form.reset();
                  removeResumeFile();
                  setJobReviewPending(false);
                  setJobUrl("");
                  setJobLinkConsent(false);
                  setJobLinkError("");
                  setJobLinkNotice("");
                  clearResults();
                }} data-testid="button-clear-job-posting">
                  <RotateCcw size={15} aria-hidden="true" /> Clear text
                </Button>
              </div>
              {error && <p className="text-sm font-medium text-destructive" role="alert" data-testid="job-check-error">{error}</p>}
            </form>
          </Form>
        </section>

        {analysis && (
          <section className="space-y-5" aria-labelledby="job-check-results-title" data-testid="job-check-results">
            <p className="sr-only" role="status" aria-live="polite" aria-atomic="true" data-testid="job-check-match-announcement">
              {matchAnnouncement}
            </p>
            <div className="overflow-hidden rounded-[24px] border border-border bg-card shadow-sm">
              <div className="grid gap-6 p-5 sm:p-8 md:grid-cols-[minmax(0,1fr)_minmax(220px,.62fr)] md:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Resume evidence match</p>
                  <h2 id="job-check-results-title" className="mt-2 font-display text-3xl leading-tight sm:text-4xl" data-testid="job-check-verdict">{verdict}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{nextAction}</p>
                </div>
                <div className="flex items-center gap-5 rounded-2xl bg-muted/45 p-4 sm:p-5">
                  <div className="flex size-24 shrink-0 flex-col items-center justify-center rounded-full border-[5px] border-primary/20 bg-background text-center" data-testid="job-check-score">
                    {score === null
                      ? <span className="px-2 text-[10px] font-semibold leading-4">Not enough clear requirements to score</span>
                      : <><span className="font-data text-3xl font-medium leading-none">{score}</span><span className="mt-1 text-[10px] font-bold uppercase tracking-wider">of 100</span></>}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Resume evidence match</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {includedRequirements.length} included · {excludedCount} excluded from {analysis.requirements.length} extracted
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">This reflects evidence in the supplied wording, not your ability or hiring odds. Apply/pause cutoffs are judgment-based, not validated hiring thresholds.</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 border-t border-border bg-muted/25 md:grid-cols-5" data-testid="job-check-breakdown">
                {([
                  ["Direct", breakdown.direct],
                  ["Transferable", breakdown.transferable],
                  ["Partial", breakdown.partial],
                  ["Not documented", breakdown["not-documented"]],
                  ["Confirmed gap", breakdown["confirmed-gap"]],
                ] as const).map(([label, count]) => (
                  <div key={label} className="border-r border-border/70 px-4 py-3 last:border-r-0 sm:px-5">
                    <p className="font-data text-xl tabular-nums">{count}</p>
                    <p className="text-[11px] leading-4 text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-4 p-5 sm:p-8">
                {mandatoryGapConfirmedByUser && (
                  <p className="rounded-xl border border-amber-600/30 bg-amber-500/10 p-3 text-sm leading-6" role="status" data-testid="job-check-mandatory-gap">
                    Your confirmed gap on a mandatory requirement overrides the score recommendation.
                  </p>
                )}
                {analysis.warnings.map((warning) => (
                  <p key={warning} className="flex gap-2 rounded-xl bg-amber-500/10 p-3 text-sm leading-6" role="status">
                    <AlertTriangle className="mt-1 size-4 shrink-0 text-amber-700" aria-hidden="true" />{warning}
                  </p>
                ))}
              {["jobTitle", "company", "location", "employmentType"].some((key) => form.getValues(key as keyof FormValues)) && (
                <dl className="mt-4 grid gap-3 rounded-xl bg-muted/45 p-4 text-sm sm:grid-cols-2" data-testid="job-context-summary">
                  {([
                    ["jobTitle", "Role title"],
                    ["company", "Company"],
                    ["location", "Location"],
                    ["employmentType", "Employment type"],
                  ] as const).map(([key, label]) => {
                    const value = form.getValues(key);
                    return value ? <div key={key}><dt className="font-semibold">{label}</dt><dd className="mt-1 text-muted-foreground">{value}</dd></div> : null;
                  })}
                </dl>
              )}
              {analysis.notes.length > 0 && (
                <div className="mt-4 rounded-xl bg-muted/60 p-4">
                  <h3 className="text-sm font-semibold">Posting signals to review</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
                    {analysis.notes.map((note) => <li key={note}>{note}</li>)}
                  </ul>
                </div>
              )}
                {lowConfidenceRequirements.length > 0 && (
                  <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between" data-testid="job-check-low-confidence-shortcut">
                    <p className="text-sm leading-6">
                      {lowConfidenceRequirements.length} low-confidence {lowConfidenceRequirements.length === 1 ? "requirement was" : "requirements were"} excluded from the score.
                    </p>
                    <button
                      type="button"
                      onClick={showLowConfidenceRequirements}
                      aria-controls="job-check-all-requirements"
                      className="min-h-10 shrink-0 rounded-full border border-amber-700/40 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-500/10 dark:text-amber-200"
                      data-testid="button-find-low-confidence"
                    >
                      Find low-confidence items
                    </button>
                  </div>
                )}
                <details className="rounded-xl border border-border/80 bg-background/60 px-4 py-3">
                  <summary className="cursor-pointer text-sm font-semibold">How to read this score</summary>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Rule-based and based only on extracted posting requirements and the wording in your resume. It is not a validated prediction, hiring odds, or a judgment of capability. Mandatory requirements count twice; preferred count once. Ambiguous, unclear, contextual-tool, and unresolved items are excluded. Direct evidence counts fully, transferable 75%, partial 50%; not documented and confirmed gaps count zero.
                  </p>
                </details>
              </div>
            </div>

              <div className="space-y-3" data-testid="job-check-highlighted">
                {highlightedRequirements.map((requirement) => renderRequirement(
                  requirement,
                  analysis.requirements.findIndex((item) => item.id === requirement.id),
                ))}
              </div>
              {analysis.requirements.length > highlightedRequirements.length && (
                <details ref={allRequirementsRef} id="job-check-all-requirements" className="rounded-2xl border border-border bg-muted/20 p-4 sm:p-5" data-testid="job-check-all-requirements">
                  <summary className="cursor-pointer font-semibold">Review all extracted requirements <span className="ml-1 text-sm font-normal text-muted-foreground">({analysis.requirements.length - highlightedRequirements.length} more)</span></summary>
                  <div className="mt-4 space-y-6">
                    {lowConfidenceRequirements.length > 0 && (
                      <section id="job-check-low-confidence" aria-labelledby="job-check-low-confidence-title" data-testid="job-check-low-confidence-group">
                        <h3 id="job-check-low-confidence-title" className="font-semibold">Low-confidence requirements ({lowConfidenceRequirements.length})</h3>
                        <p className="mb-3 mt-1 text-sm leading-6 text-muted-foreground">These uncertain items are excluded from the score. Check the original posting before deciding what they require.</p>
                        <div className="space-y-3">
                          {lowConfidenceRequirements.map((requirement) =>
                            renderRequirement(requirement, analysis.requirements.findIndex((item) => item.id === requirement.id))
                          )}
                        </div>
                      </section>
                    )}
                    {otherRequirements.length > 0 && (
                      <section aria-labelledby="job-check-other-requirements-title">
                        {lowConfidenceRequirements.length > 0 && <h3 id="job-check-other-requirements-title" className="mb-3 font-semibold">Other extracted requirements</h3>}
                        <div className="space-y-3">
                          {otherRequirements.map((requirement) =>
                            renderRequirement(requirement, analysis.requirements.findIndex((item) => item.id === requirement.id))
                          )}
                        </div>
                      </section>
                    )}
                  </div>
                </details>
              )}
              <details className="rounded-xl border border-border/80 bg-card px-4 py-3">
                <summary className="cursor-pointer text-sm font-semibold">Posting extraction limits</summary>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  The parser looks for English-language lines and recognizable terms. It can miss requirements in long paragraphs or infer the wrong emphasis. Verify the original posting and use your own judgment.
                </p>
              </details>
          </section>
        )}

        {!analysis && (
          <aside className="rounded-[20px] border border-border bg-muted/35 p-5 text-sm leading-6 text-muted-foreground">
            Your resume stays in this browser. The result is a candid evidence check, not an automated hiring prediction.
          </aside>
        )}
      </div>
    </PublicPage>
  );
}
