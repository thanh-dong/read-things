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

export const IDENTIFY_AND_TRANSLATE_SYSTEM_PROMPT = `You are an object identification and translation assistant. Given image classification labels from a camera, identify the specific object being viewed, then translate it. Respond in JSON only, no other text.`;

export function buildIdentifyAndTranslatePrompt(
  mlKitLabels: string[],
  targetLanguages: string[],
): string {
  const langList = targetLanguages.join(', ');
  const labelList = mlKitLabels.map((l) => `"${l}"`).join(', ');
  return `A camera detected these labels on an object: [${labelList}]

Based on these labels, identify the most likely specific object (e.g., "cup" not "tableware", "apple" not "food").

Then translate the identified object name to these languages: ${langList}

Respond with this exact JSON format:
{
  "identified": "specific object name in English",
  "translations": [
    {
      "lang": "language_code",
      "word": "translated word in native script",
      "phonetic": "romanized pronunciation guide"
    }
  ]
}

Rules:
- "identified" must be a specific, common noun (e.g., "laptop", "coffee mug", "banana") — never a broad category
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
