import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/expo';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ResumeIntelligence } from '@workspace/api-client-react';
import { refreshCareerMarketContext } from '@/lib/career-api';
import {
  clearCompensationCorrections,
  COMPENSATION_CORRECTIONS_STORAGE_KEY,
  parseCompensationCorrections,
  updateCompensationCorrection,
  type CompensationCorrections,
} from '@/lib/compensation-corrections';
import { careerAccountScope, careerStorageKey, omitResumeUri } from './career-profile-storage';
import { isMarketRefreshFresh } from './market-refresh';
import { deleteSavedCareerResume } from '@/lib/career-api';

export type CareerProfile = {
  name: string;
  situation: string;
  role: string;
  company: string;
  city: string;
  experience: string;
  ctc: string;
  target: string;
  resumeUri?: string;
  resumeName?: string;
  resumeStatus?: 'not_added' | 'processing' | 'ready' | 'failed';
};

export type ResumeProcessingState = 'idle' | 'processing' | 'failed';
export type MarketRefreshSummary = {
  text: string;
  categories: string[];
  changed?: boolean;
};
export type MarketRefreshRecord = MarketRefreshSummary & {
  refreshedAt: string;
};
type CareerContextValue = {
  profile: CareerProfile;
  brutalMode: boolean;
  isHydrated: boolean;
  onboardingComplete: boolean;
  resumeIntelligence?: ResumeIntelligence;
  resumeMarketRefreshedAt?: string;
  marketRefreshSummary?: MarketRefreshSummary;
  marketRefreshHistory: MarketRefreshRecord[];
  compensationCorrections: CompensationCorrections;
  resumeProcessingState: ResumeProcessingState;
  resumeProcessingError?: string;
  updateProfile: (profile: CareerProfile) => void;
  setResumeIntelligence: (intelligence: ResumeIntelligence | undefined) => void;
  setResumeProcessingState: (state: ResumeProcessingState, error?: string) => void;
  clearResumeIntelligence: () => Promise<void>;
  refreshMarketContext: () => Promise<void>;
  setResumeMarketRefreshedAt: (value?: string) => void;
  setMarketRefreshSummary: (summary?: MarketRefreshSummary) => void;
  setMarketRefreshHistory: (history: MarketRefreshRecord[]) => void;
  setCompensationCorrection: (key: string, value: string) => void;
  clearCompensationCorrections: (prefix?: string) => void;
  completeOnboarding: () => void;
  setBrutalMode: (value: boolean) => void;
};

const STORAGE_KEY = '@careerreality/profile';
const MODE_KEY = '@careerreality/brutal-mode';
const ONBOARDING_KEY = '@careerreality/onboarding-complete';

const INTELLIGENCE_KEY = '@careerreality/resume-intelligence';
const PROCESSING_KEY = '@careerreality/resume-processing';
const MARKET_REFRESH_KEY = '@careerreality/market-refresh';
const MARKET_SUMMARY_KEY = '@careerreality/market-refresh-summary';
const MARKET_HISTORY_KEY = '@careerreality/market-refresh-history';
const defaultProfile: CareerProfile = {
  name: 'Shiv',
  situation: 'Working full-time in data engineering',
  role: 'Senior Data Engineer',
  company: 'Your current company',
  city: 'Bengaluru',
  experience: '8 years',
  ctc: '₹31.5L',
  target: 'Staff Data Engineer',
};

const CareerContext = createContext<CareerContextValue | null>(null);

export function CareerProvider({ children }: { children: ReactNode }) {
  const { isLoaded, userId } = useAuth();
  if (!isLoaded) return null;
  const accountScope = careerAccountScope(userId);
  return (
    <CareerProviderState key={accountScope} accountScope={accountScope}>
      {children}
    </CareerProviderState>
  );
}

function CareerProviderState({
  children,
  accountScope,
}: {
  children: ReactNode;
  accountScope: string;
}) {
  const [profile, setProfile] = useState<CareerProfile>(defaultProfile);
  const [brutalMode, setBrutalModeState] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [resumeIntelligence, setResumeIntelligenceState] = useState<ResumeIntelligence | undefined>();
  const [resumeMarketRefreshedAt, setResumeMarketRefreshedAtState] = useState<string | undefined>();
  const [marketRefreshSummary, setMarketRefreshSummaryState] = useState<MarketRefreshSummary | undefined>();
  const [marketRefreshHistory, setMarketRefreshHistoryState] = useState<MarketRefreshRecord[]>([]);
  const [compensationCorrections, setCompensationCorrectionsState] = useState<CompensationCorrections>({});
  const [resumeProcessingState, setResumeProcessingStateState] = useState<ResumeProcessingState>('idle');
  const [resumeProcessingError, setResumeProcessingError] = useState<string | undefined>();
  const [isHydrated, setIsHydrated] = useState(false);
  const marketRefreshRequestRef = useRef<Promise<void> | null>(null);
  const storageKeys = useMemo(() => ({
    profile: careerStorageKey(STORAGE_KEY, accountScope),
    mode: careerStorageKey(MODE_KEY, accountScope),
    onboarding: careerStorageKey(ONBOARDING_KEY, accountScope),
    intelligence: careerStorageKey(INTELLIGENCE_KEY, accountScope),
    processing: careerStorageKey(PROCESSING_KEY, accountScope),
    marketRefresh: careerStorageKey(MARKET_REFRESH_KEY, accountScope),
    marketSummary: careerStorageKey(MARKET_SUMMARY_KEY, accountScope),
    marketHistory: careerStorageKey(MARKET_HISTORY_KEY, accountScope),
    compensationCorrections: careerStorageKey(COMPENSATION_CORRECTIONS_STORAGE_KEY, accountScope),
  }), [accountScope]);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(storageKeys.profile), AsyncStorage.getItem(storageKeys.mode), AsyncStorage.getItem(storageKeys.onboarding), AsyncStorage.getItem(storageKeys.intelligence), AsyncStorage.getItem(storageKeys.processing), AsyncStorage.getItem(storageKeys.marketRefresh), AsyncStorage.getItem(storageKeys.marketSummary), AsyncStorage.getItem(storageKeys.marketHistory), AsyncStorage.getItem(storageKeys.compensationCorrections)])
      .then(([storedProfile, storedMode, storedOnboarding, storedIntelligence, storedProcessing, storedMarketRefresh, storedMarketSummary, storedMarketHistory, storedCompensationCorrections]) => {
        if (storedProfile) {
          try {
            const parsed = JSON.parse(storedProfile) as Partial<CareerProfile>;
            setProfile({ ...defaultProfile, ...omitResumeUri(parsed) });
          } catch {
            setProfile(defaultProfile);
          }
        }
        setBrutalModeState(storedMode === 'true');
        setOnboardingComplete(storedOnboarding === 'true');
        if (storedIntelligence) {
          try {
            const parsedIntelligence = JSON.parse(storedIntelligence) as ResumeIntelligence;
            setResumeIntelligenceState(parsedIntelligence);
            setResumeMarketRefreshedAtState(storedMarketRefresh ?? parsedIntelligence.processedAt);
          } catch {
            setResumeIntelligenceState(undefined);
          }
        }
        if (storedProcessing) {
          try {
            const parsed = JSON.parse(storedProcessing) as { state?: ResumeProcessingState; error?: string };
            setResumeProcessingStateState(parsed.state === 'failed' ? 'failed' : 'idle');
            setResumeProcessingError(parsed.state === 'failed' ? parsed.error : undefined);
          } catch {
            setResumeProcessingStateState('idle');
          }
        }
        if (storedMarketSummary) {
          try {
            const parsed = JSON.parse(storedMarketSummary) as MarketRefreshSummary;
            setMarketRefreshSummaryState({
              ...parsed,
              changed: parsed.changed ?? parsed.text.startsWith('Updated '),
            });
          } catch {
            setMarketRefreshSummaryState(undefined);
          }
        }
        if (storedMarketHistory) {
          try {
            const parsedHistory = JSON.parse(storedMarketHistory) as MarketRefreshRecord[];
            setMarketRefreshHistoryState(parsedHistory.slice(0, 5).map((entry) => ({
              ...entry,
              changed: entry.changed ?? entry.text.startsWith('Updated '),
            })));
          } catch {
            setMarketRefreshHistoryState([]);
          }
        } else if (storedMarketSummary && storedMarketRefresh) {
          try {
            const parsedSummary = JSON.parse(storedMarketSummary) as MarketRefreshSummary;
            setMarketRefreshHistoryState([{
              ...parsedSummary,
              changed: parsedSummary.changed ?? parsedSummary.text.startsWith('Updated '),
              refreshedAt: storedMarketRefresh,
            }]);
          } catch {
            setMarketRefreshHistoryState([]);
          }
        }
        if (storedCompensationCorrections) {
          try {
            setCompensationCorrectionsState(parseCompensationCorrections(storedCompensationCorrections));
          } catch {
            setCompensationCorrectionsState({});
          }
        }
      })
      .finally(() => setIsHydrated(true));
  }, [storageKeys]);

  useEffect(() => {
    if (!isHydrated) return;
    const profileForStorage = omitResumeUri(profile);
    void AsyncStorage.setItem(storageKeys.profile, JSON.stringify(profileForStorage));
  }, [isHydrated, profile, storageKeys.profile]);

  useEffect(() => {
    if (!isHydrated) return;
    void AsyncStorage.setItem(storageKeys.mode, String(brutalMode));
  }, [brutalMode, isHydrated, storageKeys.mode]);

  useEffect(() => {
    if (!isHydrated) return;
    void AsyncStorage.setItem(storageKeys.onboarding, String(onboardingComplete));
  }, [isHydrated, onboardingComplete, storageKeys.onboarding]);

  useEffect(() => {
    if (!isHydrated) return;
    if (resumeIntelligence) {
      void AsyncStorage.setItem(storageKeys.intelligence, JSON.stringify(resumeIntelligence));
    } else {
      void AsyncStorage.removeItem(storageKeys.intelligence);
    }
  }, [isHydrated, resumeIntelligence, storageKeys.intelligence]);

  useEffect(() => {
    if (!isHydrated) return;
    void AsyncStorage.setItem(storageKeys.processing, JSON.stringify({
      state: resumeProcessingState,
      error: resumeProcessingError,
    }));
  }, [isHydrated, resumeProcessingError, resumeProcessingState, storageKeys.processing]);

  useEffect(() => {
    if (!isHydrated) return;
    if (resumeMarketRefreshedAt) {
      void AsyncStorage.setItem(storageKeys.marketRefresh, resumeMarketRefreshedAt);
    } else {
      void AsyncStorage.removeItem(storageKeys.marketRefresh);
    }
  }, [isHydrated, resumeMarketRefreshedAt, storageKeys.marketRefresh]);

  useEffect(() => {
    if (!isHydrated) return;
    if (marketRefreshSummary) {
      void AsyncStorage.setItem(storageKeys.marketSummary, JSON.stringify(marketRefreshSummary));
    } else {
      void AsyncStorage.removeItem(storageKeys.marketSummary);
    }
  }, [isHydrated, marketRefreshSummary, storageKeys.marketSummary]);

  useEffect(() => {
    if (!isHydrated) return;
    void AsyncStorage.setItem(storageKeys.marketHistory, JSON.stringify(marketRefreshHistory.slice(0, 5)));
  }, [isHydrated, marketRefreshHistory, storageKeys.marketHistory]);

  useEffect(() => {
    if (!isHydrated) return;
    void AsyncStorage.setItem(storageKeys.compensationCorrections, JSON.stringify(compensationCorrections));
  }, [compensationCorrections, isHydrated, storageKeys.compensationCorrections]);

  const value = useMemo(
    () => ({
      profile,
      brutalMode,
      isHydrated,
      onboardingComplete,
      resumeIntelligence,
      resumeMarketRefreshedAt,
      marketRefreshSummary,
      marketRefreshHistory,
      compensationCorrections,
      resumeProcessingState,
      resumeProcessingError,
      updateProfile: (nextProfile: CareerProfile) => setProfile({ ...nextProfile, resumeUri: undefined }),
      setResumeIntelligence: setResumeIntelligenceState,
      setResumeMarketRefreshedAt: setResumeMarketRefreshedAtState,
      setMarketRefreshSummary: setMarketRefreshSummaryState,
      setMarketRefreshHistory: setMarketRefreshHistoryState,
      setCompensationCorrection: (key: string, value: string) => {
        setCompensationCorrectionsState((previous) =>
          updateCompensationCorrection(previous, key, value),
        );
      },
      clearCompensationCorrections: (prefix?: string) => {
        setCompensationCorrectionsState((previous) =>
          clearCompensationCorrections(previous, prefix),
        );
      },
      setResumeProcessingState: (state: ResumeProcessingState, error?: string) => {
        setResumeProcessingStateState(state);
        setResumeProcessingError(error);
      },
      clearResumeIntelligence: async () => {
        await deleteSavedCareerResume();
        setResumeIntelligenceState(undefined);
        setResumeMarketRefreshedAtState(undefined);
        setMarketRefreshSummaryState(undefined);
        setMarketRefreshHistoryState([]);
        setResumeProcessingStateState('idle');
        setResumeProcessingError(undefined);
        setProfile((previous) => ({ ...previous, resumeName: undefined, resumeStatus: 'not_added' }));
      },
      refreshMarketContext: () => {
        if (!resumeIntelligence || resumeProcessingState === 'processing') return Promise.resolve();
        if (isMarketRefreshFresh(resumeMarketRefreshedAt)) return Promise.resolve();
        if (marketRefreshRequestRef.current) return marketRefreshRequestRef.current;

        setResumeProcessingStateState('processing');
        setResumeProcessingError(undefined);
        const request = (async () => {
          try {
            const refreshed = await refreshCareerMarketContext(profile, resumeIntelligence);
            setResumeIntelligenceState(refreshed.intelligence);
            setResumeMarketRefreshedAtState(refreshed.refreshedAt);
            setMarketRefreshSummaryState({
              text: refreshed.changeSummary,
              categories: refreshed.categories,
              changed: refreshed.changed,
            });
            setMarketRefreshHistoryState((previous) => [
              {
                text: refreshed.changeSummary,
                categories: refreshed.categories,
                changed: refreshed.changed,
                refreshedAt: refreshed.refreshedAt,
              },
              ...previous.filter((entry) => entry.refreshedAt !== refreshed.refreshedAt),
            ].slice(0, 5));
            setResumeProcessingStateState('idle');
          } catch (error) {
            setResumeProcessingStateState('failed');
            setResumeProcessingError(error instanceof Error ? error.message : 'Market context refresh failed. Try again.');
          }
        })();
        marketRefreshRequestRef.current = request;
        void request.finally(() => {
          if (marketRefreshRequestRef.current === request) marketRefreshRequestRef.current = null;
        });
        return request;
      },
      completeOnboarding: () => setOnboardingComplete(true),
      setBrutalMode: setBrutalModeState,
    }),
    [brutalMode, compensationCorrections, isHydrated, marketRefreshHistory, marketRefreshSummary, onboardingComplete, profile, resumeIntelligence, resumeMarketRefreshedAt, resumeProcessingError, resumeProcessingState],
  );

  return <CareerContext.Provider value={value}>{children}</CareerContext.Provider>;
}

export function useCareer() {
  const context = useContext(CareerContext);
  if (!context) throw new Error('useCareer must be used inside CareerProvider');
  return context;
}

export function useAccountScopedStorageKey(key: string): string | null {
  const { isLoaded, userId } = useAuth();
  if (!isLoaded) return null;
  const accountScope = careerAccountScope(userId);
  return careerStorageKey(key, accountScope);
}
