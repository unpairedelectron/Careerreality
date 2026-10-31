import { Feather } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useCareer } from '@/context/career-context';
import {
  applyToCareerJob,
  dismissCareerJobRecommendation,
  fetchCareerJobRecommendations,
} from '@/lib/career-api';
import type {
  JobRecommendation,
  JobRecommendationsResponse,
} from '@workspace/api-client-react';
import { Header, Pill, PrimaryButton, Screen, SectionHeader } from '@/components/career-ui';

function isE2ESignedIn(): boolean {
  return __DEV__
    && typeof window !== 'undefined'
    && (
      new URLSearchParams(window.location.search).get('e2e-auth') === 'signed-in'
      || window.localStorage.getItem('career-reality-e2e-auth') === 'signed-in'
    );
}

function formatFreshness(value: string | null | undefined): string {
  if (!value) return 'Freshness is not available yet.';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Freshness is not available yet.';
  return `Verified ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

function feedLabel(status: JobRecommendationsResponse['feeds'][number]): string {
  if (status.status === 'healthy') return `${status.name} is live`;
  if (status.status === 'empty') return `${status.name} returned no current roles`;
  if (status.status === 'unauthorized') return `${status.name} needs attention`;
  if (status.status === 'unavailable') return `${status.name} is temporarily unavailable`;
  return `${status.name} is not configured`;
}

export default function JobsScreen() {
  const colors = useColors();
  const { isSignedIn } = useAuth();
  const { profile, isHydrated } = useCareer();
  const signedIn = Boolean(isSignedIn || isE2ESignedIn());
  const [recommendations, setRecommendations] = useState<JobRecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actingJobId, setActingJobId] = useState<string | null>(null);

  const loadRecommendations = useCallback(async () => {
    if (!signedIn) return;
    setLoading(true);
    setError(null);
    try {
      const next = await fetchCareerJobRecommendations();
      setRecommendations(next);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'We could not load matched roles.');
    } finally {
      setLoading(false);
    }
  }, [signedIn]);

  useEffect(() => {
    if (signedIn && isHydrated) void loadRecommendations();
  }, [
    isHydrated,
    loadRecommendations,
    profile.city,
    profile.ctc,
    profile.experience,
    profile.role,
    profile.target,
    signedIn,
  ]);

  const updateLifecycle = async (job: JobRecommendation, status: 'applied' | 'dismissed') => {
    setActingJobId(job.id);
    setError(null);
    try {
      if (status === 'applied') await applyToCareerJob(job.id);
      else await dismissCareerJobRecommendation(job.id);
      setRecommendations((current) => current
        ? { ...current, jobs: current.jobs.filter((candidate) => candidate.id !== job.id) }
        : current);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (status === 'applied') await Linking.openURL(job.applyUrl);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'That job could not be updated. Try again.');
    } finally {
      setActingJobId(null);
    }
  };

  if (!signedIn) {
    return <SignedOutJobs colors={colors} />;
  }

  return (
    <Screen>
      <Header eyebrow="PROFILE-AWARE JOBS" title="The right role is worth waiting for." />

      {loading && !recommendations ? (
        <View testID="jobs-loading" style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.stateTitle, { color: colors.foreground }]}>Finding roles that fit your brief…</Text>
          <Text style={[styles.stateBody, { color: colors.mutedForeground }]}>We are checking trusted feeds against your saved role, direction, city, experience, and constraints.</Text>
        </View>
      ) : error && !recommendations ? (
        <View testID="jobs-error" style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="alert-circle" size={22} color={colors.warning} />
          <Text style={[styles.stateTitle, { color: colors.foreground }]}>Your matched roles are unavailable.</Text>
          <Text style={[styles.stateBody, { color: colors.mutedForeground }]}>{error}</Text>
          <PrimaryButton onPress={() => void loadRecommendations()} icon="refresh-cw">Try again</PrimaryButton>
        </View>
      ) : recommendations ? (
        <RecommendationsView
          colors={colors}
          recommendations={recommendations}
          actingJobId={actingJobId}
          error={error}
          onApply={(job) => void updateLifecycle(job, 'applied')}
          onDismiss={(job) => void updateLifecycle(job, 'dismissed')}
          onRefresh={() => void loadRecommendations()}
          onReviewProfile={() => router.push('/(tabs)/profile')}
        />
      ) : null}
    </Screen>
  );
}

function RecommendationsView({
  colors,
  recommendations,
  actingJobId,
  error,
  onApply,
  onDismiss,
  onRefresh,
  onReviewProfile,
}: {
  colors: ReturnType<typeof useColors>;
  recommendations: JobRecommendationsResponse;
  actingJobId: string | null;
  error: string | null;
  onApply: (job: JobRecommendation) => void;
  onDismiss: (job: JobRecommendation) => void;
  onRefresh: () => void;
  onReviewProfile: () => void;
}) {
  const context = recommendations.profileContext;
  return (
    <>
      <View testID="jobs-recommendations" style={[styles.hero, { backgroundColor: colors.primary }]}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Feather name="briefcase" size={20} color={colors.primaryForeground} />
          </View>
          <Pill tone="positive">{recommendations.jobs.length} matched</Pill>
        </View>
        <Text style={[styles.heroTitle, { color: colors.primaryForeground }]}>Roles matched to your actual next move.</Text>
        <Text style={[styles.heroBody, { color: colors.primaryForeground }]}>
          These are filtered against your saved brief. A match is a starting point, not a promise.
        </Text>
      </View>

      <SectionHeader title="Your matching brief" action="Saved context" />
      <View testID="jobs-profile-context" style={[styles.contextCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ContextItem label="Current role" value={context.role} colors={colors} />
        <ContextItem label="Target direction" value={context.targetDirection} colors={colors} />
        <ContextItem label="Level · experience" value={`${context.level ?? 'Not explicit'} · ${context.experience}`} colors={colors} />
        <ContextItem label="City · compensation" value={`${context.city} · ${context.compensation}`} colors={colors} />
      </View>

      <View style={[styles.freshnessCard, { backgroundColor: colors.secondary }]}>
        <View style={styles.freshnessHeader}>
          <Feather name="shield" size={16} color={colors.primary} />
          <Text style={[styles.freshnessTitle, { color: colors.foreground }]}>Trusted source boundary</Text>
        </View>
        <Text style={[styles.freshnessBody, { color: colors.mutedForeground }]}>
          {formatFreshness(recommendations.lastRefreshedAt)} · Only official ATS feeds and approved providers are shown as recommendations.
        </Text>
        {recommendations.feeds.map((feed) => (
          <Text key={feed.id} style={[styles.feedStatus, { color: colors.mutedForeground }]}>• {feedLabel(feed)}</Text>
        ))}
      </View>

      {error ? <Text testID="jobs-action-error" style={[styles.errorText, { color: colors.warning }]}>{error}</Text> : null}

      <SectionHeader title="Recommended for you" action={recommendations.jobs.length > 0 ? 'Evidence first' : undefined} />
      {recommendations.jobs.length === 0 ? (
        <View testID="jobs-empty" style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={22} color={colors.primary} />
          <Text style={[styles.stateTitle, { color: colors.foreground }]}>No trusted matches yet.</Text>
          <Text style={[styles.stateBody, { color: colors.mutedForeground }]}>We will not fill this space with generic listings. Try again when a trusted feed has a role that clears your saved constraints, or update your career profile.</Text>
          <PrimaryButton onPress={onReviewProfile} icon="edit-3">Review my career profile</PrimaryButton>
          <Pressable onPress={onRefresh} accessibilityRole="button" testID="button-refresh-jobs">
            <Text style={[styles.linkText, { color: colors.primary }]}>Refresh trusted feeds</Text>
          </Pressable>
        </View>
      ) : (
        recommendations.jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            colors={colors}
            isActing={actingJobId === job.id}
            onApply={() => onApply(job)}
            onDismiss={() => onDismiss(job)}
          />
        ))
      )}

      {recommendations.searchLinks.length > 0 ? (
        <View style={[styles.outboundCard, { borderColor: colors.border }]}>
          <Text style={[styles.outboundTitle, { color: colors.foreground }]}>Search elsewhere, with context</Text>
          <Text style={[styles.outboundBody, { color: colors.mutedForeground }]}>These links leave CareerReality. They are not recommendations and do not carry our freshness guarantee.</Text>
          <View style={styles.outboundLinks}>
            {recommendations.searchLinks.map((link) => (
              <Pressable key={link.url} onPress={() => void Linking.openURL(link.url)} accessibilityRole="link">
                <Text style={[styles.linkText, { color: colors.primary }]}>{link.name} ↗</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </>
  );
}

function JobCard({
  job,
  colors,
  isActing,
  onApply,
  onDismiss,
}: {
  job: JobRecommendation;
  colors: ReturnType<typeof useColors>;
  isActing: boolean;
  onApply: () => void;
  onDismiss: () => void;
}) {
  return (
    <View testID={`job-card-${job.id}`} style={[styles.jobCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.jobHeader}>
        <View style={styles.jobHeading}>
          <Text style={[styles.jobTitle, { color: colors.foreground }]}>{job.title}</Text>
          <Text style={[styles.jobCompany, { color: colors.mutedForeground }]}>{job.company}</Text>
        </View>
        <Pill tone="positive">{job.matchScore}% fit</Pill>
      </View>
      <View style={styles.jobMeta}>
        <Pill>{job.location}</Pill>
        <Pill>{job.remoteType}</Pill>
        <Text style={[styles.sourceText, { color: colors.mutedForeground }]}>{job.sourceName}</Text>
      </View>
      <Text style={[styles.freshnessText, { color: colors.mutedForeground }]}>{formatFreshness(job.lastVerifiedAt)} · Canonical application link</Text>
      <View style={[styles.evidenceBox, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.evidenceTitle, { color: colors.foreground }]}>Why it fits</Text>
        {job.matchEvidence.map((evidence) => <Text key={evidence} style={[styles.evidenceText, { color: colors.mutedForeground }]}>• {evidence}</Text>)}
        {job.unknowns.length > 0 ? (
          <>
            <Text style={[styles.unknownTitle, { color: colors.warning }]}>Still unknown</Text>
            {job.unknowns.map((unknown) => <Text key={unknown} style={[styles.evidenceText, { color: colors.mutedForeground }]}>• {unknown}</Text>)}
          </>
        ) : null}
      </View>
      <Text style={[styles.guidance, { color: colors.foreground }]}>{job.applicationGuidance}</Text>
      <View style={styles.jobActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Apply to ${job.title} at ${job.company}`}
          disabled={isActing}
          onPress={onApply}
          testID={`button-apply-job-${job.id}`}
          style={({ pressed }) => [styles.applyButton, { backgroundColor: colors.primary, opacity: pressed || isActing ? 0.65 : 1 }]}
        >
          {isActing ? <ActivityIndicator color={colors.primaryForeground} size="small" /> : <Feather name="external-link" size={15} color={colors.primaryForeground} />}
          <Text style={[styles.applyButtonText, { color: colors.primaryForeground }]}>{isActing ? 'Updating…' : 'Apply on employer site'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={isActing} onPress={onDismiss} testID={`button-dismiss-job-${job.id}`}>
          <Text style={[styles.dismissText, { color: colors.mutedForeground }]}>Not for me</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ContextItem({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.contextItem}>
      <Text style={[styles.contextLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.contextValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function SignedOutJobs({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <Screen>
      <Header eyebrow="PROFILE-AWARE JOBS" title="The right role is worth waiting for." />
      <View testID="jobs-coming-soon" style={[styles.hero, { backgroundColor: colors.primary }]}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}><Feather name="briefcase" size={20} color={colors.primaryForeground} /></View>
          <Pill tone="positive">Personalized first</Pill>
        </View>
        <Text style={[styles.heroTitle, { color: colors.primaryForeground }]}>We’re building a better way to job hunt.</Text>
        <Text style={[styles.heroBody, { color: colors.primaryForeground }]}>Sign in to match trusted openings to your saved experience, direction, city, level, and constraints.</Text>
      </View>
      <View style={[styles.nextCard, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.nextEyebrow, { color: colors.primary }]}>YOUR PROFILE IS THE FILTER</Text>
        <Text style={[styles.nextTitle, { color: colors.foreground }]}>No generic listings pretending to know you.</Text>
        <Text style={[styles.nextBody, { color: colors.mutedForeground }]}>We will show evidence, unknowns, freshness, and a canonical application path when a role is genuinely profile-aware.</Text>
        <PrimaryButton onPress={() => router.push('/sign-in')} icon="log-in">Sign in to get matched roles</PrimaryButton>
      </View>
      <View style={styles.trustNote}>
        <Feather name="shield" size={15} color={colors.primary} />
        <Text style={[styles.trustText, { color: colors.mutedForeground }]}>No scraped listings. No stale links presented as current. No generic match score.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 20, padding: 19, gap: 14 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.14)' },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 23, lineHeight: 28, letterSpacing: -0.4 },
  heroBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, opacity: 0.86 },
  contextCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 13 },
  contextItem: { gap: 3 },
  contextLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, letterSpacing: 0.7, textTransform: 'uppercase' },
  contextValue: { fontFamily: 'Inter_600SemiBold', fontSize: 14, lineHeight: 19 },
  freshnessCard: { borderRadius: 18, padding: 16, gap: 7, marginTop: 18 },
  freshnessHeader: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  freshnessTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  freshnessBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  feedStatus: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 16 },
  stateCard: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 11 },
  stateTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, lineHeight: 23 },
  stateBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  errorText: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18, marginTop: 14 },
  jobCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12, marginBottom: 14 },
  jobHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  jobHeading: { flex: 1, gap: 4 },
  jobTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, lineHeight: 22 },
  jobCompany: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  jobMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7 },
  sourceText: { flexShrink: 1, fontFamily: 'Inter_400Regular', fontSize: 11 },
  freshnessText: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  evidenceBox: { borderRadius: 13, padding: 12, gap: 5 },
  evidenceTitle: { fontFamily: 'Inter_700Bold', fontSize: 12, marginBottom: 2 },
  evidenceText: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17 },
  unknownTitle: { fontFamily: 'Inter_700Bold', fontSize: 11, marginTop: 6 },
  guidance: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18 },
  jobActions: { gap: 14, alignItems: 'flex-start' },
  applyButton: { minHeight: 42, borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  applyButtonText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  dismissText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, paddingVertical: 3 },
  outboundCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 8, marginTop: 8, marginBottom: 18 },
  outboundTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  outboundBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  outboundLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 3 },
  linkText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  nextCard: { borderRadius: 18, padding: 18, gap: 10, marginTop: 22 },
  nextEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.2 },
  nextTitle: { fontFamily: 'Inter_700Bold', fontSize: 19, lineHeight: 24 },
  nextBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, marginBottom: 5 },
  trustNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingVertical: 20 },
  trustText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17 },
});