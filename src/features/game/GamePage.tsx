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

import type { Settings } from '@features/settings/types';
import { useTranslation } from '@/locales/index';

interface GamePageProps {
  puzzle: Puzzle;
  mode: 'daily' | 'archive' | 'unlimited';
  settings: Settings;
  onStateChange?: (state: GameState) => void;
}

export const GamePage = ({ puzzle, mode, settings, onStateChange }: GamePageProps) => {
  const { state, loadPuzzle, submitGuess, useHint } = useGameState();
  const { toasts, addToast, dismissToast } = useToast();
  const [showOverlay, setShowOverlay] = useState(false);
  const [articleReader, setArticleReader] = useState(false);
  const [previousGuessCount, setPreviousGuessCount] = useState(0);
  const t = useTranslation(settings.language);

  // Notify parent of state changes (for stats modal)
  useEffect(() => {
    if (onStateChange) onStateChange(state);
  }, [state, onStateChange]);

  // Load puzzle on mount (or when puzzle changes)
  useEffect(() => {
    const savedState = mode === 'daily' ? loadDailyProgress(puzzle.id, settings.language) : null;
    loadPuzzle(puzzle, mode, settings.language, savedState ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle.id, mode, settings.language]);

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
      if (serialized) saveDailyProgress(puzzle.id, serialized, settings.language);
    }
  }, [state.guessHistory.length, mode, puzzle.id, state, settings.language]);

  // Update statistics when solved
  useEffect(() => {
    if (state.solved && mode === 'daily') {
      const stats = loadStats(settings.language);
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
      }, settings.language);
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
      addToast(t('solvedToast', { title: state.puzzle?.title || latest.word }), 'success');
    } else if (latest.isAlternate) {
      addToast(t('alternateToast'), 'warning');
    } else if (latest.revealCount > 0) {
      addToast(t('revealToast', { word: latest.word, count: latest.revealCount }), 'success');
    }
    // No toast for misses — too noisy
  }, [state.guessHistory.length, state.guessHistory, previousGuessCount, addToast, state.puzzle?.title, t]);

  const score = computeScore(state);
  const lastGuess = state.guessHistory[state.guessHistory.length - 1] ?? null;

  const handleReadArticle = useCallback(() => {
    setShowOverlay(false);
    setArticleReader(true);
  }, []);

  if (state.tokens.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-[var(--color-text-muted)]">{t('loadingPuzzle')}</div>
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
            guessCount={score.guessCount}
            hintsUsed={state.hintsUsed}
            puzzle={puzzle}
            onUseHint={useHint}
            language={settings.language}
          />
        )}

        {/* Title */}
        {state.puzzle && (
          <h1 className="mb-8 mt-4 text-4xl font-serif font-bold text-center leading-relaxed text-[var(--color-text-primary)]">
            {[...state.puzzle.title.matchAll(/([a-zA-Z0-9À-ÿ-]+)|([^a-zA-Z0-9À-ÿ-]+)/g)].map((match, i) => {
              const text = match[0];
              const isWhitespace = /^\s+$/.test(text);
              const isPunctuation = !isWhitespace && /^[^a-zA-Z0-9À-ÿ]+$/.test(text);
              const isStop = isWhitespace || isPunctuation ? false : isStopWord(text, settings.language);
              
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
                  posColorsEnabled={settings.posColorsEnabled}
                />
              );
            })}
          </h1>
        )}

        {/* Article */}
        <ArticleRenderer
          tokens={state.tokens}
          posColorsEnabled={settings.posColorsEnabled}
        />

        {/* Guess history */}
        <div className="mt-8">
          <GuessHistory history={state.guessHistory} language={settings.language} />
        </div>
      </main>

      {/* Fixed guess input bar */}
      <GuessInput
        onGuess={submitGuess}
        lastGuess={lastGuess}
        guessCount={score.guessCount}
        revealedPercent={score.revealedPercent}
        solved={state.solved}
        language={settings.language}
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
