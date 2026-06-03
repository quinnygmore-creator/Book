import { useCallback, useRef, useState } from 'react';
import { Audio } from 'expo-av';

export type RecorderStatus = 'idle' | 'recording' | 'stopping';

export interface StoppedRecording {
  uri: string;
  durationMillis: number;
}

/**
 * Single-recording capture hook. One mic, one active recording at a time.
 * `start()` requests permission and begins; `stop()` finalizes and returns
 * the temp file URI + duration for the caller to persist.
 */
export function useRecorder() {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [durationMillis, setDurationMillis] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationRef = useRef(0);

  const start = useCallback(async () => {
    const perm = await Audio.requestPermissionsAsync();
    if (!perm.granted) {
      throw new Error('Microphone permission is required to record.');
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const recording = new Audio.Recording();
    recording.setProgressUpdateInterval(200);
    recording.setOnRecordingStatusUpdate((s) => {
      if (s.isRecording) {
        durationRef.current = s.durationMillis;
        setDurationMillis(s.durationMillis);
      }
    });

    await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await recording.startAsync();

    recordingRef.current = recording;
    durationRef.current = 0;
    setDurationMillis(0);
    setStatus('recording');
  }, []);

  const stop = useCallback(async (): Promise<StoppedRecording | null> => {
    const recording = recordingRef.current;
    if (!recording) return null;

    setStatus('stopping');
    try {
      await recording.stopAndUnloadAsync();
    } finally {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    }

    const uri = recording.getURI();
    const finalDuration = durationRef.current;

    recordingRef.current = null;
    setDurationMillis(0);
    setStatus('idle');

    if (!uri) return null;
    return { uri, durationMillis: finalDuration };
  }, []);

  return { status, durationMillis, start, stop };
}
