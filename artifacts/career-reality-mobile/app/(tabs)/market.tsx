import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listPublicCompanySignals, listSalaryBenchmarks } from '@workspace/api-client-react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';
import { MarketEvidenceDetails } from '@/components/market-evidence';
import { useColors } from '@/hooks/useColors';
import { Header, Pill, ProgressBar, Screen, SectionHeader } from '@/components/career-ui';
import { useCareer } from '@/context/career-context';
import { evidenceStatusLabel, isUsableCompanyScoreEvidence, isUsableSalaryEvidence } from '@/lib/public-evidence';
import { parseAnnualCtc } from '@/lib/relocation';

const tabs = ['Salary', 'Company', 'AI exposure'] as const;
type MarketTab = (typeof tabs)[number];

export default function MarketScreen() {
  const colors = useColors();
  const { profile, resumeIntelligence } = useCareer();
  const [activeTab, setActiveTab] = useState<MarketTab>('Salary');

  return (
    <Screen>
      <Header eyebrow="MARKET INTELLIGENCE" title="Read the market." />
      <View style={[styles.segmented, { backgroundColor: colors.secondary }]}>
        {tabs.map((tab) => (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab }}
            testID={`market-tab-${tab.toLowerCase().replace(' ', '-')}`}
            onPress={() => {
              setActiveTab(tab);
              void Haptics.selectionAsync();
            }}
            style={[styles.segment, activeTab === tab && { backgroundColor: colors.card }]}
          >
            <Text style={[styles.segmentText, { color: activeTab === tab ? colors.foreground : colors.mutedForeground }]}>{tab}</Text>
          </Pressable>
        ))}
      </View>

      {resumeIntelligence ? <View style={[styles.resumeBridge, { backgroundColor: colors.secondary }]}><Text style={[styles.resumeBridgeTitle, { color: colors.foreground }]}>Resume-informed lens</Text><Text style={[styles.resumeBridgeBody, { color: colors.mutedForeground }]}>{resumeIntelligence.skills.slice(0, 5).map((skill) => skill.name).join(' · ') || 'No skills were confidently detected yet.'} · {profile.city}</Text><Text style={[styles.resumeBridgeSource, { color: colors.primary }]}>Resume facts come from your document; source dates and methods appear on each market signal.</Text></View> : null}
      {activeTab === 'Salary' ? <SalaryPanel role={profile.role} city={profile.city} experience={profile.experience} ctc={profile.ctc} resumeSkills={resumeIntelligence?.skills.slice(0, 3).map((skill) => skill.name)} /> : null}
      {activeTab === 'Company' ? <CompanyPanel company={profile.company} /> : null}
      {activeTab === 'AI exposure' ? <AiPanel role={profile.role} skills={resumeIntelligence?.skills.slice(0, 4).map((skill) => skill.name)} /> : null}
    </Screen>
  );
}

function SalaryPanel({ role, city, experience, ctc, resumeSkills }: { role: string; city: string; experience: string; ctc: string; resumeSkills?: string[] }) {
  const colors = useColors();
  const salaryQuery = useQuery({
    queryKey: ['salary-benchmark', role, city, experience],
    queryFn: () => listSalaryBenchmarks({ role, city, experienceBand: experienceBandFor(experience) }),
    staleTime: 10 * 60 * 1000,
  });
  const benchmark = salaryQuery.isError
    ? undefined
    : salaryQuery.data?.data.find(isUsableSalaryEvidence);
  const annualCtc = parseAnnualCtc(ctc);
  const estimated = benchmark?.provenance.status === 'ESTIMATED';
  const formatLakh = (value: number) => `₹${Math.round((value / 100_000) * 10) / 10}L`;
  const formatMonthly = (value: number) => `₹${Math.round(value / 12 / 1000)}k / month`;
  const ctcBreakdown = annualCtc ? [
    ['Base salary', annualCtc * 0.6, '60%'],
    ['Variable pay', annualCtc * 0.15, '15%'],
    ['PF + gratuity', annualCtc * 0.07, '7%'],
    ['Benefits + other', annualCtc * 0.18, '18%'],
  ] as const : [];
  return (
    <>
      <SectionHeader title={role} action={`${experience} · ${city}`} />
      <View style={[styles.rangeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.rangeTop}>
          <View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>MARKET RANGE · {benchmark ? evidenceStatusLabel(benchmark.provenance.status).toUpperCase() : 'SOURCE-BACKED'}</Text>
            <Text style={[styles.range, { color: colors.foreground }]}>
              {benchmark ? `${formatLakh(benchmark.p25)} — ${formatLakh(benchmark.p75)}` : salaryQuery.isError ? 'Range unavailable' : salaryQuery.isPending ? 'Loading market range…' : 'No scoped range'}
            </Text>
          </View>
          <Pill tone={estimated || salaryQuery.isError ? 'warning' : benchmark ? 'positive' : 'accent'}>{benchmark ? estimated ? 'Context only' : benchmark.confidence : salaryQuery.isError ? 'Unavailable' : 'Directional'}</Pill>
        </View>
        {benchmark ? <SalaryRangeGraphic benchmark={benchmark} annualCtc={estimated ? null : annualCtc} comparisonExcluded={Boolean(estimated && annualCtc)} /> : null}
        <View style={styles.rangeLabels}>
          <Text style={[styles.smallText, { color: colors.mutedForeground }]}>25th · {benchmark ? formatLakh(benchmark.p25) : '—'}</Text>
          <Text style={[styles.smallText, { color: colors.mutedForeground }]}>Median · {benchmark ? formatLakh(benchmark.median) : '—'}</Text>
          <Text style={[styles.smallText, { color: colors.mutedForeground }]}>75th · {benchmark ? formatLakh(benchmark.p75) : '—'}</Text>
        </View>
        <View style={[styles.insightRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>YOUR CURRENT CTC</Text>
            <Text style={[styles.insightValue, { color: colors.accent }]}>{ctc || 'Not shared'} · {benchmark ? estimated ? 'not compared with an estimate' : `${formatLakh(benchmark.median)} market median` : salaryQuery.isError ? 'comparison unavailable' : 'waiting for benchmark'}</Text>
        </View>
      </View>
        {benchmark ? <MarketEvidenceDetails source={benchmark.source} sourceUrl={benchmark.sourceUrl} provenance={benchmark.provenance} /> : null}
      <SectionHeader title="Here is what we know about your CTC" action={annualCtc ? 'Illustrative breakdown' : 'Needs a CTC input'} />
      <View style={[styles.ctcCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.ctcHeader}>
          <View><Text style={[styles.label, { color: colors.mutedForeground }]}>CURRENT HEADLINE CTC</Text><Text style={[styles.range, { color: colors.foreground }]}>{annualCtc ? formatLakh(annualCtc) : ctc || 'Not shared'}</Text></View>
          <Pill tone={annualCtc ? 'positive' : 'warning'}>{annualCtc ? formatMonthly(annualCtc) : 'Monthly unknown'}</Pill>
        </View>
        {ctcBreakdown.length ? ctcBreakdown.map(([name, value, share]) => (
          <View key={name} style={styles.ctcRow}><Text style={[styles.factorLabel, { color: colors.foreground }]}>{name}</Text><View style={styles.ctcShare}><Text style={[styles.smallText, { color: colors.mutedForeground }]}>{share}</Text><Text style={[styles.ctcValue, { color: colors.foreground }]}>{formatLakh(value)}</Text></View></View>
        )) : <Text style={[styles.sourceBody, { color: colors.mutedForeground }]}>Add an annual CTC in your profile to see an illustrative split. We will not invent one for you.</Text>}
        <Text style={[styles.sourceBody, { color: colors.mutedForeground }]}>This split is a planning assumption, not your payslip. Take-home varies by tax regime, deductions, and payout timing.</Text>
      </View>
      <SectionHeader title="Here is what it means for you" action="Directional levers" />
      <View style={styles.factorList}>
        {[
           [resumeSkills?.[0] ? `Resume skill: ${resumeSkills[0]}` : 'Cloud + platform scope', 'Resume evidence', 88],
          ['Architecture ownership', 'Build next', 62],
          ['Company type', 'GCC premium', 75],
        ].map(([label, note, value]) => (
          <View key={String(label)} style={styles.factor}>
            <View style={styles.factorText}><Text style={[styles.factorLabel, { color: colors.foreground }]}>{label}</Text><Text style={[styles.smallText, { color: colors.mutedForeground }]}>{note}</Text></View>
            <View style={styles.factorBar}><ProgressBar value={Number(value)} /></View>
          </View>
        ))}
      </View>
    </>
  );
}

function SalaryRangeGraphic({
  benchmark,
  annualCtc,
  comparisonExcluded,
}: {
  benchmark: { p25: number; median: number; p75: number };
  annualCtc: number | null;
  comparisonExcluded?: boolean;
}) {
  const colors = useColors();
  const spread = Math.max(benchmark.p75 - benchmark.p25, 1);
  const currentPosition = annualCtc === null ? null : Math.max(0, Math.min(100, ((annualCtc - benchmark.p25) / spread) * 100));
  return (
    <View
      testID="salary-range-graphic"
      accessible
      accessibilityLabel={`Salary range from ${benchmark.p25} to ${benchmark.p75}${annualCtc ? `, current CTC positioned at ${Math.round(currentPosition ?? 0)} percent of the range` : ''}`}
      style={styles.rangeGraphic}
    >
      <Svg width="100%" height={72} viewBox="0 0 320 72" preserveAspectRatio="none" accessibilityElementsHidden>
        <Defs>
          <LinearGradient id="salaryRangeGradient" x1="0" x2="1">
            <Stop offset="0" stopColor={colors.primary} stopOpacity="0.42" />
            <Stop offset="1" stopColor={colors.accent} stopOpacity="0.9" />
          </LinearGradient>
        </Defs>
        <Line x1="12" y1="36" x2="308" y2="36" stroke={colors.secondary} strokeWidth="8" strokeLinecap="round" />
        <Line x1="12" y1="36" x2="308" y2="36" stroke="url(#salaryRangeGradient)" strokeWidth="8" strokeLinecap="round" />
        <Line x1="160" y1="17" x2="160" y2="55" stroke={colors.foreground} strokeOpacity="0.38" strokeWidth="1.5" strokeDasharray="3 3" />
        <Circle cx="160" cy="36" r="6" fill={colors.card} stroke={colors.primary} strokeWidth="3" />
        {currentPosition !== null ? <Circle testID="salary-range-current-marker" cx={12 + (296 * currentPosition) / 100} cy="36" r="7" fill={colors.accent} stroke={colors.card} strokeWidth="3" /> : null}
      </Svg>
      <View style={styles.rangeGraphicLabels}>
        <Text style={[styles.smallText, { color: colors.mutedForeground }]}>25th</Text>
        <Text style={[styles.smallText, { color: colors.primary }]}>Median</Text>
        <Text style={[styles.smallText, { color: colors.mutedForeground }]}>75th</Text>
      </View>
      <Text style={[styles.rangeGraphicNote, { color: colors.mutedForeground }]}>
        {comparisonExcluded ? 'Estimated evidence is context only; your CTC is not compared or scored against it.' : annualCtc ? 'Accent marker shows your current input against this scoped range.' : 'Add a CTC to place your current input on this range.'}
      </Text>
    </View>
  );
}

function CompanyPanel({ company }: { company: string }) {
  const colors = useColors();
  const companyQuery = useQuery({
    queryKey: ['company-signals', company],
    queryFn: () => listPublicCompanySignals({ query: company }),
    staleTime: 10 * 60 * 1000,
  });
  const companies = companyQuery.isError
    ? []
    : (companyQuery.data?.data ?? []).filter(isUsableCompanyScoreEvidence).slice(0, 3);
  return (
    <>
       <SectionHeader title="Here is what we know about companies" action={companies.length ? 'Approved signals' : companyQuery.isError ? 'Unavailable' : companyQuery.isPending ? 'Checking sources' : 'Scores withheld'} />
        {companies.length ? companies.map((item) => {
          const stability = Number(item.stability);
          const status = item.momentum === 'Steady' || item.momentum === 'Building' ? 'Strong' : 'Watch';
          return (
            <View key={item.name} style={[styles.companyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.companyTop}><View style={[styles.companyMark, { backgroundColor: colors.secondary }]}><Text style={[styles.companyMarkText, { color: colors.primary }]}>{item.name.charAt(0)}</Text></View><View style={styles.companyCopy}><Text style={[styles.companyName, { color: colors.foreground }]}>{item.name}</Text><Text style={[styles.smallText, { color: colors.mutedForeground }]}>Public stability signal</Text></View><Text style={[styles.companyScore, { color: colors.primary }]}>{stability}</Text></View>
              <CompanySignalGraphic stability={stability} />
              <View style={styles.companyBottom}><Pill tone={status === 'Strong' ? 'positive' : 'warning'}>{status}</Pill><Text style={[styles.smallText, { color: colors.mutedForeground }]}>{item.momentum} · approved source</Text></View>
              <MarketEvidenceDetails source={item.source} sourceUrl={item.sourceUrl} provenance={item.provenance} />
            </View>
          );
        }) : (
         <View style={[styles.sourceCard, { backgroundColor: colors.secondary }]}>
           <Text style={[styles.sourceTitle, { color: colors.foreground }]}>No scoped company signal</Text>
           <Text style={[styles.sourceBody, { color: colors.mutedForeground }]}>{companyQuery.isError ? 'The company signal source could not be reached. Try again later; this is not a negative company conclusion.' : companyQuery.isPending ? 'We are checking the public company signal source. Unknown is better than an offline baseline presented as current.' : companyQuery.data?.data.length ? 'Public signals were returned, but company scores and rankings are withheld until a versioned methodology is approved and the evidence is complete.' : 'No scoped public company signal was returned. This is unknown, not a negative company conclusion.'}</Text>
         </View>
       )}
      <View style={[styles.sourceCard, { backgroundColor: colors.secondary }]}><Text style={[styles.sourceTitle, { color: colors.foreground }]}>Company signals are not forecasts</Text><Text style={[styles.sourceBody, { color: colors.mutedForeground }]}>Use them to decide what to verify next—not to predict layoffs or outcomes.</Text></View>
    </>
  );
}

function CompanySignalGraphic({ stability }: { stability: number }) {
  const colors = useColors();
  const marker = Math.max(12, Math.min(308, 12 + (296 * Math.max(0, Math.min(stability, 100))) / 100));
  return (
    <View
      accessible
      accessibilityLabel={`Public stability signal ${stability} out of 100`}
      style={styles.companyGraphic}
    >
      <Svg width="100%" height={44} viewBox="0 0 320 44" preserveAspectRatio="none" accessibilityElementsHidden>
        <Line x1="12" y1="21" x2="308" y2="21" stroke={colors.secondary} strokeWidth="6" strokeLinecap="round" />
        <Path d="M 12 21 C 68 8, 104 35, 160 21 S 250 8, 308 21" fill="none" stroke={colors.primary} strokeOpacity="0.55" strokeWidth="2" />
        <Circle cx={marker} cy="21" r="6" fill={colors.primary} stroke={colors.card} strokeWidth="3" />
      </Svg>
      <View style={styles.companyGraphicLabels}>
        <Text style={[styles.smallText, { color: colors.mutedForeground }]}>Watch</Text>
        <Text style={[styles.smallText, { color: colors.primary }]}>Signal position · {stability}</Text>
        <Text style={[styles.smallText, { color: colors.mutedForeground }]}>Steady</Text>
      </View>
    </View>
  );
}

function experienceBandFor(value: string) {
  const years = Number(value.match(/\d+(?:\.\d+)?/)?.[0] ?? 0);
  if (years <= 2) return '0–2 years';
  if (years <= 5) return '3–5 years';
  if (years <= 8) return '5–8 years';
  return '9+ years';
}

function AiPanel({ role, skills }: { role: string; skills?: string[] }) {
  const colors = useColors();
  return (
    <>
       <SectionHeader title="Your AI exposure map" action={role} />
      <View style={[styles.aiHero, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.aiScoreRow}><View><Text style={[styles.label, { color: colors.mutedForeground }]}>TASK-LEVEL LENS</Text><Text style={[styles.aiScore, { color: colors.foreground }]}>Qualitative</Text></View><Pill tone="positive">Evidence needed</Pill></View>
        <Text style={[styles.aiBody, { color: colors.mutedForeground }]}>This is a task map, not a prediction of job displacement. Use it to choose where to automate, augment, or deepen judgment.</Text>
        <View style={[styles.aiLegend, { backgroundColor: colors.secondary }]}><View style={[styles.aiLegendDot, { backgroundColor: colors.primary }]} /><Text style={[styles.smallText, { color: colors.mutedForeground }]}>Role context + resume evidence · no unsupported resilience score</Text></View>
      </View>
       <SectionHeader title="Task map" />
       {skills?.length ? <Text style={[styles.sourceBody, { color: colors.mutedForeground }]}>Resume skills in view: {skills.join(' · ')} · evidence is user-provided.</Text> : null}
      {[
        ['SQL generation', 'Automate', 78, 'warning'],
        ['Data architecture', 'Master', 27, 'positive'],
        ['Stakeholder management', 'Augment', 18, 'positive'],
        ['Pipeline monitoring', 'Delegate', 66, 'warning'],
      ].map(([label, action, value, tone]) => (
        <View key={label} style={styles.taskRow}><View style={styles.taskCopy}><Text style={[styles.taskLabel, { color: colors.foreground }]}>{label}</Text><Text style={[styles.smallText, { color: tone === 'warning' ? colors.warning : colors.success }]}>{action}</Text></View><View style={styles.taskBar}><ProgressBar value={Number(value)} color={tone === 'warning' ? colors.warning : colors.primary} /></View><Text style={[styles.smallText, { color: colors.mutedForeground }]}>{value}%</Text></View>
      ))}
      <SectionHeader title="30-day roadmap" action="Build leverage" />
      <View style={[styles.roadmapCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {[
          ['01', 'Choose one workflow', 'Map a pipeline where AI can remove toil without removing judgment.'],
          ['02', 'Ship a proof point', 'Turn the result into a measurable before/after story.'],
          ['03', 'Make it legible', 'Add the story to your portfolio and next interview narrative.'],
        ].map(([number, title, body]) => (
          <View key={number} style={styles.roadmapRow}><View style={[styles.roadmapNumber, { backgroundColor: colors.secondary }]}><Text style={[styles.roadmapNumberText, { color: colors.primary }]}>{number}</Text></View><View style={styles.roadmapCopy}><Text style={[styles.taskLabel, { color: colors.foreground }]}>{title}</Text><Text style={[styles.smallText, { color: colors.mutedForeground }]}>{body}</Text></View></View>
        ))}
      </View>
      <View style={[styles.sourceCard, { backgroundColor: colors.secondary }]}><Text style={[styles.sourceTitle, { color: colors.foreground }]}>The useful distinction</Text><Text style={[styles.sourceBody, { color: colors.mutedForeground }]}>Task automation is not the same as job displacement. Build leverage where human judgment compounds.</Text></View>
    </>
  );
}

const styles = StyleSheet.create({
  segmented: { flexDirection: 'row', borderRadius: 13, padding: 4, gap: 3 },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: 10 },
  segmentText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  rangeCard: { borderWidth: 1, borderRadius: 17, padding: 17, gap: 20 },
  rangeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  label: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  range: { fontFamily: 'Inter_700Bold', fontSize: 27, letterSpacing: -0.8, marginTop: 6 },
  rangeGraphic: { gap: 2 },
  rangeGraphicLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  rangeGraphicNote: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15, marginTop: 6 },
  rangeLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  ctcCard: { borderWidth: 1, borderRadius: 17, padding: 17, gap: 14 },
  ctcHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 2 },
  ctcRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
  ctcShare: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ctcValue: { fontFamily: 'Inter_700Bold', fontSize: 13, width: 55, textAlign: 'right' },
  smallText: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  insightRow: { borderTopWidth: 1, paddingTop: 15, gap: 7 },
  insightValue: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  factorList: { gap: 18 },
  factor: { gap: 9 },
  factorText: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  factorLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  factorBar: { width: '100%' },
  sourceCard: { borderRadius: 15, padding: 15, marginTop: 20, gap: 7 },
  sourceTitle: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  sourceBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  resumeBridge: { borderRadius: 15, padding: 15, marginTop: 17, gap: 6 },
  resumeBridgeTitle: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  resumeBridgeBody: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18 },
  resumeBridgeSource: { fontFamily: 'Inter_600SemiBold', fontSize: 10, lineHeight: 15 },
  companyCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 16, marginBottom: 10 },
  companyTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  companyMark: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  companyMarkText: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  companyCopy: { flex: 1, gap: 4 },
  companyName: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  companyScore: { fontFamily: 'Inter_700Bold', fontSize: 25 },
  companyBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  companyGraphic: { gap: 1 },
  companyGraphicLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aiHero: { borderWidth: 1, borderRadius: 17, padding: 18, gap: 15 },
  aiScoreRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  aiScore: { fontFamily: 'Inter_700Bold', fontSize: 33, marginTop: 5 },
  aiBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  aiLegend: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, padding: 9 },
  aiLegendDot: { width: 7, height: 7, borderRadius: 4 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  taskCopy: { width: 128, gap: 4 },
  taskLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  taskBar: { flex: 1 },
  roadmapCard: { borderWidth: 1, borderRadius: 17, padding: 16, gap: 16 },
  roadmapRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  roadmapNumber: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  roadmapNumberText: { fontFamily: 'Inter_700Bold', fontSize: 10 },
  roadmapCopy: { flex: 1, gap: 5, paddingTop: 2 },
});