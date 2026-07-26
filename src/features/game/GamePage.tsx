// src/features/game/GamePage.tsx
// Main game page — assembles all game components and manages the game lifecycle.

import { useEffect, useState, useCallback } from 'react';
import type { Puzzle, GameState } from '@features/game/types';
import { useGameState } from '@features/game/hooks/useGameState';
import { computeScore, serializeState, normalizeWord } from '@features/game/utils/gameEngine';
import { ArticleRenderer } from '@features/game/components/ArticleRenderer';
import { TokenSpan } from '@features/game/components/TokenSpan';
import { isStopWord } from '@data/stopWords';
import { GuessInput } from '@features/game/components/GuessInput';
import { GuessHistory } from '@features/game/components/GuessHistory';
import { HintPanel } from '@features/game/components/HintPanel';
import { PostSolveOverlay } from '@features/game/components/PostSolveOverlay';
import { ToastContainer, useToast } from '@components/ui/Toast';
import {
  saveDailyProgress,
  loadDailyProgress,
  saveStats,
  loadStats,
} from '@services/storageService';
import { getTodayId } from '@services/puzzleService';

interface GamePageProps {
  puzzle: Puzzle;
  mode: 'daily' | 'archive' | 'unlimited';
  posColorsEnabled: boolean;
  onStateChange?: (state: GameState) => void;
}

export const GamePage = ({ puzzle, mode, posColorsEnabled, onStateChange }: GamePageProps) => {
  const { state, loadPuzzle, submitGuess, useHint } = useGameState();
  const { toasts, addToast, dismissToast } = useToast();
  const [showOverlay, setShowOverlay] = useState(false);
  const [articleReader, setArticleReader] = useState(false);
  const [previousGuessCount, setPreviousGuessCount] = useState(0);

  // Notify parent of state changes (for stats modal)
  useEffect(() => {
    if (onStateChange) onStateChange(state);
  }, [state, onStateChange]);

  // Load puzzle on mount (or when puzzle changes)
  useEffect(() => {
    const savedState = mode === 'daily' ? loadDailyProgress(puzzle.id) : null;
    loadPuzzle(puzzle, mode, savedState ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle.id, mode]);

  // Show post-solve overlay when solved
  useEffect(() => {
    if (state.solved && !showOverlay && !articleReader) {
      // Small delay so the last token reveal animates first
      const timer = setTimeout(() => setShowOverlay(true), 600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [state.solved, showOverlay, articleReader]);

  // Persist progress after every guess (daily mode only)
  useEffect(() => {
    if (mode === 'daily' && state.puzzle && state.guessHistory.length > 0) {
      const serialized = serializeState(state);
      if (serialized) saveDailyProgress(puzzle.id, serialized);
    }
  }, [state.guessHistory.length, mode, puzzle.id, state]);

  // Update statistics when solved
  useEffect(() => {
    if (state.solved && mode === 'daily') {
      const stats = loadStats();
      const today = getTodayId();
      const score = computeScore(state);

      const lastDate = stats.lastPlayedDate;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const isStreakContinued = lastDate === yesterdayStr;
      const newStreak = isStreakContinued ? stats.currentStreak + 1 : 1;

      saveStats({
        ...stats,
        gamesPlayed: stats.gamesPlayed + 1,
        gamesWon: stats.gamesWon + 1,
        currentStreak: newStreak,
        bestStreak: Math.max(stats.bestStreak, newStreak),
        lastPlayedDate: today,
        history: [
          ...stats.history,
          {
            date: today,
            puzzleId: puzzle.id,
            guessCount: score.guessCount,
            revealedPercent: score.revealedPercent,
            hintsUsed: score.hintsUsedCount,
            solved: true,
            durationMs: state.startedAt
              ? Date.now() - new Date(state.startedAt).getTime()
              : 0,
          },
        ],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.solved]);

  // Show toasts for guess results
  useEffect(() => {
    const history = state.guessHistory;
    if (history.length === 0 || history.length === previousGuessCount) return;
    setPreviousGuessCount(history.length);

    const latest = history[history.length - 1];
    if (latest.isTitle) {
      addToast(`🏆 Solved! The article is: ${state.puzzle?.title || latest.word}`, 'success');
    } else if (latest.isAlternate) {
      addToast(`🎯 Almost! You've found the subject. Try the full title.`, 'warning');
    } else if (latest.revealCount > 0) {
      addToast(`✓ "${latest.word}" revealed ×${latest.revealCount}`, 'success');
    }
    // No toast for misses — too noisy
  }, [state.guessHistory.length, state.guessHistory, previousGuessCount, addToast]);

  const score = computeScore(state);
  const lastGuess = state.guessHistory[state.guessHistory.length - 1] ?? null;

  const handleReadArticle = useCallback(() => {
    setShowOverlay(false);
    setArticleReader(true);
  }, []);

  if (state.tokens.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-[var(--color-text-muted)]">Loading puzzle…</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Main content */}
      <main className="mx-auto max-w-3xl px-4 pb-32 pt-6">
        {/* Hint panel (Lumen) */}
        {state.puzzle && (
          <HintPanel
            guessCount={state.guessHistory.length}
            hintsUsed={state.hintsUsed}
            puzzle={state.puzzle}
            onUseHint={useHint}
          />
        )}

        {/* Title */}
        {state.puzzle && (
          <h1 className="mb-8 mt-4 text-4xl font-serif font-bold text-center leading-relaxed text-[var(--color-text-primary)]">
            {[...state.puzzle.title.matchAll(/([a-zA-Z0-9À-ÿ-]+)|([^a-zA-Z0-9À-ÿ-]+)/g)].map((match, i) => {
              const text = match[0];
              const isWhitespace = /^\s+$/.test(text);
              const isPunctuation = !isWhitespace && /^[^a-zA-Z0-9À-ÿ]+$/.test(text);
              const isStop = isWhitespace || isPunctuation ? false : isStopWord(text);
              
              let revealed = state.solved || isWhitespace || isPunctuation || isStop;
              if (!revealed) {
                revealed = state.guessedWords.has(normalizeWord(text));
              }

              return (
                <TokenSpan
                  key={`title-${i}`}
                  id={-(i + 1)}
                  text={text}
                  pos="NNP"
                  isStopWord={isStop}
                  isPunctuation={isPunctuation}
                  isWhitespace={isWhitespace}
                  isParagraphBreak={false}
                  revealed={revealed}
                  posColorsEnabled={posColorsEnabled}
                />
              );
            })}
          </h1>
        )}

        {/* Article */}
        <ArticleRenderer
          tokens={state.tokens}
          posColorsEnabled={posColorsEnabled}
        />

        {/* Guess history */}
        <div className="mt-8">
          <GuessHistory history={state.guessHistory} />
        </div>
      </main>

      {/* Fixed guess input bar */}
      <GuessInput
        onGuess={submitGuess}
        lastGuess={lastGuess}
        guessCount={score.guessCount}
        revealedPercent={score.revealedPercent}
        solved={state.solved}
      />

      {/* Post-solve overlay */}
      {showOverlay && state.solved && (
        <PostSolveOverlay
          state={state}
          onClose={() => setShowOverlay(false)}
          onReadArticle={handleReadArticle}
        />
      )}

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
