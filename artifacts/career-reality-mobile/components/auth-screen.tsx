import { Feather, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';

type AuthMode = 'sign-in' | 'sign-up' | 'recovery';

export const AUTH_TEST_IDS = {
  screen: 'auth-screen',
  scroll: 'auth-scroll',
  input: (label: string) =>
    `auth-input-${label.trim().toLowerCase().replace(/\s+/g, '-')}`,
  codeInput: 'auth-input-code',
  error: 'auth-error',
  primaryAction: 'auth-primary-action',
  secondaryAction: 'auth-secondary-action',
} as const;

export function AuthScreen({
  children,
  eyebrow,
  title,
  description,
  mode,
  onBack,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  mode: AuthMode;
  onBack?: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';

  return (
    <View testID={AUTH_TEST_IDS.screen} style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <LinearGradient
        colors={
          isDark
            ? [colors.card, colors.background, colors.background]
            : [colors.card, colors.background, colors.secondary]
        }
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.ambientMark}>
        <View style={[styles.ambientRing, { borderColor: colors.primary + '18' }]} />
        <View style={[styles.ambientDot, { backgroundColor: colors.accent + '25' }]} />
      </View>

      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 22), paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        showsVerticalScrollIndicator={false}
        testID={AUTH_TEST_IDS.scroll}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel={onBack ? 'Go back' : 'CareerReality home'}
            accessibilityRole={onBack ? 'button' : 'text'}
            onPress={onBack}
            style={({ pressed }) => [
              styles.brandLockup,
              pressed && onBack ? styles.pressed : null,
            ]}
          >
            {onBack ? (
              <Feather color={colors.foreground} name="arrow-left" size={18} />
            ) : (
              <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
                <View style={[styles.brandMarkLine, { backgroundColor: colors.primaryForeground }]} />
                <View style={[styles.brandMarkLineShort, { backgroundColor: colors.primaryForeground }]} />
              </View>
            )}
            <Text style={[styles.brand, { color: colors.foreground }]}>
              CAREER<Text style={{ color: colors.primary }}>REALITY</Text>
            </Text>
          </Pressable>
          <View style={[styles.privacyPill, { borderColor: colors.border, backgroundColor: colors.card + 'B8' }]}>
            <View style={[styles.privacyDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.privacyText, { color: colors.mutedForeground }]}>PRIVATE BY DESIGN</Text>
          </View>
        </View>

        <View style={styles.intro}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow}</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>{description}</Text>
        </View>

        <View style={[styles.panel, { backgroundColor: colors.card + 'E8', borderColor: colors.border }]}>
          {children}
        </View>

        <View style={styles.trustRail}>
          <TrustItem icon="lock" label="Your data stays yours" colors={colors} />
          <TrustItem icon="activity" label="Evidence before advice" colors={colors} />
          <TrustItem icon="compass" label="Built for the next move" colors={colors} />
        </View>

        <Text style={[styles.legal, { color: colors.mutedForeground }]}>
          By continuing, you agree to CareerReality&apos;s Terms and acknowledge its Privacy Policy.
        </Text>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

function TrustItem({
  icon,
  label,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.trustItem}>
      <Feather color={colors.primary} name={icon} size={13} />
      <Text style={[styles.trustText, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

export function AuthField({
  label,
  icon,
  colors,
  containerStyle,
  right,
  ...props
}: TextInputProps & {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  colors: ReturnType<typeof useColors>;
  containerStyle?: StyleProp<ViewStyle>;
  right?: React.ReactNode;
}) {
  const [focused, setFocused] = React.useState(false);

  return (
    <View style={[styles.field, containerStyle]}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <View
        style={[
          styles.inputShell,
          {
            backgroundColor: colors.background + 'B8',
            borderColor: focused ? colors.primary : colors.border,
            shadowColor: focused ? colors.primary : 'transparent',
          },
          focused && styles.inputShellFocused,
        ]}
      >
        <Feather color={colors.mutedForeground} name={icon} size={17} />
        <TextInput
          {...props}
          accessibilityLabel={props.accessibilityLabel ?? label}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground }]}
          testID={props.testID ?? AUTH_TEST_IDS.input(label)}
        />
        {right}
      </View>
    </View>
  );
}

export function PasswordField({
  label,
  value,
  onChangeText,
  colors,
  placeholder = 'At least 8 characters',
  testID,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  colors: ReturnType<typeof useColors>;
  placeholder?: string;
  testID?: string;
}) {
  const [visible, setVisible] = React.useState(false);
  return (
    <AuthField
      autoCapitalize="none"
      autoCorrect={false}
      icon="lock"
      label={label}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={!visible}
      testID={testID}
      value={value}
      colors={colors}
      right={
        <Pressable
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          accessibilityRole="button"
          onPress={() => setVisible((current) => !current)}
          hitSlop={10}
        >
          <Feather color={colors.mutedForeground} name={visible ? 'eye-off' : 'eye'} size={17} />
        </Pressable>
      }
    />
  );
}

export function AuthButton({
  children,
  onPress,
  disabled,
  loading,
  secondary = false,
  style,
  testID,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  secondary?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary
          ? { borderColor: colors.border, backgroundColor: colors.background + 'B8' }
          : { backgroundColor: colors.primary },
        (pressed || disabled || loading) && styles.buttonDimmed,
        style,
      ]}
      testID={testID ?? (secondary ? AUTH_TEST_IDS.secondaryAction : AUTH_TEST_IDS.primaryAction)}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? colors.primary : colors.primaryForeground} size="small" />
      ) : (
        <Text
          style={[
            styles.buttonText,
            { color: secondary ? colors.foreground : colors.primaryForeground },
          ]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

export function SocialButton({
  provider,
  onPress,
  loading,
}: {
  provider: 'google' | 'linkedin';
  onPress: () => void;
  loading?: boolean;
}) {
  const colors = useColors();
  const isGoogle = provider === 'google';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Continue with ${isGoogle ? 'Google' : 'LinkedIn'}`}
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.socialButton,
        { borderColor: colors.border, backgroundColor: colors.background + 'B8' },
        (pressed || loading) && styles.buttonDimmed,
      ]}
      testID={`social-${provider}`}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : isGoogle ? (
        <FontAwesome color="#4285F4" name="google" size={16} />
      ) : (
        <FontAwesome color="#0A66C2" name="linkedin" size={17} />
      )}
      <Text style={[styles.socialText, { color: colors.foreground }]}>
        Continue with {isGoogle ? 'Google' : 'LinkedIn'}
      </Text>
    </Pressable>
  );
}

export function AuthDivider() {
  const colors = useColors();
  return (
    <View style={styles.divider}>
      <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>OR CONTINUE WITH EMAIL</Text>
      <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
    </View>
  );
}

export function AuthError({ message }: { message?: string }) {
  const colors = useColors();
  if (!message) return null;
  return (
    <View
      accessibilityRole="alert"
      testID={AUTH_TEST_IDS.error}
      style={[styles.errorBox, { backgroundColor: colors.destructive + '12', borderColor: colors.destructive + '38' }]}
    >
      <Feather color={colors.destructive} name="alert-circle" size={16} />
      <Text style={[styles.errorText, { color: colors.destructive }]}>{message}</Text>
    </View>
  );
}

export function AuthHint({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return <Text style={[styles.hint, { color: colors.mutedForeground }]}>{children}</Text>;
}

export function PasswordStrength({ password }: { password: string }) {
  const colors = useColors();
  if (!password) return null;

  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password) && /[a-z]/.test(password),
    /\d|[^A-Za-z]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const label = score === 3 ? 'Strong password' : score === 2 ? 'Good start' : 'Add a little more strength';

  return (
    <View style={styles.passwordStrength}>
      <View style={styles.passwordStrengthHeader}>
        <Text style={[styles.passwordStrengthLabel, { color: colors.mutedForeground }]}>PASSWORD QUALITY</Text>
        <Text style={[styles.passwordStrengthValue, { color: score === 3 ? colors.success : colors.mutedForeground }]}>
          {label}
        </Text>
      </View>
      <View style={styles.passwordBars}>
        {checks.map((passed, index) => (
          <View
            key={index}
            style={[
              styles.passwordBar,
              { backgroundColor: passed ? (score === 3 ? colors.success : colors.primary) : colors.border },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.passwordStrengthHint, { color: colors.mutedForeground }]}>
        Use 8+ characters with upper/lowercase letters and a number or symbol.
      </Text>
    </View>
  );
}

export function AuthLink({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Text onPress={onPress} style={[styles.link, { color: colors.primary }]}>
      {children}
    </Text>
  );
}

export function AuthCodeInput({
  value,
  onChangeText,
  colors,
}: {
  value: string;
  onChangeText: (value: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TextInput
      autoCapitalize="none"
      autoCorrect={false}
      autoFocus
      keyboardType="number-pad"
      maxLength={6}
      onChangeText={onChangeText}
      placeholder="000000"
      placeholderTextColor={colors.mutedForeground}
      style={[
        styles.codeInput,
        { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background + 'B8' },
      ]}
      accessibilityLabel="Verification code"
      testID={AUTH_TEST_IDS.codeInput}
      textAlign="center"
      value={value}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 22 },
  ambientMark: { position: 'absolute', right: -120, top: 96, height: 290, width: 290 },
  ambientRing: { borderWidth: 1, borderRadius: 145, height: 290, width: 290 },
  ambientDot: { borderRadius: 80, height: 160, position: 'absolute', right: 62, top: 68, width: 160 },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  brandLockup: { alignItems: 'center', flexDirection: 'row', gap: 9, minHeight: 36 },
  brandMark: { alignItems: 'center', borderRadius: 8, height: 28, justifyContent: 'center', width: 28 },
  brandMarkLine: { borderRadius: 2, height: 13, transform: [{ rotate: '34deg' }], width: 3 },
  brandMarkLineShort: { borderRadius: 2, height: 8, marginLeft: 8, marginTop: -8, transform: [{ rotate: '34deg' }], width: 3 },
  brand: { fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: 1.3 },
  privacyPill: { alignItems: 'center', borderRadius: 20, borderWidth: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingVertical: 7 },
  privacyDot: { borderRadius: 4, height: 6, width: 6 },
  privacyText: { fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 0.8 },
  intro: { marginBottom: 25, marginTop: 52, maxWidth: 390 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.4, marginBottom: 13 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 34, letterSpacing: -1, lineHeight: 39 },
  description: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, marginTop: 14, maxWidth: 355 },
  panel: { borderRadius: 22, borderWidth: 1, padding: 19 },
  field: { marginBottom: 17 },
  fieldLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.2, marginBottom: 8 },
  inputShell: { alignItems: 'center', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 11, minHeight: 54, paddingHorizontal: 15 },
  inputShellFocused: { shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { height: 0, width: 0 } },
  input: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 15, minHeight: 52, paddingVertical: 0 },
  codeInput: { borderRadius: 14, borderWidth: 1, fontFamily: 'Inter_700Bold', fontSize: 25, letterSpacing: 8, minHeight: 66, paddingHorizontal: 16 },
  button: { alignItems: 'center', borderRadius: 14, justifyContent: 'center', minHeight: 54 },
  buttonDimmed: { opacity: 0.58 },
  buttonText: { fontFamily: 'Inter_700Bold', fontSize: 14, letterSpacing: 0.1 },
  socialButton: { alignItems: 'center', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 10, justifyContent: 'center', minHeight: 52 },
  socialText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  divider: { alignItems: 'center', flexDirection: 'row', gap: 10, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 0.7 },
  hint: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginBottom: 17, marginTop: -2 },
  passwordStrength: { marginBottom: 16, marginTop: -8 },
  passwordStrengthHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  passwordStrengthLabel: { fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 0.8 },
  passwordStrengthValue: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  passwordBars: { flexDirection: 'row', gap: 5 },
  passwordBar: { borderRadius: 3, flex: 1, height: 4 },
  passwordStrengthHint: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 14, marginTop: 6 },
  link: { fontFamily: 'Inter_700Bold' },
  errorBox: { alignItems: 'flex-start', borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 9, marginBottom: 15, padding: 11 },
  errorText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 17 },
  trustRail: { gap: 11, marginTop: 21 },
  trustItem: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  trustText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  legal: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15, marginTop: 27, textAlign: 'center' },
  pressed: { opacity: 0.65 },
});