import { initLlama, type LlamaContext } from 'llama.rn';
import { Paths, Directory, File } from 'expo-file-system';
import {
  documentDirectory,
  createDownloadResumable,
} from 'expo-file-system/legacy';
import { useModelStore } from '@/stores/model-store';

const MODEL_DIR = new Directory(Paths.document, 'models');
const MODEL_FILENAME = 'gemma-4-e2b-it-q4_k_m.gguf';
const MODEL_FILE = new File(MODEL_DIR, MODEL_FILENAME);
const MODEL_LEGACY_PATH = `${documentDirectory}models/${MODEL_FILENAME}`;
const MODEL_URL =
  'https://huggingface.co/unsloth/gemma-4-E2B-it-GGUF/resolve/main/gemma-4-E2B-it-Q4_K_M.gguf';

let llamaContext: LlamaContext | null = null;

function ensureModelDir(): void {
  if (!MODEL_DIR.exists) {
    MODEL_DIR.create({ intermediates: true });
  }
}

export function isModelDownloaded(): boolean {
  return MODEL_FILE.exists;
}

export function getModelSize(): number {
  if (MODEL_FILE.exists) {
    return MODEL_FILE.size;
  }
  return 0;
}

export async function downloadModel(): Promise<void> {
  const store = useModelStore.getState();

  if (isModelDownloaded()) {
    store.setStatus('downloaded');
    return;
  }

  ensureModelDir();
  store.setStatus('downloading');
  store.setDownloadProgress(0);

  try {
    console.log('[Gemma] Starting download from:', MODEL_URL);
    console.log('[Gemma] Saving to:', MODEL_LEGACY_PATH);

    const downloadResumable = createDownloadResumable(
      MODEL_URL,
      MODEL_LEGACY_PATH,
      {},
      (downloadProgress) => {
        const progress = Math.round(
          (downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite) *
            100,
        );
        if (progress % 10 === 0) {
          console.log(`[Gemma] Download progress: ${progress}%`);
        }
        store.setDownloadProgress(progress);
      },
    );

    const result = await downloadResumable.downloadAsync();
    console.log('[Gemma] Download result:', JSON.stringify(result));
    if (result?.uri) {
      store.setStatus('downloaded');
      store.setDownloadProgress(100);
    } else {
      throw new Error('Download failed — file not found after download');
    }
  } catch (error) {
    console.error('[Gemma] Download error:', error);
    store.setError(
      error instanceof Error ? error.message : 'Download failed',
    );
    if (MODEL_FILE.exists) {
      MODEL_FILE.delete();
    }
    throw error;
  }
}

export function deleteModel(): void {
  if (llamaContext) {
    llamaContext.release();
    llamaContext = null;
  }
  if (MODEL_FILE.exists) {
    MODEL_FILE.delete();
  }
  const store = useModelStore.getState();
  store.setStatus('not-downloaded');
  store.setDownloadProgress(0);
}

export async function initModel(): Promise<void> {
  if (llamaContext) return;

  const store = useModelStore.getState();

  if (!isModelDownloaded()) {
    const msg = 'Model not downloaded';
    store.setError(msg);
    throw new Error(msg);
  }

  store.setStatus('loading');

  try {
    llamaContext = await initLlama({
      model: MODEL_FILE.uri,
      n_ctx: 2048,
      n_gpu_layers: 99,
      use_mlock: true,
    });
    store.setStatus('ready');
  } catch (error) {
    llamaContext = null;
    store.setError(
      error instanceof Error ? error.message : 'Failed to load model',
    );
    throw error;
  }
}

export async function releaseModel(): Promise<void> {
  if (llamaContext) {
    await llamaContext.release();
    llamaContext = null;
    useModelStore.getState().setStatus('downloaded');
  }
}

export function isModelReady(): boolean {
  return llamaContext !== null;
}

export interface TranslationResult {
  lang: string;
  word: string;
  phonetic: string | null;
}

export async function translateLabel(
  englishLabel: string,
  targetLanguages: string[],
  systemPrompt: string,
  userPrompt: string,
): Promise<TranslationResult[]> {
  if (!llamaContext) {
    throw new Error('Model not initialized. Call initModel() first.');
  }

  const result = await llamaContext.completion({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    n_predict: 512,
    temperature: 0,
    stop: ['```', '\n\n\n'],
  });

  try {
    const parsed: {
      translations?: Array<{
        lang: string;
        word: string;
        phonetic?: string;
      }>;
    } = JSON.parse(result.text);

    const translations: TranslationResult[] = (
      parsed.translations ?? []
    ).map((t) => ({
      lang: t.lang,
      word: t.word,
      phonetic: t.phonetic ?? null,
    }));
    return translations;
  } catch {
    console.warn('Failed to parse Gemma response:', result.text);
    return [];
  }
}
