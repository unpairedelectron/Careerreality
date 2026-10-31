import { Feather } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { CareerBriefHistoryEntry } from '@workspace/api-client-react';
import { Header, Pill, PrimaryButton, Screen } from '@/components/career-ui';
import { useColors } from '@/hooks/useColors';
import { fetchCareerBriefHistory } from '@/lib/career-api';

function isE2ESignedIn(): boolean {
  return __DEV__
    && typeof window !== 'undefined'
    && (
      new URLSearchParams(window.location.search).get('e2e-auth') === 'signed-in'
      || window.localStorage.getItem('career-reality-e2e-auth') === 'signed-in'
    );
}

function formatReadDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusLabel(entry: CareerBriefHistoryEntry): string {
  if (entry.change.status === 'initial') return 'First read';
  if (entry.change.status === 'insufficient') return 'Not enough evidence';
  if (entry.change.status === 'unchanged') return 'No material change';
  return 'Changed';
}

function statusTone(entry: CareerBriefHistoryEntry): 'positive' | 'warning' | 'accent' {
  if (entry.change.status === 'insufficient') return 'warning';
  if (entry.change.status === 'changed') return 'accent';
  return 'positive';
}

function HistoryEntry({ entry }: { entry: CareerBriefHistoryEntry }) {
  const colors = useColors();
  return (
    <View testID={`brief-history-entry-${entry.id}`} style={[styles.entryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.entryTop}>
        <View style={styles.entryDate}>
          <Feather name="clock" size={14} color={colors.primary} />
          <Text style={[styles.dateText, { color: colors.mutedForeground }]}>{formatReadDate(entry.createdAt)}</Text>
        </View>
        <Pill tone={statusTone(entry)}>{statusLabel(entry)}</Pill>
      </View>
      <Text style={[styles.headline, { color: colors.foreground }]}>{entry.headline}</Text>
      <Text style={[styles.summary, { color: colors.mutedForeground }]}>{entry.change.summary}</Text>
      {entry.change.details.length > 0 ? (
        <View style={styles.details}>
          {entry.change.details.map((detail, index) => (
            <View key={`${detail.category}-${detail.summary}-${index}`} style={[styles.detail, { borderTopColor: colors.border }]}>
              <Text style={[styles.category, { color: colors.primary }]}>{detail.category}</Text>
              <Text style={[styles.detailSummary, { color: colors.foreground }]}>{detail.summary}</Text>
              <Text style={[styles.provenance, { color: colors.mutedForeground }]}>{detail.source} · {detail.freshness}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.details}>
          <Text style={[styles.noDetails, { color: colors.mutedForeground }]}>
            {entry.change.status === 'initial'
              ? 'This is the baseline for future comparisons.'
              : entry.change.status === 'insufficient'
                ? 'No current evidence is available; this is not treated as an improvement.'
                : 'No separate profile or evidence change was found.'}
          </Text>
          {entry.evidence.length > 0 ? (
            <Text style={[styles.provenance, { color: colors.mutedForeground }]}>
              Current evidence: {entry.evidence.map((evidence) => `${evidence.source} · ${evidence.freshness}`).join(' · ')}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

export default function BriefHistoryScreen() {
  const colors = useColors();
  const { isSignedIn } = useAuth();
  const signedIn = Boolean(isSignedIn || isE2ESignedIn());
  const historyQuery = useQuery({
    queryKey: ['career-brief-history'],
    queryFn: fetchCareerBriefHistory,
    enabled: signedIn,
    staleTime: 60 * 1000,
    retry: false,
  });

  return (
    <Screen>
      <Header eyebrow="PRIVATE HISTORY" title="How your read changed" back />
      {!signedIn ? (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="lock" size={18} color={colors.primary} />
          <Text style={[styles.stateTitle, { color: colors.foreground }]}>Sign in to view your history</Text>
          <Text style={[styles.stateBody, { color: colors.mutedForeground }]}>Your career reads stay private to your CareerReality account.</Text>
        </View>
      ) : null}
      {signedIn && historyQuery.isPending ? (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="activity" size={18} color={colors.primary} />
          <Text style={[styles.stateTitle, { color: colors.foreground }]}>Loading your read history...</Text>
        </View>
      ) : null}
      {signedIn && historyQuery.isError ? (
        <View testID="brief-history-error" style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="wifi-off" size={18} color={colors.warning} />
          <Text style={[styles.stateTitle, { color: colors.foreground }]}>Your read history is unavailable.</Text>
          <Text style={[styles.stateBody, { color: colors.mutedForeground }]}>The latest brief is still separate from this history view. Try again when you are ready.</Text>
          <PrimaryButton onPress={() => void historyQuery.refetch()} icon="refresh-cw" secondary>
            {historyQuery.isFetching ? 'Retrying...' : 'Retry history'}
          </PrimaryButton>
        </View>
      ) : null}
      {signedIn && historyQuery.isSuccess && historyQuery.data.entries.length === 0 ? (
        <View testID="brief-history-empty" style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="book-open" size={18} color={colors.primary} />
          <Text style={[styles.stateTitle, { color: colors.foreground }]}>No saved reads yet.</Text>
          <Text style={[styles.stateBody, { color: colors.mutedForeground }]}>Build your first personal brief and future changes will appear here with their evidence trail.</Text>
        </View>
      ) : null}
      {signedIn && historyQuery.isSuccess && historyQuery.data.entries.length > 0 ? (
        <View style={styles.list}>
          <Text style={[styles.intro, { color: colors.mutedForeground }]}>Each entry keeps the date, change category, source, freshness, and evidence limits together.</Text>
          {historyQuery.data.entries.map((entry) => <HistoryEntry key={entry.id} entry={entry} />)}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  intro: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginBottom: 2 },
  entryCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 10 },
  entryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  entryDate: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dateText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  headline: { fontFamily: 'Inter_700Bold', fontSize: 16, lineHeight: 21 },
  summary: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  details: { gap: 9 },
  detail: { borderTopWidth: 1, paddingTop: 10, gap: 3 },
  category: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  detailSummary: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18 },
  provenance: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15 },
  noDetails: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  stateCard: { borderWidth: 1, borderRadius: 17, padding: 16, gap: 8 },
  stateTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, lineHeight: 20 },
  stateBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
});