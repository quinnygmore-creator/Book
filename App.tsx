import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BookshelfScreen } from './src/screens/BookshelfScreen';
import { BookScreen } from './src/screens/BookScreen';
import { Book } from './src/types/book';
import { colors } from './src/theme/colors';

// Lightweight, dependency-free navigation. The app has exactly two
// screens for now: the shelf and a single open book.
type Route = { name: 'shelf' } | { name: 'book'; book: Book };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'shelf' });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      {route.name === 'shelf' ? (
        <BookshelfScreen onOpenBook={(book) => setRoute({ name: 'book', book })} />
      ) : (
        <BookScreen book={route.book} onBack={() => setRoute({ name: 'shelf' })} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
