// src/features/game/components/PostSolveOverlay.tsx
// Shown when the player correctly guesses the article title.
// Focus-trapped modal with pull quote, share button, and article reader link.

import { useEffect, useRef } from 'react';
import type { GameState } from '@features/game/types';
import { computeScore, generateShareText } from '@features/game/utils/gameEngine';
import { useTranslation } from '@/locales/index';

interface PostSolveOverlayProps {
  state: GameState;
  onClose: () => void;
  onReadArticle: () => void;
}

export const PostSolveOverlay = ({ state, onClose, onReadArticle }: PostSolveOverlayProps) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const score = computeScore(state);
  const t = useTranslation(state.language);

  // Focus the close button when overlay opens
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Trap focus within modal and allow ESC to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleShare = async () => {
    const text = generateShareText(state);
    if (navigator.share) {
      try {
        await navigator.share({ text, title: 'Unredact' });
      } catch {
        await navigator.clipboard.writeText(text);
      }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const pullQuote = state.puzzle?.sampleSentence ?? '';
  const title = state.puzzle?.title ?? '';

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="solve-title"
      aria-describedby="solve-description"
    >
      <div className="animate-slide-up w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated,#303030)] p-8 shadow-modal">
        {/* Trophy */}
        <div className="mb-4 text-center text-5xl" aria-hidden="true">🏆</div>

        {/* Title */}
        <h2
          id="solve-title"
          className="mb-2 text-center text-2xl font-bold text-[var(--color-accent)]"
        >
          {title}
        </h2>

        {/* Pull quote */}
        {pullQuote && (
          <blockquote
            id="solve-description"
            className="mb-6 rounded-lg border-l-4 border-[var(--color-accent)] bg-[var(--color-bg-secondary)] p-4 text-sm italic text-[var(--color-text-secondary,#C8C2B6)]"
            aria-label="Sample quote from the article"
          >
            "{pullQuote}"
          </blockquote>
        )}

        {/* Score */}
        <div className="mb-6 flex justify-center gap-6 text-sm text-[var(--color-text-muted)]">
          <span>
            <strong className="text-[var(--color-text-primary)]">{score.guessCount}</strong> {t('guesses').toLowerCase()}
          </span>
          <span>
            <strong className="text-[var(--color-text-primary)]">{score.revealedPercent}%</strong> {t('revealed').toLowerCase()}
          </span>
          {score.hintsUsedCount > 0 && (
            <span>
              <strong className="text-[var(--color-text-primary)]">💡{score.hintsUsedCount}</strong> {t('hints').toLowerCase()}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onReadArticle}
            className="w-full rounded-xl bg-[var(--color-accent)] py-3 font-semibold text-[var(--color-text-inverse)] transition-all hover:brightness-110 active:scale-95"
          >
            {t('theArticleWas')}
          </button>

          <button
            onClick={() => void handleShare()}
            className="w-full rounded-xl border border-[var(--color-border)] py-3 font-semibold text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-bg-secondary)] active:scale-95"
          >
            {t('shareText')}
          </button>

          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="w-full py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            ✕ {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
