# CLAUDE.md — readThings

## Project Overview

readThings is a camera-first vocabulary learning mobile app (Android + iOS) built with Expo/React Native + TypeScript. Users point their camera at objects to see names in multiple languages with pronunciation.

**Architecture**: Hybrid ML pipeline — ML Kit Image Labeling (~30ms) for real-time detection, Gemma 4 E2B (llama.rn GGUF) for on-device multilingual translation with phonetics.

## Tech Stack

- **Framework**: Expo SDK 54+, React Native, TypeScript (strict)
- **Routing**: expo-router (file-based)
- **Camera + ML**: react-native-vision-camera v4, custom frame processor plugin for ML Kit
- **On-device LLM**: Gemma 4 E2B via llama.rn (GGUF Q4_K_M)
- **TTS**: expo-speech (platform native)
- **Database**: expo-sqlite + Drizzle ORM
- **State**: Zustand (persist middleware for settings)
- **Storage**: expo-file-system (photos in documentDirectory)
- **Builds**: EAS Build

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (requires dev client, NOT Expo Go)
npx expo start

# Run on device
npx expo run:ios
npx expo run:android

# Generate DB migrations after schema changes
npx drizzle-kit generate

# Prebuild native projects (after adding plugins or native deps)
npx expo prebuild --clean

# Type check
npx tsc --noEmit

# Lint
npx expo lint

# Build for testing
eas build -p android --profile preview
eas build -p ios --profile preview
```

## Project Structure

```
src/
  app/          # expo-router file-based routing (screens)
  components/   # Shared React components
  services/     # Business logic (detection, gemma, tts, imageStorage)
  db/           # Drizzle schema + client
  stores/       # Zustand stores
  hooks/        # Custom React hooks
  constants/    # Languages, prompts, config
modules/        # Native Expo local modules (ML Kit frame processor)
drizzle/        # Auto-generated migration files
plugins/        # Expo config plugins
```

## Rules and Constraints

### Architecture
- This app is OFFLINE-FIRST. No cloud APIs for core functionality. Gemma runs fully on-device.
- ML Kit handles detection (fast, real-time). Gemma handles translation (rich, 1-3s). Never mix these roles.
- All translations are cached in SQLite. Never translate the same word twice.
- Photos are stored in expo-file-system documentDirectory, paths stored in SQLite.

### Code Style
- TypeScript strict mode. No `any` types except when interfacing with native plugin returns.
- Files: kebab-case. Components: PascalCase. Hooks: `use` prefix camelCase. Stores: camelCase with `Store` suffix.
- Database schema uses camelCase in TypeScript, snake_case in SQL columns (Drizzle convention).
- No classes for services — use plain async functions.
- No barrel exports (index.ts re-exports). Import directly from the source file.

### Database
- Schema lives in `src/db/schema.ts`. Client in `src/db/client.ts`.
- Always use `openDatabaseSync` (not async) with `enableChangeListener: true`.
- After any schema change, run `npx drizzle-kit generate` to create migrations.
- Use `useLiveQuery` for reactive UI. Use plain queries for one-off reads.
- Use `onConflictDoUpdate` (upsert) for the translation cache.

### Native Modules
- ML Kit frame processor plugin lives in `modules/mlkit-label/`.
- iOS: Swift plugin + ObjC registration file. Android: Kotlin plugin + Expo Module.
- Frame processor registered as `"labelImage"` on both platforms.
- Frame processing throttled to 2fps via `runAtTargetFps(2, ...)`.

### Gemma / LLM
- Use `llama.rn` directly (not @react-native-ai/llama) for minimal dependencies.
- Temperature = 0 for deterministic JSON output.
- Always parse Gemma output with try/catch — fallback to English label on failure.
- Model files stored in `${documentDirectory}models/`.
- Never run Gemma on live camera frames — only on user-initiated capture.

### State Management
- Zustand for all state. No React Context for app state.
- Persisted stores (settings) use `createJSONStorage(() => AsyncStorage)`.
- Transient stores (detection results, model status) use plain `create()`.
- Use `partialize` to avoid serializing action functions.

### TTS
- Pass native script text to TTS (e.g., "猫" not "neko"). The TTS engine handles pronunciation.
- Default rate 0.9 (slightly slower for learners).
- Always check language availability before speaking.

### What NOT to do
- Do NOT use Expo Go — native modules require dev client builds.
- Do NOT add cloud translation APIs — the app is designed to be fully offline.
- Do NOT run Gemma during live camera preview — only on capture.
- Do NOT store images as blobs in SQLite — store file paths only.
- Do NOT use `drizzle-kit push` — it doesn't work with the expo driver. Use `generate` + `useMigrations`.
- Do NOT add analytics, telemetry, or tracking without explicit approval.
- Do NOT commit API keys, secrets, or model files to the repo.

## Key Files

- `DEVELOPMENT_PLAN.md` — High-level architecture, tech decisions, risks
- `.claude/PRPs/plans/readthings-full-implementation.plan.md` — Detailed 31-task implementation plan with code patterns
- `app.config.ts` — Expo configuration with all plugins
- `src/db/schema.ts` — Database schema (source of truth)
- `src/services/gemma.ts` — Gemma model download, init, translation
- `src/services/detection.ts` — ML Kit frame processor wrapper
- `modules/mlkit-label/` — Native frame processor plugin (Swift + Kotlin)

## Supported Languages

ja (Japanese), vi (Vietnamese), ko (Korean), zh (Chinese), es (Spanish), fr (French), de (German), pt (Portuguese), th (Thai), ar (Arabic)
