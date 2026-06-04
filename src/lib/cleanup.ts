/**
 * Sends a raw transcript to the `cleanup` Edge Function (Claude) and
 * returns a structured { title, body } page. All failure modes raise a
 * CleanupError with a user-friendly message.
 */
import { config, isCleanupConfigured } from '../config';

export class CleanupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CleanupError';
  }
}

export interface CleanPage {
  title: string;
  body: string;
}

export async function cleanupText(text: string): Promise<CleanPage> {
  if (!isCleanupConfigured()) {
    throw new CleanupError(
      'AI cleanup isn’t set up yet. Add EXPO_PUBLIC_CLEANUP_URL to your .env.'
    );
  }
  if (!text.trim()) {
    throw new CleanupError('There’s nothing to clean up yet.');
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.supabaseAnonKey) {
    headers['Authorization'] = `Bearer ${config.supabaseAnonKey}`;
    headers['apikey'] = config.supabaseAnonKey;
  }

  let resp: Response;
  try {
    resp = await fetch(config.cleanupUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text }),
    });
  } catch {
    throw new CleanupError(
      'Couldn’t reach the cleanup service. Check your connection and try again.'
    );
  }

  const rawBody = await resp.text();

  if (!resp.ok) {
    let message = 'AI cleanup failed. Please try again.';
    try {
      const parsed = JSON.parse(rawBody);
      if (parsed?.error) message = parsed.error;
    } catch {
      // Non-JSON error body — keep the default message.
    }
    throw new CleanupError(message);
  }

  let data: { title?: string; body?: string };
  try {
    data = JSON.parse(rawBody);
  } catch {
    throw new CleanupError('Unexpected response from the cleanup service.');
  }

  const title = (data.title ?? '').trim();
  const body = (data.body ?? '').trim();
  if (!body) {
    throw new CleanupError('AI cleanup returned an empty page.');
  }
  return { title: title || 'Untitled', body };
}
