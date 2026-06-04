import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Goal } from '../types/goal';
import { colors, radius } from '../theme/colors';

interface Props {
  goal: Goal;
  linkedCount: number;
  onToggleMilestone: (milestoneId: string) => void;
  onDeleteMilestone: (milestoneId: string) => void;
  onAddMilestone: () => void;
  onLongPress: () => void;
}

export function GoalCard({
  goal,
  linkedCount,
  onToggleMilestone,
  onDeleteMilestone,
  onAddMilestone,
  onLongPress,
}: Props) {
  const total = goal.milestones.length;
  const done = goal.milestones.filter((m) => m.done).length;
  const pct = total === 0 ? 0 : done / total;

  return (
    <Pressable style={styles.card} onLongPress={onLongPress} delayLongPress={300}>
      <Text style={styles.title}>{goal.title}</Text>

      <View style={styles.progressRow}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct * 100}%` }]} />
        </View>
        <Text style={styles.progressTxt}>
          {done}/{total}
        </Text>
      </View>

      {goal.milestones.map((m) => (
        <Pressable
          key={m.id}
          style={styles.milestoneRow}
          onPress={() => onToggleMilestone(m.id)}
          onLongPress={() => onDeleteMilestone(m.id)}
          delayLongPress={300}
        >
          <View style={[styles.checkbox, m.done && styles.checkboxDone]}>
            {m.done && <Text style={styles.check}>✓</Text>}
          </View>
          <Text style={[styles.milestoneTxt, m.done && styles.milestoneDone]}>
            {m.title}
          </Text>
        </Pressable>
      ))}

      <Pressable onPress={onAddMilestone} style={styles.addRow} hitSlop={6}>
        <Text style={styles.addTxt}>+ Add milestone</Text>
      </Pressable>

      {linkedCount > 0 && (
        <Text style={styles.linked}>
          🎯 Mentioned in {linkedCount} {linkedCount === 1 ? 'entry' : 'entries'}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  progressTxt: {
    marginLeft: 10,
    fontSize: 13,
    color: colors.inkSoft,
    fontVariant: ['tabular-nums'],
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxDone: {
    backgroundColor: colors.accent,
  },
  check: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  milestoneTxt: {
    flex: 1,
    fontSize: 15,
    color: colors.ink,
  },
  milestoneDone: {
    color: colors.inkSoft,
    textDecorationLine: 'line-through',
  },
  addRow: {
    paddingVertical: 8,
  },
  addTxt: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
  },
  linked: {
    marginTop: 6,
    fontSize: 13,
    color: colors.inkSoft,
  },
});
