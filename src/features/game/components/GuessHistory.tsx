// src/features/game/components/GuessHistory.tsx
// Scrollable list of all guesses with reveal counts and colour coding.
// Uses CSS contain: content for performance with long lists.

import type { GuessRecord } from '@features/game/types';
import { useTranslation } from '@/locales/index';

interface GuessHistoryProps {
  history: GuessRecord[];
  language: 'en' | 'fr';
}

const getRowStyle = (entry: GuessRecord): string => {
  if (entry.isTitle)       return 'text-yellow-400 font-semibold';
  if (entry.revealCount > 0) return 'text-green-400';
  return 'text-[var(--color-text-muted)]';
};

const getIcon = (entry: GuessRecord): string => {
  if (entry.isTitle)         return '🏆';
  if (entry.isAlternate)     return '🎯';
  if (entry.revealCount > 0) return '🟩';
  return '⬛';
};

export const GuessHistory = ({ history, language }: GuessHistoryProps) => {
  const t = useTranslation(language);

  if (history.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 text-center text-sm text-[var(--color-text-muted)]">
        {t('noGuessesYet')}
      </div>
    );
  }

  // Show most recent guesses at the top
  const reversed = [...history].reverse();

  return (
    <div
      className="guess-list max-h-64 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]"
      aria-label={`Guess history — ${history.length} guesses made`}
      role="log"
      aria-live="polite"
    >
      <ul className="divide-y divide-[var(--color-border)]">
        {reversed.map((entry) => (
          <li
            key={`${entry.normalizedWord}-${entry.timestamp}`}
            className={`flex items-center justify-between px-4 py-2 text-sm ${getRowStyle(entry)}`}
          >
            <span className="flex items-center gap-2">
              <span aria-hidden="true">{getIcon(entry)}</span>
              <span className="font-medium">{entry.word}</span>
              {entry.isAlternate && (
                <span className="text-xs text-amber-400">({t('closeGuess')})</span>
              )}
            </span>

            <span className="tabular-nums text-xs">
              {entry.isTitle
                ? t('solvedLabel')
                : entry.revealCount > 0
                ? `×${entry.revealCount}`
                : t('notFoundLabel')}
            </span>
          </li>
        ))}
      </ul>

      {history.length > 0 && (
        <div className="border-t border-[var(--color-border)] px-4 py-2 text-xs text-[var(--color-text-muted)]">
          {t('guessesTotal', { count: history.length, plural: history.length === 1 ? '' : 's' })}
        </div>
      )}
    </div>
  );
};
