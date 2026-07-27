// src/features/statistics/components/StatsModal.tsx
// Displays player's all-time statistics and today's result.

import { Modal } from '@components/ui/Modal';
import type { Statistics } from '@features/statistics/types';
import type { GameState } from '@features/game/types';
import { useTranslation } from '@/locales/index';
import { computeScore, generateShareText } from '@features/game/utils/gameEngine';

interface StatsModalProps {
  stats: Statistics;
  currentGameState: GameState;
  onClose: () => void;
}

const StatCard = ({ value, label }: { value: string | number; label: string }) => (
  <div className="flex flex-col items-center gap-1 rounded-xl bg-[var(--color-bg-secondary)] px-4 py-4">
    <span className="text-3xl font-bold tabular-nums text-[var(--color-accent)]">
      {value}
    </span>
    <span className="text-center text-xs text-[var(--color-text-muted)] leading-tight">
      {label}
    </span>
  </div>
);

const WinRateBar = ({ rate }: { rate: number }) => (
  <div>
    <div className="mb-1 flex justify-between text-xs text-[var(--color-text-muted)]">
      <span>Win rate</span>
      <span className="font-semibold text-[var(--color-text-primary)]">{rate}%</span>
    </div>
    <div
      className="h-2 overflow-hidden rounded-full bg-[var(--color-bg-secondary)]"
      role="progressbar"
      aria-valuenow={rate}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Win rate: ${rate}%`}
    >
      <div
        className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-700"
        style={{ width: `${rate}%` }}
      />
    </div>
  </div>
);

export const StatsModal = ({ stats, currentGameState, onClose }: StatsModalProps) => {
  const winRate = stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0;

  const t = useTranslation(currentGameState.language);
  const score = computeScore(currentGameState);

  const handleShare = async () => {
    const text = generateShareText(currentGameState);
    try {
      if (navigator.share) {
        await navigator.share({ text, title: 'Unredact' });
      } else {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // User cancelled share — ignore
    }
  };

  return (
    <Modal id="stats" title={t('statsTitle')} onClose={onClose} closeLabel={t('closeLabel')}>
      <div className="flex flex-col gap-6">
        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2">
          <StatCard value={stats.gamesPlayed} label={t('gamesPlayed')} />
          <StatCard value={stats.gamesWon} label={t('gamesWon')} />
          <StatCard value={stats.currentStreak} label={`🔥 ${t('currentStreak')}`} />
          <StatCard value={stats.bestStreak} label={t('bestStreak')} />
        </div>

        {/* Win rate bar */}
        <WinRateBar rate={winRate} />

        {/* Today's result (if solved) */}
        {currentGameState.solved && (
          <div className="rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 p-4">
            <div className="flex gap-4 text-sm">
              <span>
                <strong className="text-[var(--color-text-primary)]">{score.guessCount}</strong>{' '}
                <span className="text-[var(--color-text-muted)]">{t('guesses').toLowerCase()}</span>
              </span>
              <span>
                <strong className="text-[var(--color-text-primary)]">{score.revealedPercent}%</strong>{' '}
                <span className="text-[var(--color-text-muted)]">{t('revealed').toLowerCase()}</span>
              </span>
              {score.hintsUsedCount > 0 && (
                <span>
                  <strong className="text-[var(--color-text-primary)]">💡{score.hintsUsedCount}</strong>{' '}
                  <span className="text-[var(--color-text-muted)]">{t('hints').toLowerCase()}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Share button */}
        {currentGameState.solved && (
          <button
            onClick={() => void handleShare()}
            className="w-full rounded-xl bg-[var(--color-accent)] py-3 font-semibold text-[var(--color-text-inverse)] transition-all hover:brightness-110 active:scale-95"
          >
            {t('shareText')}
          </button>
        )}

        {/* No games yet placeholder */}
        {stats.gamesPlayed === 0 && (
          <p className="text-center text-sm text-[var(--color-text-muted)]">
            {t('noStats')}
          </p>
        )}
      </div>
    </Modal>
  );
};
