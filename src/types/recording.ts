/**
 * A locally-stored voice recording.
 *
 * Phase 3 keeps these on-device only. In Phase 4 each recording is
 * uploaded and becomes a `notes` row (audio_path + duration_secs).
 */
export interface Recording {
  id: string;
  uri: string; // file:// path in the app's document directory
  durationMillis: number;
  createdAt: string; // ISO timestamp
}
