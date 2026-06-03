# Books

> Speak your thoughts. Turn them into books worth keeping.

A mobile-first app that turns spoken thoughts into beautifully structured pages,
organized into personal **books** instead of folders.

This repo is being built in **phases**. Each phase ships one complete, working
slice before the next begins.

---

## Build status

| Phase | Feature | Status |
| ----- | ------- | ------ |
| 1 | Product design | ✅ Complete (see plan) |
| 2 | System architecture | ✅ Complete (see plan) |
| 3 | Voice capture (record / save / play / delete) | ✅ Complete |
| 4 | Speech-to-text (upload / transcribe / display) | ✅ Complete |
| 5 | AI cleanup engine (filler / grammar / title / structure) | ✅ Complete |
| 6 | Book system (create / rename / delete / add entries) | ✅ Complete |
| 7 | Beautiful reading experience (4 themes, reader) | ✅ Complete |
| 8 | Goals system (goals, milestones, AI detection) | ✅ Complete |
| 9 | Final MVP review + launch plan | ✅ Complete |
| — | **Post-review**: auth + sync, onboarding, inline edit | ✅ Complete |

---

## Phase 3 — Voice Capture (current)

The app records audio with a single button, saves recordings on-device, and lets
you play and delete them. **No backend required** — this runs fully offline so the
core capture loop can be validated immediately.

### Tech
- **Expo + React Native + TypeScript**
- `expo-av` for recording & playback
- `expo-file-system` + `AsyncStorage` for local persistence

### Run it

```bash
npm install
npm start          # then press i (iOS), a (Android), or scan the QR in Expo Go
```

> Recording requires a real device or simulator with microphone access.
> On first record you'll be asked for microphone permission.

### Project structure

```
App.tsx                       App entry
app.json                      Expo config + mic permissions
src/
  theme/colors.ts             Warm "notebook" palette
  types/recording.ts          Recording type
  lib/
    recordingStore.ts         Local persistence (filesystem + AsyncStorage)
    format.ts                 Duration / date formatting
  hooks/
    useRecorder.ts            Record start/stop
    usePlayer.ts              Play/stop (one at a time)
  components/
    RecordButton.tsx          Single capture button
    RecordingItem.tsx         List row: play / meta / delete
  screens/
    CaptureScreen.tsx         The capture screen
supabase/
  migrations/0001_init.sql    Foundational DB schema (used from Phase 4)
```

### Data model (Phase 3)
Recordings are stored locally:
- Audio files → `documentDirectory/recordings/<id>.m4a`
- Metadata → `AsyncStorage` key `books.recordings.v1`

The Supabase schema in `supabase/migrations/0001_init.sql` is the foundation that
Phase 4 begins writing to (a recording becomes a `notes` row with `audio_path`).

---

## Phase 4 — Speech-to-Text (current)

Each recording is uploaded to a Supabase **Edge Function** (`transcribe`) that calls
**OpenAI Whisper** and returns the transcript, which is displayed under the
recording. The OpenAI key stays server-side, never in the app.

Flow: `record → upload audio → Whisper → transcript stored locally → displayed`.
Transcription auto-runs after recording when configured; otherwise each recording
shows a **Transcribe** button. Failures show a friendly message + **Retry**.

### Setup (one-time)

```bash
# 1. Deploy the function (needs the Supabase CLI + a project)
supabase functions deploy transcribe --no-verify-jwt
supabase secrets set OPENAI_API_KEY=sk-...

# 2. Point the app at it
cp .env.example .env
#   EXPO_PUBLIC_TRANSCRIBE_URL=https://<project-ref>.functions.supabase.co/transcribe
#   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>

npm start
```

> Without `.env`, the app still records/plays/deletes; the **Transcribe** button
> explains that transcription isn’t configured yet.

### New files / changes
```
supabase/functions/transcribe/index.ts   Whisper-backed Edge Function
src/config.ts                            Reads EXPO_PUBLIC_* env
src/lib/transcription.ts                 Upload + parse transcript, typed errors
src/types/recording.ts                   + transcript, transcriptStatus
src/lib/recordingStore.ts                + updateRecording()
src/components/RecordingItem.tsx          Transcript display / states
src/screens/CaptureScreen.tsx             Auto-transcribe + retry wiring
.env.example                             Config template
```

### Database
No schema change needed — the transcript maps onto `notes.body_raw` and
`notes.status` from `0001_init.sql`. (The app still stores locally in Phase 4;
the cloud write happens when auth + sync land.)

---

## Phase 5 — AI Cleanup Engine (current)

After transcription, the raw text is sent to a second Edge Function (`cleanup`)
that calls **Claude** and returns a structured `{ title, body }` page — filler
removed, grammar fixed, a short title generated, and natural structure applied.
This chains automatically after transcription.

Example: `"Umm I was thinking maybe a tote bag with a hidden compartment"` →
**Design Concept** — *"A tote bag featuring a hidden compartment while maintaining
a clean, minimal appearance."*

Each entry shows a **Clean / Raw** toggle so users can always see the original
transcript (trust + transparency). Failures show a message + **Retry polish**.

### Prompt strategy
- A forced `save_page` tool guarantees structured `{ title, body }` output.
- The system prompt removes filler / fixes grammar but is explicitly forbidden
  from adding ideas or responding to content — it preserves the speaker's voice.
- A one-shot example anchors title length and structure.

### Setup
```bash
supabase functions deploy cleanup --no-verify-jwt
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
# add to .env:  EXPO_PUBLIC_CLEANUP_URL=https://<ref>.functions.supabase.co/cleanup
```

### New files / changes
```
supabase/functions/cleanup/index.ts   Claude-backed cleanup (tool-forced JSON)
src/lib/cleanup.ts                     Client call + typed errors
src/config.ts                          + cleanupUrl / isCleanupConfigured
src/types/recording.ts                 + title, bodyClean, cleanupStatus
src/components/RecordingItem.tsx        Polished page + Clean/Raw toggle
src/screens/CaptureScreen.tsx           Auto-chain cleanup + manual polish
```

### Database
No schema change — the page maps onto `notes.title` + `notes.body_clean`
(already defined in `0001_init.sql`).

---

## Phase 6 — Book System (current)

Entries now live inside **books** instead of one flat list. The app opens on a
**Shelf** of books; tapping a book opens it and you record entries directly into
it. The full pipeline (record → transcribe → polish) runs inside the book.

### UI screens
- **Bookshelf** — a 2-column grid of book covers (emoji + title + page count),
  a dashed **New book** tile, and long-press → **Rename / Delete**.
- **Book** — the book's entries plus the capture button; a **‹ Shelf** back button.

Creating a book drops you straight into it to record. Deleting a book *unassigns*
its entries (mirrors the schema's `ON DELETE SET NULL`) rather than destroying them.

### Navigation
Dependency-free: `App.tsx` holds a tiny route state (`shelf` | `book`). No
navigation library needed for two screens — keeps the build simple.

### New files / changes
```
src/types/book.ts                 Book type
src/lib/bookStore.ts              create / rename / delete / list books
src/lib/recordingStore.ts         + bookId, listRecordings(bookId), countByBook, unassignBook
src/components/TextInputModal.tsx  Reusable create/rename modal
src/screens/BookshelfScreen.tsx   The shelf (grid + CRUD)
src/screens/BookScreen.tsx        A book's entries + capture (was CaptureScreen)
App.tsx                           Shelf ⇄ Book navigation
```

### Database
No schema change — `books` and `notes.book_id` already exist in `0001_init.sql`.
Local data layer (`bookStore` / `recordingStore`) maps 1:1 to Supabase SDK calls:
`insert/update/delete` on **books**, and updating **notes.book_id** for assignment.

---

## Phase 7 — Beautiful Reading Experience (current)

Tapping an entry opens a full-screen, book-like **Reader**: pages you swipe
between horizontally, rendered in one of four themes.

### Themes
| Theme | Feel | Fonts |
| ----- | ---- | ----- |
| **Journal** | warm cream paper, left margin rule | Playfair Display + Lora |
| **Handwritten** | ink-blue, large flowing script | Caveat |
| **Minimal** | crisp white, generous spacing | Inter |
| **Sketchbook** | textured paper, dashed frame | Patrick Hand |

A theme switcher at the bottom of the reader restyles every page live and
persists the choice on the book (`books.theme`).

### Design system
- `src/theme/themes.ts` — typed `ReadingTheme` (page color, ink, fonts, sizes,
  line height, decorations) for all four themes.
- Real typography via `@expo-google-fonts/*`, loaded in `App.tsx` (UI gated
  until fonts are ready).
- `PageView` renders title + body with lightweight markdown (bullets, sub-
  headings, paragraphs) and a long-date header for a book-like touch.

### Page transitions
Horizontal `FlatList` with `pagingEnabled` gives the swipe-between-pages feel;
each page scrolls vertically for long entries.

### New files / changes
```
src/theme/themes.ts            ThemeId + 4 ReadingThemes + helpers
src/components/PageView.tsx     Themed page renderer (mini markdown)
src/components/Reader.tsx       Full-screen pager + theme switcher
src/types/book.ts               + theme
src/lib/bookStore.ts            + setBookTheme; new books default to 'journal'
src/lib/format.ts               + formatLongDate
src/components/RecordingItem.tsx + onOpen (tap to read)
src/screens/BookScreen.tsx       Opens the Reader
App.tsx                          Loads fonts before rendering
```

---

## Phase 8 — Goals System (current)

Create **goals**, add **milestones**, and check them off. After an entry is
cleaned, an AI step links it to any goals it mentions.

Example: the entry *"I worked on the tote bag today"* automatically links to the
goal **Launch Clothing Brand** — shown as a 🎯 chip on the entry and counted as
"mentioned in N entries" on the goal.

### Goal architecture
- Goals contain milestones (embedded locally; separate `milestones` table in SQL).
- Entries link to goals via `note_goals` in SQL; locally via `Recording.goalIds`.
- A **Goals** screen (reached from the shelf header) lists goals with a progress
  bar, tappable milestone checkboxes, add-milestone, and long-press rename/delete.

### AI workflow
`cleaned entry → POST /detect-goals (text + user's goals) → Claude (forced
link_goals tool) → matched goal ids → stored on the entry`. Best-effort: any
failure is ignored so it never blocks the capture loop. The model may only
return ids from the provided list (validated server-side).

### Setup
```bash
supabase functions deploy detect-goals --no-verify-jwt
# add to .env:  EXPO_PUBLIC_DETECT_GOALS_URL=https://<ref>.functions.supabase.co/detect-goals
```

### New files / changes
```
supabase/migrations/0002_goals.sql       goals / milestones / note_goals + RLS
supabase/functions/detect-goals/index.ts Claude goal detection (forced tool)
src/types/goal.ts                         Goal + Milestone
src/lib/goalStore.ts                      goal/milestone CRUD
src/lib/goalDetection.ts                  client call (best-effort)
src/components/GoalCard.tsx               goal + milestones + progress
src/screens/GoalsScreen.tsx               the goals screen
src/config.ts / src/types/recording.ts   + detectGoalsUrl / goalIds
src/lib/recordingStore.ts                 + countByGoal
src/components/RecordingItem.tsx          🎯 goal chips
src/screens/BookScreen.tsx                runs detection, passes goal titles
src/screens/BookshelfScreen.tsx / App.tsx Goals navigation
```

---

## Post-review additions (auth + sync, onboarding, inline edit)

Acting on the Phase 9 review, three launch-readiness features were added. All
stay **local-first**: with no Supabase configured the app still runs offline
(no sign-in), and cloud features activate only when `EXPO_PUBLIC_SUPABASE_URL`
+ anon key are set.

### Auth + cloud sync
- **Auth:** email one-time-code sign-in via Supabase (no OAuth provider setup
  needed; Apple/Google can be added later). `SignInScreen` + `useAuth`.
- **Sync:** `src/lib/sync.ts` — last-write-wins by `updatedAt`. On sign-in it
  pulls cloud rows, merges with local, writes the merged result locally, and
  pushes it back. Covers books, notes, goals, milestones, and note→goal links.
- **Schema:** ids are now client-generated `text` (so the same id works offline
  and in the cloud). See updated `0001_init.sql` / `0002_goals.sql`.
- **Limitation:** audio files stay on-device; an entry synced to another device
  shows its page text but can't replay the original audio. Sync runs on sign-in.

### Onboarding
First-run carousel (`OnboardingScreen`) explaining speak → beautify → collect,
ending by requesting microphone access. Gated by a flag (`src/lib/onboarding.ts`).

### Inline page editing
The Reader has an **Edit** mode: tap Edit to correct the AI-cleaned title/body
in the current theme, then Save (persists via `updateRecording`).

### Setup for cloud mode
```bash
# add to .env:
EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
# apply the SQL in supabase/migrations to your project, then enable email auth.
```
