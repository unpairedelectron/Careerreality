import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  getListCareerActionsQueryKey,
  useCreateCareerAction,
  useListCareerActions,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useAccountScopedStorageKey, useCareer } from '@/context/career-context';
import { Header, Pill, PrimaryButton, Screen, SectionHeader } from '@/components/career-ui';
import { relocationCities, type RelocationCityId } from '@/lib/relocation';
import {
  calculateWhatIf,
  whatIfScenarios,
  type WhatIfScenarioId,
} from '@/lib/what-if';

const STORAGE_KEY = '@careerreality/what-if-inputs';
const ACTION_SOURCE = 'What-if simulation';

export default function WhatIfScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { profile } = useCareer();
  const storageKey = useAccountScopedStorageKey(STORAGE_KEY);
  const queryClient = useQueryClient();
  const [scenario, setScenario] = useState<WhatIfScenarioId>('switch');
  const [scenarioCtc, setScenarioCtc] = useState(profile.ctc);
  const [targetCityId, setTargetCityId] = useState<RelocationCityId>('hyderabad');
  const [isHydrated, setIsHydrated] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const actionsQuery = useListCareerActions({
    query: { queryKey: getListCareerActionsQueryKey(), enabled: Boolean(isSignedIn) },
  });
  const createAction = useCreateCareerAction();
  const selectedScenario = whatIfScenarios.find((item) => item.id === scenario) ?? whatIfScenarios[1];
  const result = useMemo(
    () => calculateWhatIf({
      currentCtc: profile.ctc,
      scenarioCtc,
      scenario,
      currentCity: profile.city,
      targetCityId,
    }),
    [profile.city, profile.ctc, scenario, scenarioCtc, targetCityId],
  );
  const actionTitle = `Verify the ${selectedScenario.label.toLowerCase()} scenario`;
  const savedAction = actionsQuery.data?.find(
    (action) => action.title === actionTitle && action.source === ACTION_SOURCE,
  );

  useEffect(() => {
    if (!storageKey) return;
    AsyncStorage.getItem(storageKey)
      .then((stored) => {
        if (!stored) return;
        try {
          const saved = JSON.parse(stored) as {
            scenario?: WhatIfScenarioId;
            scenarioCtc?: string;
            targetCityId?: RelocationCityId;
          };
          if (saved.scenario === 'stay' || saved.scenario === 'switch' || saved.scenario === 'relocate') {
            setScenario(saved.scenario);
          }
          if (typeof saved.scenarioCtc === 'string') setScenarioCtc(saved.scenarioCtc);
          if (relocationCities.some((city) => city.id === saved.targetCityId)) {
            setTargetCityId(saved.targetCityId as RelocationCityId);
          }
        } catch {
          // An older or malformed local value should not block the simulator.
        }
      })
      .finally(() => setIsHydrated(true));
  }, [storageKey]);

  useEffect(() => {
    if (isHydrated && storageKey) {
      void AsyncStorage.setItem(storageKey, JSON.stringify({ scenario, scenarioCtc, targetCityId }));
    }
  }, [isHydrated, scenario, scenarioCtc, targetCityId, storageKey]);

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
          body: 'Write down the missing number, conversation, or proof point that would confirm or reject this scenario before you act.',
          source: ACTION_SOURCE,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListCareerActionsQueryKey() });
      setSaveMessage('Added to your private Plan.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setSaveError('This simulation check could not be saved. Try again.');
    }
  }

  return (
    <Screen keyboardAware>
      <Header back eyebrow="WHAT-IF SIMULATION" title="Make the trade-off visible before you make the move." />

      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <Text style={[styles.heroEyebrow, { color: colors.primaryForeground }]}>A DIRECTIONAL MODEL, NOT A PROMISE</Text>
        <Text style={[styles.heroTitle, { color: colors.primaryForeground }]}>Change one assumption and see what needs proving.</Text>
        <Text style={[styles.heroBody, { color: colors.primaryForeground }]}>
          This simulation uses visible inputs, a 72% take-home planning factor, and city cost assumptions. It is designed to improve the next conversation—not make the decision for you.
        </Text>
      </View>

      <SectionHeader title="Choose a scenario" action="Tap to compare" />
      <View style={styles.scenarioList}>
        {whatIfScenarios.map((item) => {
          const selected = item.id === scenario;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Simulate ${item.label}`}
              testID={`button-what-if-${item.id}`}
              onPress={() => { setScenario(item.id); setSaveMessage(null); setSaveError(null); void Haptics.selectionAsync(); }}
              style={[styles.scenarioButton, { backgroundColor: selected ? colors.primary : colors.card, borderColor: selected ? colors.primary : colors.border }]}
            >
              <Text style={[styles.scenarioLabel, { color: selected ? colors.primaryForeground : colors.foreground }]}>{item.label}</Text>
              <Text style={[styles.scenarioDescription, { color: selected ? colors.primaryForeground : colors.mutedForeground }]}>{item.description}</Text>
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title="Change the assumption" action="Your inputs" />
      <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>HYPOTHETICAL ANNUAL CTC</Text>
        <TextInput
          accessibilityLabel="Hypothetical annual CTC"
          testID="input-what-if-ctc"
          value={scenarioCtc}
          onChangeText={setScenarioCtc}
          placeholder="₹38L"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
          returnKeyType="done"
        />
        <Text style={[styles.inputHelp, { color: colors.mutedForeground }]}>
          Current profile CTC: {profile.ctc || 'not shared'} · use ₹38L, 3800000, or “prefer not to say”.
        </Text>
      </View>

      {scenario === 'relocate' ? (
        <>
          <SectionHeader title="Choose the target city" action="Planning midpoint" />
          <View style={styles.cityGrid}>
            {relocationCities.map((city) => {
              const selected = city.id === targetCityId;
              return (
                <Pressable
                  key={city.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Use ${city.name} in simulation`}
                  testID={`button-what-if-city-${city.id}`}
                  onPress={() => setTargetCityId(city.id)}
                  style={[styles.cityButton, { backgroundColor: selected ? colors.primary : colors.card, borderColor: selected ? colors.primary : colors.border }]}
                >
                  <Text style={[styles.cityName, { color: selected ? colors.primaryForeground : colors.foreground }]}>{city.name}</Text>
                  <Text style={[styles.cityDetail, { color: selected ? colors.primaryForeground : colors.mutedForeground }]}>₹{Math.round(city.monthlyLivingCost / 1000)}k / month</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      <SectionHeader title="Here is what we know" action={selectedScenario.label} />
      <View style={[styles.readoutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.readoutHeader}>
          <Text style={[styles.readoutTitle, { color: colors.foreground }]}>{selectedScenario.label}</Text>
          <Pill tone={result.monthlyRoomChange !== null && result.monthlyRoomChange < 0 ? 'warning' : 'accent'}>72% planning factor</Pill>
        </View>
        <Text style={[styles.readoutBody, { color: colors.mutedForeground }]}>{result.known}</Text>
        <View style={styles.statsRow}>
          <View style={[styles.stat, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>MONTHLY ROOM CHANGE</Text>
            <Text style={[styles.statValue, { color: result.monthlyRoomChange !== null && result.monthlyRoomChange < 0 ? colors.warning : colors.foreground }]}>
              {result.monthlyRoomChange === null ? 'Unknown' : `${result.monthlyRoomChange < 0 ? '−' : '+'}₹${Math.round(Math.abs(result.monthlyRoomChange) / 1000)}k`}
            </Text>
          </View>
          <View style={[styles.stat, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>FIRST-YEAR CHANGE</Text>
            <Text style={[styles.statValue, { color: result.firstYearChange !== null && result.firstYearChange < 0 ? colors.warning : colors.foreground }]}>
              {result.firstYearChange === null ? 'Unknown' : `${result.firstYearChange < 0 ? '−' : '+'}₹${Math.round(Math.abs(result.firstYearChange) / 1000)}k`}
            </Text>
          </View>
        </View>
        {result.breakEvenMonths !== null ? <Text style={[styles.breakEven, { color: colors.primary }]}>Move buffer breaks even in about {result.breakEvenMonths} months if the monthly gain holds.</Text> : null}
      </View>

      <SectionHeader title="Here is what it means for you" action="Directional" />
      <View style={[styles.meaningCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Feather name={result.monthlyRoomChange !== null && result.monthlyRoomChange < 0 ? 'alert-triangle' : 'compass'} size={18} color={result.monthlyRoomChange !== null && result.monthlyRoomChange < 0 ? colors.warning : colors.primary} />
        <Text style={[styles.meaningText, { color: colors.foreground }]}>{result.meaning}</Text>
      </View>

      <SectionHeader title="Here is what we do not know" action={`${result.unknowns.length} gaps`} />
      <View style={[styles.unknownCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {result.unknowns.map((unknown) => (
          <View key={unknown} style={styles.bulletRow}>
            <View style={[styles.bullet, { backgroundColor: colors.warning }]} />
            <Text style={[styles.bulletText, { color: colors.mutedForeground }]}>{unknown}</Text>
          </View>
        ))}
      </View>

      <SectionHeader title="Here is what you should do next" action="Make it testable" />
      <View style={[styles.nextCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Text style={[styles.nextTitle, { color: colors.foreground }]}>Write the missing number or conversation that would change this read.</Text>
        <Text style={[styles.sourceText, { color: colors.mutedForeground }]}>Save this as a Plan item before you negotiate, resign, or relocate.</Text>
        <PrimaryButton onPress={saveNextMove} icon={savedAction ? 'arrow-up-right' : 'plus'} secondary>
          {savedAction ? 'In Plan' : isSignedIn ? 'Add check to Plan' : 'Sign in to save this check'}
        </PrimaryButton>
        {saveMessage ? <Text style={[styles.successText, { color: colors.primary }]}>{saveMessage}</Text> : null}
        {saveError ? <Text style={[styles.errorText, { color: colors.warning }]}>{saveError}</Text> : null}
      </View>

      <View style={styles.disclaimer}>
        <Feather name="info" size={14} color={colors.mutedForeground} />
        <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>A simulation is useful when it names the assumption that must be verified. It is not a forecast of your outcome.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 20, padding: 20, gap: 10 },
  heroEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.2, opacity: 0.78 },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 23, lineHeight: 28 },
  heroBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, opacity: 0.84 },
  scenarioList: { gap: 8 },
  scenarioButton: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 4 },
  scenarioLabel: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  scenarioDescription: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
  inputCard: { borderWidth: 1, borderRadius: 17, padding: 16, gap: 9 },
  inputLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1 },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  inputHelp: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cityButton: { width: '31.8%', minHeight: 60, borderRadius: 13, borderWidth: 1, padding: 9, justifyContent: 'center', gap: 4 },
  cityName: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  cityDetail: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 14 },
  readoutCard: { borderWidth: 1, borderRadius: 17, padding: 16, gap: 12 },
  readoutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  readoutTitle: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 17 },
  readoutBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  statsRow: { flexDirection: 'row', gap: 9 },
  stat: { flex: 1, borderRadius: 12, padding: 11, gap: 6 },
  statLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.8 },
  statValue: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  breakEven: { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 17 },
  meaningCard: { borderWidth: 1, borderRadius: 17, padding: 16, gap: 9 },
  meaningText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, lineHeight: 20 },
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