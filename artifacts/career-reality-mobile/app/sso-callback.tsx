import * as WebBrowser from 'expo-web-browser';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@clerk/expo';
import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

type AuthIntent = 'sign-in' | 'sign-up';

function getAuthIntent(value: unknown): AuthIntent {
  return value === 'sign-up' ? 'sign-up' : 'sign-in';
}

// This must run on the callback page so Expo Web can close the auth popup
// and return control to the screen that started the Clerk SSO flow.
if (
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  (Boolean(window.opener) || window.parent !== window)
) {
  WebBrowser.maybeCompleteAuthSession();
}

export default function SsoCallbackScreen() {
  const colors = useColors();
  const { isLoaded, isSignedIn } = useAuth();
  const { intent: rawIntent } = useLocalSearchParams<{ intent?: string }>();
  const intent = getAuthIntent(rawIntent);
  const isSignUp = intent === 'sign-up';
  const recoveryRoute = isSignUp ? '/sign-up' : '/sign-in';

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/' as never);
    }
  }, [isLoaded, isSignedIn]);

  const canRecover = isLoaded && !isSignedIn;

  return (
    <View testID="oauth-callback-screen" style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.mark, { backgroundColor: colors.primary }]}>
        <Text style={[styles.markText, { color: colors.primaryForeground }]}>CR</Text>
      </View>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>SECURE SIGN IN</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>
        {canRecover
          ? `${isSignUp ? 'Sign-up' : 'Sign-in'} needs another try.`
          : `Finishing your ${isSignUp ? 'sign-up' : 'sign-in'}…`}
      </Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        {canRecover
          ? `The secure ${isSignUp ? 'sign-up' : 'sign-in'} return was interrupted or expired. Go back and try Google again.`
          : `You can close this window if the ${isSignUp ? 'sign-up' : 'sign-in'} screen is already open.`}
      </Text>
      {canRecover ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Return to ${isSignUp ? 'sign up' : 'sign in'}`}
          onPress={() => router.replace(recoveryRoute as never)}
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          testID="oauth-callback-retry"
        >
          <Text style={[styles.retryButtonText, { color: colors.primaryForeground }]}>
            Return to {isSignUp ? 'sign up' : 'sign in'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 28 },
  mark: { alignItems: 'center', borderRadius: 12, height: 48, justifyContent: 'center', marginBottom: 24, width: 48 },
  markText: { fontFamily: 'Inter_700Bold', fontSize: 14, letterSpacing: 0.4 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.4, marginBottom: 12 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 27, letterSpacing: -0.6, textAlign: 'center' },
  description: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, marginTop: 12, maxWidth: 300, textAlign: 'center' },
  retryButton: { borderRadius: 12, marginTop: 24, paddingHorizontal: 18, paddingVertical: 13 },
  retryButtonText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
});