import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRecorder } from '../hooks/useRecorder';
import { usePlayer } from '../hooks/usePlayer';
import { RecordButton } from '../components/RecordButton';
import { RecordingItem } from '../components/RecordingItem';
import {
  deleteRecording,
  listRecordings,
  saveRecording,
  updateRecording,
} from '../lib/recordingStore';
import { Recording } from '../types/recording';
import { Book } from '../types/book';
import { colors } from '../theme/colors';
import { formatDuration } from '../lib/format';
import { transcribeAudio } from '../lib/transcription';
import { cleanupText } from '../lib/cleanup';
import { isCleanupConfigured, isTranscriptionConfigured } from '../config';

// Ignore accidental taps that produce near-empty clips.
const MIN_DURATION_MS = 500;

interface Props {
  book: Book;
  onBack: () => void;
}

export function BookScreen({ book, onBack }: Props) {
  const { status, durationMillis, start, stop } = useRecorder();
  const { playingId, play, stop: stopPlayback } = usePlayer();
  const [entries, setEntries] = useState<Recording[]>([]);

  const refresh = useCallback(async () => {
    setEntries(await listRecordings(book.id));
  }, [book.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Transcript → Claude → store the structured page.
  const runCleanupFor = useCallback(
    async (id: string, text: string) => {
      await updateRecording(id, { cleanupStatus: 'processing', cleanupError: undefined });
      await refresh();
      try {
        const { title, body } = await cleanupText(text);
        await updateRecording(id, { title, bodyClean: body, cleanupStatus: 'ready' });
      } catch (e) {
        const message = e instanceof Error ? e.message : 'AI cleanup failed.';
        await updateRecording(id, { cleanupStatus: 'failed', cleanupError: message });
      }
      await refresh();
    },
    [refresh]
  );

  // Upload → Whisper → store transcript, then auto-chain AI cleanup.
  const runTranscription = useCallback(
    async (rec: Recording) => {
      await updateRecording(rec.id, {
        transcriptStatus: 'processing',
        transcriptError: undefined,
      });
      await refresh();
      try {
        const text = await transcribeAudio(rec.uri);
        await updateRecording(rec.id, { transcript: text, transcriptStatus: 'ready' });
        await refresh();
        if (isCleanupConfigured()) {
          await runCleanupFor(rec.id, text);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Transcription failed.';
        await updateRecording(rec.id, {
          transcriptStatus: 'failed',
          transcriptError: message,
        });
        await refresh();
      }
    },
    [refresh, runCleanupFor]
  );

  const handleRecordPress = useCallback(async () => {
    try {
      if (status === 'idle') {
        await start();
      } else if (status === 'recording') {
        const result = await stop();
        if (result && result.durationMillis >= MIN_DURATION_MS) {
          // Entry is saved directly into this book.
          const saved = await saveRecording(result.uri, result.durationMillis, book.id);
          await refresh();
          if (isTranscriptionConfigured()) {
            runTranscription(saved);
          }
        }
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong.';
      Alert.alert('Recording error', message);
    }
  }, [status, start, stop, refresh, runTranscription, book.id]);

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
      Alert.alert('Delete entry?', 'This cannot be undone.', [
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
        <Pressable onPress={onBack} hitSlop={10} style={styles.backBtn}>
          <Text style={styles.backTxt}>‹ Shelf</Text>
        </Pressable>
        <Text style={styles.title}>
          {book.coverEmoji ?? '📓'} {book.title}
        </Text>
        <Text style={styles.subtitle}>
          {entries.length === 1 ? '1 page' : `${entries.length} pages`}
        </Text>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>This book is empty</Text>
            <Text style={styles.emptySub}>
              Tap the button below and start speaking.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <RecordingItem
            recording={item}
            index={entries.length - index}
            isPlaying={playingId === item.id}
            onPlay={() => handlePlay(item)}
            onDelete={() => handleDelete(item)}
            onTranscribe={() => runTranscription(item)}
            onCleanup={() => runCleanupFor(item.id, item.transcript ?? '')}
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
    paddingTop: 8,
    paddingBottom: 8,
  },
  backBtn: {
    marginBottom: 6,
  },
  backTxt: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.ink,
  },
  subtitle: {
    fontSize: 14,
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
