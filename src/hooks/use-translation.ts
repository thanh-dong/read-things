import { useState, useCallback } from 'react';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db/client';
import { translationCache } from '@/db/schema';
import { translateLabel, type TranslationResult } from '@/services/gemma';
import { isModelReady } from '@/services/gemma';
import { TRANSLATION_SYSTEM_PROMPT, buildTranslationPrompt } from '@/constants/prompts';

interface TranslationWithLang extends TranslationResult {
  fromCache: boolean;
}

interface UseTranslationReturn {
  translations: TranslationWithLang[];
  isTranslating: boolean;
  error: string | null;
  translate: (englishLabel: string, targetLanguages: string[]) => Promise<void>;
}

export function useTranslation(): UseTranslationReturn {
  const [translations, setTranslations] = useState<TranslationWithLang[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translate = useCallback(async (englishLabel: string, targetLanguages: string[]) => {
    setIsTranslating(true);
    setError(null);
    setTranslations([]);

    try {
      // Step 1: Check cache for each language
      const cached: TranslationWithLang[] = [];
      const uncachedLangs: string[] = [];

      for (const lang of targetLanguages) {
        const rows = await db.select()
          .from(translationCache)
          .where(
            and(
              eq(translationCache.englishLabel, englishLabel.toLowerCase()),
              eq(translationCache.targetLanguage, lang)
            )
          )
          .limit(1);

        if (rows.length > 0) {
          cached.push({
            lang,
            word: rows[0].translatedWord,
            phonetic: rows[0].phonetic,
            fromCache: true,
          });
        } else {
          uncachedLangs.push(lang);
        }
      }

      // If all cached, return immediately
      if (uncachedLangs.length === 0) {
        setTranslations(cached);
        setIsTranslating(false);
        return;
      }

      // Step 2: Translate uncached languages via Gemma
      if (!isModelReady()) {
        // Show cached results + error for uncached
        setTranslations(cached);
        setError('Translation model not loaded. Download it in Settings.');
        setIsTranslating(false);
        return;
      }

      const userPrompt = buildTranslationPrompt(englishLabel, uncachedLangs);
      const results = await translateLabel(
        englishLabel,
        uncachedLangs,
        TRANSLATION_SYSTEM_PROMPT,
        userPrompt,
      );

      // Step 3: Cache the new translations
      for (const result of results) {
        await db.insert(translationCache).values({
          englishLabel: englishLabel.toLowerCase(),
          targetLanguage: result.lang,
          translatedWord: result.word,
          phonetic: result.phonetic,
        }).onConflictDoUpdate({
          target: [translationCache.englishLabel, translationCache.targetLanguage],
          set: {
            translatedWord: result.word,
            phonetic: result.phonetic,
          },
        });
      }

      // Merge cached + new results
      const newTranslations: TranslationWithLang[] = results.map((r) => ({
        ...r,
        fromCache: false,
      }));

      setTranslations([...cached, ...newTranslations]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
      setTranslations([]);
    } finally {
      setIsTranslating(false);
    }
  }, []);

  return { translations, isTranslating, error, translate };
}
