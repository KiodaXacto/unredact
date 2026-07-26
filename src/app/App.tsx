// src/app/App.tsx
// Root application component — owns settings state and modal orchestration.

import { useState, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Header } from '@components/layout/Header';
import { SettingsModal } from '@features/settings/components/SettingsModal';
import { StatsModal } from '@features/statistics/components/StatsModal';
import { useSettings } from '@features/settings/hooks/useSettings';
import { loadStats } from '@services/storageService';
import type { Puzzle, GameState } from '@features/game/types';

type ActiveModal = 'settings' | 'stats' | null;

export const App = () => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  // GameState is passed up from child routes so modals can show stats
  const [gameState, setGameState] = useState<GameState | null>(null);

  const navigate = useNavigate();

  const openModal = useCallback((modal: ActiveModal) => setActiveModal(modal), []);
  const closeModal = useCallback(() => setActiveModal(null), []);

  return (
    <div
      className={`min-h-dvh bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] ${
        settings.posColorsEnabled ? 'pos-colors-enabled' : ''
      } ${settings.highContrastEnabled ? 'high-contrast' : ''}`}
    >
      {/* ── Navigation header ───────────────────────────────────── */}
      <Header
        puzzle={currentPuzzle}
        onOpenSettings={() => openModal('settings')}
        onOpenStats={() => openModal('stats')}
        onOpenArchive={() => { void navigate('/archive'); }}
        onOpenUnlimited={() => { void navigate('/unlimited'); }}
      />

      {/* ── Page content ────────────────────────────────────────── */}
      <Outlet
        context={{
          settings,
          setCurrentPuzzle,
          setGameState,
        }}
      />

      {/* ── Settings modal ───────────────────────────────────────── */}
      {activeModal === 'settings' && (
        <SettingsModal
          settings={settings}
          onUpdate={updateSettings}
          onReset={resetSettings}
          onClose={closeModal}
        />
      )}

      {/* ── Stats modal ──────────────────────────────────────────── */}
      {activeModal === 'stats' && (
        <StatsModal
          stats={loadStats()}
          currentGameState={gameState ?? {
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
            startedAt: null,
            solvedAt: null,
          }}
          onClose={closeModal}
        />
      )}
    </div>
  );
};
