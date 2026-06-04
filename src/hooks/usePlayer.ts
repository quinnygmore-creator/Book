import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';

/**
 * Plays one recording at a time. Tapping a playing item (via the screen)
 * stops it; starting another automatically stops the previous one.
 */
export function usePlayer() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const stop = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch {
        // Already unloaded — ignore.
      }
      soundRef.current = null;
    }
    setPlayingId(null);
  }, []);

  const play = useCallback(
    async (id: string, uri: string) => {
      await stop();
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      soundRef.current = sound;
      setPlayingId(id);

      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.isLoaded && s.didJustFinish) {
          stop();
        }
      });
    },
    [stop]
  );

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { playingId, play, stop };
}
