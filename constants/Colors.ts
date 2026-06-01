const tintColorLight = '#3b82f6';
const tintColorDark = '#60a5fa';

export const Colors = {
  light: {
    text: '#1f2937',
    textSecondary: '#6b7280',
    background: '#f3f4f6',
    card: '#ffffff',
    border: '#e5e7eb',
    tint: tintColorLight,
    tabIconDefault: '#9ca3af',
    tabIconSelected: tintColorLight,
    inputBackground: '#f3f4f6',
    success: '#10b981',
    successBackground: '#d1fae5',
    danger: '#ef4444',
    dangerBackground: '#fee2e2',
    warning: '#f59e0b',
    warningBackground: '#fef3c7',
    info: '#3b82f6',
    infoBackground: '#dbeafe',
    disabled: '#e5e7eb',
    disabledText: '#6b7280',
  },
  dark: {
    text: '#f9fafb',
    textSecondary: '#9ca3af',
    background: '#111827',
    card: '#1f2937',
    border: '#374151',
    tint: tintColorDark,
    tabIconDefault: '#6b7280',
    tabIconSelected: tintColorDark,
    inputBackground: '#374151',
    success: '#34d399',
    successBackground: '#064e3b',
    danger: '#f87171',
    dangerBackground: '#7f1d1d',
    warning: '#fbbf24',
    warningBackground: '#78350f',
    info: '#60a5fa',
    infoBackground: '#1e3a8a',
    disabled: '#374151',
    disabledText: '#9ca3af',
  },
};

import { useColorScheme } from 'react-native';

export function useThemeColor() {
  const theme = useColorScheme() ?? 'light';
  return Colors[theme];
}
