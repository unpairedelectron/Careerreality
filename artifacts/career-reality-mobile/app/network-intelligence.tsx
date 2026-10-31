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
import { Header, Pill, PrimaryButton, Screen, SectionHeader } from '@/components/career-ui';
import {
  analyzeNetworkIntelligence,
  getDefaultNetworkResponses,
  networkDimensions,
  networkResponseOptions,
  type NetworkResponse,
  type NetworkResponses,
} from '@/lib/network-intelligence';

const STORAGE_KEY = '@careerreality/network-intelligence';
const ACTION_SOURCE = 'Network and recruiter intelligence';

function readStoredResponses(value: string | null): NetworkResponses {
  if (!value) return getDefaultNetworkResponses();
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return networkDimensions.reduce<NetworkResponses>((responses, dimension) => {
      const answer = parsed[dimension.key];
      responses[dimension.key] = networkResponseOptions.some((option) => option.value === answer)
        ? answer as NetworkResponse
        : 'unknown';
      return responses;
    }, getDefaultNetworkResponses());
  } catch {
    return getDefaultNetworkResponses();
  }
}

export default function NetworkIntelligenceScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { profile } = useCareer();
  const storageKey = useAccountScopedStorageKey(STORAGE_KEY);
  const queryClient = useQueryClient();
  const [responses, setResponses] = useState<NetworkResponses>(getDefaultNetworkResponses);
  const [isHydrated, setIsHydrated] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const actionsQuery = useListCareerActions({
    query: { queryKey: getListCareerActionsQueryKey(), enabled: Boolean(isSignedIn) },
  });
  const createAction = useCreateCareerAction();
  const analysis = useMemo(() => analyzeNetworkIntelligence(responses), [responses]);
  const savedAction = actionsQuery.data?.find(
    (action) => action.title === analysis.nextMove.title && action.source === ACTION_SOURCE,
  );

  useEffect(() => {
    if (!storageKey) return;
    AsyncStorage.getItem(storageKey)
      .then((stored) => setResponses(readStoredResponses(stored)))
      .finally(() => setIsHydrated(true));
  }, [storageKey]);

  useEffect(() => {
    if (isHydrated && storageKey) void AsyncStorage.setItem(storageKey, JSON.stringify(responses));
  }, [isHydrated, responses, storageKey]);

  function updateResponse(key: string, value: NetworkResponse) {
    setResponses((current) => ({ ...current, [key]: value }));
    setSaveMessage(null);
    setSaveError(null);
  }

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
          title: analysis.nextMove.title,
          body: analysis.nextMove.body,
          source: ACTION_SOURCE,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListCareerActionsQueryKey() });
      setSaveMessage('Added to your private Plan.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setSaveError('This network next move could not be saved. Try again.');
    }
  }

  return (
    <Screen>
      <Header back eyebrow="NETWORK + RECRUITER INTELLIGENCE" title="Use relationships as evidence, not fantasy." />

      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <Text style={[styles.heroEyebrow, { color: colors.primaryForeground }]}>A SIGNAL CHECK, NOT A GRAPH LOOKUP</Text>
        <Text style={[styles.heroTitle, { color: colors.primaryForeground }]}>A large network is not the same as a warm path.</Text>
        <Text style={[styles.heroBody, { color: colors.primaryForeground }]}>
          Tell us what you have actually observed. CareerReality will help you choose the next conversation without pretending to know private intent or recruiter decisions.
        </Text>
      </View>

      <SectionHeader title="Your observed signals" action={`${profile.target} · private inputs`} />
      {networkDimensions.map((dimension) => {
        const value = responses[dimension.key] ?? 'unknown';
        return (
          <View key={dimension.key} style={[styles.questionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.questionHeader}>
              <View style={styles.questionLabel}>
                <Feather name={dimension.key === 'recruiter' ? 'mail' : 'user'} size={15} color={colors.primary} />
                <Text style={[styles.questionGroup, { color: colors.primary }]}>{dimension.title}</Text>
              </View>
              <Pill tone={value === 'warm' ? 'positive' : value === 'none' ? 'warning' : 'accent'}>
                {networkResponseOptions.find((option) => option.value === value)?.label ?? 'Not enough evidence'}
              </Pill>
            </View>
            <Text style={[styles.questionTitle, { color: colors.foreground }]}>{dimension.question}</Text>
            <Text style={[styles.questionDetail, { color: colors.mutedForeground }]}>{dimension.detail}</Text>
            <View style={styles.options}>
              {networkResponseOptions.map((option) => {
                const selected = value === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${dimension.title}: ${option.label}`}
                    testID={`button-network-${dimension.key}-${option.value}`}
                    onPress={() => updateResponse(dimension.key, option.value)}
                    style={[
                      styles.option,
                      {
                        backgroundColor: selected ? colors.primary : colors.secondary,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.optionLabel, { color: selected ? colors.primaryForeground : colors.foreground }]}>{option.label}</Text>
                    <Text style={[styles.optionDetail, { color: selected ? colors.primaryForeground : colors.mutedForeground }]}>{option.detail}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}

      <SectionHeader title="Here is what we know" action={analysis.label} />
      <View style={[styles.analysisCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.analysisHeader}>
          <Feather name="compass" size={18} color={analysis.tone === 'warning' ? colors.warning : colors.primary} />
          <Pill tone={analysis.tone}>{analysis.label}</Pill>
        </View>
        <Text style={[styles.analysisTitle, { color: colors.foreground }]}>{analysis.title}</Text>
        <Text style={[styles.analysisBody, { color: colors.mutedForeground }]}>{analysis.body}</Text>
        <View style={[styles.evidenceLine, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.evidenceLineText, { color: colors.mutedForeground }]}>
            {analysis.warmCount} warm signal{analysis.warmCount === 1 ? '' : 's'} · {analysis.unknownCount} unknown
          </Text>
        </View>
      </View>

      <SectionHeader title="Here is what it means for you" action="No private lookup" />
      <View style={[styles.meaningCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Text style={[styles.meaningText, { color: colors.foreground }]}>{analysis.known}</Text>
      </View>

      <SectionHeader title="Here is what we do not know" action={`${analysis.unknowns.length} gaps`} />
      <View style={[styles.unknownCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {analysis.unknowns.map((unknown) => (
          <View key={unknown} style={styles.bulletRow}>
            <View style={[styles.bullet, { backgroundColor: colors.warning }]} />
            <Text style={[styles.bulletText, { color: colors.mutedForeground }]}>{unknown}</Text>
          </View>
        ))}
      </View>

      <SectionHeader title="Here is what you should do next" action="Bounded ask" />
      <View style={[styles.nextCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Text style={[styles.nextTitle, { color: colors.foreground }]}>{analysis.nextMove.title}</Text>
        <Text style={[styles.nextBody, { color: colors.mutedForeground }]}>{analysis.nextMove.body}</Text>
        <Text style={[styles.sourceText, { color: colors.mutedForeground }]}>Source: Your observed signals · not a private network or recruiter database.</Text>
        <PrimaryButton onPress={saveNextMove} icon={savedAction ? 'arrow-up-right' : 'plus'} secondary>
          {savedAction ? 'In Plan' : isSignedIn ? 'Add next move to Plan' : 'Sign in to save this move'}
        </PrimaryButton>
        {saveMessage ? <Text style={[styles.successText, { color: colors.primary }]}>{saveMessage}</Text> : null}
        {saveError ? <Text style={[styles.errorText, { color: colors.warning }]}>{saveError}</Text> : null}
      </View>

      <View style={styles.disclaimer}>
        <Feather name="info" size={14} color={colors.mutedForeground} />
        <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
          This tool cannot see private messages, recruiter intent, or hiring decisions. It helps you choose what to verify next.
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
  questionCard: { borderWidth: 1, borderRadius: 17, padding: 15, gap: 9, marginBottom: 10 },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  questionLabel: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  questionGroup: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  questionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, lineHeight: 20 },
  questionDetail: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  options: { gap: 7, marginTop: 2 },
  option: { borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10, gap: 3 },
  optionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  optionDetail: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  analysisCard: { borderWidth: 1, borderRadius: 17, padding: 16, gap: 10 },
  analysisHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  analysisTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, lineHeight: 22 },
  analysisBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  evidenceLine: { borderRadius: 10, padding: 10 },
  evidenceLineText: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 16 },
  meaningCard: { borderWidth: 1, borderRadius: 17, padding: 16 },
  meaningText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, lineHeight: 20 },
  unknownCard: { borderWidth: 1, borderRadius: 17, padding: 16, gap: 12 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bullet: { width: 7, height: 7, borderRadius: 4, marginTop: 5 },
  bulletText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  nextCard: { borderWidth: 1, borderRadius: 17, padding: 16, gap: 11 },
  nextTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, lineHeight: 21 },
  nextBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  sourceText: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  successText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  errorText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 18 },
  disclaimer: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 22 },
  disclaimerText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17 },
});