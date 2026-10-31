import { useAuth } from '@clerk/expo';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  getGetPromotionReadinessQueryKey,
  getListCareerActionsQueryKey,
  getListPromotionEvidenceQueryKey,
  getListPromotionReadinessHistoryQueryKey,
  useCreateCareerAction,
  useCreatePromotionEvidence,
  useDeletePromotionEvidence,
  useGetPromotionReadiness,
  useListCareerActions,
  useListPromotionEvidence,
  useListPromotionReadinessHistory,
  useUpdatePromotionReadiness,
  type PromotionReadinessInputPathStatus,
} from '@workspace/api-client-react';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Header, Pill, PrimaryButton, ProgressBar, Screen, SectionHeader } from '@/components/career-ui';
import { useCareer } from '@/context/career-context';
import { formatPlanningDate, parseDateOnly } from '@/lib/planning-date';

type ScoreKey = 'scopeScore' | 'impactScore' | 'skillsScore' | 'sponsorshipScore';

const criteria: Array<{
  key: ScoreKey;
  title: string;
  question: string;
  detail: string;
}> = [
  {
    key: 'scopeScore',
    title: 'Scope',
    question: 'Are you already operating beyond your current role?',
    detail: 'Ownership, ambiguity, cross-team reach, or decisions that match the next level.',
  },
  {
    key: 'impactScore',
    title: 'Measurable impact',
    question: 'Can you show what changed because of your work?',
    detail: 'Use outcomes: revenue, reliability, speed, quality, adoption, or risk reduced.',
  },
  {
    key: 'skillsScore',
    title: 'Target-role skills',
    question: 'Do you have evidence for the skills your target role requires?',
    detail: 'Rate demonstrated capability, not courses completed or skills listed on a resume.',
  },
  {
    key: 'sponsorshipScore',
    title: 'Manager sponsorship',
    question: 'Would your manager advocate for the promotion today?',
    detail: 'A clear standard, direct feedback, and a path to the next review matter more than hope.',
  },
];

const pathOptions: Array<{
  value: PromotionReadinessInputPathStatus;
  label: string;
  detail: string;
}> = [
  { value: 'clear', label: 'Clear', detail: 'A level, standard, and review path are visible.' },
  { value: 'unclear', label: 'Unclear', detail: 'The opportunity may exist, but the path is not explicit.' },
  { value: 'blocked', label: 'Blocked', detail: 'Timing, budget, structure, or sponsorship is blocking it.' },
];

const actionTemplates: Record<ScoreKey, { title: string; body: string }> = {
  scopeScore: {
    title: 'Take ownership of a next-level scope',
    body: 'Ask for one ambiguous, cross-team problem that lets you demonstrate ownership beyond your current role. Define the decision rights and success measure before starting.',
  },
  impactScore: {
    title: 'Document one measurable promotion outcome',
    body: 'Turn a recent project into an outcome story: baseline, your ownership, what changed, and the evidence a manager can verify.',
  },
  skillsScore: {
    title: 'Close one target-role evidence gap',
    body: 'Choose the weakest target-role capability and create a small deliverable that proves it in your current work, rather than only studying it.',
  },
  sponsorshipScore: {
    title: 'Ask for a promotion standard check-in',
    body: 'Schedule a direct conversation with your manager: ask what evidence would make them advocate for the next level and when you will review progress.',
  },
};

function ScoreField({
  title,
  question,
  detail,
  value,
  onChange,
}: {
  title: string;
  question: string;
  detail: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const colors = useColors();
  const scaleLabel = value === 1
    ? 'No evidence yet'
    : value === 2
      ? 'Some early evidence'
      : value === 3
        ? 'Partially demonstrated'
        : value === 4
          ? 'Consistently demonstrated'
          : 'Strong next-level evidence';
  return (
    <View style={[styles.criteriaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.criteriaHeader}>
        <Text style={[styles.criteriaTitle, { color: colors.foreground }]}>{title}</Text>
        <Pill tone={value >= 4 ? 'positive' : value >= 3 ? 'accent' : 'warning'}>{value}/5</Pill>
      </View>
      <Text style={[styles.criteriaQuestion, { color: colors.foreground }]}>{question}</Text>
      <Text style={[styles.criteriaDetail, { color: colors.mutedForeground }]}>{detail}</Text>
      <Text style={[styles.scaleLabel, { color: colors.primary }]}>{scaleLabel}</Text>
      <View style={styles.scoreRow}>
        {[1, 2, 3, 4, 5].map((score) => (
          <Pressable
            key={score}
            accessibilityRole="button"
            accessibilityLabel={`${title}: ${score} out of 5`}
            accessibilityState={{ selected: value === score }}
            onPress={() => onChange(score)}
            testID={`button-promotion-${title.toLowerCase().replaceAll(' ', '-')}-${score}`}
            style={[
              styles.scoreButton,
              {
                backgroundColor: value === score ? colors.primary : colors.secondary,
                borderColor: value === score ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.scoreButtonText, { color: value === score ? colors.primaryForeground : colors.foreground }]}>{score}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.scaleLegend}>
        <Text style={[styles.scaleLegendText, { color: colors.mutedForeground }]}>No evidence</Text>
        <Text style={[styles.scaleLegendText, { color: colors.mutedForeground }]}>Consistently demonstrated</Text>
      </View>
    </View>
  );
}

function PathStatusPicker({
  value,
  onChange,
}: {
  value: PromotionReadinessInputPathStatus;
  onChange: (value: PromotionReadinessInputPathStatus) => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.pathPicker}>
      {pathOptions.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="button"
          accessibilityState={{ selected: value === option.value }}
          onPress={() => onChange(option.value)}
          style={[
            styles.pathOption,
            {
              backgroundColor: value === option.value ? colors.primary : colors.secondary,
              borderColor: value === option.value ? colors.primary : colors.border,
            },
          ]}
        >
          <Text style={[styles.pathOptionLabel, { color: value === option.value ? colors.primaryForeground : colors.foreground }]}>{option.label}</Text>
          <Text style={[styles.pathOptionDetail, { color: value === option.value ? colors.primaryForeground : colors.mutedForeground }]}>{option.detail}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function PromotionScreen() {
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isSignedIn } = useAuth();
  const { profile } = useCareer();
  const [scores, setScores] = useState<Record<ScoreKey, number>>({
    scopeScore: 1,
    impactScore: 1,
    skillsScore: 1,
    sponsorshipScore: 1,
  });
  const [pathStatus, setPathStatus] = useState<PromotionReadinessInputPathStatus>('unclear');
  const [pathNotes, setPathNotes] = useState('');
  const [proofPoint, setProofPoint] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [managerCheckInDate, setManagerCheckInDate] = useState('');
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceDetail, setEvidenceDetail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [packetVisible, setPacketVisible] = useState(false);

  const enabledQuery = Boolean(isSignedIn);
  const readinessQuery = useGetPromotionReadiness({
    query: { queryKey: getGetPromotionReadinessQueryKey(), enabled: enabledQuery },
  });
  const historyQuery = useListPromotionReadinessHistory({
    query: { queryKey: getListPromotionReadinessHistoryQueryKey(), enabled: enabledQuery },
  });
  const evidenceQuery = useListPromotionEvidence({
    query: { queryKey: getListPromotionEvidenceQueryKey(), enabled: enabledQuery },
  });
  const actionsQuery = useListCareerActions({
    query: { queryKey: getListCareerActionsQueryKey(), enabled: enabledQuery },
  });
  const updateReadiness = useUpdatePromotionReadiness();
  const createCareerAction = useCreateCareerAction();
  const createEvidence = useCreatePromotionEvidence();
  const deleteEvidence = useDeletePromotionEvidence();

  useEffect(() => {
    if (!readinessQuery.data) return;
    setScores({
      scopeScore: readinessQuery.data.scopeScore,
      impactScore: readinessQuery.data.impactScore,
      skillsScore: readinessQuery.data.skillsScore,
      sponsorshipScore: readinessQuery.data.sponsorshipScore,
    });
    setPathStatus(readinessQuery.data.pathStatus);
    setPathNotes(readinessQuery.data.pathNotes);
    setProofPoint(readinessQuery.data.proofPoint);
    setTargetDate(readinessQuery.data.targetDate ?? '');
    setManagerCheckInDate(readinessQuery.data.managerCheckInDate ?? '');
  }, [readinessQuery.data]);

  const readinessPercent = useMemo(() => {
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    return Math.round((total / 20) * 100);
  }, [scores]);
  const readinessBand = readinessPercent >= 80
    ? 'Strong evidence'
    : readinessPercent >= 60
      ? 'Building toward it'
      : 'Early evidence';
  const weakestCriterion = useMemo(
    () => criteria.reduce((weakest, criterion) => scores[criterion.key] < scores[weakest.key] ? criterion : weakest, criteria[0]),
    [scores],
  );
  const weakestTemplate = actionTemplates[weakestCriterion.key];
  const promotionActionSource = `Promotion readiness · ${weakestCriterion.key}`;
  const weakActionExists = actionsQuery.data?.some((action) => action.source === promotionActionSource) ?? false;
  const history = historyQuery.data ?? [];
  const evidence = evidenceQuery.data ?? [];
  const actions = actionsQuery.data ?? [];
  const baseline = history.length > 1 ? history[history.length - 1] : null;
  const hasSavedReview = Boolean(readinessQuery.data);
  const pathLabel = pathOptions.find((option) => option.value === pathStatus)?.label ?? 'Unclear';
  const prompts = [
    `What specific evidence would make you comfortable advocating for my promotion to ${profile.target}?`,
    `Which scope or outcome should I own before our next review to demonstrate the next level?`,
    `What is the review date and decision process for this promotion path?`,
  ];

  const packetText = [
    `PROMOTION CASE · ${profile.name}`,
    `${profile.role} → ${profile.target}`,
    '',
    `Readiness: ${readinessBand} (${readinessPercent}/100)`,
    `Promotion path: ${pathOptions.find((option) => option.value === pathStatus)?.label ?? 'Unclear'}`,
    pathNotes ? `Path context: ${pathNotes}` : '',
    '',
    'EVIDENCE DIMENSIONS',
    ...criteria.map((criterion) => {
      const delta = baseline ? scores[criterion.key] - baseline[criterion.key] : 0;
      return `• ${criterion.title}: ${scores[criterion.key]}/5${delta ? ` (${delta > 0 ? '+' : ''}${delta} since first review)` : ''}`;
    }),
    '',
    `PROOF POINT\n${proofPoint || 'Add the outcome you will take into the promotion conversation.'}`,
    '',
    evidence.length ? `LINKED EVIDENCE\n${evidence.map((item) => `• ${item.title}: ${item.detail}`).join('\n')}` : 'LINKED EVIDENCE\nAdd career actions or proof points before the conversation.',
    '',
    `MANAGER CHECK-IN\n${managerCheckInDate ? `Target date: ${managerCheckInDate}\n` : ''}${prompts.map((prompt) => `• ${prompt}`).join('\n')}`,
  ].filter(Boolean).join('\n');

  async function refreshPromotionQueries() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetPromotionReadinessQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getListPromotionReadinessHistoryQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getListPromotionEvidenceQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getListCareerActionsQueryKey() }),
    ]);
  }

  async function saveReadiness() {
    const trimmedProofPoint = proofPoint.trim();
    const trimmedPathNotes = pathNotes.trim();
    const trimmedTargetDate = targetDate.trim();
    const trimmedCheckInDate = managerCheckInDate.trim();
    if (!trimmedProofPoint) {
      setFormError('Add one proof point you could take into a promotion conversation.');
      return;
    }
    if (!trimmedPathNotes) {
      setFormError('Add what you know about the promotion path, even if the answer is unclear.');
      return;
    }
    if (trimmedTargetDate && !parseDateOnly(trimmedTargetDate)) {
      setFormError('Use a real target date in YYYY-MM-DD format.');
      return;
    }
    if (trimmedCheckInDate && !parseDateOnly(trimmedCheckInDate)) {
      setFormError('Use a real manager check-in date in YYYY-MM-DD format.');
      return;
    }
    setFormError(null);
    setSavedMessage(null);
    try {
      await updateReadiness.mutateAsync({
        data: {
          ...scores,
          pathStatus,
          pathNotes: trimmedPathNotes,
          proofPoint: trimmedProofPoint,
          targetDate: trimmedTargetDate || null,
          managerCheckInDate: trimmedCheckInDate || null,
        },
      });
      await refreshPromotionQueries();
      setSavedMessage('Readiness saved. A new review snapshot was recorded.');
    } catch {
      setFormError('Your readiness readout could not be saved. Try again.');
    }
  }

  async function addEvidence(action?: { id: string; title: string; body: string }) {
    const title = action?.title ?? evidenceTitle.trim();
    const detail = action?.body ?? evidenceDetail.trim();
    if (!title || !detail) {
      setFormError('Add an evidence title and detail before saving it.');
      return;
    }
    setFormError(null);
    try {
      await createEvidence.mutateAsync({ data: { title, detail, actionId: action?.id ?? null } });
      setEvidenceTitle('');
      setEvidenceDetail('');
      await queryClient.invalidateQueries({ queryKey: getListPromotionEvidenceQueryKey() });
    } catch {
      setFormError('That evidence could not be linked. Try again.');
    }
  }

  async function removeEvidence(id: string) {
    try {
      await deleteEvidence.mutateAsync({ id });
      await queryClient.invalidateQueries({ queryKey: getListPromotionEvidenceQueryKey() });
    } catch {
      setFormError('That evidence could not be removed.');
    }
  }

  async function addWeakDimensionToPlan() {
    if (weakActionExists) {
      router.push('/(tabs)/plan');
      return;
    }
    setActionMessage(null);
    try {
      await createCareerAction.mutateAsync({
        data: {
          kind: weakestCriterion.key === 'sponsorshipScore' ? 'profile' : 'skill',
          title: weakestTemplate.title,
          body: weakestTemplate.body,
          source: promotionActionSource,
          dueDate: parseDateOnly(targetDate) ? targetDate : null,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListCareerActionsQueryKey() });
      setActionMessage(`${weakestCriterion.title} is now on your Plan.`);
    } catch {
      setActionMessage('The Plan action could not be created. Try again.');
    }
  }

  if (!isSignedIn) {
    return (
      <Screen>
        <Header back eyebrow="PROMOTION READINESS" title="Make the next level legible." />
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="lock" size={18} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sign in to build your readout</Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Your promotion evidence is private and stays connected to your career profile.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen keyboardAware>
      <Header
        back
        eyebrow="PROMOTION READINESS"
        title="Make the next level legible."
        action={
          <View style={styles.headerActions}>
            <Pressable
              onPress={saveReadiness}
              accessibilityRole="button"
              accessibilityLabel="Save promotion review"
              testID="button-save-promotion-review-top"
              style={({ pressed }) => [styles.saveLink, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={[styles.saveLinkText, { color: colors.primary }]}>Save</Text>
            </Pressable>
          </View>
        }
      />
      <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
        <View style={styles.heroHeader}>
          <View style={styles.heroCopy}>
            <Text style={[styles.heroEyebrow, { color: colors.primaryForeground }]}>DIRECTIONAL EVIDENCE READOUT</Text>
            <Text style={[styles.heroTitle, { color: colors.primaryForeground }]}>{readinessBand}</Text>
          </View>
          <Text style={[styles.heroScore, { color: colors.primaryForeground }]}>{readinessPercent}</Text>
        </View>
        <Text style={[styles.heroBody, { color: colors.primaryForeground }]}>
          {profile.role} → {profile.target}. This is evidence strength, not a promise of a title change.
        </Text>
        <View style={styles.heroMetaRow}>
          <Pill tone={pathStatus === 'clear' ? 'positive' : pathStatus === 'blocked' ? 'warning' : 'accent'}>{pathLabel} path</Pill>
          <Text style={[styles.heroMeta, { color: colors.primaryForeground }]}>
            {hasSavedReview ? `${history.length || 1} review${(history.length || 1) === 1 ? '' : 's'} saved` : 'First review · not saved'}
          </Text>
        </View>
      </View>

      <SectionHeader title="Is the path actually available?" action="Context" />
      <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.formHint, { color: colors.mutedForeground }]}>Separate your readiness from the team or company’s ability to make the promotion real.</Text>
        <PathStatusPicker value={pathStatus} onChange={setPathStatus} />
        <TextInput
          value={pathNotes}
          onChangeText={setPathNotes}
          placeholder="What do you know about level criteria, headcount, timing, or budget?"
          placeholderTextColor={colors.mutedForeground}
          multiline
          style={[styles.input, styles.shortMultilineInput, { color: colors.foreground, borderColor: colors.border }]}
          accessibilityLabel="Promotion path context"
          testID="input-promotion-path-notes"
        />
      </View>

      <View style={[styles.noteCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Feather name="info" size={16} color={colors.primary} />
        <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
          Score what you can demonstrate today. The weakest dimension is usually the most useful next conversation.
        </Text>
      </View>

      <SectionHeader title="The four promotion signals" action="1–5 each" />
      {criteria.map((criterion) => (
        <ScoreField
          key={criterion.key}
          title={criterion.title}
          question={criterion.question}
          detail={criterion.detail}
          value={scores[criterion.key]}
          onChange={(value) => setScores((previous) => ({ ...previous, [criterion.key]: value }))}
        />
      ))}

      <SectionHeader title="Turn the weakest signal into a move" action={weakestCriterion.title} />
      <View style={[styles.actionCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Feather name="zap" size={18} color={colors.primary} />
        <View style={styles.actionCopy}>
          <Text style={[styles.actionTitle, { color: colors.foreground }]}>{weakestTemplate.title}</Text>
          <Text style={[styles.actionBody, { color: colors.mutedForeground }]}>{weakestTemplate.body}</Text>
        </View>
        <Pressable onPress={addWeakDimensionToPlan} accessibilityRole="button" testID="button-add-weak-promotion-dimension">
          <Text style={[styles.linkText, { color: colors.primary }]}>{weakActionExists ? 'Open Plan' : 'Add to Plan'}</Text>
        </Pressable>
      </View>
      {actionMessage ? <Text style={[styles.savedText, { color: colors.success }]}>{actionMessage}</Text> : null}

      <SectionHeader title="Manager check-in prompts" action={managerCheckInDate ? formatPlanningDate(managerCheckInDate) : 'Set a date below'} />
      <View style={[styles.promptCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.formHint, { color: colors.mutedForeground }]}>Use these questions to turn an ambiguous promotion path into an explicit agreement.</Text>
        {prompts.map((prompt) => (
          <View key={prompt} style={styles.promptRow}>
            <Text style={[styles.promptNumber, { color: colors.primary }]}>•</Text>
            <Text style={[styles.promptText, { color: colors.foreground }]}>{prompt}</Text>
          </View>
        ))}
      </View>

      <SectionHeader title="Linked evidence" action={`${evidence.length} items`} />
      <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.formHint, { color: colors.mutedForeground }]}>Link completed or open career actions to the proof you will bring into the conversation.</Text>
        {actions.filter((action) => !evidence.some((item) => item.actionId === action.id)).slice(0, 4).map((action) => (
          <View key={action.id} style={[styles.linkedActionRow, { borderBottomColor: colors.border }]}>
            <View style={styles.actionCopy}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>{action.title}</Text>
              <Text numberOfLines={2} style={[styles.formHint, { color: colors.mutedForeground }]}>{action.body}</Text>
            </View>
            <Pressable onPress={() => addEvidence({ id: action.id, title: action.title, body: action.body })} accessibilityRole="button" testID={`button-link-evidence-${action.id}`}>
              <Text style={[styles.linkText, { color: colors.primary }]}>Link</Text>
            </Pressable>
          </View>
        ))}
        <TextInput
          value={evidenceTitle}
          onChangeText={setEvidenceTitle}
          placeholder="Evidence title"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
          accessibilityLabel="Evidence title"
          testID="input-promotion-evidence-title"
        />
        <TextInput
          value={evidenceDetail}
          onChangeText={setEvidenceDetail}
          placeholder="What happened, what did you own, and what proves it?"
          placeholderTextColor={colors.mutedForeground}
          multiline
          style={[styles.input, styles.shortMultilineInput, { color: colors.foreground, borderColor: colors.border }]}
          accessibilityLabel="Evidence detail"
          testID="input-promotion-evidence-detail"
        />
        <PrimaryButton onPress={() => addEvidence()} icon="plus" secondary>Add evidence</PrimaryButton>
        {evidence.map((item) => (
          <View key={item.id} style={[styles.evidenceRow, { borderTopColor: colors.border }]}>
            <View style={styles.actionCopy}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[styles.formHint, { color: colors.mutedForeground }]}>{item.detail}</Text>
            </View>
            <Pressable onPress={() => removeEvidence(item.id)} accessibilityRole="button" accessibilityLabel={`Remove ${item.title}`} testID={`button-remove-evidence-${item.id}`}>
              <Feather name="x" size={17} color={colors.mutedForeground} />
            </Pressable>
          </View>
        ))}
      </View>

      <SectionHeader title="Progress by dimension" action={history.length ? `${history.length} reviews` : 'First review'} />
      <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {criteria.map((criterion) => {
          const delta = baseline ? scores[criterion.key] - baseline[criterion.key] : 0;
          return (
            <View key={criterion.key} style={styles.progressRow}>
              <View style={styles.progressLabelRow}>
                <Text style={[styles.formLabel, { color: colors.foreground }]}>{criterion.title}</Text>
                <Text style={[styles.progressValue, { color: delta > 0 ? colors.success : colors.mutedForeground }]}>{scores[criterion.key]}/5{delta ? ` · ${delta > 0 ? '+' : ''}${delta}` : ''}</Text>
              </View>
              <ProgressBar value={scores[criterion.key] * 20} color={scores[criterion.key] >= 4 ? colors.success : colors.primary} />
            </View>
          );
        })}
        {history.slice(0, 6).map((snapshot) => (
          <View key={snapshot.id} style={[styles.historyRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.formHint, { color: colors.mutedForeground }]}>{new Date(snapshot.capturedAt).toLocaleDateString()}</Text>
            <Text style={[styles.formLabel, { color: colors.foreground }]}>{Math.round(((snapshot.scopeScore + snapshot.impactScore + snapshot.skillsScore + snapshot.sponsorshipScore) / 20) * 100)}/100</Text>
          </View>
        ))}
      </View>

      <SectionHeader title="Your proof point and review dates" />
      <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.formLabel, { color: colors.foreground }]}>What will you take to your manager?</Text>
        <Text style={[styles.formHint, { color: colors.mutedForeground }]}>Name the outcome, your ownership, and the evidence you can show.</Text>
        <TextInput
          value={proofPoint}
          onChangeText={setProofPoint}
          placeholder="Example: Reduced pipeline failures by 30% across three teams..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          style={[styles.input, styles.multilineInput, { color: colors.foreground, borderColor: colors.border }]}
          accessibilityLabel="Promotion proof point"
          testID="input-promotion-proof-point"
        />
        <Text style={[styles.formLabel, { color: colors.foreground }]}>Target promotion review date <Text style={{ color: colors.mutedForeground }}>(optional)</Text></Text>
        <TextInput
          value={targetDate}
          onChangeText={setTargetDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
          style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
          accessibilityLabel="Promotion target review date"
          testID="input-promotion-target-date"
        />
        <Text style={[styles.formLabel, { color: colors.foreground }]}>Manager check-in date <Text style={{ color: colors.mutedForeground }}>(optional)</Text></Text>
        <TextInput
          value={managerCheckInDate}
          onChangeText={setManagerCheckInDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
          style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
          accessibilityLabel="Manager check-in date"
          testID="input-promotion-manager-check-in-date"
        />
        {formError ? <Text style={[styles.errorText, { color: colors.warning }]}>{formError}</Text> : null}
        {savedMessage ? <Text style={[styles.savedText, { color: colors.success }]}>{savedMessage}</Text> : null}
        {readinessQuery.data?.updatedAt ? (
          <Text style={[styles.formHint, { color: colors.mutedForeground }]}>
            Last updated {new Date(readinessQuery.data.updatedAt).toLocaleDateString()}
          </Text>
        ) : null}
        <PrimaryButton onPress={saveReadiness} icon="save">
          {updateReadiness.isPending ? 'Saving...' : 'Save readiness review'}
        </PrimaryButton>
      </View>

      <SectionHeader title="Promotion packet" action="Generated from your readout" />
      <View style={[styles.packetCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Text style={[styles.packetIntro, { color: colors.foreground }]}>Turn the current evidence into a manager-ready conversation brief.</Text>
        <PrimaryButton onPress={() => setPacketVisible((visible) => !visible)} icon={packetVisible ? 'eye-off' : 'file-text'} secondary>
          {packetVisible ? 'Hide packet' : 'Generate packet'}
        </PrimaryButton>
        {packetVisible ? (
          <View style={[styles.packetPreview, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text selectable style={[styles.packetText, { color: colors.foreground }]}>{packetText}</Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: { borderRadius: 20, padding: 20, gap: 16 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroCopy: { flex: 1, gap: 8 },
  heroEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.1, opacity: 0.78 },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 23, lineHeight: 28 },
  heroScore: { fontFamily: 'Inter_700Bold', fontSize: 53, letterSpacing: -2 },
  heroBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, opacity: 0.86 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  heroMeta: { fontFamily: 'Inter_500Medium', fontSize: 11, opacity: 0.78 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveLink: { paddingHorizontal: 4, paddingVertical: 10 },
  saveLinkText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  noteCard: { borderWidth: 1, borderRadius: 15, padding: 14, flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  noteText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  criteriaCard: { borderWidth: 1, borderRadius: 17, padding: 15, gap: 8, marginBottom: 10 },
  criteriaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  criteriaTitle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  criteriaQuestion: { fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 18 },
  criteriaDetail: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
  scaleLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, marginTop: 2 },
  scoreRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  scoreButton: { width: 42, height: 38, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  scoreButtonText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  scaleLegend: { flexDirection: 'row', justifyContent: 'space-between' },
  scaleLegendText: { fontFamily: 'Inter_400Regular', fontSize: 10 },
  formCard: { borderWidth: 1, borderRadius: 17, padding: 14, gap: 10 },
  formLabel: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  formHint: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  input: { borderWidth: 1, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 11, fontFamily: 'Inter_500Medium', fontSize: 13 },
  multilineInput: { minHeight: 94, textAlignVertical: 'top' },
  shortMultilineInput: { minHeight: 68, textAlignVertical: 'top' },
  errorText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 18 },
  savedText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 18 },
  emptyCard: { borderWidth: 1, borderRadius: 17, padding: 18, gap: 8 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  emptyBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  pathPicker: { gap: 8 },
  pathOption: { borderWidth: 1, borderRadius: 12, padding: 11, gap: 3 },
  pathOptionLabel: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  pathOptionDetail: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 15 },
  actionCard: { borderWidth: 1, borderRadius: 17, padding: 15, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  actionCopy: { flex: 1, gap: 4 },
  actionTitle: { fontFamily: 'Inter_700Bold', fontSize: 13, lineHeight: 18 },
  actionBody: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  linkText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  promptCard: { borderWidth: 1, borderRadius: 17, padding: 15, gap: 11 },
  promptRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  promptNumber: { fontFamily: 'Inter_700Bold', fontSize: 16, lineHeight: 18 },
  promptText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18 },
  linkedActionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, paddingBottom: 10 },
  evidenceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderTopWidth: 1, paddingTop: 11 },
  progressCard: { borderWidth: 1, borderRadius: 17, padding: 15, gap: 14 },
  progressRow: { gap: 7 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressValue: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  historyRow: { borderTopWidth: 1, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  packetCard: { borderWidth: 1, borderRadius: 17, padding: 15, gap: 11 },
  packetIntro: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18 },
  packetPreview: { borderWidth: 1, borderRadius: 12, padding: 12 },
  packetText: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17 },
});