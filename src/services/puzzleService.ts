// src/services/puzzleService.ts
// Loads puzzle JSON files from the static /data/ directory.
// All paths match the public/ folder structure.
// No backend required — files are served as static assets.

import type { Puzzle } from '@features/game/types';
import type { ArchiveEntry } from '@features/archive/types';

const BASE_URL = import.meta.env.VITE_DAILY_PUZZLE_BASE_URL ?? '/data/puzzles';
const ARCHIVE_INDEX_URL = import.meta.env.VITE_ARCHIVE_INDEX_URL ?? '/data/archive-index.json';
const UNLIMITED_INDEX_URL = import.meta.env.VITE_UNLIMITED_INDEX_URL ?? '/data/unlimited-index.json';

// ── Date helpers ──────────────────────────────────────────────────

/** Returns today's date in YYYY-MM-DD format */
export const getTodayId = (): string => {
  const d = new Date();
  const year  = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day   = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ── Fetch helpers ─────────────────────────────────────────────────

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
};

// ── Puzzle loaders ────────────────────────────────────────────────

/**
 * Load today's daily puzzle.
 * Filename: /data/puzzles/YYYY-MM-DD.json
 */
export const getDailyPuzzle = async (lang: 'en' | 'fr' = 'en'): Promise<Puzzle> => {
  const id = getTodayId();
  return getPuzzleById(id, lang);
};

/**
 * Load a specific puzzle by date ID (for archive and unlimited mode).
 * Filename: /data/puzzles/{id}.json
 */
export const getPuzzleById = async (id: string, lang: 'en' | 'fr' = 'en'): Promise<Puzzle> => {
  try {
    return await fetchJson<Puzzle>(`${BASE_URL}/${id}-${lang}.json`);
  } catch {
    if (lang === 'fr') {
      try {
        return await fetchJson<Puzzle>(`${BASE_URL}/${id}-en.json`);
      } catch {
        // Fall through
      }
    }
    return fetchJson<Puzzle>(`${BASE_URL}/${id}.json`);
  }
};

/**
 * Load the archive index (lightweight — no token data).
 * Used to render the archive calendar.
 */
export const getArchiveIndex = async (): Promise<ArchiveEntry[]> => {
  const index = await fetchJson<ArchiveEntry[]>(`${ARCHIVE_INDEX_URL}?t=${Date.now()}`);
  const today = getTodayId();
  // Only show puzzles up to today's date
  return index.filter(entry => entry.id <= today);
};

// ── Unlimited mode ────────────────────────────────────────────────

interface UnlimitedIndexEntry {
  id: string;
  difficulty: Puzzle['difficulty'];
  category: string;
}

/**
 * Load a random puzzle from the unlimited pool, optionally filtered.
 */
export const getUnlimitedPuzzle = async (
  filters: {
    difficulty: 'all' | Puzzle['difficulty'];
    category: string;
  },
  lang: 'en' | 'fr' = 'en'
): Promise<Puzzle> => {
  const index = await fetchJson<UnlimitedIndexEntry[]>(`${UNLIMITED_INDEX_URL}?t=${Date.now()}`);

  const filtered = index.filter((entry) => {
    if (filters.difficulty !== 'all' && entry.difficulty !== filters.difficulty) return false;
    if (filters.category !== 'all' && entry.category !== filters.category) return false;
    return true;
  });

  if (filtered.length === 0) {
    throw new Error('No puzzles match the selected filters.');
  }

  const random = filtered[Math.floor(Math.random() * filtered.length)];
  return getPuzzleById(random.id, lang);
};
