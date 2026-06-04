import React, { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Audio } from 'expo-av';
import { colors, radius } from '../theme/colors';

interface Props {
  onDone: () => void;
}

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '🎙️',
    title: 'Speak your thoughts',
    body: 'Tap one button and talk naturally. No typing, no blank page.',
  },
  {
    emoji: '✨',
    title: 'We make them beautiful',
    body: 'AI removes the “ums”, fixes grammar, and shapes your words into a clean, structured page.',
  },
  {
    emoji: '📚',
    title: 'Keep them in books',
    body: 'Collect your pages into books worth keeping — a Daily Journal, Business Ideas, anything.',
  },
];

/** First-run carousel that ends by requesting microphone access. */
export function OnboardingScreen({ onDone }: Props) {
  const [index, setIndex] = useState(0);
  const last = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  const next = async () => {
    if (!last) {
      setIndex((i) => i + 1);
      return;
    }
    // Final step: ask for the mic up front so the first recording is friction-free.
    try {
      await Audio.requestPermissionsAsync();
    } catch {
      // Ignore — they can grant it later when they record.
    }
    onDone();
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={onDone} hitSlop={10} style={styles.skip}>
        <Text style={styles.skipTxt}>Skip</Text>
      </Pressable>

      <View style={styles.body}>
        <Text style={styles.emoji}>{slide.emoji}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.text}>{slide.body}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <Pressable onPress={next} style={styles.btn}>
          <Text style={styles.btnTxt}>
            {last ? 'Start recording' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 32,
  },
  skip: {
    alignSelf: 'flex-end',
    paddingVertical: 12,
  },
  skipTxt: {
    color: colors.inkSoft,
    fontSize: 15,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 72,
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 14,
  },
  text: {
    fontSize: 17,
    lineHeight: 26,
    color: colors.inkSoft,
    textAlign: 'center',
    maxWidth: width * 0.8,
  },
  footer: {
    paddingBottom: 36,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 22,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 22,
  },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnTxt: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});
