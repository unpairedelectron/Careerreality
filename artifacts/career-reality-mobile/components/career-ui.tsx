import { Feather } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { router } from 'expo-router';

export function Screen({
  children,
  scroll = true,
  keyboardAware = false,
}: {
  children: ReactNode;
  scroll?: boolean;
  keyboardAware?: boolean;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  // Keep the final Home trust rail above the absolute tab bar on compact
  // devices. Native tab bars and the web fallback both need this extra
  // breathing room in addition to the system safe-area inset.
  const bottomInset = Platform.OS === 'web' ? 50 : insets.bottom + 16;
  const content = (
    <View style={[styles.screenContent, { paddingTop: topInset + 18, paddingBottom: bottomInset + 48 }]}>
      {children}
    </View>
  );
  if (!scroll) {
    return <View style={[styles.screen, { backgroundColor: colors.background }]}>{content}</View>;
  }
  if (keyboardAware) {
    return (
      <KeyboardAwareScrollViewCompat
        style={[styles.screen, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
        testID="screen-scroll"
      >
        {content}
      </KeyboardAwareScrollViewCompat>
    );
  }
  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
      testID="screen-scroll"
    >
      {content}
    </ScrollView>
  );
}

export function Header({
  eyebrow,
  title,
  action,
  back = false,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
  back?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={styles.header}>
      {back ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          testID="button-go-back"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="arrow-left" size={17} color={colors.foreground} />
        </Pressable>
      ) : null}
      <View style={styles.headerCopy}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow}</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      </View>
      {action}
    </View>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
}: {
  icon: keyof typeof Feather.glyphMap;
  onPress?: () => void;
  label: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={`icon-${label.toLowerCase().replaceAll(' ', '-')}`}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 }]}
    >
      <Feather name={icon} size={18} color={colors.foreground} />
    </Pressable>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: string }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {action ? <Text style={[styles.sectionAction, { color: colors.primary }]}>{action}</Text> : null}
    </View>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  tone = 'default',
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'positive' | 'warning' | 'accent';
  icon?: keyof typeof Feather.glyphMap;
}) {
  const colors = useColors();
  const toneColor = tone === 'positive' ? colors.success : tone === 'warning' ? colors.warning : tone === 'accent' ? colors.accent : colors.primary;
  return (
    <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.metricTop}>
        <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text>
        {icon ? <Feather name={icon} size={15} color={toneColor} /> : null}
      </View>
      <Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.metricDetail, { color: toneColor }]}>{detail}</Text>
    </View>
  );
}

export function SignalCard({
  label,
  text,
  source,
  tone = 'positive',
}: {
  label: string;
  text: string;
  source: string;
  tone?: 'positive' | 'warning' | 'accent';
}) {
  const colors = useColors();
  const toneColor = tone === 'warning' ? colors.warning : tone === 'accent' ? colors.accent : colors.primary;
  return (
    <View style={[styles.signalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.signalDot, { backgroundColor: toneColor }]} />
      <View style={styles.signalCopy}>
        <Text style={[styles.signalLabel, { color: toneColor }]}>{label}</Text>
        <Text style={[styles.signalText, { color: colors.foreground }]}>{text}</Text>
        <Text style={[styles.signalSource, { color: colors.mutedForeground }]}>{source}</Text>
      </View>
    </View>
  );
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}>
      <View style={[styles.progressFill, { width: `${Math.min(value, 100)}%`, backgroundColor: color ?? colors.primary }]} />
    </View>
  );
}

export function Pill({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'positive' | 'warning' | 'accent' }) {
  const colors = useColors();
  const toneColor = tone === 'positive' ? colors.success : tone === 'warning' ? colors.warning : tone === 'accent' ? colors.accent : colors.mutedForeground;
  return (
    <View style={[styles.pill, { backgroundColor: colors.secondary }]}>
      <Text style={[styles.pillText, { color: toneColor }]}>{children}</Text>
    </View>
  );
}

export function PrimaryButton({
  children,
  onPress,
  icon,
  secondary = false,
}: {
  children: ReactNode;
  onPress?: () => void;
  icon?: keyof typeof Feather.glyphMap;
  secondary?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      testID={`button-${String(children).toLowerCase().replaceAll(' ', '-')}`}
      style={({ pressed }) => [
        styles.primaryButton,
        { backgroundColor: secondary ? colors.secondary : colors.primary, opacity: pressed ? 0.84 : 1 },
      ]}
    >
      <Text style={[styles.primaryButtonText, { color: secondary ? colors.foreground : colors.primaryForeground }]}>{children}</Text>
      {icon ? <Feather name={icon} size={16} color={secondary ? colors.foreground : colors.primaryForeground} /> : null}
    </Pressable>
  );
}

export function ProfileSetupCard({
  title,
  body,
  onPress,
  buttonLabel = 'Complete your profile',
  testID,
}: {
  title: string;
  body: string;
  onPress: () => void;
  buttonLabel?: string;
  testID?: string;
}) {
  const colors = useColors();
  return (
    <View testID={testID} style={[styles.profileSetupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.profileSetupTop}>
        <View style={[styles.profileSetupIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="compass" size={19} color={colors.primary} />
        </View>
        <Pill tone="accent">PROFILE SETUP</Pill>
      </View>
      <Text style={[styles.profileSetupTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.profileSetupBody, { color: colors.mutedForeground }]}>{body}</Text>
      <View style={styles.profileSetupMeta}>
        <Text style={[styles.profileSetupMetaText, { color: colors.mutedForeground }]}>Role · city · direction</Text>
        <Text style={[styles.profileSetupMetaText, { color: colors.mutedForeground }]}>Resume optional</Text>
      </View>
      <PrimaryButton onPress={onPress} icon="arrow-right">
        {buttonLabel}
      </PrimaryButton>
    </View>
  );
}

export function ScoreBadge({ value, label }: { value: string; label: string }) {
  const colors = useColors();
  return (
    <View style={styles.scoreBadge}>
      <Text style={[styles.scoreValue, { color: colors.primary }]}>{value}</Text>
      <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

export function Divider() {
  const colors = useColors();
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  screenContent: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 26 },
  backButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  headerCopy: { flex: 1, minWidth: 0, gap: 7 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 30, lineHeight: 35, letterSpacing: -0.7 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginTop: 28, marginBottom: 12 },
  sectionTitle: { flex: 1, minWidth: 0, fontFamily: 'Inter_700Bold', fontSize: 17, letterSpacing: -0.2 },
  sectionAction: { flexShrink: 1, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  iconButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  metricCard: { flex: 1, minHeight: 118, borderWidth: 1, borderRadius: 15, padding: 15, justifyContent: 'space-between' },
  metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' },
  metricValue: { fontFamily: 'Inter_700Bold', fontSize: 25, letterSpacing: -0.5 },
  metricDetail: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  signalCard: { flexDirection: 'row', gap: 12, borderRadius: 15, borderWidth: 1, padding: 16, marginBottom: 10 },
  signalDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  signalCopy: { flex: 1, gap: 5 },
  signalLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  signalText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, lineHeight: 20 },
  signalSource: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  pill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  pillText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  primaryButton: { minHeight: 48, borderRadius: 13, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  profileSetupCard: { borderWidth: 1, borderRadius: 20, padding: 18, gap: 13 },
  profileSetupTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  profileSetupIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  profileSetupTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, lineHeight: 25, letterSpacing: -0.3 },
  profileSetupBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  profileSetupMeta: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  profileSetupMetaText: { flexShrink: 1, fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 0.2 },
  scoreBadge: { alignItems: 'flex-end', gap: 2 },
  scoreValue: { fontFamily: 'Inter_700Bold', fontSize: 25 },
  scoreLabel: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  divider: { height: 1, width: '100%', marginVertical: 18 },
});