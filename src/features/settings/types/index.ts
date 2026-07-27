// src/features/settings/types/index.ts

export type Theme = 'dark' | 'light' | 'system';
export type FontSize = 'small' | 'medium' | 'large';

export interface Settings {
  theme: Theme;
  fontSize: FontSize;
  posColorsEnabled: boolean;
  highContrastEnabled: boolean;
  language: 'en' | 'fr';
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  fontSize: 'medium',
  posColorsEnabled: false,
  highContrastEnabled: false,
  language: 'en',
};
