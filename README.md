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
| 5 | **AI cleanup engine** (filler / grammar / title / structure) | ✅ Complete |
| 6 | Book system | ⏳ |
| 7 | Beautiful reading experience | ⏳ |
| 8 | Goals system | ⏳ |
| 9 | Final MVP review | ⏳ |

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
