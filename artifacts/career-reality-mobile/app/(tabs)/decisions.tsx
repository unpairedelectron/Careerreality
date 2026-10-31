import DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAnalyzeCompensationDocument, useCreateCareerAction, getListCareerActionsQueryKey, type CompensationAnalysis } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useCareer } from '@/context/career-context';
import { Header, Pill, PrimaryButton, Screen, SectionHeader } from '@/components/career-ui';
import { countCompensationCorrections, shouldConfirmCompensationReset } from '@/lib/compensation-corrections';

type DocumentKind = 'offer' | 'payslip';
type Attachment = { name: string; uri: string };

const documentCopy: Record<DocumentKind, {
  label: string;
  title: string;
  body: string;
  button: string;
}> = {
  offer: {
    label: 'OFFER LETTER',
    title: 'Separate cash from persuasion.',
    body: 'Upload the offer letter and we’ll pull out fixed pay, variable pay, equity, and the gaps worth clarifying before you say yes.',
    button: 'Attach offer letter',
  },
  payslip: {
    label: 'PAYSLIP',
    title: 'Know what actually reaches you.',
    body: 'Upload a monthly payslip to separate gross pay, take-home, and deductions for a real runway decision.',
    button: 'Attach payslip',
  },
};

function findingTone(category: string): 'positive' | 'warning' | 'accent' {
  if (category === 'ambiguity' || category === 'variable_pay') return 'warning';
  if (category === 'take_home' || category === 'guaranteed_cash') return 'positive';
  return 'accent';
}

function correctionKey(kind: DocumentKind, category: string, label: string): string {
  return `compensation:${kind}:${category}:${label}`;
}

function correctionPrefix(kind: DocumentKind): string {
  return `compensation:${kind}:`;
}

export default function DecisionsScreen() {
  const colors = useColors();
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const {
    profile,
    compensationCorrections,
    setCompensationCorrection,
    clearCompensationCorrections,
  } = useCareer();
  const [activeKind, setActiveKind] = useState<DocumentKind>('offer');
  const [attachments, setAttachments] = useState<Partial<Record<DocumentKind, Attachment>>>({});
  const [analyses, setAnalyses] = useState<Partial<Record<DocumentKind, CompensationAnalysis>>>({});
  const [error, setError] = useState<string | undefined>();
  const [saveMessage, setSaveMessage] = useState<string | undefined>();
  const compensationMutation = useAnalyzeCompensationDocument();
  const createAction = useCreateCareerAction();
  const activeCopy = documentCopy[activeKind];
  const activeAnalysis = analyses[activeKind];
  const activeAttachment = attachments[activeKind];
  const correctionCount = Object.keys(compensationCorrections).length;
  const activeCorrectionPrefix = correctionPrefix(activeKind);
  const activeCorrectionCount = countCompensationCorrections(compensationCorrections, activeCorrectionPrefix);

  const resetCorrections = (prefix?: string) => {
    clearCompensationCorrections(prefix);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const requestResetCorrections = ({
    prefix,
    count,
    label,
  }: {
    prefix?: string;
    count: number;
    label: string;
  }) => {
    if (!shouldConfirmCompensationReset(count)) {
      resetCorrections(prefix);
      return;
    }
    Alert.alert(
      'Reset local corrections?',
      `This will restore ${count} ${label} value${count === 1 ? '' : 's'} to the original document readout. Your analyzed documents and evidence will stay here.`,
      [
        { text: 'Keep edits', style: 'cancel' },
        { text: 'Reset corrections', style: 'destructive', onPress: () => resetCorrections(prefix) },
      ],
    );
  };

  const analyzeDocument = async (kind: DocumentKind) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      if (asset.size && asset.size > 8 * 1024 * 1024) {
        setError('That document is larger than 8 MB. Choose a smaller PDF or DOCX export.');
        return;
      }
      setError(undefined);
      setActiveKind(kind);
      setAttachments((previous) => ({ ...previous, [kind]: { name: asset.name, uri: asset.uri } }));
      const analysis = await compensationMutation.mutateAsync({
        data: {
          file: new File(asset.uri),
          documentType: kind,
        },
      });
      clearCompensationCorrections(correctionPrefix(kind));
      setAnalyses((previous) => ({ ...previous, [kind]: analysis }));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We could not read that compensation document. Try a PDF or DOCX export.');
    }
  };

  const saveReadout = async () => {
    if (!activeAnalysis) {
      setSaveMessage('Analyze an offer letter or payslip first so there is a readout to save.');
      return;
    }
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    setSaveMessage(undefined);
    try {
      await createAction.mutateAsync({
        data: {
          kind: 'decision',
          title: `${activeKind === 'offer' ? 'Review offer' : 'Review payslip'}: ${activeAnalysis.headline}`,
          body: `${activeAnalysis.summary} Next: ${activeAnalysis.nextActions[0] ?? 'Verify the open questions before deciding.'}`,
          source: `Compensation reality · ${activeKind === 'offer' ? 'Offer letter' : 'Payslip'}`,
          dueDate: null,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListCareerActionsQueryKey() });
      setSaveMessage('Saved to Plan. Start with the first verification step.');
    } catch {
      setSaveMessage('This readout could not be saved. Try again.');
    }
  };

  return (
    <Screen keyboardAware>
      <Header eyebrow="DECISION ENGINE" title="Make the move make sense." />
      <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.heroLabel, { color: colors.primary }]}>COMPENSATION REALITY</Text>
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>The number on top is not the number you keep.</Text>
        <Text style={[styles.heroBody, { color: colors.mutedForeground }]}>Start with the documents you already have. CareerReality separates guaranteed cash, conditional pay, take-home, and missing answers before giving you a next move.</Text>
      </View>

      <SectionHeader title="Choose a document" action="Private processing" />
      <View style={styles.documentTabs}>
        {(Object.keys(documentCopy) as DocumentKind[]).map((kind) => {
          const selected = activeKind === kind;
          const hasAnalysis = Boolean(analyses[kind]);
          const kindCorrectionCount = countCompensationCorrections(
            compensationCorrections,
            correctionPrefix(kind),
          );
          return (
            <Pressable
              key={kind}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${kind === 'offer' ? 'Offer' : 'Payslip'}${hasAnalysis ? ', readout ready' : ', not added'}${kindCorrectionCount ? `, ${kindCorrectionCount} edited` : ''}`}
              testID={`button-compensation-${kind}`}
              onPress={() => { setActiveKind(kind); setError(undefined); void Haptics.selectionAsync(); }}
              style={[styles.documentTab, { backgroundColor: selected ? colors.primary : colors.card, borderColor: selected ? colors.primary : colors.border }]}
            >
              <Text style={[styles.documentTabLabel, { color: selected ? colors.primaryForeground : colors.mutedForeground }]}>{kind === 'offer' ? 'OFFER' : 'PAYSLIP'}</Text>
              <View style={styles.documentTabStatusRow}>
                <Text style={[styles.documentTabStatus, { color: selected ? colors.primaryForeground : colors.foreground }]}>{hasAnalysis ? 'Readout ready' : 'Not added'}</Text>
                {kindCorrectionCount > 0 ? (
                  <Text style={[styles.documentTabEdited, { color: selected ? colors.primaryForeground : colors.primary }]}>
                    {kindCorrectionCount} edited
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.uploadCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <View style={styles.uploadHeader}>
          <View style={[styles.uploadIcon, { backgroundColor: colors.card }]}><Text style={[styles.uploadIconText, { color: colors.primary }]}>₹</Text></View>
          <View style={styles.uploadCopy}>
            <Text style={[styles.uploadLabel, { color: colors.primary }]}>{activeCopy.label}</Text>
            <Text style={[styles.uploadTitle, { color: colors.foreground }]}>{activeCopy.title}</Text>
          </View>
          {activeAnalysis ? <Pill tone="positive">Analyzed</Pill> : null}
        </View>
        <Text style={[styles.uploadBody, { color: colors.mutedForeground }]}>{activeCopy.body}</Text>
        {activeAttachment ? <Text style={[styles.fileName, { color: colors.foreground }]}>{activeAttachment.name}</Text> : null}
        <Pressable onPress={() => void analyzeDocument(activeKind)} disabled={compensationMutation.isPending} accessibilityRole="button" testID={`button-attach-${activeKind}`} style={({ pressed }) => [styles.attachButton, { borderColor: colors.primary, opacity: pressed || compensationMutation.isPending ? 0.55 : 1 }]}>
          <Text style={[styles.attachButtonText, { color: colors.primary }]}>{compensationMutation.isPending ? 'Reading document…' : activeAttachment ? `Replace ${activeKind}` : activeCopy.button}</Text>
        </Pressable>
        <Text style={[styles.privacyNote, { color: colors.mutedForeground }]}>PDF or DOCX · extracted in memory · original file discarded after analysis</Text>
        {activeCorrectionCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Reset ${activeKind} corrections`}
            testID={`button-reset-compensation-${activeKind}`}
            onPress={() => requestResetCorrections({
              prefix: activeCorrectionPrefix,
              count: activeCorrectionCount,
              label: activeKind,
            })}
            style={({ pressed }) => [
              styles.scopedResetButton,
              { borderColor: colors.border, opacity: pressed ? 0.65 : 1 },
            ]}
          >
            <Text style={[styles.scopedResetButtonText, { color: colors.mutedForeground }]}>
              Reset {activeKind} edits
            </Text>
          </Pressable>
        ) : null}
      </View>
      {correctionCount > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reset all local compensation corrections"
          testID="button-reset-all-compensation-corrections"
          onPress={() => requestResetCorrections({
            count: correctionCount,
            label: 'local compensation',
          })}
          style={({ pressed }) => [
            styles.resetButton,
            { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.65 : 1 },
          ]}
        >
          <Text style={[styles.resetButtonText, { color: colors.mutedForeground }]}>
            Reset all {correctionCount === 1 ? 'local correction' : `${correctionCount} local corrections`}
          </Text>
        </Pressable>
      ) : null}
      {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

      {activeAnalysis ? (
        <>
          <SectionHeader title="Here is what we know" action={profile.city} />
          <View style={[styles.readoutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.readoutHeadline, { color: colors.foreground }]}>{activeAnalysis.headline}</Text>
            <Text style={[styles.readoutSummary, { color: colors.mutedForeground }]}>{activeAnalysis.summary}</Text>
            <View style={styles.findings}>
              {activeAnalysis.findings.map((finding) => {
                const key = correctionKey(activeKind, finding.category, finding.label);
                const correctedValue = compensationCorrections[key];
                const displayedValue = correctedValue ?? finding.value;
                const isCorrected = correctedValue !== undefined && correctedValue !== finding.value;
                return (
                <View key={`${finding.category}-${finding.label}`} style={[styles.finding, { borderTopColor: colors.border }]}>
                  <View style={styles.findingHeader}>
                    <Text style={[styles.findingLabel, { color: colors.foreground }]}>{finding.label}</Text>
                    <View style={styles.findingPills}>
                      <Pill tone={findingTone(finding.category)}>{finding.confidence}</Pill>
                      {isCorrected ? <Pill tone="accent">User corrected</Pill> : null}
                    </View>
                  </View>
                  <TextInput
                    accessibilityLabel={`Edit ${finding.label}`}
                    testID={`input-compensation-${activeKind}-${finding.category}`}
                    value={displayedValue}
                    onChangeText={(value) => setCompensationCorrection(key, value === finding.value ? '' : value)}
                    placeholder="Enter a corrected value"
                    placeholderTextColor={colors.mutedForeground}
                    returnKeyType="done"
                    style={[styles.findingValueInput, { color: colors.primary, borderColor: isCorrected ? colors.accent : colors.border, backgroundColor: colors.background }]}
                  />
                  {isCorrected ? (
                    <Text style={[styles.correctionNote, { color: colors.accent }]}>
                      User correction · original extraction: {finding.value}. The interpretation below still uses the document’s original assumptions.
                    </Text>
                  ) : null}
                  <Text style={[styles.findingInterpretation, { color: colors.mutedForeground }]}>{finding.interpretation}</Text>
                  <Text style={[styles.findingEvidence, { color: colors.mutedForeground }]}>Document line · {finding.evidence}</Text>
                </View>
                );
              })}
            </View>
          </View>

          <SectionHeader title="Here is what it means for you" />
          <Text style={[styles.readoutSummary, { color: colors.mutedForeground }]}>{activeAnalysis.summary}</Text>
          <SectionHeader title="Here is what we do not know" action={`${activeAnalysis.qualityNotes.length} limits`} />
          <Text style={[styles.qualityNote, { color: colors.mutedForeground }]}>{activeAnalysis.qualityNotes.join(' ')}</Text>

          <SectionHeader title="Here is what you should do next" />
          {activeAnalysis.nextActions.map((action, index) => (
            <View key={action} style={styles.actionRow}>
              <View style={[styles.actionNumber, { backgroundColor: colors.secondary }]}><Text style={[styles.actionNumberText, { color: colors.primary }]}>{String(index + 1).padStart(2, '0')}</Text></View>
              <Text style={[styles.actionText, { color: colors.foreground }]}>{action}</Text>
            </View>
          ))}
        </>
      ) : (
        <>
          <SectionHeader title="The first useful read" />
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No compensation document yet.</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Upload an offer letter to see what is guaranteed, conditional, or missing. Add a payslip next to ground the decision in monthly take-home.</Text>
          </View>
        </>
      )}

      {saveMessage ? <Text style={[styles.saveMessage, { color: saveMessage.startsWith('Saved') ? colors.success : colors.warning }]}>{saveMessage}</Text> : null}
      <PrimaryButton onPress={() => void saveReadout()} secondary icon="arrow-right">
        {createAction.isPending ? 'Saving readout…' : isSignedIn ? 'Save this readout to Plan' : 'Sign in to save this readout'}
      </PrimaryButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 9 },
  heroLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.2 },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, lineHeight: 27, letterSpacing: -0.4 },
  heroBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  documentTabs: { flexDirection: 'row', gap: 8 },
  documentTab: { flex: 1, minHeight: 70, borderWidth: 1, borderRadius: 14, padding: 12, justifyContent: 'space-between' },
  documentTabLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1 },
  documentTabStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  documentTabStatus: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  documentTabEdited: { fontFamily: 'Inter_700Bold', fontSize: 10 },
  uploadCard: { borderRadius: 17, padding: 16, gap: 11 },
  uploadHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  uploadIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  uploadIconText: { fontFamily: 'Inter_700Bold', fontSize: 21 },
  uploadCopy: { flex: 1, gap: 4 },
  uploadLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1 },
  uploadTitle: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  uploadBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  fileName: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  attachButton: { minHeight: 43, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  attachButtonText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  privacyNote: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15 },
  scopedResetButton: { alignSelf: 'flex-start', minHeight: 32, borderWidth: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  scopedResetButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  resetButton: { minHeight: 38, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  resetButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  error: { fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 16, marginTop: -3 },
  readoutCard: { borderWidth: 1, borderRadius: 17, padding: 16, gap: 9 },
  readoutHeadline: { fontFamily: 'Inter_700Bold', fontSize: 21, lineHeight: 26 },
  readoutSummary: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  findings: { gap: 0, marginTop: 4 },
  finding: { borderTopWidth: 1, paddingTop: 12, marginTop: 12, gap: 5 },
  findingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  findingLabel: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 12 },
  findingPills: { alignItems: 'flex-end', gap: 4 },
  findingValueInput: { minHeight: 42, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontFamily: 'Inter_700Bold', fontSize: 16 },
  correctionNote: { fontFamily: 'Inter_600SemiBold', fontSize: 10, lineHeight: 15 },
  findingInterpretation: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17 },
  findingEvidence: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15 },
  actionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 13 },
  actionNumber: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionNumberText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  actionText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 19 },
  qualityNote: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15, marginTop: 2 },
  saveMessage: { fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 16, marginTop: 12 },
  emptyCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  emptyBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
});