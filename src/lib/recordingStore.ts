/**
 * Local-first persistence for voice recordings.
 *
 * Audio files live in the app's document directory; lightweight
 * metadata (id, duration, timestamp) lives in AsyncStorage. This
 * keeps Phase 3 fully offline with zero backend setup.
 */
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recording } from '../types/recording';

const DIR = `${FileSystem.documentDirectory}recordings/`;
const META_KEY = 'books.recordings.v1';

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  }
}

async function writeAll(items: Recording[]): Promise<void> {
  await AsyncStorage.setItem(META_KEY, JSON.stringify(items));
}

/** Return all recordings, newest first. */
export async function listRecordings(): Promise<Recording[]> {
  const raw = await AsyncStorage.getItem(META_KEY);
  const items: Recording[] = raw ? JSON.parse(raw) : [];
  return items
    // Default status fields for recordings saved in earlier phases.
    .map((r) => ({
      transcriptStatus: 'none' as const,
      cleanupStatus: 'none' as const,
      ...r,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Move a freshly-recorded temp file into permanent storage and save metadata. */
export async function saveRecording(
  tempUri: string,
  durationMillis: number
): Promise<Recording> {
  await ensureDir();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const dest = `${DIR}${id}.m4a`;
  await FileSystem.moveAsync({ from: tempUri, to: dest });

  const recording: Recording = {
    id,
    uri: dest,
    durationMillis,
    createdAt: new Date().toISOString(),
    transcriptStatus: 'none',
    cleanupStatus: 'none',
  };

  const items = await listRecordings();
  await writeAll([recording, ...items]);
  return recording;
}

/** Patch a recording's fields (e.g. transcript + status) and persist. */
export async function updateRecording(
  id: string,
  patch: Partial<Recording>
): Promise<Recording | null> {
  const items = await listRecordings();
  let updated: Recording | null = null;
  const next = items.map((r) => {
    if (r.id !== id) return r;
    updated = { ...r, ...patch };
    return updated;
  });
  if (updated) await writeAll(next);
  return updated;
}

/** Delete a recording's audio file and its metadata. */
export async function deleteRecording(id: string): Promise<void> {
  const items = await listRecordings();
  const target = items.find((r) => r.id === id);
  if (target) {
    try {
      await FileSystem.deleteAsync(target.uri, { idempotent: true });
    } catch {
      // File already gone — ignore and clean up metadata anyway.
    }
  }
  await writeAll(items.filter((r) => r.id !== id));
}
