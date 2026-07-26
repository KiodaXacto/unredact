// src/features/settings/hooks/useSettings.ts
// Persistent settings hook — reads from localStorage, applies to DOM.

import { useState, useCallback, useEffect } from 'react';
import type { Settings, Theme, FontSize } from '@features/settings/types';
import { DEFAULT_SETTINGS } from '@features/settings/types';
import { loadSettings, saveSettings } from '@services/storageService';

const applyTheme = (theme: Theme) => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.classList.toggle('light', !isDark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content',
    isDark ? '#1A1A1A' : '#F8F6F1'
  );
};

const applyFontSize = (size: FontSize) => {
  document.documentElement.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
  document.documentElement.classList.add(`font-size-${size}`);
};

export const useSettings = () => {
  const [settings, setSettingsState] = useState<Settings>(() => loadSettings());

  // Apply settings to DOM on mount
  useEffect(() => {
    applyTheme(settings.theme);
    applyFontSize(settings.fontSize);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...partial };

      // Apply side effects
      if (partial.theme !== undefined) applyTheme(partial.theme);
      if (partial.fontSize !== undefined) applyFontSize(partial.fontSize);

      saveSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    applyTheme(DEFAULT_SETTINGS.theme);
    applyFontSize(DEFAULT_SETTINGS.fontSize);
    saveSettings(DEFAULT_SETTINGS);
    setSettingsState(DEFAULT_SETTINGS);
  }, []);

  return { settings, updateSettings, resetSettings };
};
