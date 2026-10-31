import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { router } from 'expo-router';
import {
  getListCareerActionsQueryKey,
  useCreateCareerAction,
  useListCareerActions,
  useUpdateCareerAction,
  type CareerAction,
  type CareerBrief,
} from '@workspace/api-client-react';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Header, Pill, PrimaryButton, ProfileSetupCard, Screen, SectionHeader } from '@/components/career-ui';
import { useCareer } from '@/context/career-context';
import { fetchCareerBrief, isCareerProfileNotConfiguredError } from '@/lib/career-api';
import { formatPlanningDate, parseDateOnly, toLocalDateKey } from '@/lib/planning-date';

function sortByDueDate(left: CareerAction, right: CareerAction): number {
  if (!left.dueDate && !right.dueDate) return left.createdAt.localeCompare(right.createdAt);
  if (!left.dueDate) return 1;
  if (!right.dueDate) return -1;
  return left.dueDate.localeCompare(right.dueDate);
}

type MarketMove = {
  id: string;
  label: string;
  value: string;
  source: string;
  freshness: string;
  confidence: CareerBrief['confidence'];
  title: string;
  body: string;
};

function makeMarketChangeId(label: string, source: string, value: string): string {
  return `${label}:${source}:${value}`.slice(0, 160);
}

function buildMarketMoves(brief: CareerBrief): MarketMove[] {
  return brief.evidence.slice(0, 4).map((evidence) => ({
    id: makeMarketChangeId(evidence.label, evidence.source, evidence.value),
    label: evidence.label,
    value: evidence.value,
    source: evidence.source,
    freshness: evidence.freshness,
    confidence: evidence.confidence,
    title: `Test ${evidence.label.toLowerCase()} against your next move`,
    body: `Use this signal to test one real opportunity for ${brief.nextMove.toLowerCase()}`,
  }));
}

function DecisionSignalFlow({ brief }: { brief: CareerBrief }) {
  const colors = useColors();
  const signalCount = Math.min(brief.evidence.length, 4);
  const points = Array.from({ length: Math.max(signalCount, 1) }, (_, index) => 26 + index * 42);
  const path = points.length === 1
    ? `M ${points[0]} 42`
    : `M ${points.map((point, index) => `${point} ${index % 2 === 0 ? 42 : 24}`).join(' C ')}`;
  return (
    <View
      testID="plan-decision-flow"
      accessible
      accessibilityLabel={`${signalCount} evidence signals flow into your ${brief.confidence.toLowerCase()} confidence next move`}
      style={[styles.flowCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.flowHeader}>
        <View style={styles.flowHeading}>
          <View style={[styles.flowIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="activity" size={16} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.flowEyebrow, { color: colors.primary }]}>DECISION ENGINE</Text>
            <Text style={[styles.flowTitle, { color: colors.foreground }]}>Signals → meaning → move</Text>
          </View>
        </View>
        <Pill tone={brief.confidence === 'High' ? 'positive' : 'accent'}>{brief.confidence}</Pill>
      </View>
      <Svg width="100%" height={68} viewBox="0 0 170 68" preserveAspectRatio="none" accessibilityElementsHidden>
        <Line x1="12" y1="53" x2="158" y2="53" stroke={colors.secondary} strokeWidth="2" />
        <Path d={path.replaceAll(/[0-9]+/g, (value, index) => index % 2 === 0 ? String(Number(value) * 0.5) : value)} fill="none" stroke={colors.primary} strokeWidth="2.5" strokeLinecap="round" />
        {points.map((point, index) => (
          <Circle key={point} cx={point * 0.5} cy={index % 2 === 0 ? 42 : 24} r="5" fill={index === points.length - 1 ? colors.accent : colors.primary} />
        ))}
        <Circle cx="158" cy="53" r="5" fill={colors.accent} />
      </Svg>
      <View style={styles.flowLabels}>
        <View><Text style={[styles.flowLabel, { color: colors.mutedForeground }]}>EVIDENCE</Text><Text style={[styles.flowValue, { color: colors.foreground }]}>{signalCount} sources</Text></View>
        <View><Text style={[styles.flowLabel, { color: colors.mutedForeground }]}>READ</Text><Text style={[styles.flowValue, { color: colors.foreground }]}>{brief.confidence} confidence</Text></View>
        <View style={styles.flowEnd}><Text style={[styles.flowLabel, { color: colors.mutedForeground }]}>NEXT</Text><Text style={[styles.flowValue, { color: colors.accent }]}>1 move</Text></View>
      </View>
    </View>
  );
}

function isE2ESignedIn(): boolean {
  return __DEV__
    && typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('e2e-auth') === 'signed-in';
}

function ActionCard({
  action,
  onToggle,
  onSkip,
  onBeginSnooze,
  onSnooze,
  snoozing,
  snoozeDate,
  snoozeError,
  onSnoozeDateChange,
  onCancelSnooze,
}: {
  action: CareerAction;
  onToggle: (action: CareerAction) => void;
  onSkip: (action: CareerAction) => void;
  onBeginSnooze: (action: CareerAction) => void;
  onSnooze: (action: CareerAction) => void;
  snoozing: boolean;
  snoozeDate: string;
  snoozeError: string | null;
  onSnoozeDateChange: (date: string) => void;
  onCancelSnooze: () => void;
}) {
  const colors = useColors();
  const completed = action.status === 'completed';
  const statusLabel = completed ? 'completed' : action.status === 'skipped' ? 'skipped' : 'open';
  return (
    <View testID={`plan-action-card-${action.id}`} style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${action.title}, ${statusLabel}${action.dueDate ? `, due ${formatPlanningDate(action.dueDate)}` : ''}`}
        onPress={() => onToggle(action)}
        testID={`button-plan-action-${action.id}`}
        style={({ pressed }) => [styles.actionMain, { opacity: pressed ? 0.82 : 1 }]}
      >
        <View style={[styles.check, { borderColor: completed ? colors.primary : colors.mutedForeground, backgroundColor: completed ? colors.primary : 'transparent' }]}>
          {completed ? <Feather name="check" size={13} color={colors.primaryForeground} /> : null}
        </View>
        <View style={styles.actionCopy}>
          <Text style={[styles.actionTitle, { color: colors.foreground, textDecorationLine: completed ? 'line-through' : 'none' }]}>
            {action.title}
          </Text>
          <Text style={[styles.actionBody, { color: colors.mutedForeground }]}>{action.body}</Text>
          <View style={styles.actionMeta}>
            <Pill tone={completed ? 'positive' : 'accent'}>{completed ? 'Completed' : action.status === 'skipped' ? 'Skipped' : action.dueDate ? formatPlanningDate(action.dueDate) : 'No date'}</Pill>
            <Text style={[styles.actionSource, { color: colors.mutedForeground }]}>
              {action.marketChangeId ? `Market change · ${action.source}` : action.source}
            </Text>
          </View>
        </View>
      </Pressable>
      {action.status === 'open' && action.marketChangeId ? (
        snoozing ? (
          <View style={styles.snoozeEditor}>
            <Text style={[styles.snoozeLabel, { color: colors.mutedForeground }]}>Snooze until</Text>
            <TextInput
              value={snoozeDate}
              onChangeText={onSnoozeDateChange}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              style={[styles.snoozeInput, { color: colors.foreground, borderColor: colors.border }]}
              accessibilityLabel={`Snooze ${action.title} until`}
              testID={`input-plan-snooze-date-${action.id}`}
            />
            {snoozeError ? <Text style={[styles.errorText, { color: colors.warning }]}>{snoozeError}</Text> : null}
            <View style={styles.snoozeActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Confirm snooze for ${action.title}`}
                onPress={() => onSnooze(action)}
                testID={`button-plan-snooze-confirm-${action.id}`}
                style={[styles.snoozeButton, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.snoozeButtonText, { color: colors.primaryForeground }]}>Snooze</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel snooze"
                onPress={onCancelSnooze}
                testID={`button-plan-snooze-cancel-${action.id}`}
                style={[styles.snoozeButton, { borderColor: colors.border, borderWidth: 1 }]}
              >
                <Text style={[styles.snoozeButtonText, { color: colors.foreground }]}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Snooze ${action.title}`}
            onPress={() => onBeginSnooze(action)}
            testID={`button-plan-snooze-${action.id}`}
            style={({ pressed }) => [styles.snoozeTrigger, { borderTopColor: colors.border, opacity: pressed ? 0.65 : 1 }]}
          >
            <Feather name="clock" size={14} color={colors.primary} />
            <Text style={[styles.snoozeTriggerText, { color: colors.primary }]}>Snooze</Text>
          </Pressable>
        )
      ) : null}
      {action.status === 'open' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Skip ${action.title}`}
          onPress={() => onSkip(action)}
          testID={`button-plan-skip-${action.id}`}
          style={({ pressed }) => [styles.skipTrigger, { borderTopColor: colors.border, opacity: pressed ? 0.65 : 1 }]}
        >
          <Feather name="slash" size={14} color={colors.mutedForeground} />
          <Text style={[styles.skipTriggerText, { color: colors.mutedForeground }]}>Skip for now</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function PlanScreen() {
  const colors = useColors();
  const { isSignedIn } = useAuth();
  const signedIn = Boolean(isSignedIn || isE2ESignedIn());
  const { profile } = useCareer();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [dueDate, setDueDate] = useState(toLocalDateKey());
  const [formError, setFormError] = useState<string | null>(null);
  const [snoozeError, setSnoozeError] = useState<string | null>(null);
  const [snoozingActionId, setSnoozingActionId] = useState<string | null>(null);
  const [snoozeDate, setSnoozeDate] = useState('');
  const actionsQuery = useListCareerActions({
    query: { queryKey: getListCareerActionsQueryKey(), enabled: signedIn },
  });
  const briefQuery = useQuery({
    queryKey: ['career-brief-plan', profile.role, profile.city, profile.target],
    queryFn: fetchCareerBrief,
    enabled: Boolean(signedIn && profile.role && profile.city && profile.target),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const createAction = useCreateCareerAction();
  const updateAction = useUpdateCareerAction();

  const actions = actionsQuery.data ?? [];
  const today = toLocalDateKey();
  const profileMissing = isCareerProfileNotConfiguredError(briefQuery.error);
  const hasFreshMarketEvidence = briefQuery.isSuccess && !briefQuery.isError && Boolean(briefQuery.data);
  const marketEvidence = briefQuery.data?.evidence.filter((evidence) =>
    evidence.label !== 'Profile baseline'
    && !(evidence.label === 'Live role demand' && evidence.freshness === 'Unavailable'),
  ) ?? [];
  const marketMoves = hasFreshMarketEvidence && marketEvidence.length > 0
    ? buildMarketMoves({ ...briefQuery.data, evidence: marketEvidence })
    : [];
  const liveMarketUnavailable = hasFreshMarketEvidence
    && briefQuery.data?.evidence.some((evidence) => evidence.label === 'Live role demand' && evidence.freshness === 'Unavailable');
  const briefChange = briefQuery.data?.whatChanged;
  const openActions = useMemo(
    () => actions.filter((action) => action.status === 'open').sort(sortByDueDate),
    [actions],
  );
  const completedActions = useMemo(
    () => actions.filter((action) => action.status !== 'open').sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [actions],
  );
  const attentionActions = openActions.filter((action) => action.dueDate && action.dueDate <= today);
  const upcomingActions = openActions.filter((action) => action.dueDate && action.dueDate > today);
  const unscheduledActions = openActions.filter((action) => !action.dueDate);
  const scheduledMarketMoveIds = useMemo(
    () => new Set(actions.flatMap((action) => action.marketChangeId ? [action.marketChangeId] : [])),
    [actions],
  );

  async function addAction() {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    const trimmedDate = dueDate.trim();
    if (!trimmedTitle || !trimmedBody) {
      setFormError('Add a title and a concrete next step.');
      return;
    }
    if (trimmedDate && !parseDateOnly(trimmedDate)) {
      setFormError('Use a real date in YYYY-MM-DD format.');
      return;
    }
    setFormError(null);
    try {
      await createAction.mutateAsync({
        data: {
          kind: 'decision',
          title: trimmedTitle,
          body: trimmedBody,
          source: 'Personal plan',
          dueDate: trimmedDate || null,
        },
      });
      setTitle('');
      setBody('');
      setDueDate(toLocalDateKey());
      await queryClient.invalidateQueries({ queryKey: getListCareerActionsQueryKey() });
    } catch {
      setFormError('This action could not be saved. Try again.');
    }
  }

  async function toggleAction(action: CareerAction) {
    try {
      await updateAction.mutateAsync({
        id: action.id,
        data: { status: action.status === 'open' ? 'completed' : 'open' },
      });
      await queryClient.invalidateQueries({ queryKey: getListCareerActionsQueryKey() });
    } catch {
      setFormError('This action could not be updated. Try again.');
    }
  }

  async function skipAction(action: CareerAction) {
    if (action.status !== 'open') return;
    try {
      await updateAction.mutateAsync({
        id: action.id,
        data: { status: 'skipped' },
      });
      await queryClient.invalidateQueries({ queryKey: getListCareerActionsQueryKey() });
    } catch {
      setFormError('This action could not be skipped. Try again.');
    }
  }

  function beginSnooze(action: CareerAction) {
    if (action.status !== 'open' || !action.marketChangeId) return;
    const currentDueDate = action.dueDate ? parseDateOnly(action.dueDate) : null;
    const defaultDate = currentDueDate ?? new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    setSnoozeDate(toLocalDateKey(defaultDate));
    setSnoozingActionId((current) => current === action.id ? null : action.id);
    setSnoozeError(null);
    setFormError(null);
  }

  function cancelSnooze() {
    setSnoozingActionId(null);
    setSnoozeDate('');
    setSnoozeError(null);
  }

  async function snoozeAction(action: CareerAction) {
    if (action.status !== 'open' || !action.marketChangeId) return;
    const trimmedDate = snoozeDate.trim();
    const date = parseDateOnly(trimmedDate);
    if (!date) {
      setSnoozeError('Use a real date in YYYY-MM-DD format.');
      return;
    }
    if (trimmedDate <= today) {
      setSnoozeError('Choose a future date to move this action out of attention.');
      return;
    }
    setSnoozeError(null);
    setFormError(null);
    try {
      await updateAction.mutateAsync({
        id: action.id,
        data: { dueDate: trimmedDate },
      });
      cancelSnooze();
      await queryClient.invalidateQueries({ queryKey: getListCareerActionsQueryKey() });
    } catch {
      setSnoozeError('This market action could not be snoozed. Try again.');
    }
  }

  async function scheduleMarketMove(move: MarketMove) {
    if (scheduledMarketMoveIds.has(move.id)) return;
    setFormError(null);
    try {
      await createAction.mutateAsync({
        data: {
          kind: 'brief',
          title: move.title,
          body: move.body,
          source: `Market change · ${move.source}`,
          dueDate: toLocalDateKey(),
          marketChangeId: move.id,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListCareerActionsQueryKey() });
    } catch {
      setFormError('This market move could not be scheduled. Try again.');
    }
  }

  return (
    <Screen keyboardAware>
      <Header eyebrow="CAREER PLAN" title={profileMissing ? 'Start with your reality.' : 'Turn signals into moves.'} />

      {!signedIn ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="lock" size={18} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sign in to save your plan</Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Your dates and completed actions stay private to your CareerReality account.</Text>
        </View>
      ) : (
          <>
            {profileMissing ? (
              <ProfileSetupCard
                testID="plan-profile-setup-needed"
                title="Build the brief before you plan the move"
                body="We need your role, city, experience, current CTC, and target before a market signal can become a useful action."
                buttonLabel="Build my brief"
                onPress={() => router.push('/onboarding')}
              />
            ) : (
              <View style={[styles.introCard, { backgroundColor: colors.primary }]}>
                <Text style={[styles.introEyebrow, { color: colors.primaryForeground }]}>WHAT SHOULD I DO NEXT?</Text>
                <Text style={[styles.introTitle, { color: colors.primaryForeground }]}>A plan that moves with your market.</Text>
                <Text style={[styles.introBody, { color: colors.primaryForeground }]}>Schedule one concrete next move, then close the loop when it is done.</Text>
              </View>
            )}

          {briefQuery.isPending ? (
            <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="activity" size={17} color={colors.primary} />
              <Text style={[styles.stateTitle, { color: colors.foreground }]}>Reading the latest market signals...</Text>
              <Text style={[styles.stateBody, { color: colors.mutedForeground }]}>Your plan will turn fresh evidence into concrete moves.</Text>
            </View>
          ) : null}

          {!profileMissing && briefQuery.isError ? (
            <View testID="plan-market-unavailable" style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="wifi-off" size={17} color={colors.warning} />
              <Text style={[styles.stateTitle, { color: colors.foreground }]}>The market read is unavailable.</Text>
              <Text style={[styles.stateBody, { color: colors.mutedForeground }]}>The last saved signal is not shown as current. Retry when you are ready.</Text>
              <PrimaryButton onPress={() => void briefQuery.refetch()} icon="refresh-cw" secondary>
                {briefQuery.isFetching ? 'Retrying market read...' : 'Retry market read'}
              </PrimaryButton>
            </View>
          ) : null}
          {briefChange && briefChange.status !== 'initial' ? (
            <View testID="plan-brief-change" style={[styles.changeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.changeHeader}>
                <Feather name={briefChange.status === 'insufficient' ? 'alert-circle' : 'refresh-cw'} size={15} color={briefChange.status === 'insufficient' ? colors.warning : colors.primary} />
                <Text style={[styles.changeEyebrow, { color: briefChange.status === 'insufficient' ? colors.warning : colors.primary }]}>BRIEF CHANGE</Text>
              </View>
              <Text style={[styles.changeSummary, { color: colors.foreground }]}>{briefChange.summary}</Text>
              {briefChange.details.slice(0, 3).map((detail, index) => (
                <View key={`${detail.category}-${detail.summary}-${index}`} style={[styles.changeDetail, { borderTopColor: colors.border }]}>
                  <Text style={[styles.changeDetailText, { color: colors.mutedForeground }]}>{detail.summary}</Text>
                  <Text style={[styles.changeSource, { color: colors.mutedForeground }]}>{detail.source} · {detail.freshness}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {signedIn && !profileMissing ? (
            <Pressable
              onPress={() => router.push('/brief-history')}
              accessibilityRole="button"
              accessibilityLabel="View brief history"
              testID="button-open-brief-history"
              style={({ pressed }) => [styles.historyLink, { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.72 : 1 }]}
            >
              <Feather name="clock" size={15} color={colors.primary} />
              <Text style={[styles.historyLinkText, { color: colors.primary }]}>Review your read history</Text>
              <Feather name="arrow-up-right" size={14} color={colors.primary} />
            </Pressable>
          ) : null}

          {hasFreshMarketEvidence && briefQuery.data ? <DecisionSignalFlow brief={briefQuery.data} /> : null}

          {marketMoves.length > 0 ? (
            <View testID="plan-market-change-section">
              <SectionHeader title="Market read → next moves" action={`${marketMoves.length} signals`} />
              <View style={[styles.changeIntro, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <View style={styles.suggestionHeader}>
                  <Feather name="trending-up" size={17} color={colors.primary} />
                  <Text style={[styles.suggestionLabel, { color: colors.primary }]}>Server-researched market context</Text>
                </View>
                <Text style={[styles.suggestionBody, { color: colors.foreground }]}>These moves come from the same personalized decision engine as Home, using the latest available salary, company, watch, and live role-demand evidence.</Text>
                <Text style={[styles.suggestionSource, { color: colors.mutedForeground }]}>
                  {briefQuery.data?.freshness} · choose the response you can test, not the story you can only worry about.
                </Text>
              </View>
              {marketMoves.map((move) => {
                const linkedAction = actions.find((action) =>
                  action.marketChangeId === move.id,
                );
                return (
                  <View testID={`market-move-${move.label.toLowerCase().replaceAll(' ', '-')}`} key={move.id} style={[styles.marketMoveCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.moveHeader}>
                      <View style={styles.moveLabel}>
                        <Feather name="compass" size={15} color={colors.primary} />
                        <Text style={[styles.moveCategory, { color: colors.primary }]}>{move.label}</Text>
                      </View>
                      <Pill tone={move.confidence === 'High' ? 'positive' : 'accent'}>{move.confidence} confidence</Pill>
                    </View>
                    <Text style={[styles.moveValue, { color: colors.foreground }]}>{move.value}</Text>
                    <Text style={[styles.moveBody, { color: colors.mutedForeground }]}>{move.title}</Text>
                    <Text style={[styles.suggestionSource, { color: colors.mutedForeground }]}>
                      {move.source} · {move.freshness}
                    </Text>
                    {linkedAction ? (
                      <View style={styles.scheduledState}>
                        <Pill tone={linkedAction.status === 'completed' ? 'positive' : 'accent'}>
                          {linkedAction.status === 'completed' ? 'Completed' : linkedAction.status === 'skipped' ? 'Skipped' : 'In your plan'}
                        </Pill>
                        <Text style={[styles.scheduledText, { color: colors.mutedForeground }]}>
                          {linkedAction.dueDate ? `Scheduled for ${formatPlanningDate(linkedAction.dueDate)}` : 'This signal is already tracked.'}
                        </Text>
                      </View>
                    ) : (
                      <PrimaryButton onPress={() => void scheduleMarketMove(move)} icon="calendar" secondary>
                        Add this move to Plan
                      </PrimaryButton>
                    )}
                  </View>
                );
              })}
            </View>
          ) : null}
          {liveMarketUnavailable ? (
            <View testID="plan-live-demand-unavailable" style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="wifi-off" size={17} color={colors.warning} />
              <Text style={[styles.stateTitle, { color: colors.foreground }]}>Live role demand could not be verified.</Text>
              <Text style={[styles.stateBody, { color: colors.mutedForeground }]}>The connected job source did not return a current result, so the plan is not using an older demand signal as if it were current.</Text>
            </View>
          ) : null}

          <SectionHeader title="Add a move" action="Private" />
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="What will you do?"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              accessibilityLabel="Career action title"
              testID="input-plan-title"
            />
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Make it concrete: interview a manager, compare two offers..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={[styles.input, styles.multilineInput, { color: colors.foreground, borderColor: colors.border }]}
              accessibilityLabel="Career action details"
              testID="input-plan-body"
            />
            <TextInput
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              accessibilityLabel="Career action due date"
              testID="input-plan-due-date"
            />
            {formError ? <Text style={[styles.errorText, { color: colors.warning }]}>{formError}</Text> : null}
            <PrimaryButton onPress={addAction} icon="plus">
              {createAction.isPending ? 'Saving...' : 'Add to plan'}
            </PrimaryButton>
          </View>

          {actionsQuery.isPending ? <Text style={[styles.stateText, { color: colors.mutedForeground }]}>Loading your plan...</Text> : null}
          {actionsQuery.isError ? <Text style={[styles.errorText, { color: colors.warning }]}>Your plan is unavailable right now. Try again shortly.</Text> : null}

          {attentionActions.length > 0 ? (
            <>
              <SectionHeader title="Needs attention" action={`${attentionActions.length} open`} />
              {attentionActions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  onToggle={toggleAction}
                   onSkip={skipAction}
                  onBeginSnooze={beginSnooze}
                  onSnooze={snoozeAction}
                  snoozing={snoozingActionId === action.id}
                  snoozeDate={snoozeDate}
                  snoozeError={snoozeError}
                  onSnoozeDateChange={setSnoozeDate}
                  onCancelSnooze={cancelSnooze}
                />
              ))}
            </>
          ) : null}
          {upcomingActions.length > 0 ? (
            <>
              <SectionHeader title="Upcoming" action={`${upcomingActions.length} scheduled`} />
              {upcomingActions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  onToggle={toggleAction}
                   onSkip={skipAction}
                  onBeginSnooze={beginSnooze}
                  onSnooze={snoozeAction}
                  snoozing={snoozingActionId === action.id}
                  snoozeDate={snoozeDate}
                  snoozeError={snoozeError}
                  onSnoozeDateChange={setSnoozeDate}
                  onCancelSnooze={cancelSnooze}
                />
              ))}
            </>
          ) : null}
          {unscheduledActions.length > 0 ? (
            <>
              <SectionHeader title="No date yet" />
              {unscheduledActions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  onToggle={toggleAction}
                   onSkip={skipAction}
                  onBeginSnooze={beginSnooze}
                  onSnooze={snoozeAction}
                  snoozing={snoozingActionId === action.id}
                  snoozeDate={snoozeDate}
                  snoozeError={snoozeError}
                  onSnoozeDateChange={setSnoozeDate}
                  onCancelSnooze={cancelSnooze}
                />
              ))}
            </>
          ) : null}
          {completedActions.length > 0 ? (
            <>
               <SectionHeader title="Closed loop" action={`${completedActions.length} closed`} />
              {completedActions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  onToggle={toggleAction}
                   onSkip={skipAction}
                  onBeginSnooze={beginSnooze}
                  onSnooze={snoozeAction}
                  snoozing={false}
                  snoozeDate=""
                  snoozeError={null}
                  onSnoozeDateChange={setSnoozeDate}
                  onCancelSnooze={cancelSnooze}
                />
              ))}
            </>
          ) : null}
          {!actionsQuery.isPending && actions.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="calendar" size={18} color={colors.primary} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your plan is clear.</Text>
              <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Add the next move you can actually finish this week.</Text>
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  introCard: { borderRadius: 20, padding: 20, gap: 10 },
  introEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.2, opacity: 0.78 },
  introTitle: { fontFamily: 'Inter_700Bold', fontSize: 23, lineHeight: 28 },
  introBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, opacity: 0.84 },
  formCard: { borderWidth: 1, borderRadius: 17, padding: 14, gap: 10 },
  suggestionCard: { borderWidth: 1, borderRadius: 17, padding: 15, gap: 10 },
  changeIntro: { borderWidth: 1, borderRadius: 17, padding: 15, gap: 10, marginBottom: 10 },
  changeCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 10, marginBottom: 18 },
  changeHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  changeEyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.7 },
  changeSummary: { fontFamily: 'Inter_600SemiBold', fontSize: 16, lineHeight: 22 },
  changeDetail: { borderTopWidth: 1, paddingTop: 10, gap: 3 },
  changeDetailText: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 19 },
  changeSource: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 16 },
  flowCard: { borderWidth: 1, borderRadius: 19, padding: 15, gap: 8, marginBottom: 16 },
  flowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  flowHeading: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1 },
  flowIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  flowEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.1 },
  flowTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, marginTop: 3 },
  flowLabels: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  flowLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.8 },
  flowValue: { fontFamily: 'Inter_600SemiBold', fontSize: 11, marginTop: 3 },
  flowEnd: { alignItems: 'flex-end' },
  historyLink: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  historyLinkText: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 12 },
  suggestionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  suggestionLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' },
  suggestionBody: { fontFamily: 'Inter_700Bold', fontSize: 16, lineHeight: 22 },
  suggestionSource: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  marketMoveCard: { borderWidth: 1, borderRadius: 17, padding: 15, gap: 9, marginBottom: 10 },
  moveHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  moveLabel: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
  moveCategory: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' },
  moveValue: { fontFamily: 'Inter_700Bold', fontSize: 16, lineHeight: 22 },
  moveBody: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 19 },
  scheduledState: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  scheduledText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  input: { borderWidth: 1, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 11, fontFamily: 'Inter_500Medium', fontSize: 13 },
  multilineInput: { minHeight: 72, textAlignVertical: 'top' },
  errorText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 18 },
  stateText: { fontFamily: 'Inter_500Medium', fontSize: 13, marginTop: 6 },
  actionCard: { borderWidth: 1, borderRadius: 17, marginBottom: 10, overflow: 'hidden' },
  actionMain: { padding: 15, flexDirection: 'row', gap: 12 },
  check: { width: 24, height: 24, borderWidth: 1.5, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  actionCopy: { flex: 1, gap: 6 },
  actionTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, lineHeight: 20 },
  actionBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
  actionMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  actionSource: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  stateCard: { borderWidth: 1, borderRadius: 17, padding: 16, gap: 8 },
  stateTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, lineHeight: 20 },
  stateBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  snoozeTrigger: { borderTopWidth: 1, paddingHorizontal: 15, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 6 },
  snoozeTriggerText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  skipTrigger: { borderTopWidth: 1, paddingHorizontal: 15, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  skipTriggerText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  snoozeEditor: { borderTopWidth: 1, padding: 12, gap: 8 },
  snoozeLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 },
  snoozeInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9, fontFamily: 'Inter_500Medium', fontSize: 13 },
  snoozeActions: { flexDirection: 'row', gap: 8 },
  snoozeButton: { borderRadius: 9, paddingHorizontal: 13, paddingVertical: 9 },
  snoozeButtonText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  emptyCard: { borderWidth: 1, borderRadius: 17, padding: 18, gap: 8 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  emptyBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
});