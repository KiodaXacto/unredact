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
  dailyProgress:  (date: string) => `unredact:daily:progress:${date}`,
  archiveProgress:(id: string)   => `unredact:archive:progress:${id}`,
  unlimitedProg:  (id: string)   => `unredact:unlimited:progress:${id}`,
  stats:          'unredact:stats',
  settings:       'unredact:settings',
  archivePlayed:  'unredact:archive:played',
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

export const saveDailyProgress = (date: string, state: SerializableGameState): void => {
  set(KEYS.dailyProgress(date), state);
};

export const loadDailyProgress = (date: string): SerializableGameState | null =>
  get<SerializableGameState | null>(KEYS.dailyProgress(date), null);

export const saveArchiveProgress = (id: string, state: SerializableGameState): void => {
  set(KEYS.archiveProgress(id), state);
};

export const loadArchiveProgress = (id: string): SerializableGameState | null =>
  get<SerializableGameState | null>(KEYS.archiveProgress(id), null);

// ── Statistics ────────────────────────────────────────────────────

const DEFAULT_STATS: Statistics = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastPlayedDate: null,
  history: [],
};

export const loadStats = (): Statistics =>
  get<Statistics>(KEYS.stats, DEFAULT_STATS);

export const saveStats = (stats: Statistics): void => {
  set(KEYS.stats, stats);
};

// ── Settings ──────────────────────────────────────────────────────

export const loadSettings = (): Settings =>
  get<Settings>(KEYS.settings, DEFAULT_SETTINGS);

export const saveSettings = (settings: Settings): void => {
  set(KEYS.settings, settings);
};

// ── Archive played tracking ───────────────────────────────────────

export const loadArchivePlayed = (): Set<string> => {
  const arr = get<string[]>(KEYS.archivePlayed, []);
  return new Set(arr);
};

export const markArchivePlayed = (id: string): void => {
  const played = loadArchivePlayed();
  played.add(id);
  set(KEYS.archivePlayed, Array.from(played));
};

// ── Storage migration ─────────────────────────────────────────────

export const checkAndMigrateStorage = (): void => {
  const version = get<number>(KEYS.version, 0);
  if (version < STORAGE_VERSION) {
    // Future migrations go here
    set(KEYS.version, STORAGE_VERSION);
  }
};
