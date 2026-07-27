// src/features/game/utils/gameEngine.test.ts
// Unit tests for the core game engine — pure functions, no React.

import { describe, it, expect } from 'vitest';
import {
  normalizeWord,
  buildTokens,
  buildInvertedIndex,
  processGuess,
  applyReveal,
  computeScore,
  getAvailableHints,
  HINT_THRESHOLDS,
} from './gameEngine';
import type { RawToken, Puzzle } from '@features/game/types';

// ── Test fixtures ─────────────────────────────────────────────────

const makePuzzle = (overrides: Partial<Puzzle> = {}): Puzzle => ({
  id: '2026-07-25',
  title: 'Charles Darwin',
  normalizedTitle: 'charles darwin',
  alternateTitles: ['darwin', 'charles robert darwin'],
  category: 'Person – Science',
  difficulty: 'straightforward',
  firstLetter: 'C',
  sampleSentence: 'He is best known for his contributions to science.',
  tokens: [],
  fullTextRaw: '',
  categoriesList: ['Science'],
  ...overrides,
});

const makeRawTokens = (): RawToken[] => [
  { text: 'Charles', pos: 'NNP', isStopWord: false, isPunctuation: false },
  { text: ' ', pos: 'SPACE', isStopWord: false, isPunctuation: false },
  { text: 'Darwin', pos: 'NNP', isStopWord: false, isPunctuation: false },
  { text: ' ', pos: 'SPACE', isStopWord: false, isPunctuation: false },
  { text: 'was', pos: 'VBD', isStopWord: true, isPunctuation: false },
  { text: ' ', pos: 'SPACE', isStopWord: false, isPunctuation: false },
  { text: 'a', pos: 'DT', isStopWord: true, isPunctuation: false },
  { text: ' ', pos: 'SPACE', isStopWord: false, isPunctuation: false },
  { text: 'naturalist', pos: 'NN', isStopWord: false, isPunctuation: false },
  { text: '.', pos: 'PUNCT', isStopWord: false, isPunctuation: true },
];

// ── normalizeWord ─────────────────────────────────────────────────

describe('normalizeWord', () => {
  it('lowercases the word', () => {
    expect(normalizeWord('Darwin')).toBe('darwin');
  });

  it('strips trailing punctuation', () => {
    expect(normalizeWord('Darwin.')).toBe('darwin');
    expect(normalizeWord('naturalist,')).toBe('naturalist');
  });

  it('strips leading punctuation', () => {
    expect(normalizeWord('"Hello')).toBe('hello');
  });

  it('handles already lowercase words', () => {
    expect(normalizeWord('evolution')).toBe('evolution');
  });

  it('handles empty string', () => {
    expect(normalizeWord('')).toBe('');
  });
});

// ── buildTokens ───────────────────────────────────────────────────

describe('buildTokens', () => {
  it('assigns sequential IDs', () => {
    const tokens = buildTokens(makeRawTokens());
    tokens.forEach((t, i) => expect(t.id).toBe(i));
  });

  it('marks stop words as revealed', () => {
    const tokens = buildTokens(makeRawTokens());
    const stopToken = tokens.find((t) => t.text === 'was');
    expect(stopToken?.revealed).toBe(true);
  });

  it('marks punctuation as revealed', () => {
    const tokens = buildTokens(makeRawTokens());
    const punct = tokens.find((t) => t.text === '.');
    expect(punct?.revealed).toBe(true);
  });

  it('marks content words as NOT revealed', () => {
    const tokens = buildTokens(makeRawTokens());
    const charles = tokens.find((t) => t.text === 'Charles');
    expect(charles?.revealed).toBe(false);
  });

  it('correctly normalizes words', () => {
    const tokens = buildTokens(makeRawTokens());
    const darwin = tokens.find((t) => t.text === 'Darwin');
    expect(darwin?.normalized).toBe('darwin');
  });

  it('marks whitespace correctly', () => {
    const tokens = buildTokens(makeRawTokens());
    const space = tokens.find((t) => t.text === ' ');
    expect(space?.isWhitespace).toBe(true);
  });
});

// ── buildInvertedIndex ────────────────────────────────────────────

describe('buildInvertedIndex', () => {
  it('indexes content words', () => {
    const tokens = buildTokens(makeRawTokens());
    const index = buildInvertedIndex(tokens);
    expect(index.has('charles')).toBe(true);
    expect(index.has('darwin')).toBe(true);
    expect(index.has('naturalist')).toBe(true);
  });

  it('does NOT index stop words', () => {
    const tokens = buildTokens(makeRawTokens());
    const index = buildInvertedIndex(tokens);
    expect(index.has('was')).toBe(false);
    expect(index.has('a')).toBe(false);
  });

  it('does NOT index punctuation', () => {
    const tokens = buildTokens(makeRawTokens());
    const index = buildInvertedIndex(tokens);
    expect(index.has('.')).toBe(false);
  });

  it('maps to correct token IDs', () => {
    const tokens = buildTokens(makeRawTokens());
    const index = buildInvertedIndex(tokens);
    const charlesIds = index.get('charles');
    expect(charlesIds).toBeDefined();
    expect(tokens[charlesIds![0]].text).toBe('Charles');
  });

  it('handles repeated words', () => {
    const repeated: RawToken[] = [
      { text: 'evolution', pos: 'NN', isStopWord: false, isPunctuation: false },
      { text: ' ', pos: 'SPACE', isStopWord: false, isPunctuation: false },
      { text: 'evolution', pos: 'NN', isStopWord: false, isPunctuation: false },
    ];
    const tokens = buildTokens(repeated);
    const index = buildInvertedIndex(tokens);
    expect(index.get('evolution')?.length).toBe(2);
  });
});

// ── processGuess ─────────────────────────────────────────────────

describe('processGuess', () => {
  const setup = () => {
    const puzzle = makePuzzle();
    const tokens = buildTokens(makeRawTokens());
    const invertedIndex = buildInvertedIndex(tokens);
    const state = {
      invertedIndex,
      guessedWords: new Set<string>(),
      puzzle,
      language: 'en' as const,
    };
    return { tokens, state };
  };

  it('returns revealedIds for a found word', () => {
    const { state } = setup();
    const result = processGuess('naturalist', state);
    expect(result.wasFound).toBe(true);
    expect(result.revealedIds.length).toBeGreaterThan(0);
    expect(result.revealCount).toBeGreaterThan(0);
  });

  it('returns empty for a word not in article', () => {
    const { state } = setup();
    const result = processGuess('unicorn', state);
    expect(result.wasFound).toBe(false);
    expect(result.revealedIds).toHaveLength(0);
  });

  it('detects the exact title', () => {
    const { state } = setup();
    const result = processGuess('Charles Darwin', state);
    expect(result.isTitle).toBe(true);
  });

  it('detects alternate titles', () => {
    const { state } = setup();
    const result = processGuess('darwin', state);
    expect(result.isAlternate).toBe(true);
    expect(result.isTitle).toBe(false);
  });

  it('is case-insensitive', () => {
    const { state } = setup();
    const lower = processGuess('NATURALIST', state);
    const upper = processGuess('naturalist', state);
    expect(lower.revealedIds).toEqual(upper.revealedIds);
  });

  it('ignores already-guessed words', () => {
    const { state } = setup();
    state.guessedWords.add('naturalist');
    const result = processGuess('naturalist', state);
    expect(result.wasFound).toBe(false);
    expect(result.revealedIds).toHaveLength(0);
  });
});

// ── applyReveal ───────────────────────────────────────────────────

describe('applyReveal', () => {
  it('reveals specified token IDs', () => {
    const tokens = buildTokens(makeRawTokens());
    const contentToken = tokens.find((t) => !t.isStopWord && !t.isPunctuation && !t.isWhitespace)!;
    const updated = applyReveal(tokens, [contentToken.id]);
    expect(updated[contentToken.id].revealed).toBe(true);
  });

  it('does not mutate original token array', () => {
    const tokens = buildTokens(makeRawTokens());
    const original = [...tokens];
    applyReveal(tokens, [0]);
    expect(tokens[0].revealed).toBe(original[0].revealed);
  });

  it('returns same reference if no IDs provided', () => {
    const tokens = buildTokens(makeRawTokens());
    const result = applyReveal(tokens, []);
    expect(result).toBe(tokens);
  });
});

// ── computeScore ─────────────────────────────────────────────────

describe('computeScore', () => {
  it('computes 0% when nothing revealed', () => {
    const score = computeScore({
      guessHistory: [],
      revealedCount: 0,
      totalRedactedCount: 100,
      hintsUsed: [],
    });
    expect(score.revealedPercent).toBe(0);
    expect(score.guessCount).toBe(0);
  });

  it('computes correct percentage', () => {
    const score = computeScore({
      guessHistory: [{ word: 'test', normalizedWord: 'test', revealCount: 1, isTitle: false, isAlternate: false, timestamp: 0 }],
      revealedCount: 25,
      totalRedactedCount: 100,
      hintsUsed: [],
    });
    expect(score.revealedPercent).toBe(25);
    expect(score.guessCount).toBe(1);
  });

  it('handles zero totalRedactedCount gracefully', () => {
    const score = computeScore({
      guessHistory: [],
      revealedCount: 0,
      totalRedactedCount: 0,
      hintsUsed: [],
    });
    expect(score.revealedPercent).toBe(0);
  });
});

// ── getAvailableHints ─────────────────────────────────────────────

describe('getAvailableHints', () => {
  it('returns no hints before threshold', () => {
    expect(getAvailableHints(10, [])).toHaveLength(0);
  });

  it('returns level 1 after 50 guesses', () => {
    const hints = getAvailableHints(50, []);
    expect(hints).toContain(1);
  });

  it('does not return already-used hints', () => {
    const hints = getAvailableHints(80, [1]);
    expect(hints).not.toContain(1);
    expect(hints).toContain(2);
  });

  it('returns all three hints at 120+ guesses', () => {
    const hints = getAvailableHints(120, []);
    expect(hints).toContain(1);
    expect(hints).toContain(2);
    expect(hints).toContain(3);
  });

  it('hint thresholds are correct', () => {
    expect(HINT_THRESHOLDS[1]).toBe(50);
    expect(HINT_THRESHOLDS[2]).toBe(80);
    expect(HINT_THRESHOLDS[3]).toBe(120);
  });
});
