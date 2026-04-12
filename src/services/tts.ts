import * as Speech from 'expo-speech';
import { getLanguageByCode } from '@/constants/languages';

export async function speakWord(text: string, langCode: string, rate = 0.9): Promise<void> {
  const language = getLanguageByCode(langCode);
  if (!language) return;

  // Stop any current speech
  await Speech.stop();

  return new Promise((resolve) => {
    Speech.speak(text, {
      language: language.bcp47,
      rate,
      pitch: 1.0,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: () => resolve(),
    });
  });
}

export async function isLanguageAvailable(langCode: string): Promise<boolean> {
  const language = getLanguageByCode(langCode);
  if (!language) return false;

  const voices = await Speech.getAvailableVoicesAsync();
  return voices.some((voice) => voice.language.startsWith(langCode));
}

export function stopSpeaking(): void {
  Speech.stop();
}
