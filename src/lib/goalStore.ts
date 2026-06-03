/**
 * Local-first persistence for goals + milestones. Maps onto the
 * `goals` / `milestones` tables; swaps to Supabase SDK calls later.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal, Milestone } from '../types/goal';

const KEY = 'books.goals.v1';

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function writeAll(goals: Goal[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(goals));
}

/** Return all goals, oldest first. */
export async function listGoals(): Promise<Goal[]> {
  const raw = await AsyncStorage.getItem(KEY);
  const goals: Goal[] = raw ? JSON.parse(raw) : [];
  return goals
    .map((g) => ({ ...g, milestones: g.milestones ?? [] }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Replace the entire goals list (used by cloud sync). */
export async function replaceAllGoals(goals: Goal[]): Promise<void> {
  await writeAll(goals);
}

export async function createGoal(title: string): Promise<Goal> {
  const goals = await listGoals();
  const now = new Date().toISOString();
  const goal: Goal = {
    id: uid(),
    title: title.trim(),
    milestones: [],
    createdAt: now,
    updatedAt: now,
  };
  await writeAll([...goals, goal]);
  return goal;
}

export async function renameGoal(id: string, title: string): Promise<void> {
  const goals = await listGoals();
  await writeAll(
    goals.map((g) =>
      g.id === id ? { ...g, title: title.trim(), updatedAt: new Date().toISOString() } : g
    )
  );
}

export async function deleteGoal(id: string): Promise<void> {
  const goals = await listGoals();
  await writeAll(goals.filter((g) => g.id !== id));
}

export async function addMilestone(goalId: string, title: string): Promise<void> {
  const goals = await listGoals();
  const milestone: Milestone = {
    id: uid(),
    title: title.trim(),
    done: false,
    createdAt: new Date().toISOString(),
  };
  await writeAll(
    goals.map((g) =>
      g.id === goalId
        ? { ...g, milestones: [...g.milestones, milestone], updatedAt: new Date().toISOString() }
        : g
    )
  );
}

export async function toggleMilestone(goalId: string, milestoneId: string): Promise<void> {
  const goals = await listGoals();
  await writeAll(
    goals.map((g) =>
      g.id === goalId
        ? {
            ...g,
            milestones: g.milestones.map((m) =>
              m.id === milestoneId ? { ...m, done: !m.done } : m
            ),
            updatedAt: new Date().toISOString(),
          }
        : g
    )
  );
}

export async function deleteMilestone(goalId: string, milestoneId: string): Promise<void> {
  const goals = await listGoals();
  await writeAll(
    goals.map((g) =>
      g.id === goalId
        ? { ...g, milestones: g.milestones.filter((m) => m.id !== milestoneId) }
        : g
    )
  );
}
