/**
 * Uploads a local recording to the `transcribe` Edge Function and
 * returns the transcript text. All failure modes raise a
 * TranscriptionError with a user-friendly message.
 */
import * as FileSystem from 'expo-file-system';
import { config, isTranscriptionConfigured } from '../config';

export class TranscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TranscriptionError';
  }
}

export async function transcribeAudio(uri: string): Promise<string> {
  if (!isTranscriptionConfigured()) {
    throw new TranscriptionError(
      'Transcription isn’t set up yet. Add EXPO_PUBLIC_TRANSCRIBE_URL to your .env.'
    );
  }

  const headers: Record<string, string> = {};
  if (config.supabaseAnonKey) {
    headers['Authorization'] = `Bearer ${config.supabaseAnonKey}`;
    headers['apikey'] = config.supabaseAnonKey;
  }

  let result: FileSystem.FileSystemUploadResult;
  try {
    result = await FileSystem.uploadAsync(config.transcribeUrl, uri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      mimeType: 'audio/m4a',
      headers,
    });
  } catch {
    throw new TranscriptionError(
      'Couldn’t reach the transcription service. Check your connection and try again.'
    );
  }

  if (result.status < 200 || result.status >= 300) {
    let message = 'Transcription failed. Please try again.';
    try {
      const body = JSON.parse(result.body);
      if (body?.error) message = body.error;
    } catch {
      // Non-JSON error body — keep the default message.
    }
    throw new TranscriptionError(message);
  }

  let text = '';
  try {
    text = (JSON.parse(result.body).text ?? '').trim();
  } catch {
    throw new TranscriptionError('Unexpected response from the transcription service.');
  }

  if (!text) {
    throw new TranscriptionError('No speech was detected in this recording.');
  }
  return text;
}
