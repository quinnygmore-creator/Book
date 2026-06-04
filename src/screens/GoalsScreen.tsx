import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Goal } from '../types/goal';
import {
  addMilestone,
  createGoal,
  deleteGoal,
  deleteMilestone,
  listGoals,
  renameGoal,
  toggleMilestone,
} from '../lib/goalStore';
import { countByGoal } from '../lib/recordingStore';
import { GoalCard } from '../components/GoalCard';
import { TextInputModal } from '../components/TextInputModal';
import { colors } from '../theme/colors';

interface Props {
  onBack: () => void;
}

type ModalState =
  | { mode: 'newGoal' }
  | { mode: 'renameGoal'; goal: Goal }
  | { mode: 'newMilestone'; goal: Goal }
  | null;

export function GoalsScreen({ onBack }: Props) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [modal, setModal] = useState<ModalState>(null);

  const refresh = useCallback(async () => {
    const [g, c] = await Promise.all([listGoals(), countByGoal()]);
    setGoals(g);
    setCounts(c);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleConfirm = useCallback(
    async (value: string) => {
      if (modal?.mode === 'newGoal') await createGoal(value);
      else if (modal?.mode === 'renameGoal') await renameGoal(modal.goal.id, value);
      else if (modal?.mode === 'newMilestone') await addMilestone(modal.goal.id, value);
      setModal(null);
      await refresh();
    },
    [modal, refresh]
  );

  const handleToggle = useCallback(
    async (goalId: string, milestoneId: string) => {
      await toggleMilestone(goalId, milestoneId);
      await refresh();
    },
    [refresh]
  );

  const handleDeleteMilestone = useCallback(
    (goalId: string, milestoneId: string) => {
      Alert.alert('Delete milestone?', undefined, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMilestone(goalId, milestoneId);
            await refresh();
          },
        },
      ]);
    },
    [refresh]
  );

  const handleGoalLongPress = useCallback(
    (goal: Goal) => {
      Alert.alert(goal.title, undefined, [
        { text: 'Rename', onPress: () => setModal({ mode: 'renameGoal', goal }) },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            Alert.alert(`Delete “${goal.title}”?`, 'This removes the goal and its milestones.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  await deleteGoal(goal.id);
                  await refresh();
                },
              },
            ]),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    },
    [refresh]
  );

  const modalProps = (() => {
    switch (modal?.mode) {
      case 'renameGoal':
        return { title: 'Rename goal', confirmLabel: 'Rename', initialValue: modal.goal.title };
      case 'newMilestone':
        return { title: 'New milestone', confirmLabel: 'Add', placeholder: 'e.g. Design first tote bag' };
      default:
        return { title: 'New goal', confirmLabel: 'Create', placeholder: 'e.g. Launch Clothing Brand' };
    }
  })();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={10} style={styles.backBtn}>
          <Text style={styles.backTxt}>‹ Shelf</Text>
        </Pressable>
        <View style={styles.titleRow}>
          <Text style={styles.brand}>Goals</Text>
          <Pressable onPress={() => setModal({ mode: 'newGoal' })} hitSlop={8}>
            <Text style={styles.newBtn}>+ New</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={goals}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No goals yet</Text>
            <Text style={styles.emptySub}>
              Create a goal, then your entries will link to it automatically.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <GoalCard
            goal={item}
            linkedCount={counts[item.id] ?? 0}
            onToggleMilestone={(mId) => handleToggle(item.id, mId)}
            onDeleteMilestone={(mId) => handleDeleteMilestone(item.id, mId)}
            onAddMilestone={() => setModal({ mode: 'newMilestone', goal: item })}
            onLongPress={() => handleGoalLongPress(item)}
          />
        )}
      />

      <TextInputModal
        visible={modal !== null}
        title={modalProps.title}
        confirmLabel={modalProps.confirmLabel}
        placeholder={modalProps.placeholder}
        initialValue={modalProps.initialValue}
        onCancel={() => setModal(null)}
        onConfirm={handleConfirm}
      />
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: 0.3,
  },
  newBtn: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '600',
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
    paddingHorizontal: 30,
  },
});
