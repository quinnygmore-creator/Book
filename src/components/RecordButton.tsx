import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
import { RecorderStatus } from '../hooks/useRecorder';

interface Props {
  status: RecorderStatus;
  onPress: () => void;
}

/** The single capture button. Idle = mic dot, recording = stop square. */
export function RecordButton({ status, onPress }: Props) {
  const recording = status === 'recording';
  const busy = status === 'stopping';

  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={recording ? 'Stop recording' : 'Start recording'}
      style={({ pressed }) => [styles.outer, pressed && styles.pressed]}
    >
      <View style={[styles.inner, recording && styles.innerRecording]}>
        {busy ? (
          <ActivityIndicator color={colors.surface} />
        ) : recording ? (
          <View style={styles.stopIcon} />
        ) : (
          <View style={styles.micDot} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
  inner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRecording: {
    backgroundColor: colors.record,
    borderRadius: 20,
  },
  micDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface,
  },
  stopIcon: {
    width: 26,
    height: 26,
    borderRadius: 5,
    backgroundColor: colors.surface,
  },
});
