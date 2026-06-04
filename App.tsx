import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Lora_400Regular } from '@expo-google-fonts/lora';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Caveat_400Regular, Caveat_700Bold } from '@expo-google-fonts/caveat';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { PatrickHand_400Regular } from '@expo-google-fonts/patrick-hand';
import { BookshelfScreen } from './src/screens/BookshelfScreen';
import { BookScreen } from './src/screens/BookScreen';
import { GoalsScreen } from './src/screens/GoalsScreen';
import { SignInScreen } from './src/screens/SignInScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { Book } from './src/types/book';
import { colors } from './src/theme/colors';
import { useAuth } from './src/hooks/useAuth';
import { isOnboarded, setOnboarded } from './src/lib/onboarding';
import { fullSync } from './src/lib/sync';

// Lightweight, dependency-free navigation between the shelf, an open
// book, and the goals screen.
type Route = { name: 'shelf' } | { name: 'book'; book: Book } | { name: 'goals' };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'shelf' });
  const [onboarded, setOnboardedState] = useState<boolean | null>(null);
  const { cloudEnabled, session, loading: authLoading, sendCode, verifyCode, signOut } = useAuth();

  const [fontsLoaded] = useFonts({
    Lora_400Regular,
    PlayfairDisplay_700Bold,
    Caveat_400Regular,
    Caveat_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
    PatrickHand_400Regular,
  });

  // Load the onboarding flag once.
  useEffect(() => {
    isOnboarded().then(setOnboardedState);
  }, []);

  // Sync from the cloud whenever a session becomes available.
  useEffect(() => {
    if (session?.user?.id) {
      fullSync(session.user.id).catch(() => {
        // Best-effort — local data remains intact on failure.
      });
    }
  }, [session?.user?.id]);

  const ready = fontsLoaded && onboarded !== null && !authLoading;
  if (!ready) {
    return (
      <View style={[styles.safe, styles.center]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  // 1) First run → onboarding.
  if (!onboarded) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <OnboardingScreen
          onDone={async () => {
            await setOnboarded();
            setOnboardedState(true);
          }}
        />
      </SafeAreaView>
    );
  }

  // 2) Cloud enabled but signed out → sign in.
  if (cloudEnabled && !session) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <SignInScreen onSendCode={sendCode} onVerifyCode={verifyCode} />
      </SafeAreaView>
    );
  }

  // 3) Main app.
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      {route.name === 'shelf' && (
        <BookshelfScreen
          onOpenBook={(book) => setRoute({ name: 'book', book })}
          onOpenGoals={() => setRoute({ name: 'goals' })}
          accountEmail={session?.user?.email ?? undefined}
          onSignOut={cloudEnabled ? signOut : undefined}
        />
      )}
      {route.name === 'book' && (
        <BookScreen book={route.book} onBack={() => setRoute({ name: 'shelf' })} />
      )}
      {route.name === 'goals' && (
        <GoalsScreen onBack={() => setRoute({ name: 'shelf' })} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
