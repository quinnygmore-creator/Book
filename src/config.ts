/**
 * App configuration, read from EXPO_PUBLIC_* env vars at build time.
 * Copy .env.example to .env and fill these in to enable transcription.
 */
export const config = {
  // Full URL of the deployed `transcribe` Edge Function, e.g.
  // https://<project-ref>.functions.supabase.co/transcribe
  transcribeUrl: process.env.EXPO_PUBLIC_TRANSCRIBE_URL ?? '',

  // Full URL of the deployed `cleanup` Edge Function.
  cleanupUrl: process.env.EXPO_PUBLIC_CLEANUP_URL ?? '',

  // Full URL of the deployed `detect-goals` Edge Function (Phase 8).
  detectGoalsUrl: process.env.EXPO_PUBLIC_DETECT_GOALS_URL ?? '',

  // Supabase anon key (sent as Bearer; harmless to ship in a client).
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
};

/** True once a transcription endpoint has been configured. */
export function isTranscriptionConfigured(): boolean {
  return config.transcribeUrl.trim().length > 0;
}

/** True once an AI cleanup endpoint has been configured. */
export function isCleanupConfigured(): boolean {
  return config.cleanupUrl.trim().length > 0;
}

/** True once a goal-detection endpoint has been configured. */
export function isGoalDetectionConfigured(): boolean {
  return config.detectGoalsUrl.trim().length > 0;
}
