# Plan: readThings — Full Implementation (Phases 1-6)

## Summary

readThings is a React Native/Expo mobile app (Android + iOS) that uses the device camera with ML Kit for real-time object detection, Gemma 4 E2B (via llama.rn GGUF) for on-device multilingual translation with pronunciation, expo-speech for TTS, and expo-sqlite + Drizzle ORM for persistent local storage. This plan covers greenfield implementation from empty directory to release-ready builds.

## User Story

As a language learner,
I want to point my phone camera at any object and instantly see its name in my target language with pronunciation,
So that I can build vocabulary naturally from the real world around me.

## Problem -> Solution

No app exists that combines real-time object detection with on-device multilingual translation and pronunciation in a single offline-capable experience -> readThings provides a camera-first vocabulary builder that works entirely on-device after initial model download.

## Metadata
- **Complexity**: XL (greenfield, 6 phases, native modules, on-device ML + LLM)
- **Source PRD**: `/Volumes/ExDrive/_sources/readThings/DEVELOPMENT_PLAN.md`
- **PRD Phase**: All phases (1-6)
- **Estimated Files**: ~35 files

---

## UX Design

### Screen Flow
```
[Onboarding (first launch)]
    |
    v
[Camera Tab]                    [Library Tab]              [Settings Tab]
+--------------------------+   +----------------------+   +------------------+
| [Language: JP] [VI] [KO] |   | Search: [________]   |   | Target Languages |
|                          |   |                      |   |   [x] Japanese   |
|   +------------------+   |   | +--+ +--+ +--+ +--+ |   |   [x] Vietnamese |
|   |                  |   |   | |  | |  | |  | |  | |   |   [ ] Korean     |
|   |  CAMERA PREVIEW  |   |   | |  | |  | |  | |  | |   |                  |
|   |                  |   |   | +--+ +--+ +--+ +--+ |   | TTS Speed        |
|   +------------------+   |   | +--+ +--+ +--+ +--+ |   | [====o=====] 0.9 |
|                          |   | |  | |  | |  | |  | |   |                  |
|   --- Detection ---      |   | +--+ +--+ +--+ +--+ |   | Gemma Model      |
|   cat       92%          |   |                      |   | [Downloaded] 1.3G|
|   animal    85%          |   +----------------------+   | [Delete Model]   |
|                          |   Tap card -> Detail:        |                  |
|      [ CAPTURE ]         |   +-----------------------+  | [Dark Mode]  [x] |
+--------------------------+   | [Photo]               |  +------------------+
    |                          | cat                    |
    v (on capture)             | --                     |
+---------------------------+  | JA: 猫                 |
| [Photo taken]             |  |     neko         [>]  |
|                           |  | VI: con meo            |
| cat (92%)                 |  |     kon mew       [>]  |
| --- Translations ---      |  | KO: 고양이             |
| JA: 猫                    |  |     goyang-i      [>]  |
|     neko            [>]   |  +-----------------------+
| VI: con meo               |
|     kon mew         [>]   |
|                           |
| [Save to Library] [Retry] |
+---------------------------+
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| App Launch | N/A (new app) | Camera preview with language chips | Onboarding on first run |
| Object Detection | N/A | Real-time English labels on camera feed | ML Kit, throttled to 2fps |
| Translation | N/A | 1-3s after capture, translations appear | Gemma 4 E2B on-device |
| Pronunciation | N/A | Tap speaker icon to hear word | expo-speech, native TTS |
| Save | N/A | Tap "Save" on capture result screen | SQLite + photo to filesystem |
| Review | N/A | Browse library grid, tap for detail | Drizzle live queries |

---

## Mandatory Reading

| Priority | File | Why |
|---|---|---|
| P0 | `DEVELOPMENT_PLAN.md` | Full architecture, tech stack, risks, schema |
| P0 | This plan file | Step-by-step implementation with code patterns |

---

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| Vision Camera v4 Frame Processors | github.com/mrousavy/react-native-vision-camera | `useFrameProcessor` + `runAtTargetFps` + `Worklets.createRunOnJS` for ML Kit bridge |
| ML Kit Image Labeling | developers.google.com/ml-kit/vision/image-labeling | iOS: `VisionImage(buffer: frame.buffer)`, Android: `InputImage.fromMediaImage(frame.image, rotation)` |
| llama.rn v0.12 | github.com/mybigday/llama.rn | `initLlama()` -> `context.completion()` with messages API, streaming, JSON schema output |
| Gemma 4 E2B GGUF | huggingface.co/unsloth/gemma-4-E2B-it-GGUF | Q4_K_M variant (~2.5GB), text-only sufficient for translation |
| Drizzle + expo-sqlite | orm.drizzle.team/docs/get-started/expo-new | `driver: 'expo'` in config, `useMigrations` hook, `useLiveQuery` for reactive UI |
| expo-speech | docs.expo.dev/versions/latest/sdk/speech | `Speech.speak(text, { language, rate, pitch })`, BCP-47 codes |
| Zustand persist | github.com/pmndrs/zustand | `createJSONStorage(() => AsyncStorage)` for React Native |

---

## Patterns to Mirror

### NAMING_CONVENTION
```typescript
// Files: kebab-case (capture-result.tsx, image-storage.ts)
// Components: PascalCase (DetectionOverlay.tsx -> export function DetectionOverlay)
// Hooks: camelCase with "use" prefix (useDetection.ts -> export function useDetection)
// Stores: camelCase with "Store" suffix (settingsStore.ts -> useSettingsStore)
// Services: camelCase (gemma.ts -> export async function translateLabels)
// DB schema: camelCase TS, snake_case SQL (imagePath -> image_path)
// Constants: UPPER_SNAKE_CASE for values, camelCase for objects
```

### DB_PATTERN
```typescript
// SOURCE: Drizzle ORM + expo-sqlite convention
// Schema in src/db/schema.ts, client in src/db/client.ts
// Operations as plain async functions (not classes)
import { eq, and, desc } from 'drizzle-orm';
import { db } from './client';
import { libraryItems } from './schema';

export async function getLibraryItemById(id: number) {
  const rows = await db.select()
    .from(libraryItems)
    .where(eq(libraryItems.id, id))
    .limit(1);
  return rows[0] ?? null;
}
```

### STATE_PATTERN
```typescript
// SOURCE: Zustand convention
// Persisted stores use persist middleware + AsyncStorage
// Transient stores are plain create()
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      targetLanguages: ['ja', 'vi'],
      setTargetLanguages: (langs) => set({ targetLanguages: langs }),
    }),
    {
      name: 'readthings-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ targetLanguages: state.targetLanguages }),
    }
  )
);
```

### FRAME_PROCESSOR_PATTERN
```typescript
// SOURCE: react-native-vision-camera v4
import { useFrameProcessor, runAtTargetFps } from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';

const onLabelsDetected = Worklets.createRunOnJS((labels: Label[]) => {
  useDetectionStore.getState().setLabels(labels);
});

const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  runAtTargetFps(2, () => {
    'worklet';
    const labels = labelImage(frame);
    if (labels.length > 0) onLabelsDetected(labels);
  });
}, [onLabelsDetected]);
```

### NATIVE_PLUGIN_PATTERN_IOS
```swift
// SOURCE: Vision Camera v4 frame processor plugin
import VisionCamera
import MLKitVision
import MLKitImageLabeling

@objc(MLKitLabelPlugin)
public class MLKitLabelPlugin: FrameProcessorPlugin {
  private static let labeler: ImageLabeler = {
    let opts = ImageLabelerOptions()
    opts.confidenceThreshold = 0.4
    return ImageLabeler.imageLabeler(options: opts)
  }()

  public override func callback(_ frame: Frame, withArguments args: [AnyHashable: Any]?) -> Any? {
    let image = VisionImage(buffer: frame.buffer)
    image.orientation = frame.orientation
    guard let labels = try? MLKitLabelPlugin.labeler.results(in: image) else { return nil }
    return labels.prefix(5).map { ["label": $0.text, "confidence": $0.confidence] }
  }
}
```

### NATIVE_PLUGIN_PATTERN_ANDROID
```kotlin
// SOURCE: Vision Camera v4 frame processor plugin
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.label.ImageLabeling
import com.google.mlkit.vision.label.defaults.ImageLabelerOptions
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin

class MLKitLabelPlugin : FrameProcessorPlugin() {
  private val labeler = ImageLabeling.getClient(
    ImageLabelerOptions.Builder().setConfidenceThreshold(0.4f).build()
  )
  override fun callback(frame: Frame, params: Map<String, Any>?): Any? {
    val input = InputImage.fromMediaImage(
      frame.image, frame.imageProxy.imageInfo.rotationDegrees
    )
    val labels = Tasks.await(labeler.process(input))
    return labels.take(5).map { mapOf("label" to it.text, "confidence" to it.confidence.toDouble()) }
  }
}
```

### LLAMA_COMPLETION_PATTERN
```typescript
// SOURCE: llama.rn v0.12
import { initLlama, type LlamaContext } from 'llama.rn';

const context = await initLlama({
  model: modelPath,
  n_ctx: 2048,
  n_gpu_layers: 99,
  use_mlock: true,
}, (progress) => console.log(`Loading: ${progress}%`));

const result = await context.completion({
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Translate "cat" to ja, vi, ko with phonetics. JSON only.` },
  ],
  n_predict: 256,
  temperature: 0,
  stop: ['```', '\n\n\n'],
  response_format: { type: 'json_object' },
});
const parsed = JSON.parse(result.text);
```

### TTS_PATTERN
```typescript
// SOURCE: expo-speech
import * as Speech from 'expo-speech';

export function speakWord(text: string, lang: string, rate = 0.9) {
  Speech.speak(text, { language: lang, rate, pitch: 1.0 });
}
```

---

## Files to Change

### Phase 1: Scaffold + Camera
| File | Action | Justification |
|---|---|---|
| `package.json` | CREATE | Expo project dependencies |
| `app.config.ts` | CREATE | Expo config with plugins |
| `tsconfig.json` | CREATE | TypeScript strict config |
| `babel.config.js` | CREATE | Worklets plugin |
| `metro.config.js` | CREATE | .sql extension support for Drizzle migrations |
| `eas.json` | CREATE | EAS Build profiles |
| `src/app/_layout.tsx` | CREATE | Root tab navigator with migrations gate |
| `src/app/index.tsx` | CREATE | Redirect to camera |
| `src/app/camera.tsx` | CREATE | Camera preview + capture button |
| `src/app/library/index.tsx` | CREATE | Placeholder library grid |
| `src/app/settings.tsx` | CREATE | Placeholder settings |
| `src/services/imageStorage.ts` | CREATE | Photo save/load/delete |

### Phase 2: ML Kit Detection
| File | Action | Justification |
|---|---|---|
| `modules/mlkit-label/ios/MLKitLabelPlugin.swift` | CREATE | iOS frame processor plugin |
| `modules/mlkit-label/ios/MLKitLabelPlugin.m` | CREATE | ObjC registration bridge |
| `modules/mlkit-label/ios/MLKitLabel.podspec` | CREATE | iOS pod dependencies |
| `modules/mlkit-label/android/src/main/.../MLKitLabelPlugin.kt` | CREATE | Android frame processor plugin |
| `modules/mlkit-label/android/src/main/.../MLKitLabelModule.kt` | CREATE | Expo Module registration |
| `modules/mlkit-label/android/build.gradle` | CREATE | Android ML Kit dependencies |
| `modules/mlkit-label/expo-module.config.json` | CREATE | Expo local module config |
| `src/services/detection.ts` | CREATE | TS wrapper for frame processor plugin |
| `src/hooks/useDetection.ts` | CREATE | Frame processor hook + state |
| `src/stores/detectionStore.ts` | CREATE | Current detection labels (transient) |
| `src/components/DetectionOverlay.tsx` | CREATE | Floating label overlay on camera |
| `src/app/camera.tsx` | UPDATE | Integrate frame processor + overlay |
| `src/app/capture-result.tsx` | CREATE | Post-capture result screen |

### Phase 3: Gemma Translation
| File | Action | Justification |
|---|---|---|
| `src/db/schema.ts` | CREATE | Drizzle table definitions |
| `src/db/client.ts` | CREATE | expo-sqlite + Drizzle init |
| `drizzle.config.ts` | CREATE | Drizzle Kit config |
| `src/constants/languages.ts` | CREATE | Supported languages metadata |
| `src/constants/prompts.ts` | CREATE | Gemma prompt templates |
| `src/services/gemma.ts` | CREATE | Model init, translate, parse |
| `src/stores/modelStore.ts` | CREATE | Download/ready state |
| `src/hooks/useTranslation.ts` | CREATE | Cache check -> Gemma -> cache store |
| `src/components/TranslationCard.tsx` | CREATE | Word + phonetic + speaker |
| `src/components/ModelDownloadBanner.tsx` | CREATE | Download progress UI |
| `src/app/capture-result.tsx` | UPDATE | Integrate translations |
| `src/app/_layout.tsx` | UPDATE | Add migrations gate |

### Phase 4: TTS + Library
| File | Action | Justification |
|---|---|---|
| `src/services/tts.ts` | CREATE | expo-speech wrapper |
| `src/hooks/useLibrary.ts` | CREATE | CRUD + live queries |
| `src/components/TranslationCard.tsx` | UPDATE | Add speaker button |
| `src/components/LibraryItemCard.tsx` | CREATE | Grid card component |
| `src/app/library/index.tsx` | UPDATE | Real grid with data |
| `src/app/library/[id].tsx` | CREATE | Item detail screen |
| `src/app/capture-result.tsx` | UPDATE | Add save button |

### Phase 5: Settings + Polish
| File | Action | Justification |
|---|---|---|
| `src/stores/settingsStore.ts` | CREATE | Persisted settings |
| `src/app/settings.tsx` | UPDATE | Full settings UI |
| `src/components/LanguageChip.tsx` | CREATE | Language selector pill |
| `src/app/onboarding.tsx` | CREATE | First-launch onboarding |
| `src/app/_layout.tsx` | UPDATE | Onboarding gate + dark theme |
| `src/app/camera.tsx` | UPDATE | Language selector bar |

### Phase 6: Release
| File | Action | Justification |
|---|---|---|
| `eas.json` | UPDATE | Production build profiles |
| `app.config.ts` | UPDATE | App icons, splash, version |
| `assets/icon.png` | CREATE | App icon |
| `assets/splash.png` | CREATE | Splash screen |

## NOT Building
- Cloud sync / remote backup
- User accounts / authentication
- Flashcard / spaced repetition review mode
- Custom TFLite models for better detection
- Social sharing of vocabulary lists
- In-app purchases or monetization
- Analytics or telemetry
- Multi-image batch detection
- Video mode detection

---

## Step-by-Step Tasks

### Task 1: Initialize Expo Project
- **ACTION**: Create Expo project with TypeScript template
- **IMPLEMENT**:
  ```bash
  cd /Volumes/ExDrive/_sources/readThings
  npx create-expo-app@latest . --template default
  ```
- **MIRROR**: NAMING_CONVENTION
- **IMPORTS**: N/A (project creation)
- **GOTCHA**: Use `.` to create in current directory (which has DEVELOPMENT_PLAN.md). The template may prompt to overwrite — allow it. Verify DEVELOPMENT_PLAN.md survives or restore it.
- **VALIDATE**: `npx expo start` launches without errors

### Task 2: Install Core Dependencies
- **ACTION**: Install all packages needed for Phases 1-3
- **IMPLEMENT**:
  ```bash
  # Camera + ML
  npm install react-native-vision-camera react-native-worklets-core

  # LLM
  npm install llama.rn

  # Database
  npx expo install expo-sqlite
  npm install drizzle-orm
  npm install -D drizzle-kit

  # State
  npm install zustand
  npx expo install @react-native-async-storage/async-storage

  # TTS + File System (already in Expo SDK but ensure installed)
  npx expo install expo-speech expo-file-system

  # Dev client
  npx expo install expo-dev-client
  ```
- **MIRROR**: N/A
- **IMPORTS**: N/A
- **GOTCHA**: `llama.rn` runs a postinstall to download prebuilt native libs. Ensure network access. `react-native-worklets-core` requires New Architecture (default in SDK 54+).
- **VALIDATE**: `npm ls react-native-vision-camera llama.rn drizzle-orm expo-sqlite zustand expo-speech` shows all installed

### Task 3: Configure app.config.ts
- **ACTION**: Set up Expo config with all plugins and permissions
- **IMPLEMENT**:
  ```typescript
  // app.config.ts
  import { ExpoConfig, ConfigContext } from 'expo/config';

  export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: 'readThings',
    slug: 'readthings',
    version: '0.1.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    splash: { image: './assets/splash.png', resizeMode: 'contain', backgroundColor: '#ffffff' },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.readthings.app',
      infoPlist: {
        NSCameraUsageDescription: 'readThings uses the camera to detect objects and help you learn their names in other languages.',
      },
    },
    android: {
      adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#ffffff' },
      package: 'com.readthings.app',
      permissions: ['CAMERA'],
    },
    plugins: [
      'expo-router',
      [
        'react-native-vision-camera',
        {
          cameraPermissionText: 'readThings uses the camera to detect objects.',
          enableFrameProcessors: true,
          enableMicrophonePermission: false,
        },
      ],
      [
        'llama.rn',
        {
          enableEntitlements: true,
          forceCxx20: true,
          enableOpenCL: true,
        },
      ],
    ],
    experiments: { typedRoutes: true },
  });
  ```
- **MIRROR**: NAMING_CONVENTION
- **GOTCHA**: `llama.rn` config plugin sets iOS entitlements for extended virtual addressing (needed for 1.3GB+ model). Vision Camera plugin auto-adds camera permissions.
- **VALIDATE**: `npx expo prebuild --clean` succeeds without errors

### Task 4: Configure Babel + Metro
- **ACTION**: Add worklets babel plugin and .sql extension support
- **IMPLEMENT**:
  ```javascript
  // babel.config.js
  module.exports = function (api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: ['react-native-worklets-core/plugin'],
    };
  };
  ```
  ```javascript
  // metro.config.js
  const { getDefaultConfig } = require('expo/metro-config');
  const config = getDefaultConfig(__dirname);
  config.resolver.sourceExts.push('sql');
  module.exports = config;
  ```
- **MIRROR**: N/A
- **GOTCHA**: The worklets plugin MUST be in babel.config.js for `'worklet'` directives to compile. Without it, frame processors silently fail. The `sql` extension in Metro is required for Drizzle migrations.
- **VALIDATE**: `npx expo start --clear` starts without babel errors

### Task 5: Configure EAS Build
- **ACTION**: Create eas.json with dev, preview, and production profiles
- **IMPLEMENT**:
  ```json
  {
    "cli": { "version": ">= 5.0.0" },
    "build": {
      "development": {
        "developmentClient": true,
        "distribution": "internal"
      },
      "preview": {
        "android": { "buildType": "apk" },
        "distribution": "internal"
      },
      "production": {
        "autoIncrement": true
      }
    }
  }
  ```
- **VALIDATE**: `eas build:configure` succeeds

### Task 6: Set Up Database Schema + Client
- **ACTION**: Create Drizzle schema, client, and drizzle.config.ts
- **IMPLEMENT**:
  ```typescript
  // src/db/schema.ts
  import { sql } from 'drizzle-orm';
  import { integer, text, real, sqliteTable, primaryKey } from 'drizzle-orm/sqlite-core';

  export const libraryItems = sqliteTable('library_items', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    imagePath: text('image_path').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
  });

  export const itemLabels = sqliteTable('item_labels', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    itemId: integer('item_id').notNull().references(() => libraryItems.id, { onDelete: 'cascade' }),
    englishLabel: text('english_label').notNull(),
    confidence: real('confidence').notNull(),
  });

  export const translationCache = sqliteTable('translation_cache', {
    englishLabel: text('english_label').notNull(),
    targetLanguage: text('target_language').notNull(),
    translatedWord: text('translated_word').notNull(),
    phonetic: text('phonetic'),
  }, (table) => [
    primaryKey({ columns: [table.englishLabel, table.targetLanguage] }),
  ]);

  export type InsertLibraryItem = typeof libraryItems.$inferInsert;
  export type SelectLibraryItem = typeof libraryItems.$inferSelect;
  export type InsertItemLabel = typeof itemLabels.$inferInsert;
  export type SelectItemLabel = typeof itemLabels.$inferSelect;
  export type InsertTranslation = typeof translationCache.$inferInsert;
  export type SelectTranslation = typeof translationCache.$inferSelect;
  ```
  ```typescript
  // src/db/client.ts
  import { drizzle } from 'drizzle-orm/expo-sqlite';
  import { openDatabaseSync } from 'expo-sqlite';
  import * as schema from './schema';

  const expo = openDatabaseSync('readthings.db', { enableChangeListener: true });
  export const db = drizzle(expo, { schema });
  ```
  ```typescript
  // drizzle.config.ts
  import { defineConfig } from 'drizzle-kit';
  export default defineConfig({
    schema: './src/db/schema.ts',
    out: './drizzle',
    dialect: 'sqlite',
    driver: 'expo',
  });
  ```
  Then generate initial migration:
  ```bash
  npx drizzle-kit generate
  ```
- **MIRROR**: DB_PATTERN
- **GOTCHA**: Must use `openDatabaseSync` (not async). Must set `enableChangeListener: true` for `useLiveQuery`. Must use `driver: 'expo'` in drizzle config. Must add `'sql'` to Metro sourceExts (done in Task 4).
- **VALIDATE**: Migration files generated in `./drizzle/` directory

### Task 7: Create Root Layout with Tab Navigation + Migrations
- **ACTION**: Build the root layout with tab navigation and database migration gate
- **IMPLEMENT**:
  ```tsx
  // src/app/_layout.tsx
  import { Tabs } from 'expo-router';
  import { View, Text, ActivityIndicator } from 'react-native';
  import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
  import { Ionicons } from '@expo/vector-icons';
  import migrations from '../../drizzle/migrations';
  import { db } from '@/db/client';

  export default function RootLayout() {
    const { success, error } = useMigrations(db, migrations);

    if (error) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Database error: {error.message}</Text>
        </View>
      );
    }
    if (!success) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    return (
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="camera" options={{
          title: 'Camera',
          tabBarIcon: ({ color, size }) => <Ionicons name="camera" size={size} color={color} />,
        }} />
        <Tabs.Screen name="library" options={{
          title: 'Library',
          tabBarIcon: ({ color, size }) => <Ionicons name="library" size={size} color={color} />,
        }} />
        <Tabs.Screen name="settings" options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }} />
        <Tabs.Screen name="capture-result" options={{ href: null }} />
        <Tabs.Screen name="onboarding" options={{ href: null }} />
      </Tabs>
    );
  }
  ```
  ```tsx
  // src/app/index.tsx
  import { Redirect } from 'expo-router';
  export default function Index() {
    return <Redirect href="/camera" />;
  }
  ```
- **MIRROR**: NAMING_CONVENTION
- **GOTCHA**: The `useMigrations` hook must wrap all screens — if migrations fail, nothing renders. The `href: null` option hides routes from the tab bar.
- **VALIDATE**: App launches with 3 tabs (Camera, Library, Settings)

### Task 8: Build Camera Screen with Capture
- **ACTION**: Full-screen camera preview with capture button
- **IMPLEMENT**:
  ```tsx
  // src/app/camera.tsx
  import { useRef, useState } from 'react';
  import { View, TouchableOpacity, StyleSheet } from 'react-native';
  import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
  import { router } from 'expo-router';
  import { savePhoto } from '@/services/imageStorage';

  export default function CameraScreen() {
    const device = useCameraDevice('back');
    const { hasPermission, requestPermission } = useCameraPermission();
    const cameraRef = useRef<Camera>(null);
    const [isCapturing, setIsCapturing] = useState(false);

    if (!hasPermission) {
      // Show permission request UI
      requestPermission();
      return null;
    }
    if (!device) return null;

    const handleCapture = async () => {
      if (isCapturing || !cameraRef.current) return;
      setIsCapturing(true);
      try {
        const photo = await cameraRef.current.takePhoto({ qualityPrioritization: 'balanced' });
        const savedPath = await savePhoto(photo.path);
        router.push({ pathname: '/capture-result', params: { imagePath: savedPath } });
      } finally {
        setIsCapturing(false);
      }
    };

    return (
      <View style={StyleSheet.absoluteFill}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          photo={true}
        />
        {/* Capture button */}
        <View style={styles.captureContainer}>
          <TouchableOpacity style={styles.captureButton} onPress={handleCapture} disabled={isCapturing} />
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    captureContainer: {
      position: 'absolute', bottom: 40, width: '100%', alignItems: 'center',
    },
    captureButton: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: 'white', borderWidth: 4, borderColor: 'rgba(0,0,0,0.3)',
    },
  });
  ```
- **MIRROR**: NAMING_CONVENTION
- **GOTCHA**: `takePhoto()` returns a path in the temp directory. Must copy to documentDirectory via imageStorage service for persistence. Camera will not work in iOS Simulator — test on real device.
- **VALIDATE**: App shows camera preview. Tapping capture takes a photo and navigates to capture-result screen.

### Task 9: Image Storage Service
- **ACTION**: Service to save/load/delete photos from filesystem
- **IMPLEMENT**:
  ```typescript
  // src/services/imageStorage.ts
  import * as FileSystem from 'expo-file-system';

  const PHOTO_DIR = FileSystem.documentDirectory + 'photos/';

  export async function ensurePhotoDir() {
    const info = await FileSystem.getInfoAsync(PHOTO_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
    }
  }

  export async function savePhoto(tempPath: string): Promise<string> {
    await ensurePhotoDir();
    const filename = `photo_${Date.now()}.jpg`;
    const destPath = PHOTO_DIR + filename;
    await FileSystem.copyAsync({ from: tempPath, to: destPath });
    return destPath;
  }

  export async function deletePhoto(path: string): Promise<void> {
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) {
      await FileSystem.deleteAsync(path);
    }
  }
  ```
- **VALIDATE**: Photos persist across app restarts in documentDirectory

### Task 10: Placeholder Screens (Library + Settings)
- **ACTION**: Create minimal placeholder screens for library and settings tabs
- **IMPLEMENT**: Simple `<View><Text>Coming soon</Text></View>` for each
- **VALIDATE**: Tab navigation works across all 3 tabs

### Task 11: Create ML Kit Frame Processor Plugin (Native - iOS)
- **ACTION**: Create Expo local module with Swift frame processor plugin for ML Kit Image Labeling
- **IMPLEMENT**:
  Run `npx create-expo-module@latest --local modules/mlkit-label` then create:

  ```swift
  // modules/mlkit-label/ios/MLKitLabelPlugin.swift
  import VisionCamera
  import MLKitVision
  import MLKitImageLabeling

  @objc(MLKitLabelPlugin)
  public class MLKitLabelPlugin: FrameProcessorPlugin {
    private static let labeler: ImageLabeler = {
      let options = ImageLabelerOptions()
      options.confidenceThreshold = NSNumber(value: 0.4)
      return ImageLabeler.imageLabeler(options: options)
    }()

    public override init(proxy: VisionCameraProxyHolder, options: [AnyHashable: Any]! = [:]) {
      super.init(proxy: proxy, options: options)
    }

    public override func callback(_ frame: Frame, withArguments arguments: [AnyHashable: Any]?) -> Any? {
      let visionImage = VisionImage(buffer: frame.buffer)
      visionImage.orientation = frame.orientation
      guard let labels = try? MLKitLabelPlugin.labeler.results(in: visionImage) else { return nil }
      return Array(labels.prefix(5)).map { label in
        return ["label": label.text, "confidence": label.confidence] as [String: Any]
      }
    }
  }
  ```

  ```objc
  // modules/mlkit-label/ios/MLKitLabelPlugin.m
  #import <VisionCamera/FrameProcessorPlugin.h>
  #import <VisionCamera/FrameProcessorPluginRegistry.h>
  #import "MLKitLabel-Swift.h"

  @interface MLKitLabelPlugin (FrameProcessorPluginLoader)
  @end

  @implementation MLKitLabelPlugin (FrameProcessorPluginLoader)
  + (void)load {
    [FrameProcessorPluginRegistry addFrameProcessorPlugin:@"labelImage"
      withInitializer:^FrameProcessorPlugin*(VisionCameraProxyHolder* proxy, NSDictionary* options) {
        return [[MLKitLabelPlugin alloc] initWithProxy:proxy withOptions:options];
      }];
  }
  @end
  ```

  Podspec needs:
  ```ruby
  s.dependency "VisionCamera"
  s.dependency "GoogleMLKit/ImageLabeling"
  ```
- **MIRROR**: NATIVE_PLUGIN_PATTERN_IOS
- **GOTCHA**: The ObjC `.m` file is required to bridge Swift to the Vision Camera plugin registry. The `-Swift.h` import path depends on your module name. `frame.buffer` is `CMSampleBufferRef`, `frame.orientation` is `UIImageOrientation` — both are directly compatible with ML Kit's `VisionImage`.
- **VALIDATE**: `npx expo prebuild --clean && npx expo run:ios` builds without errors

### Task 12: Create ML Kit Frame Processor Plugin (Native - Android)
- **ACTION**: Create Kotlin frame processor plugin for Android
- **IMPLEMENT**:
  ```kotlin
  // modules/mlkit-label/android/src/main/java/expo/modules/mlkitlabel/MLKitLabelPlugin.kt
  package expo.modules.mlkitlabel

  import com.google.android.gms.tasks.Tasks
  import com.google.mlkit.vision.common.InputImage
  import com.google.mlkit.vision.label.ImageLabeling
  import com.google.mlkit.vision.label.defaults.ImageLabelerOptions
  import com.mrousavy.camera.frameprocessors.Frame
  import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin

  class MLKitLabelPlugin : FrameProcessorPlugin() {
    private val labeler = ImageLabeling.getClient(
      ImageLabelerOptions.Builder().setConfidenceThreshold(0.4f).build()
    )

    override fun callback(frame: Frame, params: Map<String, Any>?): Any? {
      val mediaImage = frame.image ?: return null
      val inputImage = InputImage.fromMediaImage(
        mediaImage,
        frame.imageProxy.imageInfo.rotationDegrees
      )
      return try {
        val labels = Tasks.await(labeler.process(inputImage))
        labels.take(5).map { label ->
          mapOf("label" to label.text, "confidence" to label.confidence.toDouble())
        }
      } catch (e: Exception) {
        null
      }
    }
  }
  ```

  ```kotlin
  // modules/mlkit-label/android/src/main/java/expo/modules/mlkitlabel/MLKitLabelModule.kt
  package expo.modules.mlkitlabel

  import expo.modules.kotlin.modules.Module
  import expo.modules.kotlin.modules.ModuleDefinition
  import com.mrousavy.camera.frameprocessors.FrameProcessorPluginRegistry

  class MLKitLabelModule : Module() {
    init {
      FrameProcessorPluginRegistry.addFrameProcessorPlugin("labelImage") { _, _ ->
        MLKitLabelPlugin()
      }
    }
    override fun definition() = ModuleDefinition { Name("MLKitLabel") }
  }
  ```

  ```json
  // modules/mlkit-label/expo-module.config.json
  {
    "platforms": ["apple", "android"],
    "apple": { "modules": ["MLKitLabelModule"] },
    "android": { "modules": ["expo.modules.mlkitlabel.MLKitLabelModule"] }
  }
  ```

  Android `build.gradle` needs:
  ```groovy
  dependencies {
    implementation project(':react-native-vision-camera')
    implementation 'com.google.mlkit:image-labeling:17.+'
  }
  ```
- **MIRROR**: NATIVE_PLUGIN_PATTERN_ANDROID
- **GOTCHA**: `frame.image` can return null if the underlying ImageProxy hasn't been populated — guard with `?: return null`. `Tasks.await()` blocks the frame processor thread (which is fine — it's not the UI thread). Android ML Kit uses `ImageLabelerOptions.Builder()` (builder pattern) vs iOS `ImageLabelerOptions()` (direct property).
- **VALIDATE**: `npx expo run:android` builds without errors

### Task 13: TypeScript Detection Service + Hook
- **ACTION**: Create TS wrapper for the native plugin and useDetection hook
- **IMPLEMENT**:
  ```typescript
  // src/services/detection.ts
  import { VisionCameraProxy, type Frame } from 'react-native-vision-camera';

  export interface DetectionLabel {
    label: string;
    confidence: number;
  }

  const plugin = VisionCameraProxy.initFrameProcessorPlugin('labelImage', {});
  if (!plugin) throw new Error('Failed to load labelImage frame processor plugin');

  export function labelImage(frame: Frame): DetectionLabel[] {
    'worklet';
    return (plugin.call(frame) as unknown as DetectionLabel[]) ?? [];
  }
  ```

  ```typescript
  // src/stores/detectionStore.ts
  import { create } from 'zustand';
  import type { DetectionLabel } from '@/services/detection';

  interface DetectionState {
    labels: DetectionLabel[];
    isDetecting: boolean;
    setLabels: (labels: DetectionLabel[]) => void;
    setDetecting: (val: boolean) => void;
    clear: () => void;
  }

  export const useDetectionStore = create<DetectionState>()((set) => ({
    labels: [],
    isDetecting: false,
    setLabels: (labels) => set({ labels }),
    setDetecting: (isDetecting) => set({ isDetecting }),
    clear: () => set({ labels: [], isDetecting: false }),
  }));
  ```

  ```typescript
  // src/hooks/useDetection.ts
  import { useCallback } from 'react';
  import { useFrameProcessor, runAtTargetFps } from 'react-native-vision-camera';
  import { Worklets } from 'react-native-worklets-core';
  import { labelImage, type DetectionLabel } from '@/services/detection';
  import { useDetectionStore } from '@/stores/detectionStore';

  export function useDetection() {
    const setLabels = useDetectionStore((s) => s.setLabels);

    const onLabelsDetected = Worklets.createRunOnJS((labels: DetectionLabel[]) => {
      setLabels(labels);
    });

    const frameProcessor = useFrameProcessor((frame) => {
      'worklet';
      runAtTargetFps(2, () => {
        'worklet';
        const results = labelImage(frame);
        if (results.length > 0) {
          onLabelsDetected(results);
        }
      });
    }, [onLabelsDetected]);

    return { frameProcessor };
  }
  ```
- **MIRROR**: FRAME_PROCESSOR_PATTERN
- **GOTCHA**: `Worklets.createRunOnJS` creates a bridge function that can be called from the worklet thread. `runAtTargetFps(2, ...)` limits ML Kit to 2 inferences per second to save battery. The `'worklet'` directive is required on BOTH the outer and inner callbacks.
- **VALIDATE**: Labels appear in detectionStore when camera points at objects

### Task 14: Detection Overlay Component
- **ACTION**: Create floating label overlay for camera screen
- **IMPLEMENT**:
  ```tsx
  // src/components/DetectionOverlay.tsx
  import { View, Text, StyleSheet } from 'react-native';
  import { useDetectionStore } from '@/stores/detectionStore';

  export function DetectionOverlay() {
    const labels = useDetectionStore((s) => s.labels);
    if (labels.length === 0) return null;

    return (
      <View style={styles.container}>
        {labels.map((item, index) => (
          <View key={index} style={styles.labelRow}>
            <Text style={styles.labelText}>{item.label}</Text>
            <Text style={styles.confidence}>{Math.round(item.confidence * 100)}%</Text>
          </View>
        ))}
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      position: 'absolute', bottom: 120, left: 16, right: 16,
      backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 12, padding: 12,
    },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    labelText: { color: 'white', fontSize: 18, fontWeight: '600' },
    confidence: { color: 'rgba(255,255,255,0.6)', fontSize: 16 },
  });
  ```
- **VALIDATE**: Labels float over camera preview

### Task 15: Update Camera Screen with Frame Processor + Overlay
- **ACTION**: Integrate detection into camera screen
- **IMPLEMENT**: Update `src/app/camera.tsx` to use `useDetection()` hook and render `<DetectionOverlay />` over the camera. Pass `frameProcessor` to `<Camera>`.
- **MIRROR**: FRAME_PROCESSOR_PATTERN
- **VALIDATE**: Point camera at objects, see labels updating in real-time

### Task 16: Capture Result Screen
- **ACTION**: Screen that shows captured photo with detection labels
- **IMPLEMENT**:
  ```tsx
  // src/app/capture-result.tsx
  import { View, Image, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
  import { useLocalSearchParams, router } from 'expo-router';
  import { useDetectionStore } from '@/stores/detectionStore';

  export default function CaptureResultScreen() {
    const { imagePath } = useLocalSearchParams<{ imagePath: string }>();
    const labels = useDetectionStore((s) => s.labels);

    return (
      <ScrollView style={styles.container}>
        <Image source={{ uri: imagePath }} style={styles.image} />
        <View style={styles.labelsContainer}>
          <Text style={styles.heading}>Detected Objects</Text>
          {labels.map((item, i) => (
            <View key={i} style={styles.labelRow}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.confidence}>{Math.round(item.confidence * 100)}%</Text>
            </View>
          ))}
        </View>
        {/* Translation cards will be added in Phase 3 */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text>Retry</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }
  ```
- **VALIDATE**: After capture, screen shows photo + detected labels with confidence

### Task 17: Constants — Languages + Prompts
- **ACTION**: Define supported languages and Gemma prompt templates
- **IMPLEMENT**:
  ```typescript
  // src/constants/languages.ts
  export interface Language {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
    ttsCode: string;  // BCP-47 for expo-speech
  }

  export const SUPPORTED_LANGUAGES: Language[] = [
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', ttsCode: 'ja' },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', ttsCode: 'vi' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', ttsCode: 'ko' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', ttsCode: 'zh-CN' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', ttsCode: 'es' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', ttsCode: 'fr' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', ttsCode: 'de' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', ttsCode: 'pt-BR' },
    { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', ttsCode: 'th' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', ttsCode: 'ar' },
  ];

  export const getLanguageByCode = (code: string) =>
    SUPPORTED_LANGUAGES.find((l) => l.code === code);
  ```

  ```typescript
  // src/constants/prompts.ts
  export const TRANSLATION_SYSTEM_PROMPT =
    'You are a translation assistant. You translate English object names into other languages with pronunciation guides. Always respond with valid JSON only, no other text.';

  export function buildTranslationPrompt(englishLabel: string, targetLangs: string[]): string {
    const langList = targetLangs.join(', ');
    return `Translate the English word "${englishLabel}" into these languages: ${langList}.
For each language, provide the translated word in its native script and a romanized/phonetic pronunciation guide.
For languages with grammatical articles (Spanish, French, German, Portuguese), include the article.

Respond with this exact JSON structure:
{"translations":[{"lang":"xx","word":"...","phonetic":"..."}]}`;
  }
  ```
- **VALIDATE**: Types export correctly, prompt function returns well-formed strings

### Task 18: Gemma Service — Model Download + Translation
- **ACTION**: Service to download Gemma 4 E2B GGUF, initialize context, and run translations
- **IMPLEMENT**:
  ```typescript
  // src/services/gemma.ts
  import * as FileSystem from 'expo-file-system';
  import { initLlama, releaseAllLlama, type LlamaContext } from 'llama.rn';
  import { TRANSLATION_SYSTEM_PROMPT, buildTranslationPrompt } from '@/constants/prompts';

  const MODEL_DIR = FileSystem.documentDirectory + 'models/';
  const MODEL_FILENAME = 'gemma-4-E2B-it-Q4_K_M.gguf';
  const MODEL_PATH = MODEL_DIR + MODEL_FILENAME;
  const MODEL_URL = 'https://huggingface.co/unsloth/gemma-4-E2B-it-GGUF/resolve/main/gemma-4-E2B-it-Q4_K_M.gguf?download=true';

  let context: LlamaContext | null = null;

  export async function isModelDownloaded(): Promise<boolean> {
    const info = await FileSystem.getInfoAsync(MODEL_PATH);
    return info.exists && (info.size ?? 0) > 100_000_000;
  }

  export async function downloadModel(onProgress: (pct: number) => void): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(MODEL_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
    }
    if (await isModelDownloaded()) return;

    const download = FileSystem.createDownloadResumable(
      MODEL_URL, MODEL_PATH, {},
      ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        onProgress(Math.round((totalBytesWritten / totalBytesExpectedToWrite) * 100));
      }
    );
    await download.downloadAsync();
  }

  export async function deleteModel(): Promise<void> {
    await unloadModel();
    const info = await FileSystem.getInfoAsync(MODEL_PATH);
    if (info.exists) await FileSystem.deleteAsync(MODEL_PATH);
  }

  export async function loadModel(onProgress?: (pct: number) => void): Promise<void> {
    if (context) return;
    context = await initLlama({
      model: MODEL_PATH,
      n_ctx: 2048,
      n_gpu_layers: 99,
      use_mlock: true,
      n_batch: 512,
    }, onProgress ? (p) => onProgress(p) : undefined);
  }

  export async function unloadModel(): Promise<void> {
    if (context) {
      await context.release();
      context = null;
    }
  }

  export interface TranslationResult {
    lang: string;
    word: string;
    phonetic: string;
  }

  export async function translateLabel(
    englishLabel: string,
    targetLangs: string[],
  ): Promise<TranslationResult[]> {
    if (!context) throw new Error('Gemma model not loaded');

    const result = await context.completion({
      messages: [
        { role: 'system', content: TRANSLATION_SYSTEM_PROMPT },
        { role: 'user', content: buildTranslationPrompt(englishLabel, targetLangs) },
      ],
      n_predict: 512,
      temperature: 0,
      stop: ['```', '\n\n\n'],
    });

    try {
      const parsed = JSON.parse(result.text);
      if (Array.isArray(parsed.translations)) {
        return parsed.translations.map((t: any) => ({
          lang: String(t.lang ?? ''),
          word: String(t.word ?? englishLabel),
          phonetic: String(t.phonetic ?? ''),
        }));
      }
    } catch {
      // Malformed JSON fallback
    }
    return targetLangs.map((lang) => ({ lang, word: englishLabel, phonetic: '' }));
  }
  ```

  ```typescript
  // src/stores/modelStore.ts
  import { create } from 'zustand';

  interface ModelState {
    isDownloaded: boolean;
    isLoaded: boolean;
    isDownloading: boolean;
    downloadProgress: number;
    loadProgress: number;
    error: string | null;
    setDownloaded: (v: boolean) => void;
    setLoaded: (v: boolean) => void;
    setDownloading: (v: boolean) => void;
    setDownloadProgress: (pct: number) => void;
    setLoadProgress: (pct: number) => void;
    setError: (err: string | null) => void;
  }

  export const useModelStore = create<ModelState>()((set) => ({
    isDownloaded: false,
    isLoaded: false,
    isDownloading: false,
    downloadProgress: 0,
    loadProgress: 0,
    error: null,
    setDownloaded: (isDownloaded) => set({ isDownloaded }),
    setLoaded: (isLoaded) => set({ isLoaded }),
    setDownloading: (isDownloading) => set({ isDownloading }),
    setDownloadProgress: (downloadProgress) => set({ downloadProgress }),
    setLoadProgress: (loadProgress) => set({ loadProgress }),
    setError: (error) => set({ error }),
  }));
  ```
- **MIRROR**: LLAMA_COMPLETION_PATTERN
- **GOTCHA**: `FileSystem.createDownloadResumable` supports pause/resume for the 2.5GB download. `temperature: 0` gives deterministic JSON output. The JSON fallback returns English labels if Gemma produces malformed output. Always strip `file://` prefix from paths before passing to `initLlama`. The model file is ~2.5GB (Q4_K_M), not 1.3GB — the research corrected the initial estimate.
- **VALIDATE**: Model downloads with progress. `translateLabel("cat", ["ja", "vi"])` returns translations.

### Task 19: Translation Hook with Cache
- **ACTION**: Hook that checks SQLite cache first, then calls Gemma, then caches result
- **IMPLEMENT**:
  ```typescript
  // src/hooks/useTranslation.ts
  import { useState, useCallback } from 'react';
  import { eq, and } from 'drizzle-orm';
  import { db } from '@/db/client';
  import { translationCache, type InsertTranslation } from '@/db/schema';
  import { translateLabel, type TranslationResult } from '@/services/gemma';
  import { useModelStore } from '@/stores/modelStore';

  export function useTranslation() {
    const [translations, setTranslations] = useState<TranslationResult[]>([]);
    const [isTranslating, setIsTranslating] = useState(false);
    const isModelLoaded = useModelStore((s) => s.isLoaded);

    const translate = useCallback(async (englishLabel: string, targetLangs: string[]) => {
      setIsTranslating(true);
      const results: TranslationResult[] = [];
      const uncachedLangs: string[] = [];

      // 1. Check cache for each language
      for (const lang of targetLangs) {
        const cached = await db.select().from(translationCache)
          .where(and(
            eq(translationCache.englishLabel, englishLabel.toLowerCase()),
            eq(translationCache.targetLanguage, lang),
          ))
          .limit(1);
        if (cached.length > 0) {
          results.push({ lang, word: cached[0].translatedWord, phonetic: cached[0].phonetic ?? '' });
        } else {
          uncachedLangs.push(lang);
        }
      }

      // 2. Call Gemma for uncached languages
      if (uncachedLangs.length > 0 && isModelLoaded) {
        try {
          const gemmaResults = await translateLabel(englishLabel, uncachedLangs);
          for (const t of gemmaResults) {
            results.push(t);
            // 3. Cache the result
            await db.insert(translationCache).values({
              englishLabel: englishLabel.toLowerCase(),
              targetLanguage: t.lang,
              translatedWord: t.word,
              phonetic: t.phonetic,
            } satisfies InsertTranslation).onConflictDoUpdate({
              target: [translationCache.englishLabel, translationCache.targetLanguage],
              set: { translatedWord: t.word, phonetic: t.phonetic },
            });
          }
        } catch (err) {
          // Fallback: show English for uncached langs
          for (const lang of uncachedLangs) {
            results.push({ lang, word: englishLabel, phonetic: '' });
          }
        }
      }

      setTranslations(results);
      setIsTranslating(false);
    }, [isModelLoaded]);

    return { translations, isTranslating, translate };
  }
  ```
- **MIRROR**: DB_PATTERN, LLAMA_COMPLETION_PATTERN
- **GOTCHA**: Normalize `englishLabel` to lowercase before cache lookup/insert. Use `onConflictDoUpdate` (upsert) to handle race conditions. If model not loaded, skip Gemma and show only cached results.
- **VALIDATE**: First call takes 1-3s (Gemma), second call for same word is instant (cache hit)

### Task 20: Translation Card + Model Download Banner Components
- **ACTION**: UI components for showing translations and download progress
- **IMPLEMENT**:
  ```tsx
  // src/components/TranslationCard.tsx
  import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
  import { Ionicons } from '@expo/vector-icons';
  import { speakWord } from '@/services/tts';
  import { getLanguageByCode } from '@/constants/languages';

  interface Props {
    lang: string;
    word: string;
    phonetic: string;
    ttsRate?: number;
  }

  export function TranslationCard({ lang, word, phonetic, ttsRate = 0.9 }: Props) {
    const language = getLanguageByCode(lang);
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.flag}>{language?.flag}</Text>
          <Text style={styles.langName}>{language?.name}</Text>
        </View>
        <Text style={styles.word}>{word}</Text>
        {phonetic ? <Text style={styles.phonetic}>{phonetic}</Text> : null}
        <TouchableOpacity
          style={styles.speakerBtn}
          onPress={() => speakWord(word, language?.ttsCode ?? lang, ttsRate)}
        >
          <Ionicons name="volume-high" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    );
  }
  ```

  ```tsx
  // src/components/ModelDownloadBanner.tsx
  import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
  import { useModelStore } from '@/stores/modelStore';
  import * as gemma from '@/services/gemma';

  export function ModelDownloadBanner() {
    const { isDownloaded, isDownloading, downloadProgress, setDownloading, setDownloadProgress, setDownloaded } = useModelStore();

    if (isDownloaded) return null;

    const handleDownload = async () => {
      setDownloading(true);
      try {
        await gemma.downloadModel((pct) => setDownloadProgress(pct));
        setDownloaded(true);
      } finally {
        setDownloading(false);
      }
    };

    return (
      <View style={styles.banner}>
        {isDownloading ? (
          <Text style={styles.text}>Downloading translation model... {downloadProgress}%</Text>
        ) : (
          <>
            <Text style={styles.text}>Download translation model for offline use</Text>
            <TouchableOpacity style={styles.btn} onPress={handleDownload}>
              <Text style={styles.btnText}>Download (2.5 GB)</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }
  ```
- **MIRROR**: TTS_PATTERN
- **VALIDATE**: Cards show flag, word, phonetic, speaker icon. Banner shows download progress.

### Task 21: TTS Service
- **ACTION**: Create expo-speech wrapper
- **IMPLEMENT**:
  ```typescript
  // src/services/tts.ts
  import * as Speech from 'expo-speech';

  export function speakWord(text: string, language: string, rate = 0.9) {
    Speech.speak(text, { language, rate, pitch: 1.0 });
  }

  export async function stopSpeech() {
    await Speech.stop();
  }

  export async function getVoicesForLanguage(langCode: string) {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices.filter((v) => v.language.startsWith(langCode));
  }
  ```
- **MIRROR**: TTS_PATTERN
- **GOTCHA**: Pass the native script word to TTS (e.g., "猫" not "neko") — the TTS engine pronounces native script correctly. Rate 0.9 is slightly slower than normal, good for learners.
- **VALIDATE**: Tap speaker icon, hear correct pronunciation

### Task 22: Settings Store (Persisted)
- **ACTION**: Create Zustand store with AsyncStorage persistence
- **IMPLEMENT**:
  ```typescript
  // src/stores/settingsStore.ts
  import { create } from 'zustand';
  import { persist, createJSONStorage } from 'zustand/middleware';
  import AsyncStorage from '@react-native-async-storage/async-storage';

  interface SettingsState {
    targetLanguages: string[];
    ttsRate: number;
    isDarkMode: boolean;
    hasCompletedOnboarding: boolean;
    setTargetLanguages: (langs: string[]) => void;
    addLanguage: (lang: string) => void;
    removeLanguage: (lang: string) => void;
    setTtsRate: (rate: number) => void;
    toggleDarkMode: () => void;
    completeOnboarding: () => void;
  }

  export const useSettingsStore = create<SettingsState>()(
    persist(
      (set, get) => ({
        targetLanguages: ['ja', 'vi', 'ko'],
        ttsRate: 0.9,
        isDarkMode: false,
        hasCompletedOnboarding: false,
        setTargetLanguages: (targetLanguages) => set({ targetLanguages }),
        addLanguage: (lang) => set((s) => ({
          targetLanguages: s.targetLanguages.includes(lang) ? s.targetLanguages : [...s.targetLanguages, lang],
        })),
        removeLanguage: (lang) => set((s) => ({
          targetLanguages: s.targetLanguages.filter((l) => l !== lang),
        })),
        setTtsRate: (ttsRate) => set({ ttsRate }),
        toggleDarkMode: () => set((s) => ({ isDarkMode: !s.isDarkMode })),
        completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      }),
      {
        name: 'readthings-settings',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (s) => ({
          targetLanguages: s.targetLanguages,
          ttsRate: s.ttsRate,
          isDarkMode: s.isDarkMode,
          hasCompletedOnboarding: s.hasCompletedOnboarding,
        }),
      }
    )
  );
  ```
- **MIRROR**: STATE_PATTERN
- **VALIDATE**: Settings persist across app restarts

### Task 23: Library CRUD Hook
- **ACTION**: Create useLibrary hook with Drizzle live queries + CRUD
- **IMPLEMENT**:
  ```typescript
  // src/hooks/useLibrary.ts
  import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
  import { eq, desc } from 'drizzle-orm';
  import { db } from '@/db/client';
  import { libraryItems, itemLabels, type InsertLibraryItem, type InsertItemLabel } from '@/db/schema';
  import { deletePhoto } from '@/services/imageStorage';

  export function useLibraryItems() {
    return useLiveQuery(
      db.select().from(libraryItems).orderBy(desc(libraryItems.createdAt))
    );
  }

  export async function saveToLibrary(
    imagePath: string,
    labels: Array<{ label: string; confidence: number }>,
  ) {
    const [item] = await db.insert(libraryItems)
      .values({ imagePath } satisfies InsertLibraryItem)
      .returning();

    if (labels.length > 0) {
      await db.insert(itemLabels).values(
        labels.map((l) => ({
          itemId: item.id,
          englishLabel: l.label,
          confidence: l.confidence,
        } satisfies InsertItemLabel))
      );
    }
    return item;
  }

  export async function deleteLibraryItem(id: number) {
    const [item] = await db.select().from(libraryItems).where(eq(libraryItems.id, id)).limit(1);
    if (item) {
      await deletePhoto(item.imagePath);
      await db.delete(libraryItems).where(eq(libraryItems.id, id));
    }
  }

  export async function toggleFavorite(id: number, isFavorite: boolean) {
    await db.update(libraryItems).set({ isFavorite }).where(eq(libraryItems.id, id));
  }

  export async function getItemLabels(itemId: number) {
    return db.select().from(itemLabels).where(eq(itemLabels.itemId, itemId));
  }
  ```
- **MIRROR**: DB_PATTERN
- **GOTCHA**: `useLiveQuery` auto-rerenders when data changes (requires `enableChangeListener: true` on the db). `deleteLibraryItem` also deletes the photo file. Cascade delete handles `item_labels` rows.
- **VALIDATE**: Items persist in SQLite, live query updates UI reactively

### Task 24: Library Grid Screen
- **ACTION**: Build library browse screen with photo grid
- **IMPLEMENT**: Grid view using `FlatList` with `numColumns={2}`, `LibraryItemCard` showing thumbnail + top label, pull-to-refresh, empty state message
- **VALIDATE**: Saved items appear in grid, tapping opens detail

### Task 25: Library Detail Screen
- **ACTION**: Build item detail screen with all translations + TTS
- **IMPLEMENT**: `src/app/library/[id].tsx` — full-size photo, list of `TranslationCard` components for each target language, favorite toggle, delete button
- **MIRROR**: TTS_PATTERN
- **VALIDATE**: Detail shows photo + translations with working TTS

### Task 26: Update Capture Result — Save + Translate
- **ACTION**: Integrate translation and save functionality into capture result screen
- **IMPLEMENT**: Add `useTranslation` hook, call `translate()` with detection labels, show `TranslationCard` list, add "Save to Library" button that calls `saveToLibrary()`
- **VALIDATE**: Full flow: capture -> detect -> translate -> save works end-to-end

### Task 27: Settings Screen
- **ACTION**: Build full settings UI
- **IMPLEMENT**: Language multi-select (grid of `LanguageChip` components), TTS rate slider, model management section (download/delete/storage info), dark mode toggle
- **VALIDATE**: Changing language selection updates translations on next capture

### Task 28: Language Chip + Language Selector Bar
- **ACTION**: Create language selector for camera screen and settings
- **IMPLEMENT**: Horizontal scrollable chips at top of camera showing active languages. Tap chip to toggle. Long-press opens settings.
- **VALIDATE**: Language bar on camera screen updates target languages

### Task 29: Onboarding Flow
- **ACTION**: 3-screen onboarding shown on first launch
- **IMPLEMENT**: `src/app/onboarding.tsx` — swipeable pages explaining the app. Last page selects target languages. Sets `hasCompletedOnboarding: true` in settings store. Root layout checks this flag.
- **VALIDATE**: First launch shows onboarding. Subsequent launches skip it.

### Task 30: Error States + Edge Cases
- **ACTION**: Handle camera permission denied, no model, TTS unavailable, empty detection
- **IMPLEMENT**: Permission denied screen with "Open Settings" link. "Download model" prompt when trying to translate without model. "No objects detected" message on empty detection. TTS language check before speaking.
- **VALIDATE**: App handles all error states gracefully without crashes

### Task 31: EAS Build Production Profiles
- **ACTION**: Configure production builds for Android and iOS
- **IMPLEMENT**: Update `eas.json` production profile. Update `app.config.ts` with final app icon, splash screen, version. Run `eas build -p android --profile production` and `eas build -p ios --profile production`.
- **GOTCHA**: iOS requires an Apple Developer account for production builds. Android needs a keystore (EAS can generate one).
- **VALIDATE**: Installable APK and IPA generated

---

## Testing Strategy

### Unit Tests
| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| `translateLabel` JSON parsing | Valid JSON string | Parsed TranslationResult[] | No |
| `translateLabel` malformed JSON | Invalid string | Fallback to English labels | Yes |
| `buildTranslationPrompt` | "cat", ["ja", "vi"] | Contains "cat", "ja", "vi" | No |
| `savePhoto` | Temp file path | New path in documentDirectory | No |
| `saveToLibrary` | Image path + labels | Item in DB with labels | No |
| `getCachedTranslation` hit | Existing entry | TranslationResult | No |
| `getCachedTranslation` miss | Non-existing entry | null | No |
| `settingsStore` persist | Set languages, restart | Languages restored | No |

### Edge Cases Checklist
- [ ] Camera permission denied on both platforms
- [ ] Gemma model not downloaded (translation fallback to English)
- [ ] Gemma returns malformed JSON (fallback parsing)
- [ ] No objects detected in frame (show helpful message)
- [ ] TTS language not available on device
- [ ] Storage full (model download fails gracefully)
- [ ] App backgrounded during model loading
- [ ] Rapid capture taps (debounce)
- [ ] Empty library (show onboarding hint)
- [ ] Device has < 3GB RAM (model load fails)

---

## Validation Commands

### Static Analysis
```bash
npx tsc --noEmit
```
EXPECT: Zero type errors

### Lint
```bash
npx expo lint
```
EXPECT: No errors

### Build (Development)
```bash
npx expo prebuild --clean
npx expo run:ios
npx expo run:android
```
EXPECT: App builds and runs on both platforms

### Build (Production)
```bash
eas build -p android --profile preview
eas build -p ios --profile preview
```
EXPECT: Installable APK/IPA generated

### Database
```bash
npx drizzle-kit generate
```
EXPECT: Migrations generated without errors

### Manual Validation
- [ ] Camera shows live preview on real device
- [ ] ML Kit labels appear within 500ms of pointing at object
- [ ] Gemma model downloads with progress bar
- [ ] Translation appears within 3s of capture
- [ ] TTS speaks correct language on tap
- [ ] Saved items persist across app restart
- [ ] Library shows photos in grid
- [ ] Settings changes take effect immediately
- [ ] App works offline (after model download)
- [ ] Dark mode toggles correctly

---

## Acceptance Criteria
- [ ] App launches on both Android and iOS
- [ ] Camera preview with real-time ML Kit label overlay
- [ ] Photo capture triggers Gemma translation
- [ ] Translations show in selected target languages with phonetics
- [ ] TTS pronounces words in correct language
- [ ] Items save to library with photo
- [ ] Library browse and detail screens work
- [ ] Settings: language selection, TTS rate, model management
- [ ] Onboarding on first launch
- [ ] All error states handled gracefully
- [ ] Works fully offline after model download

## Completion Checklist
- [ ] All 31 tasks completed
- [ ] TypeScript strict mode, zero type errors
- [ ] Database migrations generated and applied
- [ ] Native plugins build on both platforms
- [ ] Zustand stores persist settings correctly
- [ ] Translation cache prevents redundant Gemma calls
- [ ] No hardcoded API keys or secrets
- [ ] No unnecessary scope additions beyond plan

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| CameraImage -> ML Kit format conversion fails on some devices | Medium | High | Follow official VisionCamera plugin examples exactly. Test on 3+ devices. |
| Gemma 4 E2B GGUF Q4_K_M is 2.5GB not 1.3GB | Confirmed | Medium | Update all user-facing text to show 2.5GB. Consider offering IQ4_XS (~2GB) as alternative. |
| llama.rn requires New Architecture | Low | High | Expo SDK 54+ has New Arch enabled by default. Verify with `npx expo prebuild`. |
| ML Kit labels too generic | Medium | Medium | Confidence threshold 0.4. Show top 5 labels. Let user pick most relevant. |
| Gemma JSON parsing fails | Medium | Low | Fallback returns English labels. Cache known-good translations. Temperature = 0. |
| Battery drain from LLM | Medium | Low | Only run Gemma on capture (not live). Aggressive caching. |
| iOS Simulator: no camera/Metal | Known | Low | Must test on real device. Simulator for UI-only work. |

## Notes
- The model size in DEVELOPMENT_PLAN.md says 1.3GB but the actual Gemma 4 E2B Q4_K_M GGUF is ~2.5GB. Update user-facing text accordingly. For a smaller download, consider `IQ4_XS` (~2GB) or `Q3_K_S` (~1.7GB) with slightly lower quality.
- `llama.rn` v0.12.0-rc.7 is the latest RC. If stability is a concern, pin to `0.11.5` (last stable) and upgrade when 0.12.0 lands.
- The native ML Kit frame processor plugin is the highest-risk task. Consider stubbing it with mock data first to unblock UI development, then integrate real native code.
- Pass native script text (not romanization) to TTS — e.g., pass "猫" to Japanese TTS, not "neko". The TTS engine handles pronunciation correctly from native script.
- expo-sqlite does NOT work in Expo Go — development builds are required from Task 1.
