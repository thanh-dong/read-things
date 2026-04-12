export const COLORS = {
  dark: {
    background: '#000000',
    surface: '#1C1C1E',
    surfaceSecondary: '#2C2C2E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    accent: '#007AFF',
    error: '#FF3B30',
    warning: '#FF9500',
    success: '#34C759',
    border: '#38383A',
  },
  light: {
    background: '#F2F2F7',
    surface: '#FFFFFF',
    surfaceSecondary: '#E5E5EA',
    text: '#000000',
    textSecondary: '#8E8E93',
    accent: '#007AFF',
    error: '#FF3B30',
    warning: '#FF9500',
    success: '#34C759',
    border: '#C6C6C8',
  },
} as const;

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  accent: string;
  error: string;
  warning: string;
  success: string;
  border: string;
};
