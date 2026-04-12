export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  bcp47: string; // BCP-47 code for expo-speech TTS
  script: 'latin' | 'cjk' | 'arabic' | 'thai' | 'hangul';
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', bcp47: 'en-US', script: 'latin' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', bcp47: 'ja-JP', script: 'cjk' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', bcp47: 'vi-VN', script: 'latin' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', bcp47: 'ko-KR', script: 'hangul' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', bcp47: 'zh-CN', script: 'cjk' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', bcp47: 'es-ES', script: 'latin' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', bcp47: 'fr-FR', script: 'latin' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', bcp47: 'de-DE', script: 'latin' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', bcp47: 'pt-BR', script: 'latin' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', bcp47: 'th-TH', script: 'thai' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', bcp47: 'ar-SA', script: 'arabic' },
];

export const DEFAULT_TARGET_LANGUAGES = ['ja', 'vi'];

export function getLanguageByCode(code: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find(l => l.code === code);
}

export function getLanguagesByCodeList(codes: string[]): Language[] {
  return codes
    .map(code => getLanguageByCode(code))
    .filter((l): l is Language => l !== undefined);
}
