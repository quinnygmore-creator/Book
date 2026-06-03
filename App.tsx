import React, { useState } from 'react';
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
import { Book } from './src/types/book';
import { colors } from './src/theme/colors';

// Lightweight, dependency-free navigation between the shelf, an open
// book, and the goals screen.
type Route = { name: 'shelf' } | { name: 'book'; book: Book } | { name: 'goals' };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'shelf' });

  // Reading themes depend on these fonts — gate the UI until they load.
  const [fontsLoaded] = useFonts({
    Lora_400Regular,
    PlayfairDisplay_700Bold,
    Caveat_400Regular,
    Caveat_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
    PatrickHand_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View style={[styles.safe, styles.center]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      {route.name === 'shelf' && (
        <BookshelfScreen
          onOpenBook={(book) => setRoute({ name: 'book', book })}
          onOpenGoals={() => setRoute({ name: 'goals' })}
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
