export type InterviewLevel = "L1" | "L2" | "L3" | "L4";
export type InterviewQuestionType =
  | "concept"
  | "trade-off"
  | "scenario"
  | "debugging"
  | "coding"
  | "design"
  | "behavioural-technical";

export interface InterviewGuideReference {
  title: string;
  publisher: string;
  url: string;
  retrieved_date?: string;
}

export interface InterviewGuideQuestion {
  id: string;
  topic: string;
  subtopic: string;
  level: InterviewLevel;
  type: InterviewQuestionType;
  question: string;
  what_is_assessed: string;
  short_answer: string;
  deep_explanation: string;
  strong_answer_signals: string[];
  weak_answer_signals: string[];
  common_mistakes: string[];
  follow_ups: Array<{ question: string; short_answer: string }>;
  references: InterviewGuideReference[];
  code: { language: string; sample: string; executed: boolean; output: string } | null;
  core: boolean;
  priority: 1 | 2 | 3;
  estimated_reading_minutes: number;
  estimated_practice_minutes: number;
  answer_tiers: {
    fresher_level: string | null;
    senior_level: string | null;
  };
  content_tier: "complete-guide";
}

export interface InterviewGuideTopic {
  name: string;
  description?: string;
  question_count?: number;
  estimated_minutes?: number;
}

export type InterviewGuideTab = "guide" | "readiness" | "study" | "mocks" | "flashcards" | "modules";

export interface InterviewGuideProps {
  roleTitle: string;
  roleSlug: string;
  topics: InterviewGuideTopic[];
  questions: InterviewGuideQuestion[];
  /** Optional controlled user state. State remains in the browser; this component makes no network calls. */
  coreQuestionIds?: string[];
  completedQuestionIds?: string[];
  readinessChecks?: string[];
  onCoreQuestionIdsChange?: (ids: string[]) => void;
  onCompletedQuestionIdsChange?: (ids: string[]) => void;
  onReadinessChecksChange?: (ids: string[]) => void;
  onEntryPoint?: (entry: "study" | "mock" | "flashcards") => void;
}
