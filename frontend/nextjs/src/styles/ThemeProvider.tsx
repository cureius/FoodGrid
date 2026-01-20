'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Theme, ThemeMode, themes } from './theme';

interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [isMounted, setIsMounted] = useState(false);

  // Apply theme to document
  const applyTheme = (newMode: ThemeMode) => {
    if (typeof document === 'undefined') return;
    
    const htmlElement = document.documentElement;
    
    // Update data attribute for CSS selectors
    htmlElement.setAttribute('data-theme', newMode);
    
    // Update CSS variables
    const colors = themes[newMode].colors;
    const root = htmlElement.style;
    
    // Background colors
    root.setProperty('--bg-primary', colors.bg.primary);
    root.setProperty('--bg-secondary', colors.bg.secondary);
    root.setProperty('--bg-tertiary', colors.bg.tertiary);
    root.setProperty('--bg-overlay', colors.bg.overlay);
    
    // Text colors
    root.setProperty('--text-primary', colors.text.primary);
    root.setProperty('--text-secondary', colors.text.secondary);
    root.setProperty('--text-tertiary', colors.text.tertiary);
    root.setProperty('--text-inverse', colors.text.inverse);
    
    // Component colors
    root.setProperty('--component-bg', colors.component.background);
    root.setProperty('--component-border', colors.component.border);
    root.setProperty('--component-border-hover', colors.component.borderHover);
    root.setProperty('--component-hover', colors.component.hover);
    root.setProperty('--component-active', colors.component.active);
    
    // Semantic colors
    root.setProperty('--color-primary', colors.semantic.primary);
    root.setProperty('--color-primary-hover', colors.semantic.primaryHover);
    root.setProperty('--color-secondary', colors.semantic.secondary);
    root.setProperty('--color-success', colors.semantic.success);
    root.setProperty('--color-success-light', colors.semantic.successLight);
    root.setProperty('--color-warning', colors.semantic.warning);
    root.setProperty('--color-warning-light', colors.semantic.warningLight);
    root.setProperty('--color-error', colors.semantic.error);
    root.setProperty('--color-error-light', colors.semantic.errorLight);
    root.setProperty('--color-info', colors.semantic.info);
    root.setProperty('--color-info-light', colors.semantic.infoLight);
    
    // Shadows
    root.setProperty('--shadow-sm', colors.shadow.sm);
    root.setProperty('--shadow-md', colors.shadow.md);
    root.setProperty('--shadow-lg', colors.shadow.lg);
    root.setProperty('--shadow-xl', colors.shadow.xl);
  };

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialMode = savedMode || (prefersDark ? 'dark' : 'light');
    
    setModeState(initialMode);
    applyTheme(initialMode);
    setIsMounted(true);
  }, []);

  // Update theme when mode changes
  useEffect(() => {
    if (isMounted) {
      applyTheme(mode);
    }
  }, [mode, isMounted]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('theme-mode', newMode);
  };

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
  };

  if (!isMounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme: themes[mode], mode, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}