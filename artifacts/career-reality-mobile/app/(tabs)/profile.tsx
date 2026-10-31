import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useCareer } from '@/context/career-context';
import { Divider, Header, MetricCard, Pill, PrimaryButton, Screen, SectionHeader } from '@/components/career-ui';
import { getMarketRefreshFreshnessMessage } from '@/context/market-refresh';

export default function ProfileScreen() {
  const colors = useColors();
  const {
    profile,
    brutalMode,
    setBrutalMode,
    resumeIntelligence,
    resumeMarketRefreshedAt,
    marketRefreshSummary,
    marketRefreshHistory,
    resumeProcessingState,
    resumeProcessingError,
    clearResumeIntelligence,
    refreshMarketContext,
  } = useCareer();
  const [showMarketHistory, setShowMarketHistory] = useState(false);
  const marketFreshnessMessage = getMarketRefreshFreshnessMessage(resumeMarketRefreshedAt);
  const openResumeRefresh = () => {
    router.push({ pathname: '/onboarding', params: { mode: 'refresh' } } as never);
  };
  const clearSavedIntelligence = () => {
    Alert.alert(
      'Clear saved intelligence?',
      'This clears extracted resume fields from your account profile and this account’s current device data. Your profile answers and previously generated career-brief history remain. Older unscoped local copies and backup retention are not established by this action.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear intelligence',
          style: 'destructive',
          onPress: () => {
            void clearResumeIntelligence()
              .then(() => {
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              })
              .catch(() => Alert.alert(
                'Removal not confirmed',
                'The app could not confirm removal from your account. Device data was kept so you can retry.',
              ));
          },
        },
      ],
    );
  };
  return (
    <Screen>
      <Header eyebrow="CAREER WALLET" title="Your reality, in one place." action={<Pressable onPress={() => router.push('/onboarding')} accessibilityRole="button" testID="button-edit-profile"><Text style={[styles.edit, { color: colors.primary }]}>Edit</Text></Pressable>} />
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={[styles.avatarText, { color: colors.primaryForeground }]}>{profile.name.charAt(0)}</Text></View>
        <View style={styles.profileCopy}><Text style={[styles.profileName, { color: colors.foreground }]}>{profile.name}</Text><Text style={[styles.profileRole, { color: colors.mutedForeground }]}>{profile.role} · {profile.company}</Text><View style={styles.profileMeta}><Pill>{profile.city}</Pill><Pill>{profile.experience}</Pill>{profile.resumeName ? <Pill tone="positive">Resume added</Pill> : null}</View></View>
      </View>
       <SectionHeader title="Career position" action={resumeIntelligence ? 'Resume-informed' : undefined} />
      <View style={styles.metricRow}><MetricCard label="Market position" value="Top 28%" detail="Strong" tone="positive" icon="trending-up" /><MetricCard label="Skill leverage" value="76/100" detail="Above average" tone="positive" icon="layers" /></View>
      <View style={styles.metricRow}><MetricCard label="Switch readiness" value="68/100" detail="Build runway" tone="warning" icon="repeat" /><MetricCard label="Mobility" value="69/100" detail="Good optionality" tone="accent" icon="globe" /></View>
        <View style={[styles.intelligenceCard, { backgroundColor: colors.secondary }]}>
          <View style={styles.intelligenceHeader}>
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={[styles.intelligenceTitle, { color: colors.foreground }]}>
                {resumeProcessingState === 'processing' ? 'Refreshing career intelligence' : resumeIntelligence ? 'Resume intelligence ready' : resumeProcessingState === 'failed' ? 'Resume refresh needs attention' : 'Resume intelligence not added'}
              </Text>
              <Text style={[styles.intelligenceBody, { color: colors.mutedForeground }]}>
                {resumeProcessingState === 'processing'
                  ? 'Your last successful structured readout stays available while the new resume is processed.'
                  : resumeIntelligence
                    ? `${resumeIntelligence.skills.length} skills and ${resumeIntelligence.employers.length} employers detected. These are evidence from your document, not verified facts.`
                    : resumeProcessingState === 'failed'
                      ? 'Your last successful readout was preserved. Replace the resume and retry when ready.'
                      : 'Add a resume to sharpen role, skill, and market recommendations.'}
              </Text>
            </View>
            <Pill tone={resumeProcessingState === 'failed' ? 'warning' : resumeProcessingState === 'processing' ? 'accent' : resumeIntelligence ? 'positive' : 'muted'}>
              {resumeProcessingState === 'processing' ? 'Processing' : resumeProcessingState === 'failed' ? 'Retry' : resumeIntelligence ? 'Ready' : 'Optional'}
            </Pill>
          </View>
          {resumeIntelligence ? <Text style={[styles.intelligenceSource, { color: colors.primary }]}>Last market refresh · {new Date(resumeMarketRefreshedAt ?? resumeIntelligence.processedAt).toLocaleDateString()}</Text> : null}
          {marketFreshnessMessage ? <Text style={[styles.intelligenceSource, { color: colors.mutedForeground }]}>{marketFreshnessMessage}</Text> : null}
          {resumeIntelligence && marketRefreshSummary ? <View style={[styles.marketSummary, { borderTopColor: colors.border }]}><Text style={[styles.marketSummaryLabel, { color: colors.mutedForeground }]}>MARKET CONTEXT ONLY</Text><Text style={[styles.marketSummaryText, { color: colors.foreground }]}>{marketRefreshSummary.text}</Text><Text style={[styles.marketSummarySource, { color: colors.mutedForeground }]}>Resume skills and employers were not changed · {marketRefreshSummary.categories.join(' · ')}</Text></View> : null}
          {resumeIntelligence && marketRefreshHistory.length > 0 ? <View style={[styles.historySection, { borderTopColor: colors.border }]}>
            <Pressable onPress={() => setShowMarketHistory((visible) => !visible)} accessibilityRole="button" accessibilityState={{ expanded: showMarketHistory }} testID="button-toggle-market-history" style={styles.historyToggle}>
              <Text style={[styles.historyToggleText, { color: colors.primary }]}>{showMarketHistory ? 'Hide refresh history' : `View refresh history · ${marketRefreshHistory.length}`}</Text>
              <Feather name={showMarketHistory ? 'chevron-up' : 'chevron-down'} size={15} color={colors.primary} />
            </Pressable>
            {showMarketHistory ? <View style={styles.historyList}>{marketRefreshHistory.map((entry, index) => <View key={`${entry.refreshedAt}-${index}`} style={styles.historyRow}><View style={styles.historyDate}><Text style={[styles.historyDateText, { color: colors.foreground }]}>{new Date(entry.refreshedAt).toLocaleDateString()}</Text><Text style={[styles.historyCategoryText, { color: colors.mutedForeground }]}>{entry.categories.join(' · ')}</Text></View><Text style={[styles.historySummaryText, { color: colors.mutedForeground }]}>{entry.text}</Text></View>)}</View> : null}
          </View> : null}
          {resumeProcessingError ? <Text style={[styles.intelligenceError, { color: colors.destructive }]}>{resumeProcessingError}</Text> : null}
          <View style={styles.intelligenceActions}>
            <Pressable onPress={openResumeRefresh} disabled={resumeProcessingState === 'processing'} accessibilityRole="button" testID="button-refresh-resume" style={({ pressed }) => [styles.intelligenceButton, { borderColor: colors.primary, opacity: pressed || resumeProcessingState === 'processing' ? 0.55 : 1 }]}>
              <Feather name={resumeProcessingState === 'failed' ? 'rotate-ccw' : 'refresh-cw'} size={14} color={colors.primary} />
              <Text style={[styles.intelligenceButtonText, { color: colors.primary }]}>{resumeProcessingState === 'failed' ? 'Retry / replace' : resumeIntelligence ? 'Refresh / replace' : 'Add resume'}</Text>
            </Pressable>
            {resumeIntelligence ? <Pressable onPress={() => { void refreshMarketContext(); }} disabled={resumeProcessingState === 'processing'} accessibilityRole="button" accessibilityLabel={resumeProcessingState === 'failed' ? 'Retry market context' : 'Refresh market context'} testID="button-refresh-market-context" style={({ pressed }) => [styles.marketRefreshButton, { opacity: pressed || resumeProcessingState === 'processing' ? 0.55 : 1 }]}><Feather name="activity" size={14} color={colors.primary} /><Text style={[styles.intelligenceButtonText, { color: colors.primary }]}>{resumeProcessingState === 'failed' ? 'Retry market context' : 'Refresh market context'}</Text></Pressable> : null}
            {resumeIntelligence ? <Pressable onPress={clearSavedIntelligence} disabled={resumeProcessingState === 'processing'} accessibilityRole="button" testID="button-clear-resume-intelligence" style={({ pressed }) => [styles.clearButton, { opacity: pressed || resumeProcessingState === 'processing' ? 0.55 : 1 }]}><Text style={[styles.clearButtonText, { color: colors.mutedForeground }]}>Clear saved intelligence</Text></Pressable> : null}
          </View>
        </View>
       <SectionHeader title="Modes & privacy" />
       <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.settingRow}><View style={[styles.settingIcon, { backgroundColor: colors.secondary }]}><Feather name="target" size={17} color={colors.primary} /></View><View style={styles.settingCopy}><Text style={[styles.settingTitle, { color: colors.foreground }]}>Brutal mode</Text><Text style={[styles.settingBody, { color: colors.mutedForeground }]}>Less encouragement. More direct trade-offs.</Text></View><Switch value={brutalMode} onValueChange={(value) => { setBrutalMode(value); void Haptics.selectionAsync(); }} trackColor={{ false: colors.secondary, true: colors.primary }} thumbColor={colors.foreground} testID="switch-brutal-mode" /></View>
        <Divider />
         <View style={styles.settingRow}><View style={[styles.settingIcon, { backgroundColor: colors.secondary }]}><Feather name="lock" size={17} color={colors.primary} /></View><View style={styles.settingCopy}><Text style={[styles.settingTitle, { color: colors.foreground }]}>Private by default</Text><Text style={[styles.settingBody, { color: colors.mutedForeground }]}>Your compensation stays local. If you attach a resume, we process it only with your consent and keep structured insights—not the document.</Text></View><Feather name="check-circle" size={19} color={colors.success} /></View>
      </View>
      <SectionHeader title="Profile coverage" action="6 of 8 signals" />
      <View style={[styles.coverageCard, { backgroundColor: colors.secondary }]}><View style={styles.coverageTop}><Text style={[styles.coverageTitle, { color: colors.foreground }]}>Good foundation</Text><Text style={[styles.coverageValue, { color: colors.primary }]}>75%</Text></View><View style={[styles.coverageTrack, { backgroundColor: colors.card }]}><View style={[styles.coverageFill, { backgroundColor: colors.primary, width: '75%' }]} /></View><Text style={[styles.settingBody, { color: colors.mutedForeground }]}>Add manager scope and target minimum salary to sharpen your next recommendation.</Text></View>
       <PrimaryButton secondary icon="download">Export career snapshot</PrimaryButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  edit: { fontFamily: 'Inter_700Bold', fontSize: 13, paddingVertical: 8 },
  profileCard: { borderWidth: 1, borderRadius: 18, padding: 17, flexDirection: 'row', gap: 14, alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Inter_700Bold', fontSize: 24 },
  profileCopy: { flex: 1, gap: 4 },
  profileName: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  profileRole: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  profileMeta: { flexDirection: 'row', gap: 6, marginTop: 4 },
  metricRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  settingCard: { borderWidth: 1, borderRadius: 17, padding: 16 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  settingIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  settingCopy: { flex: 1, gap: 4 },
  settingTitle: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  settingBody: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17 },
  coverageCard: { borderRadius: 16, padding: 16, gap: 12 },
  coverageTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  coverageTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  coverageValue: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  coverageTrack: { height: 7, borderRadius: 4, overflow: 'hidden' },
  coverageFill: { height: '100%', borderRadius: 4 },
  intelligenceCard: { borderRadius: 16, padding: 16, gap: 7 },
  intelligenceHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  intelligenceTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  intelligenceBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  intelligenceSource: { fontFamily: 'Inter_600SemiBold', fontSize: 10, lineHeight: 15 },
  marketSummary: { borderTopWidth: 1, paddingTop: 10, gap: 4, marginTop: 2 },
  marketSummaryLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1 },
  marketSummaryText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 16 },
  marketSummarySource: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15 },
  historySection: { borderTopWidth: 1, paddingTop: 8, marginTop: 2 },
  historyToggle: { minHeight: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyToggleText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  historyList: { gap: 10, paddingTop: 7 },
  historyRow: { gap: 3 },
  historyDate: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  historyDateText: { fontFamily: 'Inter_700Bold', fontSize: 10 },
  historyCategoryText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 9, textAlign: 'right' },
  historySummaryText: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15 },
  intelligenceError: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 16 },
  intelligenceActions: { flexDirection: 'row', alignItems: 'center', gap: 13, flexWrap: 'wrap', marginTop: 5 },
  intelligenceButton: { minHeight: 38, borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 7 },
  intelligenceButtonText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  marketRefreshButton: { minHeight: 38, paddingHorizontal: 3, flexDirection: 'row', alignItems: 'center', gap: 6 },
  clearButton: { paddingVertical: 8 },
  clearButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, textDecorationLine: 'underline' },
});
