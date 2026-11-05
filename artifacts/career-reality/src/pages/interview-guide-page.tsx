import { useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { InterviewGuide } from "@/components/interview-guide/InterviewGuide";
import { InterviewGuideChooser } from "@/components/interview-guide/InterviewGuideChooser";
import { PublicFooter } from "@/components/shared/public-footer";
import type { InterviewGuideQuestion } from "@/components/interview-guide/types";
import dataEngineerItems from "../../../../content/questions/data-engineer/items.json";
import dataScientistItems from "../../../../content/questions/data-scientist/items.json";
import mlEngineerItems from "../../../../content/questions/ai-ml-engineer/items.json";
import genAiItems from "../../../../content/questions/gen-ai-engineer/items.json";
import agenticItems from "../../../../content/questions/agentic-ai-engineer/items.json";
import dataEngineerTopics from "../../../../content/questions/data-engineer/topic-map.json";
import dataScientistTopics from "../../../../content/questions/data-scientist/topic-map.json";
import mlEngineerTopics from "../../../../content/questions/ai-ml-engineer/topic-map.json";
import genAiTopics from "../../../../content/questions/gen-ai-engineer/topic-map.json";
import agenticTopics from "../../../../content/questions/agentic-ai-engineer/topic-map.json";

const roles = {
  "data-engineer": { title: "Data Engineer", items: dataEngineerItems, map: dataEngineerTopics },
  "data-scientist": { title: "Data Scientist", items: dataScientistItems, map: dataScientistTopics },
  "ai-ml-engineer": { title: "AI/ML Engineer", items: mlEngineerItems, map: mlEngineerTopics },
  "gen-ai-engineer": { title: "Generative AI Engineer", items: genAiItems, map: genAiTopics },
  "agentic-ai-engineer": { title: "Agentic AI Engineer", items: agenticItems, map: agenticTopics },
} as const;

type RoleSlug = keyof typeof roles;
type GuideProgress = { completed: string[]; readiness: string[]; core: string[] };

function readProgress(slug: RoleSlug): GuideProgress {
  try {
    const value = JSON.parse(localStorage.getItem(`careerreality-guide-v1:${slug}`) ?? "{}");
    return {
      completed: Array.isArray(value.completed) ? value.completed.filter((id: unknown) => typeof id === "string") : [],
      readiness: Array.isArray(value.readiness) ? value.readiness.filter((id: unknown) => typeof id === "string") : [],
      core: Array.isArray(value.core) ? value.core.filter((id: unknown) => typeof id === "string") : [],
    };
  } catch {
    return { completed: [], readiness: [], core: [] };
  }
}

export function InterviewGuidePage() {
  const [location] = useLocation();
  const slug = location.replace(/\/+$/, "").split("/").at(-1) as RoleSlug;
  const role = roles[slug];
  const [progress, setProgress] = useState<GuideProgress>(() => role ? readProgress(slug) : { completed: [], readiness: [], core: [] });
  const [importError, setImportError] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  const save = (next: GuideProgress) => {
    setProgress(next);
    if (role) localStorage.setItem(`careerreality-guide-v1:${slug}`, JSON.stringify(next));
  };
  const exportProgress = () => {
    const file = new Blob([JSON.stringify({ version: 1, role: slug, progress }, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = href;
    link.download = `careerreality-${slug}-study-progress.json`;
    link.click();
    URL.revokeObjectURL(href);
  };
  const importProgress = async (file?: File) => {
    if (!file || !role) return;
    const value = JSON.parse(await file.text());
    if (value?.version !== 1 || value?.role !== slug || !value?.progress || !Array.isArray(value.progress.completed) || !Array.isArray(value.progress.readiness) || !Array.isArray(value.progress.core)) {
      throw new Error("That file is not a valid backup for this role guide.");
    }
    save({
      completed: value.progress.completed.filter((id: unknown) => typeof id === "string"),
      readiness: value.progress.readiness.filter((id: unknown) => typeof id === "string"),
      core: value.progress.core.filter((id: unknown) => typeof id === "string"),
    });
  };
  const questions = useMemo(
    () => role ? role.items as unknown as InterviewGuideQuestion[] : [],
    [role],
  );

  if (!role) {
    const topicNotes: Record<RoleSlug, string> = {
      "data-engineer": "Pipelines, platforms & data quality",
      "data-scientist": "Statistics, experimentation & impact",
      "ai-ml-engineer": "Models, systems & production ML",
      "gen-ai-engineer": "LLMs, retrieval & evaluation",
      "agentic-ai-engineer": "Agents, tools & orchestration",
    };
    const chooserRoles = Object.entries(roles).map(([id, entry], index) => {
      const roleSlug = id as RoleSlug;
      return {
        id: roleSlug,
        title: entry.title,
        count: entry.items.length,
        index: String(index + 1).padStart(2, "0"),
        note: topicNotes[roleSlug],
      };
    });
    return (
      <>
        <InterviewGuideChooser roles={chooserRoles} />
        <PublicFooter />
      </>
    );
  }

  return (
    <>
    <details className="mx-auto max-w-6xl px-5 pt-3 text-sm">
      <summary className="w-fit cursor-pointer text-muted-foreground underline decoration-border underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
        Browser-only progress controls
      </summary>
      <div className="flex flex-wrap items-center gap-3 py-3">
        <span className="mr-auto text-muted-foreground">Your study progress stays in this browser.</span>
        <button type="button" className="rounded-lg border border-border px-3 py-2 font-semibold" onClick={exportProgress} data-testid="button-export-guide-progress">Export backup</button>
        <button type="button" className="rounded-lg border border-border px-3 py-2 font-semibold" onClick={() => importRef.current?.click()} data-testid="button-import-guide-progress">Import backup</button>
        <input ref={importRef} className="sr-only" type="file" accept="application/json,.json" aria-label="Choose study progress backup" onChange={(event) => {
          setImportError("");
          void importProgress(event.currentTarget.files?.[0]).catch((error: unknown) => setImportError(error instanceof Error ? error.message : "Could not import this backup."));
          event.currentTarget.value = "";
        }} />
        <button type="button" className="rounded-lg border border-border px-3 py-2 font-semibold" onClick={() => {
          if (window.confirm("Clear this browser’s interview-guide progress? This cannot be undone unless you saved a backup.")) {
            save({ completed: [], readiness: [], core: [] });
          }
        }} data-testid="button-clear-guide-progress">Clear progress</button>
        {importError && <p role="alert" className="w-full text-destructive">{importError}</p>}
      </div>
    </details>
    <InterviewGuide
      roleTitle={role.title}
      roleSlug={slug}
      topics={role.map.topics.map((topic) => ({ name: topic.topic, question_count: questions.filter((question) => question.topic === topic.topic).length }))}
      questions={questions}
      coreQuestionIds={progress.core}
      completedQuestionIds={progress.completed}
      readinessChecks={progress.readiness}
      onCoreQuestionIdsChange={(core) => save({ ...progress, core })}
      onCompletedQuestionIdsChange={(completed) => save({ ...progress, completed })}
      onReadinessChecksChange={(readiness) => save({ ...progress, readiness })}
    />
     <PublicFooter />
    </>
  );
}
