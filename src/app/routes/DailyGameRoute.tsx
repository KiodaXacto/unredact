// src/app/routes/DailyGameRoute.tsx
// Daily game route — fetches today's puzzle and renders GamePage.

import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { GamePage } from '@features/game/GamePage';
import { getDailyPuzzle } from '@services/puzzleService';
import type { Puzzle, GameState } from '@features/game/types';
import type { Settings } from '@features/settings/types';

interface OutletContext {
  settings: Settings;
  setCurrentPuzzle: (puzzle: Puzzle | null) => void;
  setGameState: (state: GameState | null) => void;
}

export const DailyGameRoute = () => {
  const { settings, setCurrentPuzzle, setGameState } = useOutletContext<OutletContext>();
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getDailyPuzzle()
      .then((p) => {
        setPuzzle(p);
        setCurrentPuzzle(p);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
      })
      .finally(() => setLoading(false));

    return () => setCurrentPuzzle(null);
  }, [setCurrentPuzzle]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
          <p className="text-sm text-[var(--color-text-muted)]">Loading today's puzzle…</p>
        </div>
      </div>
    );
  }

  if (error || !puzzle) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-4xl" aria-hidden="true">🔍</p>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
          Puzzle not found
        </h2>
        <p className="max-w-sm text-sm text-[var(--color-text-muted)]">
          {error ?? "Today's puzzle couldn't be loaded. Try refreshing the page."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-[var(--color-accent)] px-6 py-2.5 font-semibold text-[var(--color-text-inverse)] hover:brightness-110"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <GamePage
      puzzle={puzzle}
      mode="daily"
      posColorsEnabled={settings.posColorsEnabled}
      onStateChange={setGameState}
    />
  );
};
