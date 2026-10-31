import {
  customFetch,
  deleteCareerResume as deleteCareerResumeRequest,
  dismissCareerJob,
  getCareerBrief,
  listCareerBriefHistory,
  listCareerJobRecommendations,
  markCareerJobApplied,
  updateCareerProfile,
  type CareerBrief,
  type CareerBriefHistoryResponse,
  type CareerProfileInput,
  type JobRecommendationsResponse,
  type ResumeIntelligence,
} from '@workspace/api-client-react';
import type { CareerProfile } from '@/context/career-context';

type ApiErrorShape = {
  status?: unknown;
  data?: unknown;
};

export function isCareerProfileNotConfiguredError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as ApiErrorShape;
  if (candidate.status !== 404 || !candidate.data || typeof candidate.data !== 'object') {
    return false;
  }
  return (candidate.data as { code?: unknown }).code === 'CAREER_PROFILE_NOT_CONFIGURED';
}

function toCareerProfileInput(profile: CareerProfile): CareerProfileInput {
  return {
    name: profile.name.trim(),
    situation: profile.situation.trim(),
    role: profile.role.trim(),
    company: profile.company.trim(),
    city: profile.city.trim(),
    experience: profile.experience.trim(),
    ctc: profile.ctc.trim(),
    target: profile.target.trim(),
  };
}

export async function syncCareerProfile(profile: CareerProfile) {
  return updateCareerProfile(toCareerProfileInput(profile));
}

export async function uploadCareerResume(uri: string, name: string, type?: string) {
  const formData = new FormData();
  formData.append('file', { uri, name, type: type ?? 'application/pdf' } as unknown as Blob);
  return customFetch<{ status: 'ready' | 'failed'; resumeName: string; extracted: Record<string, unknown>; message: string }>(
    '/api/career/resume',
    { method: 'POST', body: formData, responseType: 'json' },
  );
}

export async function deleteSavedCareerResume() {
  return deleteCareerResumeRequest();
}

export async function fetchCareerBrief(): Promise<CareerBrief> {
  return getCareerBrief();
}

export async function fetchCareerBriefHistory(): Promise<CareerBriefHistoryResponse> {
  return listCareerBriefHistory({ limit: 12 });
}

export async function fetchCareerJobRecommendations(): Promise<JobRecommendationsResponse> {
  return listCareerJobRecommendations({ limit: 6 });
}

export async function applyToCareerJob(jobId: string) {
  return markCareerJobApplied(jobId);
}

export async function dismissCareerJobRecommendation(jobId: string) {
  return dismissCareerJob(jobId);
}

export async function refreshCareerMarketContext(
  profile: CareerProfile,
  intelligence: ResumeIntelligence,
) {
  // The brief is profile-backed. Upsert the latest local profile before
  // reading it so first-run mobile users can refresh without re-uploading.
  await syncCareerProfile(profile);
  const brief = await getCareerBrief();
  const refreshedAt = new Date().toISOString();
  const previousMarketSources = intelligence.sources
    .filter((source) => source.label !== 'Resume evidence')
    .map((source) => `${source.label}|${source.source}|${source.confidence}`)
    .sort();
  const nextMarketSources = brief.evidence
    .map((evidence) => `${evidence.label}|${evidence.source}|${evidence.confidence}`)
    .sort();
  const categories = brief.evidence.map((evidence) => evidence.label);
  const marketReadout = `${brief.headline} ${brief.nextMove}`;
  const changed = previousMarketSources.join('¦') !== nextMarketSources.join('¦')
    || intelligence.relatedNews !== brief.diagnosis
    || intelligence.marketSummary !== marketReadout;
  const changeSummary = changed
    ? `Updated ${categories.join(' · ') || 'market context'}`
    : `Rechecked ${categories.join(' · ') || 'market context'} · no material changes`;
  const marketSources = brief.evidence.map((evidence) => ({
    label: evidence.label,
    source: evidence.source,
    refreshedAt,
    confidence: evidence.confidence,
  }));

  return {
    intelligence: {
      ...intelligence,
      relatedNews: brief.diagnosis,
      marketSummary: marketReadout,
      sources: [
        ...intelligence.sources.filter((source) => source.label === 'Resume evidence'),
        ...marketSources,
      ],
    },
    refreshedAt,
    changeSummary,
    categories,
    changed,
  };
}