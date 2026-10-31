import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';
import { CareerProfile, useCareer } from '@/context/career-context';
import { syncCareerProfile } from '@/lib/career-api';

type TextField = { key: keyof CareerProfile; label: string; placeholder: string };
type SetupStep = { eyebrow: string; title: string; body: string; fields: TextField[] };

const steps: SetupStep[] = [
  {
    eyebrow: '01 · YOUR CONTEXT',
    title: 'Start with the real you.',
    body: 'Your dashboard should sound like your life, not a generic career quiz.',
    fields: [
      { key: 'name', label: 'What should we call you?', placeholder: 'Shiv' },
      { key: 'situation', label: 'What are you doing in life right now?', placeholder: 'Working full-time in data engineering' },
    ],
  },
  {
    eyebrow: '02 · WHERE YOU ARE',
    title: 'Give your market a location.',
    body: 'Company and city change the salary, demand, and risk signals we show you.',
    fields: [
      { key: 'company', label: 'Where are you working?', placeholder: 'Company name or “independent”' },
      { key: 'city', label: 'Where are you based?', placeholder: 'Bengaluru' },
    ],
  },
  {
    eyebrow: '03 · MONEY & DIRECTION',
    title: 'What would make this worth it?',
    body: 'We use your role, salary, and target to map a realistic next move.',
    fields: [
      { key: 'role', label: 'Current role or work', placeholder: 'Senior Data Engineer' },
      { key: 'ctc', label: 'Current salary / CTC', placeholder: '₹31.5L or “prefer not to say”' },
      { key: 'experience', label: 'Years of experience', placeholder: '8 years' },
      { key: 'target', label: 'Where do you want to go next?', placeholder: 'Staff Data Engineer' },
    ],
  },
  {
    eyebrow: '04 · RESUME UPLOADS PAUSED',
    title: 'Continue without a resume.',
    body: 'Resume uploads are paused while production privacy controls are verified. You can finish setup without attaching a file.',
    fields: [],
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, updateProfile, completeOnboarding, onboardingComplete } = useCareer();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isRefreshMode = mode === 'refresh';
  const [step, setStep] = useState(isRefreshMode ? steps.length - 1 : 0);
  const [draft, setDraft] = useState<CareerProfile>(profile);
  const [saveError, setSaveError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const current = steps[step];
  const update = (key: keyof CareerProfile, value: string) => setDraft((previous) => ({ ...previous, [key]: value }));
  const finish = async () => {
    if (isRefreshMode) {
      router.back();
      return;
    }
    if (isSaving) return;
    const profileToSave = { ...draft, resumeUri: undefined };
    updateProfile(profileToSave);
    setSaveError(undefined);
    setIsSaving(true);
    try {
      await syncCareerProfile(profileToSave);
      completeOnboarding();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (onboardingComplete) router.back();
      else router.replace('/(tabs)');
    } catch {
      setSaveError('Your answers are saved on this device, but we could not sync your profile. Check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <Text style={[styles.brand, { color: colors.foreground }]}>CAREER<Text style={{ color: colors.primary }}>REALITY</Text></Text>
        {onboardingComplete ? <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close onboarding"><Feather name="x" size={22} color={colors.foreground} /></Pressable> : <Text style={[styles.required, { color: colors.mutedForeground }]}>SETUP REQUIRED</Text>}
      </View>
      <KeyboardAwareScrollViewCompat contentContainerStyle={styles.content} bottomOffset={20} keyboardShouldPersistTaps="handled">
        <View style={styles.progressRow}>{steps.map((_, index) => <View key={index} style={[styles.progressItem, { backgroundColor: index <= step ? colors.primary : colors.secondary }]} />)}</View>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>{current.eyebrow}</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>{current.title}</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>{current.body}</Text>
        {current.fields.length > 0 ? (
          <View style={styles.form}>
            {current.fields.map((field) => (
              <View key={field.key} style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{field.label}</Text>
                <TextInput value={draft[field.key] as string | undefined} onChangeText={(value) => update(field.key, value)} placeholder={field.placeholder} placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} />
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.resumeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.resumeIcon, { backgroundColor: colors.secondary }]}><Feather name="shield" size={20} color={colors.primary} /></View>
            <Text style={[styles.resumeTitle, { color: colors.foreground }]}>Resume uploads are temporarily unavailable</Text>
            <Text style={[styles.resumeBody, { color: colors.mutedForeground }]} testID="text-resume-upload-paused">We have paused resume transfers while production logging, tracing, backups, and access controls are verified. No resume is sent from this screen. You can complete setup without one.</Text>
            {saveError ? <Text style={[styles.error, { color: colors.destructive }]}>{saveError}</Text> : null}
          </View>
        )}
        <View style={styles.bottom}>
          <Text style={[styles.helper, { color: colors.mutedForeground }]}>{step === steps.length - 1 ? 'No resume file or extracted resume data is sent during this step.' : 'You can change any answer later.'}</Text>
          <Pressable onPress={step === steps.length - 1 ? () => void finish() : () => { setStep(step + 1); void Haptics.selectionAsync(); }} accessibilityRole="button" testID="button-onboarding-next" disabled={isSaving} style={({ pressed }) => [styles.next, { backgroundColor: colors.primary, opacity: pressed || isSaving ? 0.84 : 1 }]}>
            <Text style={[styles.nextText, { color: colors.primaryForeground }]}>{isSaving ? 'Saving…' : step === steps.length - 1 ? (isRefreshMode ? 'Return to profile' : 'Build my dashboard') : 'Continue'}</Text>
            <Feather name={isSaving ? 'loader' : step === steps.length - 1 ? 'zap' : 'arrow-right'} size={16} color={colors.primaryForeground} />
          </Pressable>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  brand: { fontFamily: 'Inter_700Bold', fontSize: 13, letterSpacing: 1.3 },
  required: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1 },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 28 },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 44 },
  progressItem: { height: 4, flex: 1, borderRadius: 2 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.4, marginBottom: 13 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 31, lineHeight: 37, letterSpacing: -0.9, maxWidth: 340 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22, marginTop: 13, maxWidth: 350 },
  form: { gap: 18, marginTop: 40 },
  field: { gap: 8 },
  fieldLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.9, textTransform: 'uppercase' },
  input: { minHeight: 55, borderRadius: 14, borderWidth: 1, paddingHorizontal: 15, fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  resumeCard: { borderWidth: 1, borderRadius: 17, padding: 18, alignItems: 'center', gap: 11, marginTop: 40 },
  resumeIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  resumeTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, textAlign: 'center' },
  resumeBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  error: { fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 2 },
  bottom: { marginTop: 'auto', gap: 13, paddingTop: 34 },
  helper: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  next: { minHeight: 52, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  nextText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
});