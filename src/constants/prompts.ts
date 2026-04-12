export const TRANSLATION_SYSTEM_PROMPT = `You are a translation assistant. Given an English word or phrase for a physical object, provide translations with pronunciation guides. Respond in JSON only, no other text.`;

export function buildTranslationPrompt(englishLabel: string, targetLanguages: string[]): string {
  const langList = targetLanguages.join(', ');
  return `Translate "${englishLabel}" to these languages: ${langList}

Respond with this exact JSON format:
{
  "translations": [
    {
      "lang": "language_code",
      "word": "translated word in native script",
      "phonetic": "romanized pronunciation guide"
    }
  ]
}

Rules:
- For languages with non-Latin scripts (Japanese, Chinese, Korean, Thai, Arabic), provide romanized phonetic guide
- For Latin-script languages (Spanish, French, German, Portuguese, Vietnamese), the phonetic field should contain simplified pronunciation
- Include articles where natural (el/la for Spanish, le/la for French, der/die/das for German, o/a for Portuguese)
- One entry per target language
- JSON only, no markdown, no explanation`;
}

export function buildBatchTranslationPrompt(englishLabels: string[], targetLanguages: string[]): string {
  const langList = targetLanguages.join(', ');
  const labelList = englishLabels.map(l => `"${l}"`).join(', ');
  return `Translate these English words to ${langList}: ${labelList}

Respond with this exact JSON format:
{
  "results": [
    {
      "english": "original word",
      "translations": [
        {
          "lang": "language_code",
          "word": "translated word in native script",
          "phonetic": "romanized pronunciation guide"
        }
      ]
    }
  ]
}

Rules:
- For languages with non-Latin scripts, provide romanized phonetic guide
- For Latin-script languages, provide simplified pronunciation
- Include articles where natural
- JSON only, no markdown, no explanation`;
}
