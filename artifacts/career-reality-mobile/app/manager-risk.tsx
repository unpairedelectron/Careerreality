import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/expo';
import { useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  getListCareerActionsQueryKey,
  useCreateCareerAction,
  useListCareerActions,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { Header, Pill, PrimaryButton, Screen, SectionHeader } from '@/components/career-ui';
import { useAccountScopedStorageKey, useCareer } from '@/context/career-context';
import { formatPlanningDate, toLocalDateKey } from '@/lib/planning-date';
import {
  analyzeManagerRisk,
  getDefaultManagerRiskResponses,
  managerRiskDimensions,
  managerRiskResponseOptions,
  type ManagerRiskResponses,
  type RiskResponse,
} from '@/lib/manager-risk';

const STORAGE_KEY = '@careerreality/manager-team-risk';

function readStoredResponses(value: string | null): ManagerRiskResponses {
  if (!value) return getDefaultManagerRiskResponses();
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return managerRiskDimensions.reduce<ManagerRiskResponses>((responses, dimension) => {
      const response = parsed[dimension.key];
      responses[dimension.key] = managerRiskResponseOptions.some((option) => option.value === response)
        ? response as RiskResponse
        : 'unknown';
      return responses;
    }, getDefaultManagerRiskResponses());
  } catch {
    return getDefaultManagerRiskResponses();
  }
}

function RiskQuestion({
  dimension,
  value,
  onChange,
}: {
  dimension: (typeof managerRiskDimensions)[number];
  value: RiskResponse;
  onChange: (value: RiskResponse) => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.questionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.questionHeader}>
        <View style={styles.questionLabel}>
          <Feather name={dimension.group === 'manager' ? 'user' : 'users'} size={15} color={colors.primary} />
          <Text style={[styles.questionGroup, { color: colors.primary }]}>{dimension.group === 'manager' ? 'Manager' : 'Team'}</Text>
        </View>
        <Pill tone={value === 'concern' ? 'warning' : value === 'steady' ? 'positive' : 'accent'}>
          {managerRiskResponseOptions.find((option) => option.value === value)?.label ?? 'Not enough evidence'}
        </Pill>
      </View>
      <Text style={[styles.questionTitle, { color: colors.foreground }]}>{dimension.title}</Text>
      <Text style={[styles.questionText, { color: colors.foreground }]}>{dimension.question}</Text>
      <Text style={[styles.questionDetail, { color: colors.mutedForeground }]}>{dimension.detail}</Text>
      <View style={styles.options}>
        {managerRiskResponseOptions.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${dimension.title}: ${option.label}`}
              onPress={() => onChange(option.value)}
              testID={`button-manager-risk-${dimension.key}-${option.value}`}
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
}

export default function ManagerRiskScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { profile } = useCareer();
  const storageKey = useAccountScopedStorageKey(STORAGE_KEY);
  const queryClient = useQueryClient();
  const [responses, setResponses] = useState<ManagerRiskResponses>(getDefaultManagerRiskResponses);
  const [isHydrated, setIsHydrated] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const riskAnalysis = useMemo(() => analyzeManagerRisk(responses), [responses]);
  const actionsQuery = useListCareerActions({
    query: { queryKey: getListCareerActionsQueryKey(), enabled: Boolean(isSignedIn) },
  });
  const createAction = useCreateCareerAction();
  const savedAction = actionsQuery.data?.find(
    (action) => action.title === riskAnalysis.nextMove.title && action.source === 'Manager/team risk review',
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

  function updateResponse(key: string, value: RiskResponse) {
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
    setSaveError(null);
    try {
      await createAction.mutateAsync({
        data: {
          kind: 'decision',
          title: riskAnalysis.nextMove.title,
          body: riskAnalysis.nextMove.body,
          source: 'Manager/team risk review',
          dueDate: toLocalDateKey(),
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListCareerActionsQueryKey() });
      setSaveMessage('Added to your private Plan.');
    } catch {
      setSaveError('This next move could not be saved. Try again.');
    }
  }

  return (
    <Screen keyboardAware>
      <Header back eyebrow="MANAGER + TEAM" title="Read the environment, not just yourself." />

      <View style={[styles.introCard, { backgroundColor: colors.primary }]}>
        <Text style={[styles.introEyebrow, { color: colors.primaryForeground }]}>A PATTERN CHECK, NOT A VERDICT</Text>
        <Text style={[styles.introTitle, { color: colors.primaryForeground }]}>What is your working environment teaching you?</Text>
        <Text style={[styles.introBody, { color: colors.primaryForeground }]}>
          Rate what you can observe. Unknown is a valid answer. The useful output is the next fact or conversation that would change your read.
        </Text>
      </View>

      <SectionHeader title="Manager signals" action="Observable evidence" />
      {managerRiskDimensions.filter((dimension) => dimension.group === 'manager').map((dimension) => (
        <RiskQuestion
          key={dimension.key}
          dimension={dimension}
          value={responses[dimension.key] ?? 'unknown'}
          onChange={(value) => updateResponse(dimension.key, value)}
        />
      ))}

      <SectionHeader title="Team operating signals" action="System conditions" />
      {managerRiskDimensions.filter((dimension) => dimension.group === 'team').map((dimension) => (
        <RiskQuestion
          key={dimension.key}
          dimension={dimension}
          value={responses[dimension.key] ?? 'unknown'}
          onChange={(value) => updateResponse(dimension.key, value)}
        />
      ))}

      <SectionHeader title="Your current read" action={riskAnalysis.label} />
      <View style={[styles.analysisCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.analysisHeader}>
          <Feather name="shield" size={18} color={riskAnalysis.tone === 'warning' ? colors.warning : colors.primary} />
          <Pill tone={riskAnalysis.tone}>{riskAnalysis.label}</Pill>
        </View>
        <Text style={[styles.analysisTitle, { color: colors.foreground }]}>{riskAnalysis.title}</Text>
        <Text style={[styles.analysisBody, { color: colors.mutedForeground }]}>{riskAnalysis.body}</Text>
        <View style={[styles.evidenceLine, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.evidenceLineText, { color: colors.mutedForeground }]}>
            {riskAnalysis.unknownCount} unknown · {riskAnalysis.managerConcernCount} manager concern{riskAnalysis.managerConcernCount === 1 ? '' : 's'} · {riskAnalysis.teamConcernCount} team concern{riskAnalysis.teamConcernCount === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      <SectionHeader title="Next move" action="Reversible and testable" />
      <View style={[styles.nextMoveCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Text style={[styles.nextMoveTitle, { color: colors.foreground }]}>{riskAnalysis.nextMove.title}</Text>
        <Text style={[styles.nextMoveBody, { color: colors.mutedForeground }]}>{riskAnalysis.nextMove.body}</Text>
        <Text style={[styles.sourceText, { color: colors.mutedForeground }]}>
          Based on your private responses · not a prediction about your manager, team, or job security.
        </Text>
        <PrimaryButton onPress={saveNextMove} icon={savedAction ? 'arrow-up-right' : 'plus'} secondary>
          {savedAction ? `In Plan · ${savedAction.dueDate ? formatPlanningDate(savedAction.dueDate) : 'saved'}` : isSignedIn ? 'Add next move to Plan' : 'Sign in to save this move'}
        </PrimaryButton>
        {saveMessage ? <Text style={[styles.successText, { color: colors.primary }]}>{saveMessage}</Text> : null}
        {saveError ? <Text style={[styles.errorText, { color: colors.warning }]}>{saveError}</Text> : null}
      </View>

      <View style={styles.disclaimer}>
        <Feather name="info" size={14} color={colors.mutedForeground} />
        <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
          This tool helps you choose what to verify next. It cannot know private intent, guarantee safety, or predict employment outcomes.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  introCard: { borderRadius: 20, padding: 20, gap: 10 },
  introEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.2, opacity: 0.78 },
  introTitle: { fontFamily: 'Inter_700Bold', fontSize: 23, lineHeight: 28 },
  introBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, opacity: 0.84 },
  questionCard: { borderWidth: 1, borderRadius: 17, padding: 15, gap: 9, marginBottom: 10 },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  questionLabel: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  questionGroup: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  questionTitle: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  questionText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, lineHeight: 20 },
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
  nextMoveCard: { borderWidth: 1, borderRadius: 17, padding: 16, gap: 10 },
  nextMoveTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, lineHeight: 21 },
  nextMoveBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  sourceText: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  successText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  errorText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 18 },
  disclaimer: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 22 },
  disclaimerText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17 },
});