// src/features/unlimited/UnlimitedPage.tsx
// Unlimited mode — play any puzzle with optional difficulty/category filters.

import { useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { GamePage } from '@features/game/GamePage';
import { getUnlimitedPuzzle } from '@services/puzzleService';
import type { Puzzle, GameState, UnlimitedFilters } from '@features/game/types';
import type { Settings } from '@features/settings/types';

interface OutletContext {
  settings: Settings;
  setCurrentPuzzle: (p: Puzzle | null) => void;
  setGameState: (s: GameState | null) => void;
}

export const UnlimitedPage = () => {
  const { settings, setCurrentPuzzle, setGameState } = useOutletContext<OutletContext>();
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UnlimitedFilters>({
    difficulty: 'all',
    category: 'all',
  });

  const loadPuzzle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await getUnlimitedPuzzle(filters);
      setPuzzle(p);
      setCurrentPuzzle(p);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load puzzle');
    } finally {
      setLoading(false);
    }
  }, [filters, setCurrentPuzzle]);

  const handleNewPuzzle = () => {
    setPuzzle(null);
    setCurrentPuzzle(null);
    setGameState(null);
  };

  // ── Active game view ────────────────────────────────────────────
  if (puzzle) {
    return (
      <div>
        <div className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2">
            <button
              onClick={handleNewPuzzle}
              className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              ← New Puzzle
            </button>
            <button
              onClick={() => { void loadPuzzle(); handleNewPuzzle(); }}
              className="text-sm font-medium text-[var(--color-accent)] hover:brightness-110"
            >
              Skip →
            </button>
          </div>
        </div>
        <GamePage
          puzzle={puzzle}
          mode="unlimited"
          posColorsEnabled={settings.posColorsEnabled}
          onStateChange={setGameState}
        />
      </div>
    );
  }

  // ── Puzzle picker view ──────────────────────────────────────────
  const DIFFICULTIES = [
    { value: 'all', label: 'Any' },
    { value: 'straightforward', label: '🔵 Easy' },
    { value: 'challenging', label: '🟡 Challenging' },
    { value: 'obscure', label: '🔴 Obscure' },
  ] as const;

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <div className="text-center">
        <p className="mb-2 text-4xl" aria-hidden="true">∞</p>
        <h1 className="mb-2 text-2xl font-bold text-[var(--color-text-primary)]">Unlimited Mode</h1>
        <p className="mb-8 text-sm text-[var(--color-text-muted)]">
          Play any puzzle from our archive, any time, with no limits.
        </p>
      </div>

      {/* Difficulty filter */}
      <div className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
          Difficulty
        </p>
        <div className="grid grid-cols-4 gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              onClick={() => setFilters((f) => ({ ...f, difficulty: d.value as UnlimitedFilters['difficulty'] }))}
              className={`rounded-lg border py-2 text-xs font-medium transition-all ${
                filters.difficulty === d.value
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)]/50'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Start button */}
      <button
        onClick={() => void loadPuzzle()}
        disabled={loading}
        className="w-full rounded-xl bg-[var(--color-accent)] py-4 text-lg font-bold text-[var(--color-text-inverse)] transition-all hover:brightness-110 active:scale-95 disabled:cursor-wait disabled:opacity-60"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Loading…
          </span>
        ) : (
          'Start Random Puzzle'
        )}
      </button>
    </main>
  );
};
