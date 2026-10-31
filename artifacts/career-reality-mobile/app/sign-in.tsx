import { useAuth, useSignIn, useSSO } from '@clerk/expo';
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
  SocialButton,
} from '@/components/auth-screen';
import { useColors } from '@/hooks/useColors';
import { useCareer } from '@/context/career-context';

WebBrowser.maybeCompleteAuthSession();

type SignInMode = 'password' | 'forgot-email' | 'forgot-code' | 'forgot-password';
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

export default function SignInScreen() {
  const colors = useColors();
  const { signIn, errors, fetchStatus } = useSignIn();
  const { isLoaded, isSignedIn } = useAuth();
  const { isHydrated, onboardingComplete } = useCareer();
  const { startSSOFlow } = useSSO();
  useWarmUpBrowser();
  const [mode, setMode] = useState<SignInMode>('password');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [actionError, setActionError] = useState<string>();
  const [socialLoading, setSocialLoading] = useState<SocialProvider>();
  const [finishing, setFinishing] = useState(false);
  const submitting = fetchStatus === 'fetching';
  const clerkError = getClerkError(errors);
  const error = actionError ?? clerkError;

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

  const completeSignIn = useCallback(async () => {
    setFinishing(true);
    try {
      await signIn.finalize();
    } catch (finalizeError) {
      setFinishing(false);
      throw finalizeError;
    }
  }, [signIn]);

  const submitPassword = async () => {
    setActionError(undefined);
    try {
      const result = await signIn.password({ emailAddress, password });
      if (result.error) {
        setActionError(getErrorMessage(result.error) ?? 'Those sign-in details were not accepted.');
        return;
      }
      if (signIn.status === 'complete') {
        await completeSignIn();
      } else if (signIn.status === 'needs_client_trust') {
        setActionError('We need one more verification step before opening your workspace.');
      } else if (signIn.status === 'needs_second_factor') {
        setActionError('This account needs another verification step before it can open.');
      } else {
        setActionError('We could not complete sign-in yet. Please try again.');
      }
    } catch (signInError) {
      setFinishing(false);
      setActionError(getErrorMessage(signInError) ?? 'We could not reach sign-in right now. Check your connection and try again.');
    }
  };

  const startRecovery = async () => {
    setActionError(undefined);
    const result = await signIn.create({ identifier: emailAddress });
    if (result.error) {
      setActionError(getErrorMessage(result.error));
      return;
    }
    const codeResult = await signIn.resetPasswordEmailCode.sendCode();
    if (codeResult.error) {
      setActionError(getErrorMessage(codeResult.error));
      return;
    }
    setMode('forgot-code');
  };

  const resendRecoveryCode = async () => {
    setActionError(undefined);
    const result = await signIn.resetPasswordEmailCode.sendCode();
    if (result.error) {
      setActionError(getErrorMessage(result.error));
    }
  };

  const verifyRecoveryCode = async () => {
    setActionError(undefined);
    const result = await signIn.resetPasswordEmailCode.verifyCode({ code });
    if (result.error) {
      setActionError(getErrorMessage(result.error));
      return;
    }
    setMode('forgot-password');
  };

  const finishRecovery = async () => {
    setActionError(undefined);
    if (newPassword !== confirmPassword) {
      setActionError('Those passwords do not match.');
      return;
    }
    const result = await signIn.resetPasswordEmailCode.submitPassword({
      password: newPassword,
      signOutOfOtherSessions: true,
    });
    if (result.error) {
      setActionError(getErrorMessage(result.error));
      return;
    }
    if (signIn.status === 'complete') {
      await completeSignIn();
    }
  };

  const runSocial = async (provider: SocialProvider) => {
    setSocialLoading(provider);
    setActionError(undefined);
    try {
      const result = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: getAuthRedirectUrl('sign-in'),
      });
      if (result.createdSessionId) {
        setFinishing(true);
        await result.setActive?.({ session: result.createdSessionId });
      } else {
        setActionError(
          result.authSessionResult?.type === 'cancel'
            ? 'Sign-in was cancelled. You can try again whenever you are ready.'
            : 'The sign-in flow needs one more step. Please try again.',
        );
      }
    } catch (socialError) {
      setActionError(getErrorMessage(socialError) ?? 'That sign-in method is unavailable right now.');
    } finally {
      setSocialLoading(undefined);
    }
  };

  const resetRecovery = () => {
    signIn.reset();
    setActionError(undefined);
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setMode('password');
  };

  if (mode !== 'password') {
    const recoveryCopy = {
      'forgot-email': {
        title: 'A fresh start is close.',
        description: 'Enter the email attached to your CareerReality account and we’ll send a secure reset code.',
      },
      'forgot-code': {
        title: 'Check your inbox.',
        description: `We sent a six-digit code to ${emailAddress}. It expires soon for your security.`,
      },
      'forgot-password': {
        title: 'Choose a stronger password.',
        description: 'Use a password you do not reuse elsewhere. Your active sessions will be signed out.',
      },
    }[mode];

    return (
      <AuthScreen
        description={recoveryCopy.description}
        eyebrow="ACCOUNT RECOVERY"
        mode="recovery"
        onBack={mode === 'forgot-email' ? resetRecovery : () => setMode(mode === 'forgot-password' ? 'forgot-code' : 'forgot-email')}
        title={recoveryCopy.title}
      >
        {mode === 'forgot-email' ? (
          <>
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
            <AuthError message={error} />
            <AuthButton disabled={!emailAddress} loading={submitting} onPress={startRecovery}>
              Send reset code
            </AuthButton>
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 17, textAlign: 'center' }}>
              Remembered it? <AuthLink onPress={resetRecovery}>Back to sign in</AuthLink>
            </Text>
          </>
        ) : mode === 'forgot-code' ? (
          <>
            <AuthHint>Enter the six-digit code from your email. If it doesn’t arrive, check spam or request another one.</AuthHint>
            <AuthCodeInput colors={colors} onChangeText={setCode} value={code} />
            <AuthError message={error} />
            <AuthButton disabled={code.length < 6} loading={submitting} onPress={verifyRecoveryCode} style={{ marginTop: 17 }}>
              Verify code
            </AuthButton>
            <AuthButton loading={submitting} onPress={() => void resendRecoveryCode()} secondary style={{ marginTop: 10 }}>
              Send a new code
            </AuthButton>
          </>
        ) : (
          <>
            <PasswordField colors={colors} label="New password" onChangeText={setNewPassword} value={newPassword} />
            <PasswordField colors={colors} label="Confirm new password" onChangeText={setConfirmPassword} value={confirmPassword} />
            <AuthError message={error} />
            <AuthButton disabled={!newPassword || !confirmPassword} loading={submitting} onPress={finishRecovery}>
              Update password
            </AuthButton>
          </>
        )}
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      description="A private place to make better career decisions—with the evidence, context, and next move in one view."
      eyebrow="WELCOME BACK"
      mode="sign-in"
      onBack={() => router.back()}
      title="Make your next move with clarity."
    >
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
      <PasswordField colors={colors} label="Password" onChangeText={setPassword} value={password} placeholder="Your password" />
      <View style={{ alignItems: 'flex-end', marginBottom: 17, marginTop: -6 }}>
        <AuthLink onPress={() => { setActionError(undefined); setMode('forgot-email'); }}>Forgot password?</AuthLink>
      </View>
      <AuthError message={error} />
        <AuthButton disabled={!emailAddress || !password} loading={submitting || finishing} onPress={submitPassword}>
        Sign in
      </AuthButton>
      <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 18, textAlign: 'center' }}>
        New to CareerReality? <AuthLink onPress={() => router.push('/sign-up' as never)}>Create your account</AuthLink>
      </Text>
    </AuthScreen>
  );
}