import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Recording } from '../types/recording';
import { colors, radius } from '../theme/colors';
import { formatDate, formatDuration } from '../lib/format';

interface Props {
  recording: Recording;
  index: number; // human-friendly number (1-based)
  isPlaying: boolean;
  onPlay: () => void;
  onDelete: () => void;
  onTranscribe: () => void;
}

export function RecordingItem({
  recording,
  index,
  isPlaying,
  onPlay,
  onDelete,
  onTranscribe,
}: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.topRow}>
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

      <Transcript recording={recording} onTranscribe={onTranscribe} />
    </View>
  );
}

function Transcript({
  recording,
  onTranscribe,
}: {
  recording: Recording;
  onTranscribe: () => void;
}) {
  switch (recording.transcriptStatus) {
    case 'processing':
      return (
        <View style={styles.transcriptBox}>
          <View style={styles.processingRow}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.processingTxt}>Transcribing…</Text>
          </View>
        </View>
      );

    case 'ready':
      return (
        <View style={styles.transcriptBox}>
          <Text style={styles.transcriptTxt}>{recording.transcript}</Text>
        </View>
      );

    case 'failed':
      return (
        <View style={styles.transcriptBox}>
          <Text style={styles.errorTxt}>
            {recording.transcriptError ?? 'Transcription failed.'}
          </Text>
          <Pressable
            onPress={onTranscribe}
            style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}
          >
            <Text style={styles.retryTxt}>Retry</Text>
          </Pressable>
        </View>
      );

    default:
      return (
        <Pressable
          onPress={onTranscribe}
          style={({ pressed }) => [styles.transcribeBtn, pressed && styles.pressed]}
        >
          <Text style={styles.transcribeTxt}>Transcribe</Text>
        </Pressable>
      );
  }
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
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

  // Transcript area
  transcriptBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  transcriptTxt: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  processingTxt: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.inkSoft,
  },
  errorTxt: {
    fontSize: 14,
    color: colors.danger,
    marginBottom: 8,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  retryTxt: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 14,
  },
  transcribeBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  transcribeTxt: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: 14,
  },
});
