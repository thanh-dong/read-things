import { useSettingsStore } from '@/stores/settings-store';
import { COLORS, type ThemeColors } from '@/constants/theme';

export function useTheme(): ThemeColors {
  const isDarkMode = useSettingsStore((s) => s.isDarkMode);
  return isDarkMode ? COLORS.dark : COLORS.light;
}
