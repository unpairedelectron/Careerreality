import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { listSalaryBenchmarks } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useCareer } from '@/context/career-context';
import { Header, Pill, PrimaryButton, Screen, SectionHeader } from '@/components/career-ui';
import { parseAnnualCtc } from '@/lib/relocation';
import {
  benchmarkScopeLabel,
  experienceBandFor,
  isPrivacySafe,
  MIN_ANONYMOUS_PEERS,
  peerBenchmarkRoles,
  type PeerBenchmarkRole,
} from '@/lib/peer-benchmark';

const benchmarkCities = ['Bengaluru', 'Hyderabad', 'Pune', 'Mumbai', 'Delhi NCR'] as const;

export default function PeerBenchmarksScreen() {
  const colors = useColors();
  const router = useRouter();
  const { profile } = useCareer();
  const defaultCity = benchmarkCities.find((city) => city.toLowerCase() === profile.city.trim().toLowerCase()) ?? '';
  const [role, setRole] = useState<PeerBenchmarkRole>(() => peerBenchmarkRoles.find((item) => item === profile.role) ?? 'Software engineer');
  const [city, setCity] = useState(defaultCity);
  const experienceBand = experienceBandFor(profile.experience);
  const query = useQuery({
    queryKey: ['peer-benchmark', role, city, experienceBand],
    queryFn: () => listSalaryBenchmarks({ role, city, experienceBand }),
    enabled: Boolean(city),
    staleTime: 10 * 60 * 1000,
  });
  const benchmark = query.data?.data.find((row) => row.role === role && row.city === city && row.experienceBand === experienceBand);
  const privacySafe = isPrivacySafe(benchmark?.sampleSize);
  const currentCtc = parseAnnualCtc(profile.ctc);
  const percentileLabel = useMemo(() => {
    if (!benchmark || currentCtc === null) return 'Not enough evidence';
    if (currentCtc < benchmark.p25) return 'Below the observed middle range';
    if (currentCtc > benchmark.p75) return 'Above the observed middle range';
    return currentCtc >= benchmark.median ? 'Around or above the observed median' : 'Below the observed median';
  }, [benchmark, currentCtc]);

  return (
    <Screen>
      <Header back eyebrow="ANONYMOUS PEER BENCHMARKS" title="Compare without exposing an individual." />

      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <Text style={[styles.heroEyebrow, { color: colors.primaryForeground }]}>PRIVACY FLOOR · {MIN_ANONYMOUS_PEERS} PEERS</Text>
        <Text style={[styles.heroTitle, { color: colors.primaryForeground }]}>A cohort can inform you. A single person should never be revealed.</Text>
        <Text style={[styles.heroBody, { color: colors.primaryForeground }]}>
          This view uses aggregated salary ranges only. It never shows a person, raw submission, or small cohort, and it does not ask you to submit compensation to unlock a result.
        </Text>
      </View>

      <SectionHeader title="Define your peer cohort" action="Explicit scope" />
      <Text style={[styles.scopeText, { color: colors.mutedForeground }]}>
        Choose the role family and city yourself. We will not silently use the first available dataset row.
      </Text>
      <Text style={[styles.selectorLabel, { color: colors.mutedForeground }]}>ROLE FAMILY</Text>
      <View style={styles.optionGrid}>
        {peerBenchmarkRoles.map((item) => {
          const selected = role === item;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Benchmark ${item}`}
              testID={`button-peer-role-${item.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`}
              onPress={() => { setRole(item); void Haptics.selectionAsync(); }}
              style={[styles.optionButton, { backgroundColor: selected ? colors.primary : colors.card, borderColor: selected ? colors.primary : colors.border }]}
            >
              <Text style={[styles.optionText, { color: selected ? colors.primaryForeground : colors.foreground }]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.selectorLabel, { color: colors.mutedForeground }]}>CITY</Text>
      <View style={styles.optionGrid}>
        {benchmarkCities.map((item) => {
          const selected = city === item;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Benchmark ${item}`}
              testID={`button-peer-city-${item.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`}
              onPress={() => { setCity(item); void Haptics.selectionAsync(); }}
              style={[styles.optionButton, { backgroundColor: selected ? colors.primary : colors.card, borderColor: selected ? colors.primary : colors.border }]}
            >
              <Text style={[styles.optionText, { color: selected ? colors.primaryForeground : colors.foreground }]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title="Here is what we know" action={city ? benchmarkScopeLabel(role, city, experienceBand) : 'Choose a city'} />
      {!city ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="map-pin" size={18} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Choose a city to reveal a scoped cohort.</Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>No benchmark is shown until the role, city, and experience band are explicit.</Text>
        </View>
      ) : benchmark && privacySafe ? (
        <View style={[styles.readoutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.readoutHeader}>
            <View style={styles.readoutCopy}>
              <Text style={[styles.readoutTitle, { color: colors.foreground }]}>{role} in {city}</Text>
              <Text style={[styles.readoutSub, { color: colors.mutedForeground }]}>{experienceBand} · aggregated cohort</Text>
            </View>
            <Pill tone="positive">Privacy safe</Pill>
          </View>
          <View style={styles.rangeRow}>
            <View style={styles.rangeItem}><Text style={[styles.rangeLabel, { color: colors.mutedForeground }]}>25TH</Text><Text style={[styles.rangeValue, { color: colors.foreground }]}>{formatLakh(benchmark.p25)}</Text></View>
            <View style={[styles.rangeItem, styles.rangeMiddle, { borderColor: colors.border }]}><Text style={[styles.rangeLabel, { color: colors.primary }]}>MEDIAN</Text><Text style={[styles.rangeValue, { color: colors.primary }]}>{formatLakh(benchmark.median)}</Text></View>
            <View style={styles.rangeItem}><Text style={[styles.rangeLabel, { color: colors.mutedForeground }]}>75TH</Text><Text style={[styles.rangeValue, { color: colors.foreground }]}>{formatLakh(benchmark.p75)}</Text></View>
          </View>
          <View style={[styles.cohortLine, { backgroundColor: colors.secondary }]}>
            <Feather name="users" size={14} color={colors.primary} />
            <Text style={[styles.cohortText, { color: colors.mutedForeground }]}>Aggregated from {benchmark.sampleSize} peer observations · no individual records shown.</Text>
          </View>
          <Text style={[styles.sourceText, { color: colors.mutedForeground }]}>{benchmark.source} · refreshed {new Date(benchmark.refreshedAt).toLocaleDateString()}</Text>
        </View>
      ) : benchmark && !privacySafe ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="lock" size={18} color={colors.warning} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Benchmark suppressed for privacy.</Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>This cohort does not meet the {MIN_ANONYMOUS_PEERS}-peer minimum. We will not reveal its range or exact size.</Text>
        </View>
      ) : query.isError ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="wifi-off" size={18} color={colors.warning} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>This cohort could not be checked.</Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>The lookup failed before we could distinguish an empty cohort from an unavailable source. No conclusion is shown.</Text>
          <PrimaryButton onPress={() => void query.refetch()} secondary icon="refresh-cw">
            {query.isFetching ? 'Checking again…' : 'Try again'}
          </PrimaryButton>
        </View>
      ) : (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name={query.isPending ? 'loader' : 'search'} size={18} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{query.isPending ? 'Checking the scoped benchmark…' : 'No scoped benchmark available.'}</Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>{query.isPending ? 'The result will stay scoped to the role, city, and experience band you selected.' : 'No result is better than borrowing a nearby role or city and pretending it is comparable.'}</Text>
        </View>
      )}

      <SectionHeader title="Here is what it means for you" action="Profile context" />
      <View style={[styles.meaningCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Text style={[styles.meaningText, { color: colors.foreground }]}>
          {benchmark && privacySafe
            ? currentCtc === null
              ? 'Your CTC is not available, so this is a market range—not a position read.'
              : `Your current profile CTC sits ${percentileLabel.toLowerCase()}.`
            : 'Choose a privacy-safe, explicitly scoped cohort before comparing your current CTC.'}
        </Text>
        <Text style={[styles.meaningDetail, { color: colors.mutedForeground }]}>The selected role, city, and experience band are sent to the public aggregate lookup. Your CTC is compared locally and is never submitted.</Text>
      </View>

      <SectionHeader title="Here is what we do not know" action="Important limits" />
      <View style={[styles.unknownCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {[
          'Peer ranges describe observed compensation, not what any employer owes you.',
          'Role scope, company type, equity, variable pay, and negotiation timing can move the number.',
          'The public aggregate may not represent your exact team, background, or offer.',
        ].map((unknown) => (
          <View key={unknown} style={styles.bulletRow}>
            <View style={[styles.bullet, { backgroundColor: colors.warning }]} />
            <Text style={[styles.bulletText, { color: colors.mutedForeground }]}>{unknown}</Text>
          </View>
        ))}
      </View>

      <SectionHeader title="Here is what you should do next" action="Use the range carefully" />
      <View style={[styles.nextCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Text style={[styles.nextTitle, { color: colors.foreground }]}>Ask for the scope, level, and guaranteed cash behind the number.</Text>
        <Text style={[styles.sourceText, { color: colors.mutedForeground }]}>The useful next move is a better question—not a demand based on a percentile.</Text>
        <PrimaryButton onPress={() => router.push('/what-if')} icon="arrow-right">
          Run a what-if scenario
        </PrimaryButton>
      </View>

      <View style={styles.disclaimer}>
        <Feather name="shield" size={14} color={colors.mutedForeground} />
        <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>Privacy threshold: no cohort below {MIN_ANONYMOUS_PEERS} peers is shown. No individual salary, submission, or identity is exposed.</Text>
      </View>
    </Screen>
  );
}

function formatLakh(value: number): string {
  return `₹${(value / 100_000).toFixed(1).replace('.0', '')}L`;
}

const styles = StyleSheet.create({
  hero: { borderRadius: 20, padding: 20, gap: 10 },
  heroEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.2, opacity: 0.78 },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 23, lineHeight: 28 },
  heroBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, opacity: 0.84 },
  scopeText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginBottom: 16 },
  selectorLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1, marginBottom: 8, marginTop: 5 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionButton: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  optionText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  readoutCard: { borderWidth: 1, borderRadius: 17, padding: 16, gap: 14 },
  readoutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  readoutCopy: { flex: 1, gap: 4 },
  readoutTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, lineHeight: 20 },
  readoutSub: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  rangeRow: { flexDirection: 'row', alignItems: 'stretch' },
  rangeItem: { flex: 1, gap: 5, paddingVertical: 8 },
  rangeMiddle: { borderLeftWidth: 1, borderRightWidth: 1, paddingHorizontal: 10, marginHorizontal: 10 },
  rangeLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.8 },
  rangeValue: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  cohortLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 10, padding: 10 },
  cohortText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 16 },
  sourceText: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  emptyCard: { borderWidth: 1, borderRadius: 17, padding: 16, gap: 9 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, lineHeight: 20 },
  emptyBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  meaningCard: { borderWidth: 1, borderRadius: 17, padding: 16, gap: 9 },
  meaningText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, lineHeight: 20 },
  meaningDetail: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  unknownCard: { borderWidth: 1, borderRadius: 17, padding: 16, gap: 12 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bullet: { width: 7, height: 7, borderRadius: 4, marginTop: 5 },
  bulletText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  nextCard: { borderWidth: 1, borderRadius: 17, padding: 16, gap: 11 },
  nextTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, lineHeight: 21 },
  disclaimer: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 22 },
  disclaimerText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17 },
});