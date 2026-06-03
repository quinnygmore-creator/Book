-- ============================================================
-- Books — Goals system (Phase 8)
-- ------------------------------------------------------------
-- Goals contain milestones. Entries (notes) link to goals via a
-- note_goals join table, populated by the AI goal-detection step.
-- ============================================================

create table if not exists goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  title       text not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists milestones (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  goal_id     uuid not null references goals(id) on delete cascade,
  title       text not null,
  is_done     boolean default false,
  sort_order  int default 0,
  created_at  timestamptz default now()
);

-- Which entries mention / progress which goals (AI-detected).
create table if not exists note_goals (
  note_id     uuid not null references notes(id) on delete cascade,
  goal_id     uuid not null references goals(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (note_id, goal_id)
);

create index if not exists milestones_goal_idx on milestones (goal_id, sort_order);
create index if not exists note_goals_goal_idx on note_goals (goal_id);

-- Row-level security: users see only their own rows.
alter table goals      enable row level security;
alter table milestones enable row level security;
alter table note_goals enable row level security;

create policy "own goals"      on goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own milestones" on milestones
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own note_goals" on note_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
