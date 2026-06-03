import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Recording } from '../types/recording';
import { colors, radius } from '../theme/colors';
import { formatDate, formatDuration } from '../lib/format';

interface Props {
  recording: Recording;
  index: number; // human-friendly number (1-based)
  isPlaying: boolean;
  onPlay: () => void;
  onDelete: () => void;
  onTranscribe: () => void;
  onCleanup: () => void;
}

export function RecordingItem({
  recording,
  index,
  isPlaying,
  onPlay,
  onDelete,
  onTranscribe,
  onCleanup,
}: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.topRow}>
        <Pressable
          onPress={onPlay}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Stop playback' : 'Play recording'}
          style={({ pressed }) => [styles.playBtn, pressed && styles.pressed]}
        >
          {isPlaying ? <View style={styles.pauseIcon} /> : <View style={styles.playIcon} />}
        </Pressable>

        <View style={styles.meta}>
          <Text style={styles.metaTitle}>Recording {index}</Text>
          <Text style={styles.sub}>
            {formatDate(recording.createdAt)} · {formatDuration(recording.durationMillis)}
          </Text>
        </View>

        <Pressable
          onPress={onDelete}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Delete recording"
          style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
        >
          <Text style={styles.deleteTxt}>Delete</Text>
        </Pressable>
      </View>

      <Content recording={recording} onTranscribe={onTranscribe} onCleanup={onCleanup} />
    </View>
  );
}

function Content({
  recording,
  onTranscribe,
  onCleanup,
}: {
  recording: Recording;
  onTranscribe: () => void;
  onCleanup: () => void;
}) {
  const [showRaw, setShowRaw] = useState(false);

  // ── No transcript yet: show the Phase 4 transcription states. ──
  if (recording.transcriptStatus !== 'ready') {
    switch (recording.transcriptStatus) {
      case 'processing':
        return (
          <Box>
            <Processing label="Transcribing…" />
          </Box>
        );
      case 'failed':
        return (
          <Box>
            <Text style={styles.errorTxt}>
              {recording.transcriptError ?? 'Transcription failed.'}
            </Text>
            <Pill label="Retry" onPress={onTranscribe} />
          </Box>
        );
      default:
        return <FilledPill label="Transcribe" onPress={onTranscribe} />;
    }
  }

  // ── Transcript is ready. Branch on cleanup state. ──
  if (recording.cleanupStatus === 'processing') {
    return (
      <Box>
        <Processing label="Polishing…" />
      </Box>
    );
  }

  if (recording.cleanupStatus === 'ready') {
    return (
      <Box>
        <View style={styles.toggleRow}>
          <Toggle label="Clean" active={!showRaw} onPress={() => setShowRaw(false)} />
          <Toggle label="Raw" active={showRaw} onPress={() => setShowRaw(true)} />
        </View>
        {showRaw ? (
          <Text style={styles.rawTxt}>{recording.transcript}</Text>
        ) : (
          <View>
            {!!recording.title && <Text style={styles.pageTitle}>{recording.title}</Text>}
            <Text style={styles.pageBody}>{recording.bodyClean}</Text>
          </View>
        )}
      </Box>
    );
  }

  // cleanup failed or not run yet → show transcript + a Polish affordance.
  return (
    <Box>
      <Text style={styles.rawTxt}>{recording.transcript}</Text>
      {recording.cleanupStatus === 'failed' && (
        <Text style={[styles.errorTxt, styles.errorSpaced]}>
          {recording.cleanupError ?? 'AI cleanup failed.'}
        </Text>
      )}
      <Pill
        label={recording.cleanupStatus === 'failed' ? 'Retry polish' : 'Polish'}
        onPress={onCleanup}
      />
    </Box>
  );
}

// ── Small presentational helpers ──
function Box({ children }: { children: React.ReactNode }) {
  return <View style={styles.box}>{children}</View>;
}

function Processing({ label }: { label: string }) {
  return (
    <View style={styles.processingRow}>
      <ActivityIndicator size="small" color={colors.accent} />
      <Text style={styles.processingTxt}>{label}</Text>
    </View>
  );
}

function Pill({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
    >
      <Text style={styles.pillTxt}>{label}</Text>
    </Pressable>
  );
}

function FilledPill({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.filledPill, pressed && styles.pressed]}
    >
      <Text style={styles.filledPillTxt}>{label}</Text>
    </Pressable>
  );
}

function Toggle({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.toggle, active && styles.toggleActive]}>
      <Text style={[styles.toggleTxt, active && styles.toggleTxtActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pressed: { opacity: 0.6 },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 13,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.surface,
    marginLeft: 3,
  },
  pauseIcon: {
    width: 13,
    height: 13,
    borderRadius: 3,
    backgroundColor: colors.surface,
  },
  meta: {
    flex: 1,
    marginLeft: 14,
  },
  metaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
  },
  sub: {
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 2,
  },
  deleteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  deleteTxt: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: '500',
  },

  // Content area
  box: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  processingTxt: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.inkSoft,
  },
  rawTxt: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkSoft,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 6,
  },
  pageBody: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
  },
  errorTxt: {
    fontSize: 14,
    color: colors.danger,
    marginBottom: 8,
  },
  errorSpaced: {
    marginTop: 10,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    padding: 2,
    marginBottom: 10,
  },
  toggle: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  toggleActive: {
    backgroundColor: colors.surface,
  },
  toggleTxt: {
    fontSize: 13,
    color: colors.inkSoft,
    fontWeight: '500',
  },
  toggleTxtActive: {
    color: colors.ink,
    fontWeight: '600',
  },

  // Buttons
  pill: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  pillTxt: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 14,
  },
  filledPill: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  filledPillTxt: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: 14,
  },
});
