import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Recording } from '../types/recording';
import { colors, radius } from '../theme/colors';
import { formatDate, formatDuration } from '../lib/format';

interface Props {
  recording: Recording;
  index: number; // human-friendly number (1-based)
  isPlaying: boolean;
  onPlay: () => void;
  onDelete: () => void;
}

export function RecordingItem({ recording, index, isPlaying, onPlay, onDelete }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPlay}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Stop playback' : 'Play recording'}
        style={({ pressed }) => [styles.playBtn, pressed && styles.pressed]}
      >
        {isPlaying ? <View style={styles.pauseIcon} /> : <View style={styles.playIcon} />}
      </Pressable>

      <View style={styles.meta}>
        <Text style={styles.title}>Recording {index}</Text>
        <Text style={styles.sub}>
          {formatDate(recording.createdAt)} · {formatDuration(recording.durationMillis)}
        </Text>
      </View>

      <Pressable
        onPress={onDelete}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Delete recording"
        style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
      >
        <Text style={styles.deleteTxt}>Delete</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  pressed: { opacity: 0.6 },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 13,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.surface,
    marginLeft: 3,
  },
  pauseIcon: {
    width: 13,
    height: 13,
    borderRadius: 3,
    backgroundColor: colors.surface,
  },
  meta: {
    flex: 1,
    marginLeft: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
  },
  sub: {
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 2,
  },
  deleteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  deleteTxt: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: '500',
  },
});
