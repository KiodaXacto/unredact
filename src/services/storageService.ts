// src/services/storageService.ts
// Typed, namespaced localStorage wrapper.
// All keys are prefixed with 'unredact:' to avoid collisions.
// Never throws — returns fallback on any error.

import type { SerializableGameState } from '@features/game/types';
import type { Statistics } from '@features/statistics/types';
import type { Settings } from '@features/settings/types';
import { DEFAULT_SETTINGS } from '@features/settings/types';

// ── Storage version — bump when data shape changes ────────────────
const STORAGE_VERSION = 1;

const KEYS = {
  version:        'unredact:version',
  dailyProgress:  (date: string, lang: string) => `unredact:daily:progress:${date}${lang === 'en' ? '' : '_' + lang}`,
  archiveProgress:(id: string, lang: string)   => `unredact:archive:progress:${id}${lang === 'en' ? '' : '_' + lang}`,
  unlimitedProg:  (id: string, lang: string)   => `unredact:unlimited:progress:${id}${lang === 'en' ? '' : '_' + lang}`,
  stats:          (lang: string) => `unredact:stats${lang === 'en' ? '' : '_' + lang}`,
  settings:       'unredact:settings',
  archivePlayed:  (lang: string) => `unredact:archive:played${lang === 'en' ? '' : '_' + lang}`,
} as const;

// ── Generic helpers ───────────────────────────────────────────────

const get = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const set = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — silently ignore
    // Gameplay continues without persistence
  }
};

// ── Progress persistence ──────────────────────────────────────────

export const saveDailyProgress = (date: string, state: SerializableGameState, lang: string = 'en'): void => {
  set(KEYS.dailyProgress(date, lang), state);
};

export const loadDailyProgress = (date: string, lang: string = 'en'): SerializableGameState | null =>
  get<SerializableGameState | null>(KEYS.dailyProgress(date, lang), null);

export const saveArchiveProgress = (id: string, state: SerializableGameState, lang: string = 'en'): void => {
  set(KEYS.archiveProgress(id, lang), state);
};

export const loadArchiveProgress = (id: string, lang: string = 'en'): SerializableGameState | null =>
  get<SerializableGameState | null>(KEYS.archiveProgress(id, lang), null);

// ── Statistics ────────────────────────────────────────────────────

const DEFAULT_STATS: Statistics = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastPlayedDate: null,
  history: [],
};

export const loadStats = (lang: string = 'en'): Statistics =>
  get<Statistics>(KEYS.stats(lang), DEFAULT_STATS);

export const saveStats = (stats: Statistics, lang: string = 'en'): void => {
  set(KEYS.stats(lang), stats);
};

// ── Settings ──────────────────────────────────────────────────────

export const loadSettings = (): Settings => {
  const loaded = get<Partial<Settings>>(KEYS.settings, {});
  return { ...DEFAULT_SETTINGS, ...loaded };
};

export const saveSettings = (settings: Settings): void => {
  set(KEYS.settings, settings);
};

// ── Archive played tracking ───────────────────────────────────────

export const loadArchivePlayed = (lang: string = 'en'): Set<string> => {
  const arr = get<string[]>(KEYS.archivePlayed(lang), []);
  return new Set(arr);
};

export const markArchivePlayed = (id: string, lang: string = 'en'): void => {
  const played = loadArchivePlayed(lang);
  played.add(id);
  set(KEYS.archivePlayed(lang), Array.from(played));
};

// ── Storage migration ─────────────────────────────────────────────

export const checkAndMigrateStorage = (): void => {
  const version = get<number>(KEYS.version, 0);
  if (version < STORAGE_VERSION) {
    // Future migrations go here
    set(KEYS.version, STORAGE_VERSION);
  }
};
