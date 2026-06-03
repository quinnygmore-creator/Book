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
| 3 | **Voice capture** (record / save / play / delete) | ✅ Complete |
| 4 | Speech-to-text | ⏳ Next |
| 5 | AI cleanup engine | ⏳ |
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
