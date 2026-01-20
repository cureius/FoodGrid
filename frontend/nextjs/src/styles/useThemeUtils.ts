'use client';

import { useTheme } from './ThemeProvider';

/**
 * Hook to get theme colors as an object
 * Useful for dynamic styling in components
 */
export function useThemeColors() {
  const { theme } = useTheme();
  return theme.colors;
}

/**
 * Hook to get the current theme mode
 */
export function useThemeMode() {
  const { mode } = useTheme();
  return mode;
}

/**
 * Utility function to generate CSS variable references
 * Example: getCSSVar('text-primary') => 'var(--text-primary)'
 */
export function getCSSVar(variable: string): string {
  return `var(--${variable})`;
}

/**
 * Helper to create theme-aware inline styles
 * Usage: const style = createThemeStyle({ color: 'text-primary' });
 */
export function createThemeStyle(styleMap: Record<string, string>) {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(styleMap)) {
    result[key] = getCSSVar(value);
  }
  return result;
}

/**
 * Example theme-aware styled objects for common components
 */
export const themeStyles = {
  // Card styles
  card: {
    background: getCSSVar('component-bg'),
    border: `1px solid ${getCSSVar('component-border')}`,
    borderRadius: getCSSVar('radius-base'),
    boxShadow: getCSSVar('shadow-md'),
    padding: getCSSVar('spacing-md'),
    transition: getCSSVar('transition-normal'),
  },

  // Button styles
  button: {
    background: getCSSVar('color-primary'),
    color: getCSSVar('text-inverse'),
    border: 'none',
    borderRadius: getCSSVar('radius-button'),
    padding: `${getCSSVar('spacing-sm')} ${getCSSVar('spacing-md')}`,
    fontWeight: '600',
    cursor: 'pointer',
    transition: getCSSVar('transition-fast'),
  },

  // Input styles
  input: {
    background: getCSSVar('component-bg'),
    border: `1px solid ${getCSSVar('component-border')}`,
    borderRadius: getCSSVar('radius-base'),
    padding: getCSSVar('spacing-sm'),
    color: getCSSVar('text-primary'),
    fontFamily: "'Inter', sans-serif",
    transition: getCSSVar('transition-fast'),
  },

  // Modal overlay
  modalOverlay: {
    background: getCSSVar('bg-overlay'),
    backdropFilter: 'blur(4px)',
  },

  // Success badge
  successBadge: {
    background: getCSSVar('color-success-light'),
    color: getCSSVar('color-success'),
    borderRadius: getCSSVar('radius-badge'),
    padding: `4px 8px`,
  },

  // Error badge
  errorBadge: {
    background: getCSSVar('color-error-light'),
    color: getCSSVar('color-error'),
    borderRadius: getCSSVar('radius-badge'),
    padding: `4px 8px`,
  },

  // Warning badge
  warningBadge: {
    background: getCSSVar('color-warning-light'),
    color: getCSSVar('color-warning'),
    borderRadius: getCSSVar('radius-badge'),
    padding: `4px 8px`,
  },
};
