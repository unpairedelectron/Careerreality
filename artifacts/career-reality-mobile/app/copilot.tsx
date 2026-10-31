import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { askCareerReality } from '@workspace/api-client-react';
import { useAuth } from '@clerk/expo';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCareer } from '@/context/career-context';
import { Header, Pill, ProfileSetupCard, Screen } from '@/components/career-ui';
import { fetchCareerBrief, isCareerProfileNotConfiguredError } from '@/lib/career-api';
import { useColors } from '@/hooks/useColors';

const prompts = [
  'What should I do this week?',
  'Am I underpaid?',
  'Should I switch now?',
] as const;

function isE2ESignedIn(): boolean {
  return __DEV__
    && typeof window !== 'undefined'
    && (
      new URLSearchParams(window.location.search).get('e2e-auth') === 'signed-in'
      || window.localStorage.getItem('career-reality-e2e-auth') === 'signed-in'
    );
}

export default function CopilotScreen() {
  const colors = useColors();
  const { profile } = useCareer();
  const { isSignedIn } = useAuth();
  const signedIn = Boolean(isSignedIn || isE2ESignedIn());
  const [answer, setAnswer] = useState<string>('Ask a question to get a cited directional read.');
  const answerMutation = useMutation({ mutationFn: (question: string) => askCareerReality({ question }) });
  const briefQuery = useQuery({
    queryKey: ['career-brief-copilot', profile.role, profile.city, profile.target],
    queryFn: fetchCareerBrief,
    enabled: signedIn,
    retry: false,
  });
  const profileMissing = isCareerProfileNotConfiguredError(briefQuery.error) || isCareerProfileNotConfiguredError(answerMutation.error);
  const ask = async (question: string) => {
    try {
      const result = await answerMutation.mutateAsync(question);
      setAnswer(result.answer);
    } catch {
      setAnswer('Live intelligence is temporarily unavailable. Use the profile-based baseline and try again shortly.');
    }
  };
  return (
    <Screen>
      <Header eyebrow="CAREER COPILOT · EVIDENCE-BACKED" title="Ask for the next move." action={<Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close copilot"><Feather name="x" size={22} color={colors.foreground} /></Pressable>} />
      <View style={[styles.notice, { backgroundColor: colors.secondary }]}>
        <Feather name="smartphone" size={16} color={colors.primary} />
        <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>Answers are directional, cite the signals used, and show assumptions instead of pretending to know your team-level reality.</Text>
      </View>
      <View style={[styles.profileLine, { borderBottomColor: colors.border }]}><Text style={[styles.profileLabel, { color: colors.mutedForeground }]}>READING FOR</Text><Text style={[styles.profileValue, { color: colors.foreground }]}>{profile.role} · {profile.city}</Text></View>
      {profileMissing ? (
        <ProfileSetupCard
          testID="copilot-profile-setup-needed"
          title="Build your brief before asking for a personal read"
          body="Copilot needs your role, market, and direction to separate useful evidence from generic advice."
          buttonLabel="Build my brief"
          onPress={() => router.push('/onboarding')}
        />
      ) : (
        <>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Try a prompt</Text>
          <View style={styles.promptList}>
            {prompts.map((prompt) => <Pressable key={prompt} onPress={() => { void ask(prompt); void Haptics.selectionAsync(); }} accessibilityRole="button" style={({ pressed }) => [styles.prompt, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed || answerMutation.isPending ? 0.8 : 1 }]}><Text style={[styles.promptText, { color: colors.foreground }]}>{prompt}</Text><Feather name="arrow-up-right" size={15} color={colors.primary} /></Pressable>)}
          </View>
        </>
      )}
      {!profileMissing ? <View style={[styles.answerCard, { backgroundColor: colors.primary }]}>
        <View style={styles.answerHeader}><View style={styles.answerIcon}><Feather name="message-circle" size={17} color={colors.primaryForeground} /></View><Pill tone="positive">Directional read</Pill></View>
        <Text style={[styles.answer, { color: colors.primaryForeground }]}>{answer}</Text>
        <Text style={[styles.answerSource, { color: colors.primaryForeground }]}>{answerMutation.data ? `${answerMutation.data.confidence} confidence · ${answerMutation.data.evidence[0]?.source ?? 'CareerReality profile'}` : 'Based on your saved profile · refresh after changing inputs'}</Text>
      </View> : null}
      <Text style={[styles.footer, { color: colors.mutedForeground }]}>CareerReality is designed to show its uncertainty. Treat this as a starting point for your own decision, not an instruction.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: { borderRadius: 14, padding: 13, flexDirection: 'row', gap: 9, alignItems: 'flex-start', marginBottom: 23 },
  noticeText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  profileLine: { borderBottomWidth: 1, paddingBottom: 17, gap: 7, marginBottom: 24 },
  profileLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1 },
  profileValue: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, marginBottom: 12 },
  promptList: { gap: 9 },
  prompt: { borderWidth: 1, borderRadius: 14, minHeight: 52, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  promptText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  answerCard: { borderRadius: 18, padding: 18, gap: 15, marginTop: 27 },
  answerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  answerIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.14)', alignItems: 'center', justifyContent: 'center' },
  answer: { fontFamily: 'Inter_700Bold', fontSize: 19, lineHeight: 27, letterSpacing: -0.3 },
  answerSource: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15, opacity: 0.75 },
  footer: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17, marginTop: 20 },
});