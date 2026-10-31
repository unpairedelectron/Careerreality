import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useCareer } from '@/context/career-context';
import { useColors } from '@/hooks/useColors';

export default function EntryRoute() {
  const colors = useColors();
  const { isLoaded, isSignedIn } = useAuth();
  const { isHydrated, onboardingComplete } = useCareer();
  if (!isLoaded || !isHydrated) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!isSignedIn) return <Redirect href={'/sign-in' as never} />;
  return <Redirect href={onboardingComplete ? '/(tabs)' : '/onboarding'} />;
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});