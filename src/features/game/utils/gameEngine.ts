// src/features/game/utils/gameEngine.ts
// Pure functions — no React, no side effects, fully testable.
// This is the heart of Unredact.

import type {
  RawToken,
  Token,
  GameState,
  GuessResult,
  ScoreResult,
  SerializableGameState,
  HintLevel,
} from '@features/game/types';
import { isStopWord } from '@data/stopWords';

// ─────────────────────────────────────────────────────────────────
// Token building
// ─────────────────────────────────────────────────────────────────

const LEADING_TRAILING_PUNCT = /^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g;
const WHITESPACE_REGEX = /^\s+$/;
const PARAGRAPH_BREAK_REGEX = /\n\n/;

/**
 * Strips leading and trailing punctuation from a word for matching.
 * "Darwin." → "darwin"
 * "world—" → "world"
 */
export const normalizeWord = (word: string): string =>
  word.replace(LEADING_TRAILING_PUNCT, '').toLowerCase();

/**
 * Convert the raw token array from JSON into runtime Token objects.
 * Assigns stable IDs, computes normalized form, detects whitespace.
 * Called once when a puzzle is loaded.
 */
export const buildTokens = (rawTokens: RawToken[]): Token[] =>
  rawTokens.map((raw, index) => {
    const isWhitespace = WHITESPACE_REGEX.test(raw.text);
    const isParagraphBreak = PARAGRAPH_BREAK_REGEX.test(raw.text);

    return {
      ...raw,
      id: index,
      normalized: isWhitespace || raw.isPunctuation ? '' : normalizeWord(raw.text),
      isWhitespace,
      isParagraphBreak,
      // Initially revealed if it's a stop word or punctuation/whitespace
      revealed: raw.isStopWord || raw.isPunctuation || isWhitespace,
    };
  });

// ─────────────────────────────────────────────────────────────────
// Inverted index
// ─────────────────────────────────────────────────────────────────

/**
 * Build an inverted index: normalizedWord → [tokenId, tokenId, ...]
 * Built in O(n), lookups are O(1).
 * Skips stop words, punctuation, and whitespace (already visible).
 * This is the key to near-instant guess processing regardless of article length.
 */
export const buildInvertedIndex = (tokens: Token[]): Map<string, number[]> => {
  const index = new Map<string, number[]>();

  for (const token of tokens) {
    if (token.isStopWord || token.isPunctuation || token.isWhitespace || !token.normalized) {
      continue;
    }

    const existing = index.get(token.normalized);
    if (existing) {
      existing.push(token.id);
    } else {
      index.set(token.normalized, [token.id]);
    }
  }

  return index;
};

// ─────────────────────────────────────────────────────────────────
// Guess processing
// ─────────────────────────────────────────────────────────────────

/**
 * Process a player's guess against the current game state.
 * Pure function — does NOT mutate state.
 * Returns the result of the guess (what was revealed, win conditions).
 */
export const processGuess = (
  rawInput: string,
  state: Pick<GameState, 'invertedIndex' | 'guessedWords' | 'puzzle'>
): GuessResult => {
  const normalized = normalizeWord(rawInput.trim());

  // Empty or already guessed
  if (!normalized || state.guessedWords.has(normalized)) {
    return { revealedIds: [], isTitle: false, isAlternate: false, wasFound: false, revealCount: 0 };
  }

  const matchingIds = state.invertedIndex.get(normalized) ?? [];
  const wasFound = matchingIds.length > 0;

  // Check win conditions
  const puzzle = state.puzzle;
  
  const currentGuesses = new Set(state.guessedWords);
  currentGuesses.add(normalized);

  let isTitle = false;
  if (puzzle) {
    if (normalized === puzzle.normalizedTitle) {
      isTitle = true;
    } else {
      const titleWords = puzzle.title
        .match(/([a-zA-Z0-9À-ÿ-]+)/g)
        ?.map(normalizeWord)
        .filter(w => w && !isStopWord(w)) || [];
      
      if (titleWords.length > 0 && titleWords.every(w => currentGuesses.has(w))) {
        isTitle = true;
      }
    }
  }

  const isAlternate =
    !isTitle &&
    puzzle !== null &&
    puzzle.alternateTitles.some((alt) => normalizeWord(alt) === normalized);

  return {
    revealedIds: matchingIds,
    isTitle,
    isAlternate,
    wasFound,
    revealCount: matchingIds.length,
  };
};

/**
 * Apply a guess result to the token array.
 * Returns a new token array (immutable update) with revealed IDs set to true.
 * Uses direct index access — O(k) where k = number of matching tokens.
 */
export const applyReveal = (tokens: Token[], revealedIds: number[]): Token[] => {
  if (revealedIds.length === 0) return tokens;

  // Clone the array but only clone the affected token objects
  const next = [...tokens];
  for (const id of revealedIds) {
    if (next[id] && !next[id].revealed) {
      next[id] = { ...next[id], revealed: true };
    }
  }
  return next;
};

// ─────────────────────────────────────────────────────────────────
// Scoring
// ─────────────────────────────────────────────────────────────────

/**
 * Compute the final score for sharing and display.
 */
export const computeScore = (state: Pick<GameState, 'guessHistory' | 'revealedCount' | 'totalRedactedCount' | 'hintsUsed'>): ScoreResult => {
  const revealedPercent =
    state.totalRedactedCount > 0
      ? Math.round((state.revealedCount / state.totalRedactedCount) * 1000) / 10
      : 0;

  return {
    guessCount: state.guessHistory.length,
    revealedPercent,
    hintsUsedCount: state.hintsUsed.length,
    hintsUsed: state.hintsUsed,
  };
};

// ─────────────────────────────────────────────────────────────────
// Share text generation
// ─────────────────────────────────────────────────────────────────

const GUESS_SYMBOLS = {
  reveal:   '🟩',
  hint:     '🟨',
  miss:     '⬛',
  title:    '🏆',
} as const;

/**
 * Generate the shareable result text for the clipboard.
 * Example:
 *   Unredact #42 🔵 Easy
 *   🟩🟩⬛🟩🟩🟩🏆
 *   23 guesses • 18.4% revealed • 💡1
 *   https://unredact.com
 */
export const generateShareText = (state: GameState, appUrl = 'https://unredact.com'): string => {
  if (!state.puzzle) return '';

  const { guessHistory, hintsUsed, puzzle } = state;
  const score = computeScore(state);

  // Build emoji grid (max 30 squares to keep it readable)
  const maxSquares = 30;
  const symbolRow = guessHistory
    .slice(0, maxSquares)
    .map((g, i) => {
      if (g.isTitle) return GUESS_SYMBOLS.title;
      if (state.hintsUsed.length > 0 && i === 50) return GUESS_SYMBOLS.hint; // approximate
      if (g.revealCount > 0) return GUESS_SYMBOLS.reveal;
      return GUESS_SYMBOLS.miss;
    })
    .join('');

  const overflow = guessHistory.length > maxSquares ? ` +${guessHistory.length - maxSquares}` : '';
  const difficultyEmoji = { straightforward: '🔵', challenging: '🟡', obscure: '🔴' }[puzzle.difficulty];
  const hintsText = hintsUsed.length > 0 ? ` 💡${hintsUsed.length}` : '';

  const lines = [
    `Unredact ${puzzle.id} ${difficultyEmoji}`,
    `${symbolRow}${overflow}`,
    `${score.guessCount} guesses • ${score.revealedPercent}% revealed${hintsText}`,
    appUrl,
  ];

  return lines.join('\n');
};

// ─────────────────────────────────────────────────────────────────
// Hint system helpers
// ─────────────────────────────────────────────────────────────────

export const HINT_THRESHOLDS: Record<HintLevel, number> = {
  1: 50,   // First letter
  2: 80,   // Category
  3: 120,  // Sample sentence reveal
} as const;

/**
 * Returns which hint levels are now available (threshold reached but not yet used).
 */
export const getAvailableHints = (
  guessCount: number,
  hintsUsed: HintLevel[]
): HintLevel[] => {
  const available: HintLevel[] = [];
  for (const [level, threshold] of Object.entries(HINT_THRESHOLDS)) {
    const lvl = Number(level) as HintLevel;
    if (guessCount >= threshold && !hintsUsed.includes(lvl)) {
      available.push(lvl);
    }
  }
  return available;
};

// ─────────────────────────────────────────────────────────────────
// State serialization (for localStorage)
// ─────────────────────────────────────────────────────────────────

/**
 * Serialize the game state to a JSON-safe object for localStorage.
 * Maps/Sets are converted to arrays.
 */
export const serializeState = (state: GameState): SerializableGameState | null => {
  if (!state.puzzle) return null;

  return {
    puzzleId: state.puzzle.id,
    guessedWords: Array.from(state.guessedWords),
    hintsUsed: state.hintsUsed,
    solved: state.solved,
    almostSolved: state.almostSolved,
    guessHistory: state.guessHistory,
    mode: state.mode,
    startedAt: state.startedAt,
    solvedAt: state.solvedAt,
  };
};
