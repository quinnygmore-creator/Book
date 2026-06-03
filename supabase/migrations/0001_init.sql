-- ============================================================
-- Books — Foundational schema (Phase 2 design)
-- ------------------------------------------------------------
-- IDs are TEXT and generated on the client so the same id works
-- offline (local-first) and in the cloud (sync) without remapping.
-- profiles.id stays a uuid because it mirrors auth.users.
-- ============================================================

-- ---------- PROFILES (extends Supabase auth.users) ----------
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  default_theme text default 'journal',   -- journal|handwritten|minimal|sketchbook
  cleanup_style text default 'balanced',   -- keep_voice|balanced|concise
  created_at    timestamptz default now()
);

-- ---------- BOOKS (folders, but emotional) ----------
create table if not exists books (
  id          text primary key,
  user_id     uuid not null references profiles(id) on delete cascade,
  title       text not null,
  cover_emoji text,
  theme       text default 'journal',
  sort_order  int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ---------- NOTES (a "page" / entry; also holds the recording) ----------
create table if not exists notes (
  id            text primary key,
  user_id       uuid not null references profiles(id) on delete cascade,
  book_id       text references books(id) on delete set null,  -- null = Inbox
  title         text,
  body_clean    text,   -- AI-structured markdown (shown by default)
  body_raw      text,   -- original transcript (trust + reprocess)
  audio_path    text,   -- local-only in MVP; reserved for cloud storage
  duration_secs int,
  status        text default 'processing',  -- processing|ready|failed
  error_message text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists notes_user_book_created_idx
  on notes (user_id, book_id, created_at desc);

-- ---------- USAGE_EVENTS (cost metering / rate limits) ----------
create table if not exists usage_events (
  id         text primary key,
  user_id    uuid not null references profiles(id) on delete cascade,
  kind       text not null,   -- stt | cleanup
  audio_secs int,
  tokens_in  int,
  tokens_out int,
  created_at timestamptz default now()
);

-- ---------- ROW-LEVEL SECURITY: each user sees only their own rows ----------
alter table profiles     enable row level security;
alter table books        enable row level security;
alter table notes        enable row level security;
alter table usage_events enable row level security;

create policy "own profile"      on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own books"        on books
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own notes"        on notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own usage_events" on usage_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
