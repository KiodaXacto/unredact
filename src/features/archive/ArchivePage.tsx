// src/features/archive/ArchivePage.tsx
// Archive mode — browse and play past daily puzzles.

import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ArchiveCalendar } from '@features/archive/components/ArchiveCalendar';
import { GamePage } from '@features/game/GamePage';
import { getArchiveIndex, getPuzzleById } from '@services/puzzleService';
import { loadArchivePlayed, markArchivePlayed } from '@services/storageService';
import type { ArchiveEntry } from '@features/archive/types';
import type { Puzzle, GameState } from '@features/game/types';
import type { Settings } from '@features/settings/types';
import { useTranslation } from '@/locales/index';

interface OutletContext {
  settings: Settings;
  setCurrentPuzzle: (p: Puzzle | null) => void;
  setGameState: (s: GameState | null) => void;
}

export const ArchivePage = () => {
  const { settings, setCurrentPuzzle, setGameState } = useOutletContext<OutletContext>();
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [played, setPlayed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedPuzzle, setSelectedPuzzle] = useState<Puzzle | null>(null);
  const [loadingPuzzle, setLoadingPuzzle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslation(settings.language);

  useEffect(() => {
    getArchiveIndex()
      .then((data) => {
        setEntries(data);
        setPlayed(loadArchivePlayed());
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load archive');
      })
      .finally(() => setLoading(false));

    return () => {
      setCurrentPuzzle(null);
      setGameState(null);
    };
  }, [setCurrentPuzzle, setGameState]);

  useEffect(() => {
    if (selectedPuzzle) {
      setLoadingPuzzle(true);
      getPuzzleById(selectedPuzzle.id, settings.language)
        .then((puzzle) => {
          setSelectedPuzzle(puzzle);
          setCurrentPuzzle(puzzle);
        })
        .finally(() => setLoadingPuzzle(false));
    }
  }, [settings.language]); // Intentionally omitting selectedPuzzle and setCurrentPuzzle to only trigger on language change

  const handleSelect = async (entry: ArchiveEntry) => {
    setLoadingPuzzle(true);
    setError(null);
    try {
      const puzzle = await getPuzzleById(entry.id, settings.language);
      setSelectedPuzzle(puzzle);
      setCurrentPuzzle(puzzle);
      markArchivePlayed(entry.id);
      setPlayed((prev) => new Set([...prev, entry.id]));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load puzzle');
    } finally {
      setLoadingPuzzle(false);
    }
  };

  const handleBack = () => {
    setSelectedPuzzle(null);
    setCurrentPuzzle(null);
    setGameState(null);
  };

  // Show selected puzzle game
  if (selectedPuzzle) {
    return (
      <div>
        <div className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <div className="mx-auto max-w-3xl px-4 py-2">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              {t('backToArchive')}
            </button>
          </div>
        </div>
        <GamePage
          puzzle={selectedPuzzle}
          mode="archive"
          settings={settings}
          onStateChange={setGameState}
        />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-[var(--color-text-primary)]">{t('archive')}</h1>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        {t('archiveDesc', { fallback: 'Play any past daily puzzle at your own pace.' })}
      </p>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
        </div>
      )}

      {loadingPuzzle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && entries.length === 0 && !error && (
        <p className="text-center text-[var(--color-text-muted)]">{t('noArchivePuzzles')}</p>
      )}

      {!loading && entries.length > 0 && (
        <ArchiveCalendar
          entries={entries}
          playedIds={played}
          language={settings.language}
          onSelect={(entry) => { void handleSelect(entry); }}
        />
      )}
    </main>
  );
};
