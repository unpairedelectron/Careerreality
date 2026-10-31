import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  getListCareerActionsQueryKey,
  useCreateCareerAction,
  useListCareerActions,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useAccountScopedStorageKey, useCareer } from '@/context/career-context';
import { Header, MetricCard, Pill, PrimaryButton, Screen, SectionHeader } from '@/components/career-ui';
import {
  compareRelocation,
  formatRelocationAmount,
  relocationCities,
  type RelocationCityId,
} from '@/lib/relocation';

const STORAGE_KEY = '@careerreality/relocation-city';
const ACTION_SOURCE = 'Relocation comparison';

export default function RelocationScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { profile } = useCareer();
  const storageKey = useAccountScopedStorageKey(STORAGE_KEY);
  const queryClient = useQueryClient();
  const [selectedCityId, setSelectedCityId] = useState<RelocationCityId>('hyderabad');
  const [isHydrated, setIsHydrated] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const actionsQuery = useListCareerActions({
    query: { queryKey: getListCareerActionsQueryKey(), enabled: Boolean(isSignedIn) },
  });
  const createAction = useCreateCareerAction();
  const comparison = useMemo(
    () => compareRelocation(profile.city, profile.ctc, selectedCityId),
    [profile.city, profile.ctc, selectedCityId],
  );
  const actionTitle = `Verify ${comparison.city.name} relocation economics`;
  const savedAction = actionsQuery.data?.find(
    (action) => action.title === actionTitle && action.source === ACTION_SOURCE,
  );

  useEffect(() => {
    if (!storageKey) return;
    AsyncStorage.getItem(storageKey)
      .then((stored) => {
        if (relocationCities.some((city) => city.id === stored)) {
          setSelectedCityId(stored as RelocationCityId);
        }
      })
      .finally(() => setIsHydrated(true));
  }, [storageKey]);

  useEffect(() => {
    if (isHydrated && storageKey) void AsyncStorage.setItem(storageKey, selectedCityId);
  }, [isHydrated, selectedCityId, storageKey]);

  async function saveNextMove() {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    if (savedAction) {
      router.push('/(tabs)/plan');
      return;
    }
    setSaveMessage(null);
    setSaveError(null);
    try {
      await createAction.mutateAsync({
        data: {
          kind: 'decision',
          title: actionTitle,
          body: comparison.nextAction,
          source: ACTION_SOURCE,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListCareerActionsQueryKey() });
      setSaveMessage('Added to your private Plan.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setSaveError('This relocation check could not be saved. Try again.');
    }
  }

  return (
    <Screen>
      <Header back eyebrow="RELOCATION COMPARISON" title="Move for a better decision, not just a different postcode." />

      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <Text style={[styles.heroEyebrow, { color: colors.primaryForeground }]}>A PLANNING MODEL, NOT A VERDICT</Text>
        <Text style={[styles.heroTitle, { color: colors.primaryForeground }]}>Compare the economics before you romanticize the move.</Text>
        <Text style={[styles.heroBody, { color: colors.primaryForeground }]}>
          We use transparent planning midpoints and your profile context. Actual rent, obligations, offer quality, and support are still yours to verify.
        </Text>
      </View>

      <SectionHeader title="Your current context" action={`${profile.city} · ${profile.ctc || 'CTC not shared'}`} />
      <View style={[styles.contextCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.contextTitle, { color: colors.foreground }]}>Current role: {profile.role}</Text>
        <Text style={[styles.contextBody, { color: colors.mutedForeground }]}>
          The model compares city planning costs. It does not assume a relocation offer, tax outcome, family situation, or commute pattern.
        </Text>
      </View>

      <SectionHeader title="Choose a comparison city" action="Tap to compare" />
      <View style={styles.cityGrid}>
        {relocationCities.map((city) => {
          const selected = selectedCityId === city.id;
          return (
            <Pressable
              key={city.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Compare ${city.name}`}
              testID={`button-relocation-city-${city.id}`}
              onPress={() => { setSelectedCityId(city.id); setSaveMessage(null); setSaveError(null); void Haptics.selectionAsync(); }}
              style={[
                styles.cityButton,
                {
                  backgroundColor: selected ? colors.primary : colors.card,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.cityName, { color: selected ? colors.primaryForeground : colors.foreground }]}>{city.name}</Text>
              <Text style={[styles.cityFriction, { color: selected ? colors.primaryForeground : colors.mutedForeground }]}>
                {city.friction} move friction
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title="Here is what we know" action="Directional assumptions" />
      <View style={[styles.readoutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.readoutHeader}>
          <Text style={[styles.readoutTitle, { color: colors.foreground }]}>{comparison.city.name}</Text>
          <Pill tone={comparison.city.friction === 'higher' ? 'warning' : comparison.city.friction === 'lower' ? 'positive' : 'accent'}>
            {comparison.city.friction} friction
          </Pill>
        </View>
        <Text style={[styles.readoutBody, { color: colors.mutedForeground }]}>{comparison.known}</Text>
        <View style={styles.metrics}>
          <MetricCard label="Monthly city cost" value={`₹${Math.round(comparison.city.monthlyLivingCost / 1000)}k`} detail="Planning midpoint" tone="accent" />
          <MetricCard label="First-year move cost" value={`₹${Math.round(comparison.city.oneTimeMoveCost / 1000)}k`} detail="One-time buffer" tone="warning" />
        </View>
      </View>

      <SectionHeader title="Here is what it means for you" action="Profile-based direction" />
      <View style={[styles.meaningCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Feather name={comparison.estimatedMonthlyRoom !== null && comparison.estimatedMonthlyRoom < 0 ? 'alert-triangle' : 'compass'} size={18} color={comparison.estimatedMonthlyRoom !== null && comparison.estimatedMonthlyRoom < 0 ? colors.warning : colors.primary} />
        <Text style={[styles.meaningText, { color: colors.foreground }]}>{comparison.meaning}</Text>
        {comparison.firstYearMoveAdjustedRoom !== null ? (
          <Text style={[styles.meaningDetail, { color: colors.mutedForeground }]}>
            First-year room after the move buffer: {formatRelocationAmount(comparison.firstYearMoveAdjustedRoom)}.
          </Text>
        ) : null}
      </View>

      <SectionHeader title="Here is what we do not know" action={`${comparison.unknowns.length} gaps`} />
      <View style={[styles.unknownCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {comparison.unknowns.map((unknown) => (
          <View key={unknown} style={styles.bulletRow}>
            <View style={[styles.bullet, { backgroundColor: colors.warning }]} />
            <Text style={[styles.bulletText, { color: colors.mutedForeground }]}>{unknown}</Text>
          </View>
        ))}
      </View>

      <SectionHeader title="Here is what you should do next" action="Reversible check" />
      <View style={[styles.nextCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Text style={[styles.nextTitle, { color: colors.foreground }]}>{comparison.nextAction}</Text>
        <Text style={[styles.sourceText, { color: colors.mutedForeground }]}>Source: CareerReality planning assumptions · not a live cost-of-living feed.</Text>
        <PrimaryButton onPress={saveNextMove} icon={savedAction ? 'arrow-up-right' : 'plus'} secondary>
          {savedAction ? 'In Plan' : isSignedIn ? 'Add check to Plan' : 'Sign in to save this check'}
        </PrimaryButton>
        {saveMessage ? <Text style={[styles.successText, { color: colors.primary }]}>{saveMessage}</Text> : null}
        {saveError ? <Text style={[styles.errorText, { color: colors.warning }]}>{saveError}</Text> : null}
      </View>

      <View style={styles.disclaimer}>
        <Feather name="info" size={14} color={colors.mutedForeground} />
        <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
          A cheaper city is not automatically a better career move. Confirm the offer, commute, support network, and actual monthly budget before resigning.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 20, padding: 20, gap: 10 },
  heroEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.2, opacity: 0.78 },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 23, lineHeight: 28 },
  heroBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, opacity: 0.84 },
  contextCard: { borderWidth: 1, borderRadius: 17, padding: 16, gap: 7 },
  contextTitle: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  contextBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cityButton: { width: '31.8%', minHeight: 62, borderRadius: 13, borderWidth: 1, padding: 10, justifyContent: 'center', gap: 4 },
  cityName: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  cityFriction: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 14 },
  readoutCard: { borderWidth: 1, borderRadius: 17, padding: 16, gap: 12 },
  readoutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  readoutTitle: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  readoutBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  metrics: { flexDirection: 'row', gap: 10 },
  meaningCard: { borderWidth: 1, borderRadius: 17, padding: 16, gap: 9 },
  meaningText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, lineHeight: 20 },
  meaningDetail: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  unknownCard: { borderWidth: 1, borderRadius: 17, padding: 16, gap: 12 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bullet: { width: 7, height: 7, borderRadius: 4, marginTop: 5 },
  bulletText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  nextCard: { borderWidth: 1, borderRadius: 17, padding: 16, gap: 11 },
  nextTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, lineHeight: 21 },
  sourceText: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  successText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  errorText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 18 },
  disclaimer: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 22 },
  disclaimerText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17 },
});