import { initLlama, type LlamaContext } from 'llama.rn';
import * as FileSystem from 'expo-file-system';
import { useModelStore } from '@/stores/model-store';

const MODEL_DIR = FileSystem.documentDirectory + 'models/';
const MODEL_FILENAME = 'gemma-4-e2b-it-q4_k_m.gguf';
const MODEL_PATH = MODEL_DIR + MODEL_FILENAME;
const MODEL_URL =
  'https://huggingface.co/unsloth/gemma-4-E2B-it-GGUF/resolve/main/gemma-4-E2B-it-Q4_K_M.gguf';

let llamaContext: LlamaContext | null = null;

async function ensureModelDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(MODEL_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
  }
}

export async function isModelDownloaded(): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(MODEL_PATH);
  return info.exists;
}

export async function getModelSize(): Promise<number> {
  const info = await FileSystem.getInfoAsync(MODEL_PATH);
  if (info.exists) {
    return info.size;
  }
  return 0;
}

export async function downloadModel(): Promise<void> {
  const store = useModelStore.getState();

  if (await isModelDownloaded()) {
    store.setStatus('downloaded');
    return;
  }

  await ensureModelDir();
  store.setStatus('downloading');
  store.setDownloadProgress(0);

  const callback = (downloadProgress: FileSystem.DownloadProgressData) => {
    const progress =
      downloadProgress.totalBytesWritten /
      downloadProgress.totalBytesExpectedToWrite;
    store.setDownloadProgress(Math.round(progress * 100));
  };

  const downloadResumable = FileSystem.createDownloadResumable(
    MODEL_URL,
    MODEL_PATH,
    {},
    callback,
  );

  try {
    const result = await downloadResumable.downloadAsync();
    if (result?.uri) {
      store.setStatus('downloaded');
      store.setDownloadProgress(100);
    } else {
      throw new Error('Download failed — no URI returned');
    }
  } catch (error) {
    store.setError(
      error instanceof Error ? error.message : 'Download failed',
    );
    const info = await FileSystem.getInfoAsync(MODEL_PATH);
    if (info.exists) {
      await FileSystem.deleteAsync(MODEL_PATH);
    }
    throw error;
  }
}

export async function deleteModel(): Promise<void> {
  if (llamaContext) {
    await llamaContext.release();
    llamaContext = null;
  }
  const info = await FileSystem.getInfoAsync(MODEL_PATH);
  if (info.exists) {
    await FileSystem.deleteAsync(MODEL_PATH);
  }
  const store = useModelStore.getState();
  store.setStatus('not-downloaded');
  store.setDownloadProgress(0);
}

export async function initModel(): Promise<void> {
  if (llamaContext) return;

  const store = useModelStore.getState();

  if (!(await isModelDownloaded())) {
    store.setError('Model not downloaded');
    return;
  }

  store.setStatus('loading');

  try {
    llamaContext = await initLlama({
      model: MODEL_PATH,
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
