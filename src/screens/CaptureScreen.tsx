import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRecorder } from '../hooks/useRecorder';
import { usePlayer } from '../hooks/usePlayer';
import { RecordButton } from '../components/RecordButton';
import { RecordingItem } from '../components/RecordingItem';
import {
  deleteRecording,
  listRecordings,
  saveRecording,
} from '../lib/recordingStore';
import { Recording } from '../types/recording';
import { colors } from '../theme/colors';
import { formatDuration } from '../lib/format';

// Ignore accidental taps that produce near-empty clips.
const MIN_DURATION_MS = 500;

export function CaptureScreen() {
  const { status, durationMillis, start, stop } = useRecorder();
  const { playingId, play, stop: stopPlayback } = usePlayer();
  const [recordings, setRecordings] = useState<Recording[]>([]);

  const refresh = useCallback(async () => {
    setRecordings(await listRecordings());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleRecordPress = useCallback(async () => {
    try {
      if (status === 'idle') {
        await start();
      } else if (status === 'recording') {
        const result = await stop();
        if (result && result.durationMillis >= MIN_DURATION_MS) {
          await saveRecording(result.uri, result.durationMillis);
          await refresh();
        }
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong.';
      Alert.alert('Recording error', message);
    }
  }, [status, start, stop, refresh]);

  const handlePlay = useCallback(
    (rec: Recording) => {
      if (playingId === rec.id) {
        stopPlayback();
      } else {
        play(rec.id, rec.uri).catch(() =>
          Alert.alert('Playback error', 'Could not play this recording.')
        );
      }
    },
    [playingId, play, stopPlayback]
  );

  const handleDelete = useCallback(
    (rec: Recording) => {
      Alert.alert('Delete recording?', 'This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (playingId === rec.id) await stopPlayback();
            await deleteRecording(rec.id);
            await refresh();
          },
        },
      ]);
    },
    [playingId, stopPlayback, refresh]
  );

  const recording = status === 'recording';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>Books</Text>
        <Text style={styles.tagline}>Speak your thoughts.</Text>
      </View>

      <FlatList
        data={recordings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No recordings yet</Text>
            <Text style={styles.emptySub}>
              Tap the button below and start speaking.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <RecordingItem
            recording={item}
            index={recordings.length - index}
            isPlaying={playingId === item.id}
            onPlay={() => handlePlay(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
      />

      <View style={styles.footer}>
        <Text style={styles.statusText}>
          {recording
            ? formatDuration(durationMillis)
            : status === 'stopping'
            ? 'Saving…'
            : 'Tap to record'}
        </Text>
        <RecordButton status={status} onPress={handleRecordPress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  brand: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: 0.3,
  },
  tagline: {
    fontSize: 15,
    color: colors.inkSoft,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.ink,
  },
  emptySub: {
    fontSize: 14,
    color: colors.inkSoft,
    marginTop: 6,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 28,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  statusText: {
    fontSize: 15,
    color: colors.inkSoft,
    marginBottom: 14,
    fontVariant: ['tabular-nums'],
  },
});
