import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { listLayoffSignals, listPublicCompanySignals, listSalaryBenchmarks, type SalaryBenchmark } from '@workspace/api-client-react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MarketEvidenceDetails } from '@/components/market-evidence';
import { useColors } from '@/hooks/useColors';
import { useCareer } from '@/context/career-context';
import { Header, IconButton, Pill, ProfileSetupCard, ProgressBar, Screen, SectionHeader, SignalCard } from '@/components/career-ui';
import { fetchCareerBrief, isCareerProfileNotConfiguredError } from '@/lib/career-api';
import { formatHomeDate } from '@/lib/planning-date';
import { evidenceStatusLabel, isUsableCompanyScoreEvidence, isUsableLayoffEvidence, isUsableSalaryEvidence } from '@/lib/public-evidence';
import { parseAnnualCtc } from '@/lib/relocation';

function isE2ESignedIn(): boolean {
  return __DEV__
    && typeof window !== 'undefined'
    && (
      new URLSearchParams(window.location.search).get('e2e-auth') === 'signed-in'
      || window.localStorage.getItem('career-reality-e2e-auth') === 'signed-in'
    );
}

type DecisionTool = {
  key: string;
  title: string;
  question: string;
  body: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  route: string;
  testID: string;
};

const decisionTools: DecisionTool[] = [
  {
    key: 'promotion',
    title: 'Promotion readiness',
    question: 'Are you ready for the next remit?',
    body: 'Rate scope, impact, skills, and manager sponsorship. Save the proof point you can defend.',
    icon: 'trending-up',
    route: '/promotion',
    testID: 'button-open-promotion-readiness',
  },
  {
    key: 'manager-risk',
    title: 'Manager + team risk',
    question: 'What is the environment around your work?',
    body: 'Separate manager patterns, team conditions, and evidence gaps before making a big move.',
    icon: 'shield',
    route: '/manager-risk',
    testID: 'button-open-manager-risk',
  },
  {
    key: 'relocation',
    title: 'Relocation comparison',
    question: 'Would a move actually improve your position?',
    body: 'Compare transparent city assumptions before you treat relocation as the answer.',
    icon: 'map-pin',
    route: '/relocation',
    testID: 'button-open-relocation',
  },
  {
    key: 'network',
    title: 'Network intelligence',
    question: 'What is the next specific ask?',
    body: 'Separate warm evidence from wishful thinking before you ask for access.',
    icon: 'users',
    route: '/network-intelligence',
    testID: 'button-open-network-intelligence',
  },
  {
    key: 'what-if',
    title: 'What-if simulations',
    question: 'What changes if you stay, switch, or move?',
    body: 'Test one assumption at a time before you turn a possibility into a plan.',
    icon: 'sliders',
    route: '/what-if',
    testID: 'button-open-what-if',
  },
  {
    key: 'peer-benchmarks',
    title: 'Anonymous peer benchmarks',
    question: 'How do you compare with a protected cohort?',
    body: 'See scoped salary ranges only when the peer group is large enough to protect privacy.',
    icon: 'lock',
    route: '/peer-benchmarks',
    testID: 'button-open-peer-benchmarks',
  },
];

export default function HomeScreen() {
  const colors = useColors();
  const { profile, brutalMode, resumeIntelligence, marketRefreshSummary, marketRefreshHistory } = useCareer();
  const { isSignedIn } = useAuth();
  const signedIn = Boolean(isSignedIn || isE2ESignedIn());
  const briefQuery = useQuery({
    queryKey: ['career-brief', profile.role, profile.city, profile.target],
    queryFn: fetchCareerBrief,
    enabled: Boolean(signedIn && profile.role),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const brief = briefQuery.data;
  const profileMissing = isCareerProfileNotConfiguredError(briefQuery.error);
  const signalQueriesEnabled = Boolean(signedIn && brief);
  const salaryQuery = useQuery({
    queryKey: ['home-salary-benchmark', profile.role, profile.city, profile.experience],
    queryFn: () => listSalaryBenchmarks({ role: profile.role, city: profile.city, experienceBand: experienceBandFor(profile.experience) }),
    enabled: signalQueriesEnabled,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
  const companyQuery = useQuery({
    queryKey: ['home-company-signal', profile.company],
    queryFn: () => listPublicCompanySignals({ query: profile.company }),
    enabled: signalQueriesEnabled && Boolean(profile.company),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
  const layoffQuery = useQuery({
    queryKey: ['home-layoff-signals', profile.company],
    queryFn: () => listLayoffSignals({ query: profile.company }),
    enabled: signalQueriesEnabled && Boolean(profile.company),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
  const greet = brutalMode ? 'No hype. Just the read.' : `Good evening, ${profile.name}.`;
  const resumeSkills = resumeIntelligence?.skills.slice(0, 3).map((skill) => skill.name).join(' · ');
  const liveSource = resumeIntelligence?.sources.find((source) => source.label !== 'Resume evidence');
  const benchmark = salaryQuery.isError
    ? undefined
    : salaryQuery.data?.data.find(isUsableSalaryEvidence);
  const company = companyQuery.isError
    ? undefined
    : companyQuery.data?.data.find(isUsableCompanyScoreEvidence);
  const layoff = layoffQuery.isError
    ? undefined
    : layoffQuery.data?.data.find(isUsableLayoffEvidence);
  const profileCompleteness = profileFieldCount(profile);
  const [planSaved, setPlanSaved] = React.useState(false);
  const [proofExpanded, setProofExpanded] = React.useState(false);
  const [openTool, setOpenTool] = React.useState<string | null>(null);

  if (profileMissing) {
    return (
      <Screen>
        <Header
          eyebrow="CAREERREALITY · START HERE"
          title="Build your brief."
          action={<IconButton icon="bell" label="Notifications" onPress={() => Haptics.selectionAsync()} />}
        />
        <View style={styles.setupIntro}>
          <Text style={[styles.setupIntroEyebrow, { color: colors.primary }]}>A BETTER STARTING POINT</Text>
          <Text style={[styles.setupIntroTitle, { color: colors.foreground }]}>Make the read about your reality, not a generic career story.</Text>
          <Text style={[styles.setupIntroBody, { color: colors.mutedForeground }]}>Add the context behind your next move. We’ll keep the evidence, uncertainty, and action visible.</Text>
        </View>
        <ProfileSetupCard
          testID="home-profile-setup-needed"
          title="Set up your career context"
          body="Tell us your role, location, experience, current CTC, and direction. Your resume can come later."
          buttonLabel="Build my brief"
          onPress={() => router.push('/onboarding')}
        />
        <SectionHeader title="Your brief will answer" />
        <SignalCard label="What changed" text="Fresh market signals scoped to your role and city." source="After profile setup · source-labeled" />
        <SignalCard label="What it means for you" text="A personal interpretation that separates evidence from assumptions." source="After profile setup · confidence-labeled" />
        <SignalCard label="What you should do next" text="One concrete move you can add to Plan and revisit." source="After profile setup · directional" tone="accent" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        eyebrow={formatHomeDate()}
        title={greet}
        action={<IconButton icon="bell" label="Notifications" onPress={() => Haptics.selectionAsync()} />}
      />

      <View testID="home-career-intelligence" style={[styles.opening, { backgroundColor: colors.primary }]}>
        <View style={styles.openingTop}>
          <View style={styles.openingIcon}><Feather name="activity" size={17} color={colors.primaryForeground} /></View>
          <View style={styles.groundedBadge}>
            <View style={[styles.groundedDot, { backgroundColor: colors.primaryForeground }]} />
            <Text style={[styles.groundedText, { color: colors.primaryForeground }]}>
              {brief ? 'Read is grounded' : 'Read is assembling'}
            </Text>
          </View>
        </View>
        <Text style={[styles.openingEyebrow, { color: colors.primaryForeground }]}>THE SHORT READ</Text>
        <Text style={[styles.openingTitle, { color: colors.primaryForeground }]}>
          {brief?.headline ?? 'Your career read is taking shape.'}
        </Text>
        <Text style={[styles.openingBody, { color: colors.primaryForeground }]}>
          {brief?.diagnosis ?? 'We are checking the evidence behind your role, market, and next direction.'}
        </Text>
        <View style={styles.openingFooter}>
          <Text style={[styles.openingFooterText, { color: colors.primaryForeground }]}>
            <Feather name="file-text" size={12} color={colors.primaryForeground} /> {brief ? `${brief.evidence.length} source-backed signals` : 'Reading market signals'}
          </Text>
          <Text style={[styles.openingFooterText, { color: colors.primaryForeground }]}>
            <Feather name="clock" size={12} color={colors.primaryForeground} /> {brief?.freshness ?? 'Freshness pending'}
          </Text>
        </View>
      </View>

      <View style={[styles.meaningCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.briefLabelRow}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>WHAT THIS MEANS</Text>
          <Text style={[styles.briefNumber, { color: colors.mutedForeground }]}>01 / 04</Text>
        </View>
        <Text style={[styles.meaningTitle, { color: colors.foreground }]}>
          {brief?.headline ?? 'Make the next move easier to defend.'}
        </Text>
        <Text style={[styles.meaningBody, { color: colors.mutedForeground }]}>
          {brief?.nextMove ?? 'The market read will separate what is known from what still needs your evidence.'}
        </Text>
        <View style={[styles.readItem, { borderTopColor: colors.border }]}>
          <View style={[styles.readIcon, { backgroundColor: colors.secondary }]}><Feather name="check" size={13} color={colors.primary} /></View>
          <View style={styles.readCopy}>
            <Text style={[styles.readLabel, { color: colors.foreground }]}>Known so far</Text>
            <Text style={[styles.readText, { color: colors.mutedForeground }]}>Your role, location, experience, and current signals.</Text>
          </View>
        </View>
        <View style={[styles.readItem, { borderTopColor: colors.border }]}>
          <View style={[styles.readIcon, { backgroundColor: colors.background }]}><Feather name="target" size={13} color={colors.accent} /></View>
          <View style={styles.readCopy}>
            <Text style={[styles.readLabel, { color: colors.foreground }]}>Still to prove</Text>
            <Text style={[styles.readText, { color: colors.mutedForeground }]}>The scope and sponsorship behind your next step.</Text>
          </View>
        </View>
      </View>

      <View style={[styles.contextCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.contextAvatar, { backgroundColor: colors.secondary }]}>
          <Feather name="user" size={17} color={colors.primary} />
        </View>
        <View style={styles.contextCopy}>
          <Text style={[styles.contextEyebrow, { color: colors.mutedForeground }]}>YOUR CONTEXT</Text>
          <Text style={[styles.contextRole, { color: colors.foreground }]}>{profile.role}</Text>
          <Text style={[styles.contextMeta, { color: colors.mutedForeground }]}>{profile.company} · {profile.city} · {profile.experience}</Text>
        </View>
        <Text style={[styles.contextFreshness, { color: colors.primary }]}>Captured</Text>
      </View>
      <View style={[styles.coverageRow, { borderColor: colors.border }]}>
        <View style={styles.coverageCopy}>
          <Text style={[styles.coverageLabel, { color: colors.mutedForeground }]}>CONTEXT CAPTURED</Text>
          <Text style={[styles.coverageHint, { color: colors.mutedForeground }]}>Resume evidence can sharpen the read later.</Text>
        </View>
        <View style={styles.coverageMeter}>
          <Text style={[styles.coverageValue, { color: colors.primary }]}>{profileCompleteness}%</Text>
          <ProgressBar value={profileCompleteness} />
        </View>
      </View>

      <View style={styles.sectionHeading}>
        <View style={styles.sectionHeadingCopy}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>KNOWN EVIDENCE</Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your position in the market</Text>
        </View>
        <Text style={[styles.sectionDetail, { color: colors.primary }]}>
          {benchmark?.provenance.status === 'ESTIMATED' ? 'Directional context' : 'Source-backed'}
        </Text>
      </View>
      <View style={styles.marketGrid}>
        <View style={[styles.marketStat, styles.marketStatPrimary, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <View style={styles.statTopline}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>COMPENSATION</Text>
            <Feather name="trending-up" size={15} color={colors.primary} />
          </View>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{benchmark ? formatLakh(benchmark.median) : salaryQuery.isPending ? 'Reading' : 'Not scoped'}</Text>
          <Text style={[styles.statCaption, { color: colors.mutedForeground }]}>{benchmark ? benchmark.provenance.status === 'ESTIMATED' ? 'estimated median · context only' : 'median, scoped market' : 'No usable benchmark returned'}</Text>
          <Text style={[styles.statSource, { color: colors.mutedForeground }]}>{benchmark ? `n=${benchmark.sampleSize} · source retrieved ${benchmark.provenance.retrievedDate}` : 'Unknown is kept visible'}</Text>
        </View>
        <View style={[styles.marketStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statTopline}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>COMPANY SIGNAL</Text>
            <Feather name="shield" size={15} color={colors.primary} />
          </View>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{company ? 'Available' : companyQuery.isPending ? 'Reading' : 'Not matched'}</Text>
          <Text style={[styles.statCaption, { color: colors.mutedForeground }]}>{company ? `${company.momentum} momentum` : 'No company conclusion yet'}</Text>
          <Text style={[styles.statSource, { color: colors.mutedForeground }]}>{company ? 'Public company signal' : companyQuery.isError ? 'Source unavailable' : companyQuery.isPending ? 'Source pending' : companyQuery.data?.data.length ? 'Score withheld: method unapproved' : 'No scoped signal returned'}</Text>
        </View>
      </View>

      <MarketRangeCard benchmark={benchmark} annualCtc={parseAnnualCtc(profile.ctc) ?? undefined} isLoading={salaryQuery.isPending} isError={salaryQuery.isError} />

      <View style={styles.sectionHeading}>
        <View style={styles.sectionHeadingCopy}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>EVIDENCE LOG</Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>What the evidence says</Text>
        </View>
        <Text style={[styles.sectionDetail, { color: colors.primary }]}>{brief ? `${brief.evidence.length} signals` : 'Reading'}</Text>
      </View>
      {brief?.evidence.length ? brief.evidence.map((evidence) => (
        <View key={`${evidence.label}-${evidence.value}`} style={[styles.evidenceRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.evidenceMark, { backgroundColor: evidence.confidence === 'Low' ? colors.warning : colors.primary }]} />
          <View style={styles.evidenceCopy}>
            <View style={styles.evidenceTopline}>
              <Text style={[styles.evidenceLabel, { color: evidence.confidence === 'Low' ? colors.warning : colors.primary }]}>{evidence.label}</Text>
              <Text style={[styles.evidenceConfidence, { color: colors.mutedForeground }]}>{evidence.confidence}</Text>
            </View>
            <Text style={[styles.evidenceText, { color: colors.foreground }]}>{evidence.value}</Text>
            <Text style={[styles.evidenceSource, { color: colors.mutedForeground }]}>{evidence.source} · {evidence.freshness}</Text>
          </View>
        </View>
      )) : (
        <View style={[styles.evidenceRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.evidenceMark, { backgroundColor: colors.warning }]} />
          <View style={styles.evidenceCopy}>
            <Text style={[styles.evidenceLabel, { color: colors.warning }]}>EVIDENCE IS ASSEMBLING</Text>
            <Text style={[styles.evidenceText, { color: colors.foreground }]}>We will not turn your profile into a market conclusion until a scoped signal is available.</Text>
            <Text style={[styles.evidenceSource, { color: colors.mutedForeground }]}>Live brief · unknown until source returns</Text>
          </View>
        </View>
      )}
      {layoff ? (
        <View style={[styles.evidenceRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.evidenceMark, { backgroundColor: colors.warning }]} />
          <View style={styles.evidenceCopy}>
            <Text style={[styles.evidenceLabel, { color: colors.warning }]}>COMPANY WATCH</Text>
            <Text style={[styles.evidenceText, { color: colors.foreground }]}>{layoff.signal}</Text>
            <Text style={[styles.evidenceSource, { color: colors.mutedForeground }]}>{layoff.source} · retrieved {layoff.provenance.retrievedDate} · {evidenceStatusLabel(layoff.provenance.status)} · {layoff.confidence} confidence</Text>
            <MarketEvidenceDetails source={layoff.source} sourceUrl={layoff.sourceUrl} provenance={layoff.provenance} />
          </View>
        </View>
      ) : null}

      <View style={styles.sectionHeading}>
        <View style={styles.sectionHeadingCopy}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>INTERPRETATION</Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>What this means for you</Text>
        </View>
        <Text style={[styles.sectionDetail, { color: colors.primary }]}>Personal read</Text>
      </View>
      <View style={[styles.interpretationCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <View style={[styles.interpretationIcon, { backgroundColor: colors.primary }]}><Feather name="star" size={15} color={colors.primaryForeground} /></View>
        <View style={styles.interpretationCopy}>
            <Text style={[styles.interpretationTitle, { color: colors.foreground }]}>The engine read</Text>
          <Text style={[styles.interpretationBody, { color: colors.mutedForeground }]}>{brief?.diagnosis ?? 'A personal diagnosis will appear after the market evidence is ready.'}</Text>
          <Text style={[styles.interpretationSource, { color: colors.mutedForeground }]}>{brief ? `CareerReality brief · ${brief.freshness} · ${brief.confidence} confidence` : 'No live brief loaded'}</Text>
        </View>
       </View>
       {brief?.whatChanged && brief.whatChanged.status !== 'initial' ? (
         <View testID="home-brief-change" style={[styles.changeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
           <View style={styles.changeHeader}>
             <Feather name={brief.whatChanged.status === 'insufficient' ? 'alert-circle' : 'refresh-cw'} size={15} color={brief.whatChanged.status === 'insufficient' ? colors.warning : colors.primary} />
             <Text style={[styles.eyebrow, { color: brief.whatChanged.status === 'insufficient' ? colors.warning : colors.primary }]}>SINCE YOUR LAST READ</Text>
           </View>
           <Text style={[styles.changeSummary, { color: colors.foreground }]}>{brief.whatChanged.summary}</Text>
           {brief.whatChanged.details.slice(0, 3).map((detail, index) => (
             <View key={`${detail.category}-${detail.summary}-${index}`} style={[styles.changeDetail, { borderTopColor: colors.border }]}>
               <Text style={[styles.changeDetailText, { color: colors.mutedForeground }]}>{detail.summary}</Text>
               <Text style={[styles.evidenceSource, { color: colors.mutedForeground }]}>{detail.source} · {detail.freshness}</Text>
             </View>
           ))}
         </View>
       ) : null}
       {resumeIntelligence ? (
        <View style={[styles.resumeContext, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>RESUME-INFORMED CONTEXT</Text>
          <Text style={[styles.resumeBody, { color: colors.foreground }]}>{resumeIntelligence.marketSummary}</Text>
          <Text style={[styles.evidenceSource, { color: colors.mutedForeground }]}>{(marketRefreshHistory[0] ?? marketRefreshSummary)?.text ?? 'Latest resume market read'} · {liveSource?.source ?? 'Resume evidence'}</Text>
        </View>
      ) : null}

      <View style={[styles.proofCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <View style={styles.proofTop}>
          <View style={[styles.proofIcon, { backgroundColor: colors.card }]}><Feather name="help-circle" size={16} color={colors.primary} /></View>
          <View style={styles.proofHeading}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>EVIDENCE TO GATHER</Text>
            <Text style={[styles.proofTitle, { color: colors.foreground }]}>The unanswered parts are deliberate.</Text>
          </View>
        </View>
        <Text style={[styles.proofBody, { color: colors.mutedForeground }]}>We will not turn missing context into a made-up score. These areas need your experience, not a guess from the market.</Text>
        <View style={styles.openAreas}>
          {['Promotion readiness', 'Manager patterns', 'Switch readiness'].map((item) => (
            <View key={item} style={[styles.openArea, { borderColor: colors.border }]}>
              <Text style={[styles.openAreaText, { color: colors.mutedForeground }]}>{item}</Text>
            </View>
          ))}
        </View>
        <Pressable
          onPress={() => setProofExpanded((expanded) => !expanded)}
          accessibilityRole="button"
          accessibilityLabel={proofExpanded ? 'Hide evidence prompts' : 'Add one proof point'}
          accessibilityState={{ expanded: proofExpanded }}
          testID="button-toggle-proof"
          style={({ pressed }) => [styles.outlineButton, { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.78 : 1 }]}
        >
          <Text style={[styles.outlineButtonText, { color: colors.primary }]}>{proofExpanded ? 'Hide evidence prompts' : 'Add one proof point'}</Text>
          <Feather name={proofExpanded ? 'chevron-up' : 'chevron-down'} size={15} color={colors.primary} />
        </Pressable>
        {proofExpanded ? (
          <View style={[styles.proofPrompt, { backgroundColor: colors.card }]}>
            <Text style={[styles.proofPromptLabel, { color: colors.accent }]}>NEXT</Text>
            <Text style={[styles.proofPromptText, { color: colors.foreground }]}>Write down one outcome where you aligned another team, changed a decision, or moved a measurable result.</Text>
            <Pressable onPress={() => router.push('/promotion')} accessibilityRole="button" accessibilityLabel="Save a draft proof point" testID="button-save-proof-draft">
              <Text style={[styles.inlineAction, { color: colors.primary }]}>Save a draft <Feather name="arrow-up-right" size={13} color={colors.primary} /></Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.sectionHeading}>
        <View style={styles.sectionHeadingCopy}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>NEXT ACTION</Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>One thing to do this week</Text>
        </View>
        <Text style={[styles.sectionDetail, { color: colors.primary }]}>Low effort · high signal</Text>
      </View>
      <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: planSaved ? colors.primary : colors.border }]}>
        <View style={[styles.planIcon, { backgroundColor: planSaved ? colors.primary : colors.secondary }]}>
          <Feather name={planSaved ? 'check' : 'target'} size={17} color={planSaved ? colors.primaryForeground : colors.primary} />
        </View>
        <View style={styles.planCopy}>
          <Text style={[styles.planTitle, { color: colors.foreground }]}>{brief?.nextMove || 'Turn one capability into a proof point'}</Text>
          <Text style={[styles.planBody, { color: colors.mutedForeground }]}>Choose a small, observable action this week and add the result to your promotion story.</Text>
        </View>
        <View style={[styles.planFooter, { borderTopColor: colors.border }]}>
          <Pill tone="positive">{planSaved ? 'Saved to Plan' : 'Expected impact · High'}</Pill>
          <View style={styles.planActions}>
            <Pressable
              onPress={() => setPlanSaved((saved) => !saved)}
              accessibilityRole="button"
              accessibilityLabel={planSaved ? 'Remove from Plan' : 'Save to Plan'}
              testID="button-save-plan"
            >
              <Text style={[styles.link, { color: colors.primary }]}>{planSaved ? 'Remove' : 'Save'} <Feather name={planSaved ? 'check' : 'plus'} size={12} color={colors.primary} /></Text>
            </Pressable>
            <Pressable onPress={() => router.push('/(tabs)/plan')} accessibilityRole="button" accessibilityLabel="Open Plan" testID="button-open-plan">
              <Text style={[styles.link, { color: colors.primary }]}>Open Plan <Feather name="arrow-up-right" size={12} color={colors.primary} /></Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeading}>
        <View style={styles.sectionHeadingCopy}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>WHEN THE QUESTION CHANGES</Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Keep this brief close</Text>
        </View>
        <Text style={[styles.sectionDetail, { color: colors.primary }]}>Decision tools</Text>
      </View>
      <View style={styles.toolsList}>
        {decisionTools.map((tool) => {
          const isOpen = openTool === tool.key;
          return (
            <View key={tool.key} style={[styles.toolCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Pressable
                onPress={() => setOpenTool(isOpen ? null : tool.key)}
                accessibilityRole="button"
                accessibilityLabel={tool.title}
                accessibilityState={{ expanded: isOpen }}
                testID={tool.testID}
                style={({ pressed }) => [styles.toolTrigger, { opacity: pressed ? 0.78 : 1 }]}
              >
                <View style={[styles.toolIcon, { backgroundColor: colors.primary }]}><Feather name={tool.icon} size={16} color={colors.primaryForeground} /></View>
                <View style={styles.toolCopy}>
                  <Text style={[styles.toolLabel, { color: colors.primary }]}>{tool.title}</Text>
                  <Text style={[styles.toolQuestion, { color: colors.foreground }]} numberOfLines={isOpen ? undefined : 1}>{tool.question}</Text>
                </View>
                <Feather name={isOpen ? 'chevron-up' : 'chevron-right'} size={16} color={colors.mutedForeground} />
              </Pressable>
              {isOpen ? (
                <View style={styles.toolDetail} testID={`decision-tool-details-${tool.key}`}>
                  <Text style={[styles.toolBody, { color: colors.mutedForeground }]}>{tool.body}</Text>
                  <Pressable onPress={() => router.push(tool.route as never)} accessibilityRole="button" accessibilityLabel={`Open ${tool.title} decision tool`} testID={`button-open-${tool.key}`}>
                    <Text style={[styles.inlineAction, { color: colors.primary }]}>Open decision tool <Feather name="arrow-up-right" size={13} color={colors.primary} /></Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Compare job offers and tax regimes"
        testID="button-open-offer-tax-tools"
        onPress={() => router.push('/offer-tax-tools')}
        style={({ pressed }) => [styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.72 : 1 }]}
      >
        <View style={styles.toolTrigger}>
          <View style={[styles.toolIcon, { backgroundColor: colors.primary }]}><Feather name="dollar-sign" size={16} color={colors.primaryForeground} /></View>
          <View style={styles.toolCopy}>
            <Text style={[styles.toolLabel, { color: colors.primary }]}>Offer + tax comparison</Text>
            <Text style={[styles.toolQuestion, { color: colors.foreground }]}>Compare take-home scenarios or tax regimes.</Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </View>
      </Pressable>

      <View style={[styles.copilotCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <View style={[styles.copilotIcon, { backgroundColor: colors.primary }]}><Feather name="message-circle" size={17} color={colors.primaryForeground} /></View>
        <View style={styles.copilotCopy}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>CAREER COPILOT</Text>
          <Text style={[styles.copilotTitle, { color: colors.foreground }]}>Ask for the next move.</Text>
          <Text style={[styles.copilotBody, { color: colors.mutedForeground }]}>Get assumptions, evidence, uncertainty, and one practical next action.</Text>
        </View>
        <Pressable onPress={() => router.push('/copilot')} accessibilityRole="button" testID="button-open-copilot" accessibilityLabel="Open Career Copilot" style={[styles.copilotButton, { backgroundColor: colors.primary }]}>
          <Feather name="arrow-up-right" size={16} color={colors.primaryForeground} />
        </Pressable>
      </View>
       {signedIn && !profileMissing ? (
         <Pressable
           onPress={() => router.push('/brief-history')}
           accessibilityRole="button"
           accessibilityLabel="View brief history"
           testID="button-open-brief-history"
           style={({ pressed }) => [styles.historyLink, { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.72 : 1 }]}
         >
           <Feather name="clock" size={15} color={colors.primary} />
           <Text style={[styles.historyLinkText, { color: colors.primary }]}>View how your read changed</Text>
           <Feather name="arrow-up-right" size={14} color={colors.primary} />
         </Pressable>
       ) : null}

      <View style={styles.disclaimer}>
        <Feather name="info" size={14} color={colors.mutedForeground} />
        <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>Every conclusion is scoped to its source, freshness, confidence, and missing context. Unknown is a valid result.</Text>
        <Feather name="chevron-right" size={15} color={colors.primary} />
      </View>
    </Screen>
  );
}

function experienceBandFor(value: string): string {
  const years = Number(value.match(/\d+(?:\.\d+)?/)?.[0] ?? 0);
  if (years <= 2) return '0–2 years';
  if (years <= 5) return '3–5 years';
  if (years <= 8) return '5–8 years';
  return '9+ years';
}

function profileFieldCount(profile: { name: string; situation: string; role: string; company: string; city: string; experience: string; ctc: string; target: string }): number {
  const fields = [profile.name, profile.situation, profile.role, profile.company, profile.city, profile.experience, profile.ctc, profile.target];
  return Math.round((fields.filter((value) => value.trim().length > 0).length / fields.length) * 100);
}

function formatLakh(value: number): string {
  return `₹${Math.round((value / 100000) * 10) / 10}L`;
}

function MarketRangeCard({
  benchmark,
  annualCtc,
  isLoading,
  isError,
}: {
  benchmark?: SalaryBenchmark;
  annualCtc?: number;
  isLoading: boolean;
  isError: boolean;
}) {
  const colors = useColors();
  const estimated = benchmark?.provenance.status === 'ESTIMATED';
  const currentPosition = benchmark && annualCtc && !estimated
    ? Math.max(0, Math.min(100, ((annualCtc - benchmark.p25) / Math.max(benchmark.p75 - benchmark.p25, 1)) * 100))
    : undefined;

  return (
    <View testID="home-market-range" style={[styles.rangeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.rangeHeader}>
        <View style={styles.rangeCopy}>
          <Text style={[styles.rangeEyebrow, { color: colors.mutedForeground }]}>{estimated ? 'DIRECTIONAL COMPENSATION CONTEXT' : 'COMPENSATION POSITION'}</Text>
          <Text style={[styles.rangeTitle, { color: colors.foreground }]}>
            {benchmark ? `${formatLakh(benchmark.p25)} — ${formatLakh(benchmark.p75)}` : isLoading ? 'Reading your market range…' : isError ? 'Market range unavailable' : 'No scoped range yet'}
          </Text>
        </View>
        <Pill tone={estimated || isError ? 'warning' : benchmark ? 'positive' : 'accent'}>{benchmark ? estimated ? 'Estimated · context only' : benchmark.confidence : isError ? 'Unknown' : 'Directional'}</Pill>
      </View>
      {benchmark ? (
        <>
          <View style={styles.rangeTrackWrap}>
            <View style={[styles.rangeTrack, { backgroundColor: colors.secondary }]} />
            {currentPosition !== undefined ? <View testID="home-market-current-marker" style={[styles.rangeMarker, { backgroundColor: colors.accent, borderColor: colors.card, left: `${currentPosition}%` }]} /> : null}
          </View>
          <View style={styles.rangeLabels}>
            <Text style={[styles.rangeLabel, { color: colors.mutedForeground }]}>25th · {formatLakh(benchmark.p25)}</Text>
            <Text style={[styles.rangeLabel, { color: colors.mutedForeground }]}>Median · {formatLakh(benchmark.median)}</Text>
            <Text style={[styles.rangeLabel, { color: colors.mutedForeground }]}>75th · {formatLakh(benchmark.p75)}</Text>
          </View>
          <View style={[styles.rangeFooter, { borderTopColor: colors.border }]}>
            <Text style={[styles.rangeFooterLabel, { color: colors.mutedForeground }]}>YOUR INPUT</Text>
            <Text style={[styles.rangeFooterValue, { color: colors.foreground }]}>{annualCtc ? estimated ? `${formatLakh(annualCtc)} · not compared` : `${formatLakh(annualCtc)} · ${annualCtc >= benchmark.median ? 'at or above median' : 'below median'}` : 'CTC not shared'}</Text>
          </View>
          <Text style={[styles.rangeSource, { color: colors.mutedForeground }]}>{benchmark.source} · n={benchmark.sampleSize} · retrieved {benchmark.provenance.retrievedDate}</Text>
          {estimated ? <Text style={[styles.rangeSource, { color: colors.warning }]}>Estimated evidence is context only and is excluded from decision scores.</Text> : null}
          <MarketEvidenceDetails source={benchmark.source} sourceUrl={benchmark.sourceUrl} provenance={benchmark.provenance} />
        </>
      ) : (
        <Text style={[styles.rangeEmpty, { color: colors.mutedForeground }]}>{isError ? 'The source did not return a usable benchmark. This is an unknown, not a negative compensation conclusion.' : 'A scoped benchmark will appear here when the market source returns.'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  opening: { borderRadius: 22, padding: 20, gap: 14 },
  openingTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  openingIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.16)' },
  groundedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', flexShrink: 1 },
  groundedDot: { width: 6, height: 6, borderRadius: 3 },
  groundedText: { flexShrink: 1, fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  openingEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.4, opacity: 0.72 },
  openingTitle: { fontFamily: 'Inter_700Bold', fontSize: 25, lineHeight: 30, letterSpacing: -0.7 },
  openingBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, opacity: 0.86 },
  openingFooter: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.23)', paddingTop: 12, marginTop: 1 },
  openingFooterText: { flex: 1, minWidth: 0, flexShrink: 1, fontFamily: 'Inter_600SemiBold', fontSize: 10, opacity: 0.8 },
  meaningCard: { borderWidth: 1, borderRadius: 20, padding: 18, gap: 12, marginTop: 12, overflow: 'hidden' },
  briefLabelRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.25 },
  briefNumber: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 0.5 },
  meaningTitle: { fontFamily: 'Inter_700Bold', fontSize: 21, lineHeight: 26, letterSpacing: -0.45 },
  meaningBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  readItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderTopWidth: 1, paddingTop: 10 },
  readIcon: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  readCopy: { flex: 1, gap: 2 },
  readLabel: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  readText: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 15 },
  contextCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 16, padding: 13, marginTop: 12 },
  contextAvatar: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  contextCopy: { flex: 1, minWidth: 0, gap: 3 },
  contextEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 1.1 },
  contextRole: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  contextMeta: { flexShrink: 1, fontFamily: 'Inter_400Regular', fontSize: 11 },
  contextFreshness: { flexShrink: 1, alignSelf: 'flex-start', fontFamily: 'Inter_700Bold', fontSize: 10, textAlign: 'right' },
  coverageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderBottomWidth: 1, paddingHorizontal: 3, paddingVertical: 11 },
  coverageCopy: { flex: 1, gap: 3 },
  coverageLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1 },
  coverageHint: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 14 },
  coverageMeter: { width: 74, gap: 5 },
  coverageValue: { alignSelf: 'flex-end', fontFamily: 'Inter_700Bold', fontSize: 11 },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginTop: 29, marginBottom: 11 },
  sectionHeadingCopy: { flex: 1, minWidth: 0 },
  sectionTitle: { marginTop: 4, fontFamily: 'Inter_700Bold', fontSize: 18, lineHeight: 22, letterSpacing: -0.35 },
  sectionDetail: { flexShrink: 1, maxWidth: '42%', paddingBottom: 1, fontFamily: 'Inter_700Bold', fontSize: 10, textAlign: 'right' },
  marketGrid: { flexDirection: 'row', gap: 9 },
  marketStat: { flex: 1, minWidth: 0, minHeight: 136, borderWidth: 1, borderRadius: 17, padding: 14, justifyContent: 'space-between' },
  marketStatPrimary: { flex: 1.13 },
  statTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 },
  statLabel: { flex: 1, minWidth: 0, fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1 },
  statValue: { marginTop: 12, fontFamily: 'Inter_700Bold', fontSize: 25, letterSpacing: -0.6 },
  statCaption: { minHeight: 28, fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 14 },
  statSource: { fontFamily: 'Inter_400Regular', fontSize: 9, lineHeight: 13 },
  rangeCard: { borderWidth: 1, borderRadius: 17, padding: 16, gap: 14, marginTop: 9 },
  rangeHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  rangeCopy: { flex: 1, minWidth: 0, gap: 5 },
  rangeEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1 },
  rangeTitle: { fontFamily: 'Inter_700Bold', fontSize: 21, lineHeight: 26, letterSpacing: -0.4 },
  rangeTrackWrap: { height: 16, justifyContent: 'center', position: 'relative' },
  rangeTrack: { height: 7, borderRadius: 4, width: '100%' },
  rangeMarker: { width: 16, height: 16, borderRadius: 8, position: 'absolute', marginLeft: -8, borderWidth: 3 },
  rangeLabels: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 5 },
  rangeLabel: { flex: 1, minWidth: 78, fontFamily: 'Inter_400Regular', fontSize: 9 },
  rangeFooter: { borderTopWidth: 1, paddingTop: 11, gap: 4 },
  rangeFooterLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1 },
  rangeFooterValue: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  rangeSource: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15 },
  rangeEmpty: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  evidenceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 9 },
  evidenceMark: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  evidenceCopy: { flex: 1, gap: 5 },
  evidenceTopline: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  evidenceLabel: { flex: 1, minWidth: 0, fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.1 },
  evidenceConfidence: { flexShrink: 1, fontFamily: 'Inter_400Regular', fontSize: 9 },
  evidenceText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 18 },
  evidenceSource: { fontFamily: 'Inter_400Regular', fontSize: 9, lineHeight: 14 },
  interpretationCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 17, padding: 16 },
  interpretationIcon: { width: 33, height: 33, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  interpretationCopy: { flex: 1, gap: 5 },
  interpretationTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, lineHeight: 18 },
  interpretationBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  interpretationSource: { fontFamily: 'Inter_400Regular', fontSize: 9, lineHeight: 14 },
  changeCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 10, marginTop: 12 },
  changeHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  changeSummary: { fontFamily: 'Inter_600SemiBold', fontSize: 16, lineHeight: 22 },
  changeDetail: { borderTopWidth: 1, paddingTop: 10, gap: 3 },
  changeDetailText: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 19 },
  historyLink: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  historyLinkText: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 12 },
  resumeContext: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 7, marginTop: 9 },
  resumeBody: { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 18 },
  proofCard: { borderWidth: 1, borderRadius: 18, borderStyle: 'dashed', padding: 17, gap: 12, marginTop: 29 },
  proofTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  proofIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  proofHeading: { flex: 1, gap: 4 },
  proofTitle: { fontFamily: 'Inter_700Bold', fontSize: 19, lineHeight: 24, letterSpacing: -0.3 },
  proofBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  openAreas: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  openArea: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  openAreaText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  outlineButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 11 },
  outlineButtonText: { flexShrink: 1, fontFamily: 'Inter_700Bold', fontSize: 11, textAlign: 'center' },
  proofPrompt: { gap: 7, borderRadius: 12, padding: 12 },
  proofPromptLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1 },
  proofPromptText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 16 },
  inlineAction: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  planCard: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 11, borderWidth: 1, borderRadius: 18, padding: 16 },
  planIcon: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  planCopy: { flex: 1, gap: 5 },
  planTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, lineHeight: 18 },
  planBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  planFooter: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, borderTopWidth: 1, paddingTop: 11 },
  planActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  link: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  toolsList: { gap: 8 },
  toolCard: { borderWidth: 1, borderRadius: 15, overflow: 'hidden' },
  toolTrigger: { minHeight: 59, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  toolIcon: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  toolCopy: { flex: 1, minWidth: 0, gap: 2 },
  toolLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.95 },
  toolQuestion: { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 16 },
  toolDetail: { gap: 8, paddingLeft: 53, paddingRight: 13, paddingBottom: 13 },
  toolBody: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  copilotCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, borderWidth: 1, borderRadius: 17, padding: 16, marginTop: 29 },
  copilotIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  copilotCopy: { flex: 1, minWidth: 0, gap: 4 },
  copilotTitle: { fontFamily: 'Inter_700Bold', fontSize: 19, lineHeight: 23, letterSpacing: -0.3 },
  copilotBody: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  copilotButton: { width: 33, height: 33, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  disclaimer: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 24 },
  disclaimerText: { flex: 1, minWidth: 0, fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 16 },
  setupIntro: { gap: 10, marginBottom: 22 },
  setupIntroEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.2 },
  setupIntroTitle: { fontFamily: 'Inter_700Bold', fontSize: 24, lineHeight: 29, letterSpacing: -0.5 },
  setupIntroBody: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
});
