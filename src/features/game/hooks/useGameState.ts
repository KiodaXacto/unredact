// src/features/game/hooks/useGameState.ts
// Game state management using useReducer for predictable state transitions.
// All state mutations go through typed actions — no ad-hoc setState calls.

import { useReducer, useCallback } from 'react';
import type { GameState, GameAction, HintLevel, Puzzle, SerializableGameState } from '@features/game/types';
import {
  buildTokens,
  buildInvertedIndex,
  processGuess,
  applyReveal,
  HINT_THRESHOLDS,
} from '@features/game/utils/gameEngine';

// ─────────────────────────────────────────────────────────────────
// Initial state
// ─────────────────────────────────────────────────────────────────

const createInitialState = (): GameState => ({
  puzzle: null,
  tokens: [],
  invertedIndex: new Map(),
  guessedWords: new Set(),
  revealedCount: 0,
  totalRedactedCount: 0,
  hintsUsed: [],
  solved: false,
  almostSolved: false,
  guessHistory: [],
  mode: 'daily',
  language: 'en',
  startedAt: null,
  solvedAt: null,
});

// ─────────────────────────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────────────────────────

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'LOAD_PUZZLE': {
      const { puzzle, mode, language, savedState } = action.payload;
      const tokens = buildTokens(puzzle.tokens);
      const invertedIndex = buildInvertedIndex(tokens);

      // Count redacted tokens (tokens that start hidden)
      const totalRedactedCount = tokens.filter(
        (t) => !t.isStopWord && !t.isPunctuation && !t.isWhitespace
      ).length;

      // Base state from fresh puzzle load
      let nextState: GameState = {
        ...createInitialState(),
        puzzle,
        tokens,
        invertedIndex,
        totalRedactedCount,
        mode,
        language,
        startedAt: new Date().toISOString(),
      };

      // Restore saved progress if available
      if (savedState) {
        const restoredWords = new Set(savedState.guessedWords ?? []);

        // Re-apply all previous guesses to reveal correct tokens
        let restoredTokens = [...tokens];
        for (const word of restoredWords) {
          const result = processGuess(word, {
            invertedIndex,
            guessedWords: new Set<string>(),
            puzzle,
            language,
          });
          restoredTokens = applyReveal(restoredTokens, result.revealedIds);
        }

        const revealedCount = restoredTokens.filter(
          (t) => t.revealed && !t.isStopWord && !t.isPunctuation && !t.isWhitespace
        ).length;

        nextState = {
          ...nextState,
          tokens: restoredTokens,
          guessedWords: restoredWords,
          revealedCount,
          hintsUsed: savedState.hintsUsed ?? [],
          solved: savedState.solved ?? false,
          almostSolved: savedState.almostSolved ?? false,
          guessHistory: savedState.guessHistory ?? [],
          language: savedState.language ?? language,
          startedAt: savedState.startedAt ?? nextState.startedAt,
          solvedAt: savedState.solvedAt ?? null,
        };
      }

      return nextState;
    }

    case 'SUBMIT_GUESS': {
      if (state.solved || !state.puzzle) return state;

      const rawInput = action.payload;
      const normalizedInput = rawInput.trim().toLowerCase().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');

      // Ignore empty or duplicate guesses
      if (!normalizedInput || state.guessedWords.has(normalizedInput)) {
        return state;
      }

      const result = processGuess(rawInput, state);

      // Update tokens
      const newTokens = applyReveal(state.tokens, result.revealedIds);

      // Update guess set
      const newGuessedWords = new Set(state.guessedWords);
      newGuessedWords.add(normalizedInput);

      // Add to history
      const historyEntry = {
        word: rawInput.trim(),
        normalizedWord: normalizedInput,
        revealCount: result.revealCount,
        isTitle: result.isTitle,
        isAlternate: result.isAlternate,
        timestamp: Date.now(),
      };

      // Compute new revealed count
      const newRevealedCount = newTokens.filter(
        (t) => t.revealed && !t.isStopWord && !t.isPunctuation && !t.isWhitespace
      ).length;

      return {
        ...state,
        tokens: newTokens,
        guessedWords: newGuessedWords,
        revealedCount: newRevealedCount,
        solved: result.isTitle,
        almostSolved: state.almostSolved || result.isAlternate,
        guessHistory: [...state.guessHistory, historyEntry],
        solvedAt: result.isTitle ? new Date().toISOString() : state.solvedAt,
      };
    }

    case 'USE_HINT': {
      const level = action.payload;

      // Validate: hint must be earned and not already used
      const guessCount = state.guessHistory.length;
      if (guessCount < HINT_THRESHOLDS[level] || state.hintsUsed.includes(level)) {
        return state;
      }

      const nextHintsUsed: HintLevel[] = [...state.hintsUsed, level];

      // Level 3 hint: reveal the sample sentence tokens
      if (level === 3 && state.puzzle) {
        const sampleSentence = state.puzzle.sampleSentence.toLowerCase();
        const revealedIds: number[] = [];

        for (const token of state.tokens) {
          if (!token.revealed && sampleSentence.includes(token.normalized)) {
            revealedIds.push(token.id);
          }
        }

        const newTokens = applyReveal(state.tokens, revealedIds);
        const newRevealedCount = newTokens.filter(
          (t) => t.revealed && !t.isStopWord && !t.isPunctuation && !t.isWhitespace
        ).length;

        return {
          ...state,
          hintsUsed: nextHintsUsed,
          tokens: newTokens,
          revealedCount: newRevealedCount,
        };
      }

      return { ...state, hintsUsed: nextHintsUsed };
    }

    case 'RESET_GAME': {
      return createInitialState();
    }

    default:
      return state;
  }
};

// ─────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────

export interface UseGameStateReturn {
  state: GameState;
  loadPuzzle: (puzzle: Puzzle, mode: GameState['mode'], language: 'en' | 'fr', savedState?: SerializableGameState) => void;
  submitGuess: (word: string) => void;
  useHint: (level: HintLevel) => void;
  resetGame: () => void;
}

export const useGameState = (): UseGameStateReturn => {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);

  const loadPuzzle = useCallback(
    (puzzle: Puzzle, mode: GameState['mode'], language: 'en' | 'fr', savedState?: SerializableGameState) => {
      dispatch({ type: 'LOAD_PUZZLE', payload: { puzzle, mode, language, savedState } });
    },
    []
  );

  const submitGuess = useCallback((word: string) => {
    dispatch({ type: 'SUBMIT_GUESS', payload: word });
  }, []);

  const useHint = useCallback((level: HintLevel) => {
    dispatch({ type: 'USE_HINT', payload: level });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  return { state, loadPuzzle, submitGuess, useHint, resetGame };
};
