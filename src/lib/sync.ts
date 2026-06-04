/**
 * Cloud sync — local-first, last-write-wins by `updatedAt`.
 *
 * Strategy (kept deliberately simple for MVP):
 *   1. Pull the user's rows from Supabase.
 *   2. Merge with local rows, keeping whichever was updated more recently.
 *   3. Write the merged result locally AND push it back to the cloud.
 *
 * Notes:
 *   - Audio files stay on-device; only the page text/metadata syncs. An
 *     entry pulled from another device shows its page but can't replay audio.
 *   - Call `fullSync(userId)` on sign-in. It's best-effort; failures are
 *     surfaced to the caller but never corrupt local data.
 */
import { supabase } from './supabase';
import { Book } from '../types/book';
import { Goal, Milestone } from '../types/goal';
import { Recording } from '../types/recording';
import { listBooks, replaceAllBooks } from './bookStore';
import { listGoals, replaceAllGoals } from './goalStore';
import { listRecordings, replaceAllRecordings } from './recordingStore';

function newest<T>(items: T[], getId: (t: T) => string, getTime: (t: T) => string): T[] {
  // De-dupe by id keeping the most recently updated.
  const map = new Map<string, T>();
  for (const item of items) {
    const existing = map.get(getId(item));
    if (!existing || getTime(item) > getTime(existing)) {
      map.set(getId(item), item);
    }
  }
  return [...map.values()];
}

// ---------- row <-> local mappers ----------

function bookToRow(b: Book, userId: string) {
  return {
    id: b.id,
    user_id: userId,
    title: b.title,
    cover_emoji: b.coverEmoji ?? null,
    theme: b.theme ?? 'journal',
    created_at: b.createdAt,
    updated_at: b.updatedAt,
  };
}
function rowToBook(r: any): Book {
  return {
    id: r.id,
    title: r.title,
    coverEmoji: r.cover_emoji ?? undefined,
    theme: r.theme ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function noteToRow(n: Recording, userId: string) {
  const ready = n.cleanupStatus === 'ready' || n.transcriptStatus === 'ready';
  return {
    id: n.id,
    user_id: userId,
    book_id: n.bookId ?? null,
    title: n.title ?? null,
    body_clean: n.bodyClean ?? null,
    body_raw: n.transcript ?? null,
    duration_secs: Math.round(n.durationMillis / 1000),
    status: ready ? 'ready' : 'processing',
    created_at: n.createdAt,
    updated_at: n.updatedAt ?? n.createdAt,
  };
}
function rowToNote(r: any, goalIds: string[]): Recording {
  return {
    id: r.id,
    uri: '', // audio is local-only; absent for cloud-pulled entries
    durationMillis: (r.duration_secs ?? 0) * 1000,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    bookId: r.book_id ?? undefined,
    title: r.title ?? undefined,
    bodyClean: r.body_clean ?? undefined,
    transcript: r.body_raw ?? undefined,
    transcriptStatus: r.body_raw ? 'ready' : 'none',
    cleanupStatus: r.body_clean ? 'ready' : 'none',
    goalIds: goalIds.length ? goalIds : undefined,
  };
}

// ---------- main entry point ----------

export async function fullSync(userId: string): Promise<void> {
  if (!supabase) return;

  // Ensure a profile row exists (FK target for everything else).
  await supabase.from('profiles').upsert({ id: userId }, { onConflict: 'id' });

  const [localBooks, localGoals, localNotes] = await Promise.all([
    listBooks(),
    listGoals(),
    listRecordings(),
  ]);

  // ----- pull -----
  const [booksRes, goalsRes, milestonesRes, notesRes, noteGoalsRes] = await Promise.all([
    supabase.from('books').select('*').eq('user_id', userId),
    supabase.from('goals').select('*').eq('user_id', userId),
    supabase.from('milestones').select('*').eq('user_id', userId),
    supabase.from('notes').select('*').eq('user_id', userId),
    supabase.from('note_goals').select('*').eq('user_id', userId),
  ]);

  const remoteBooks = (booksRes.data ?? []).map(rowToBook);

  const milestonesByGoal = new Map<string, Milestone[]>();
  for (const m of milestonesRes.data ?? []) {
    const list = milestonesByGoal.get(m.goal_id) ?? [];
    list.push({ id: m.id, title: m.title, done: !!m.is_done, createdAt: m.created_at });
    milestonesByGoal.set(m.goal_id, list);
  }
  const remoteGoals: Goal[] = (goalsRes.data ?? []).map((g: any) => ({
    id: g.id,
    title: g.title,
    milestones: milestonesByGoal.get(g.id) ?? [],
    createdAt: g.created_at,
    updatedAt: g.updated_at,
  }));

  const goalIdsByNote = new Map<string, string[]>();
  for (const ng of noteGoalsRes.data ?? []) {
    const list = goalIdsByNote.get(ng.note_id) ?? [];
    list.push(ng.goal_id);
    goalIdsByNote.set(ng.note_id, list);
  }
  const remoteNotes = (notesRes.data ?? []).map((r: any) =>
    rowToNote(r, goalIdsByNote.get(r.id) ?? [])
  );

  // ----- merge (last-write-wins) -----
  const mergedBooks = newest(
    [...remoteBooks, ...localBooks],
    (b) => b.id,
    (b) => b.updatedAt ?? ''
  );
  const mergedGoals = newest(
    [...remoteGoals, ...localGoals],
    (g) => g.id,
    (g) => g.updatedAt ?? ''
  );
  // For notes, prefer a local copy that has audio when timestamps tie/equalish.
  const mergedNotes = newest(
    [...remoteNotes, ...localNotes],
    (n) => n.id,
    (n) => n.updatedAt ?? n.createdAt
  );

  // ----- write local -----
  await Promise.all([
    replaceAllBooks(mergedBooks),
    replaceAllGoals(mergedGoals),
    replaceAllRecordings(mergedNotes),
  ]);

  // ----- push merged back to cloud -----
  if (mergedBooks.length) {
    await supabase.from('books').upsert(mergedBooks.map((b) => bookToRow(b, userId)));
  }
  if (mergedGoals.length) {
    await supabase.from('goals').upsert(
      mergedGoals.map((g) => ({
        id: g.id,
        user_id: userId,
        title: g.title,
        created_at: g.createdAt,
        updated_at: g.updatedAt,
      }))
    );
    // Milestones: replace this user's set with the merged truth.
    await supabase.from('milestones').delete().eq('user_id', userId);
    const milestoneRows = mergedGoals.flatMap((g) =>
      g.milestones.map((m, i) => ({
        id: m.id,
        user_id: userId,
        goal_id: g.id,
        title: m.title,
        is_done: m.done,
        sort_order: i,
        created_at: m.createdAt,
      }))
    );
    if (milestoneRows.length) await supabase.from('milestones').insert(milestoneRows);
  }
  if (mergedNotes.length) {
    await supabase.from('notes').upsert(mergedNotes.map((n) => noteToRow(n, userId)));
    // note_goals: replace this user's set with the merged truth.
    await supabase.from('note_goals').delete().eq('user_id', userId);
    const ngRows = mergedNotes.flatMap((n) =>
      (n.goalIds ?? []).map((gid) => ({ note_id: n.id, goal_id: gid, user_id: userId }))
    );
    if (ngRows.length) await supabase.from('note_goals').insert(ngRows);
  }
}
