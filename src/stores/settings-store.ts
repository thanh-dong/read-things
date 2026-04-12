import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_TARGET_LANGUAGES } from '@/constants/languages';

interface SettingsState {
  targetLanguages: string[];
  ttsRate: number;
  hasCompletedOnboarding: boolean;
  isDarkMode: boolean;
  setTargetLanguages: (langs: string[]) => void;
  toggleLanguage: (langCode: string) => void;
  setTtsRate: (rate: number) => void;
  setHasCompletedOnboarding: (value: boolean) => void;
  setIsDarkMode: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      targetLanguages: DEFAULT_TARGET_LANGUAGES,
      ttsRate: 0.9,
      hasCompletedOnboarding: false,
      isDarkMode: true,
      setTargetLanguages: (targetLanguages) => set({ targetLanguages }),
      toggleLanguage: (langCode) => {
        const current = get().targetLanguages;
        if (current.includes(langCode)) {
          if (current.length > 1) {
            set({ targetLanguages: current.filter((c) => c !== langCode) });
          }
        } else {
          set({ targetLanguages: [...current, langCode] });
        }
      },
      setTtsRate: (ttsRate) => set({ ttsRate }),
      setHasCompletedOnboarding: (hasCompletedOnboarding) =>
        set({ hasCompletedOnboarding }),
      setIsDarkMode: (isDarkMode) => set({ isDarkMode }),
    }),
    {
      name: 'readthings-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        targetLanguages: state.targetLanguages,
        ttsRate: state.ttsRate,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        isDarkMode: state.isDarkMode,
      }),
    },
  ),
);
