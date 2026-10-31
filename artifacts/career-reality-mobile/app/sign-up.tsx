import { useAuth, useSignUp, useSSO } from '@clerk/expo';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import {
  AuthButton,
  AuthCodeInput,
  AuthDivider,
  AuthError,
  AuthField,
  AuthHint,
  AuthLink,
  AuthScreen,
  PasswordField,
  PasswordStrength,
  SocialButton,
} from '@/components/auth-screen';
import { useColors } from '@/hooks/useColors';
import { useCareer } from '@/context/career-context';

WebBrowser.maybeCompleteAuthSession();

type SocialProvider = 'google';

function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

function getAuthRedirectUrl(intent: 'sign-in' | 'sign-up') {
  const redirectUrl = AuthSession.makeRedirectUri({
    scheme: Platform.OS === 'web' ? undefined : 'career-reality-mobile',
    path: 'sso-callback',
  });
  const separator = redirectUrl.includes('?') ? '&' : '?';
  return `${redirectUrl}${separator}intent=${encodeURIComponent(intent)}`;
}

function getErrorMessage(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as {
    message?: string;
    errors?: Array<{ message?: string }>;
  };
  return candidate.message ?? candidate.errors?.[0]?.message;
}

function getClerkError(errors: unknown): string | undefined {
  if (!errors || typeof errors !== 'object') return undefined;
  const candidate = errors as {
    global?: Array<{ message?: string }>;
    fields?: Record<string, { message?: string }>;
  };
  return candidate.global?.[0]?.message ?? Object.values(candidate.fields ?? {})[0]?.message;
}

export default function SignUpScreen() {
  const colors = useColors();
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isLoaded, isSignedIn } = useAuth();
  const { isHydrated, onboardingComplete } = useCareer();
  const { startSSOFlow } = useSSO();
  useWarmUpBrowser();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [actionError, setActionError] = useState<string>();
  const [socialLoading, setSocialLoading] = useState<SocialProvider>();
  const [finishing, setFinishing] = useState(false);
  const submitting = fetchStatus === 'fetching';
  const error = actionError ?? getClerkError(errors);

  useEffect(() => {
    if (!finishing || !isLoaded || !isSignedIn || !isHydrated) return;
    setFinishing(false);
    router.replace((onboardingComplete ? '/(tabs)' : '/onboarding') as never);
  }, [finishing, isHydrated, isLoaded, isSignedIn, onboardingComplete]);

  useFocusEffect(
    useCallback(() => {
      return () => setSocialLoading(undefined);
    }, []),
  );

  const start = async () => {
    setActionError(undefined);
    if (password !== confirmPassword) {
      setActionError('Those passwords do not match.');
      return;
    }
    const result = await signUp.password({ emailAddress, password });
    if (result.error) {
      setActionError(getErrorMessage(result.error));
      return;
    }
    const codeResult = await signUp.verifications.sendEmailCode();
    if (codeResult.error) {
      setActionError(getErrorMessage(codeResult.error));
      return;
    }
    setVerificationSent(true);
  };

  const resendVerificationCode = async () => {
    setActionError(undefined);
    const result = await signUp.verifications.sendEmailCode();
    if (result.error) {
      setActionError(getErrorMessage(result.error));
    }
  };

  const verify = async () => {
    setActionError(undefined);
    const result = await signUp.verifications.verifyEmailCode({ code });
    if (result.error) {
      setActionError(getErrorMessage(result.error));
      return;
    }
    if (signUp.status === 'complete') {
      setFinishing(true);
      try {
        await signUp.finalize();
      } catch (finalizeError) {
        setFinishing(false);
        setActionError(getErrorMessage(finalizeError) ?? 'We could not finish creating your account. Please try again.');
      }
    }
  };

  const runSocial = async (provider: SocialProvider) => {
    setSocialLoading(provider);
    setActionError(undefined);
    try {
      const result = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: getAuthRedirectUrl('sign-up'),
      });
      if (result.createdSessionId) {
        setFinishing(true);
        await result.setActive?.({ session: result.createdSessionId });
      } else {
        setActionError(
          result.authSessionResult?.type === 'cancel'
            ? 'Sign-up was cancelled. You can try again whenever you are ready.'
            : 'The sign-up flow needs one more step. Please try again.',
        );
      }
    } catch (socialError) {
      setActionError(getErrorMessage(socialError) ?? 'That sign-up method is unavailable right now.');
    } finally {
      setSocialLoading(undefined);
    }
  };

  return (
    <AuthScreen
      description={verificationSent ? `We sent a six-digit code to ${emailAddress}. Confirm it to keep your career graph private.` : 'Start with a private career graph that turns scattered signals into a sharper next move.'}
      eyebrow={verificationSent ? 'VERIFY YOUR EMAIL' : 'START WITH THE TRUTH'}
      mode="sign-up"
      onBack={() => router.back()}
      title={verificationSent ? 'Check your inbox.' : 'Build your career advantage.'}
    >
      {!verificationSent ? (
        <>
          <View style={{ gap: 10 }}>
            <SocialButton loading={socialLoading === 'google'} onPress={() => void runSocial('google')} provider="google" />
          </View>
          <AuthDivider />
          <AuthField
            autoCapitalize="none"
            autoCorrect={false}
            icon="mail"
            keyboardType="email-address"
            label="Email address"
            onChangeText={setEmailAddress}
            placeholder="you@example.com"
            value={emailAddress}
            colors={colors}
          />
          <PasswordField colors={colors} label="Password" onChangeText={setPassword} value={password} />
          <PasswordStrength password={password} />
          <PasswordField colors={colors} label="Confirm password" onChangeText={setConfirmPassword} value={confirmPassword} placeholder="Repeat your password" />
          <AuthError message={error} />
          <AuthButton disabled={!emailAddress || !password || !confirmPassword} loading={submitting || finishing} onPress={start}>
            Create account
          </AuthButton>
        </>
      ) : (
        <>
          <AuthHint>Enter the code from your inbox. You can request a fresh one if it does not arrive.</AuthHint>
          <AuthCodeInput colors={colors} onChangeText={setCode} value={code} />
          <AuthError message={error} />
          <AuthButton disabled={code.length < 6} loading={submitting} onPress={verify} style={{ marginTop: 17 }}>
            Verify account
          </AuthButton>
          <AuthButton loading={submitting} onPress={() => void resendVerificationCode()} secondary style={{ marginTop: 10 }}>
            Send a new code
          </AuthButton>
        </>
      )}
      <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 18, textAlign: 'center' }}>
        Already have an account? <AuthLink onPress={() => router.push('/sign-in' as never)}>Sign in</AuthLink>
      </Text>
      <View nativeID="clerk-captcha" />
    </AuthScreen>
  );
}