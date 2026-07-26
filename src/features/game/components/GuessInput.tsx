// src/features/game/components/GuessInput.tsx
// Fixed input bar where the player types word guesses.
// Handles Enter key, submit button, ARIA live region announcements.

import { useState, useRef, useCallback, useId } from 'react';
import type { GuessRecord } from '@features/game/types';

interface GuessInputProps {
  onGuess: (word: string) => void;
  lastGuess: GuessRecord | null;
  guessCount: number;
  revealedPercent: number;
  solved: boolean;
  disabled?: boolean;
}

export const GuessInput = ({
  onGuess,
  lastGuess,
  guessCount,
  revealedPercent,
  solved,
  disabled = false,
}: GuessInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const announcementId = useId();

  const handleSubmit = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || solved || disabled) return;
    onGuess(trimmed);
    setInputValue('');
    // Return focus to input for fast successive guesses
    inputRef.current?.focus();
  }, [inputValue, onGuess, solved, disabled]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // Build announcement text for screen readers
  const buildAnnouncement = (): string => {
    if (!lastGuess) return '';
    if (lastGuess.isTitle) return `You solved it! The article is: ${lastGuess.word}`;
    if (lastGuess.isAlternate) return `Almost! "${lastGuess.word}" is related — try the full title.`;
    if (lastGuess.revealCount > 0)
      return `"${lastGuess.word}" revealed ${lastGuess.revealCount} word${lastGuess.revealCount === 1 ? '' : 's'}.`;
    return `"${lastGuess.word}" not found in this article.`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
      {/* Progress bar */}
      <div
        className="h-0.5 bg-[var(--color-accent)] transition-all duration-500"
        style={{ width: `${revealedPercent}%` }}
        role="progressbar"
        aria-valuenow={revealedPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${revealedPercent}% of article revealed`}
      />

      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
        {/* Guess count badge */}
        <span
          className="shrink-0 rounded-full bg-[var(--color-bg-tertiary,#2e2e2e)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text-muted)] tabular-nums"
          aria-label={`${guessCount} guesses made`}
        >
          {guessCount}
        </span>

        {/* Text input */}
        <input
          ref={inputRef}
          id="guess-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={solved || disabled}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={solved ? 'Puzzle solved! 🏆' : 'Type a word and press Enter…'}
          aria-label="Type a word to guess"
          aria-describedby={announcementId}
          className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-2.5 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none transition-colors focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-opacity-30 disabled:cursor-not-allowed disabled:opacity-50"
        />

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!inputValue.trim() || solved || disabled}
          aria-label="Submit guess"
          className="shrink-0 rounded-lg bg-[var(--color-accent)] px-5 py-2.5 font-semibold text-[var(--color-text-inverse)] transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Guess
        </button>
      </div>

      {/* ARIA live region — announces guess results to screen readers */}
      <div
        id={announcementId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {buildAnnouncement()}
      </div>
    </div>
  );
};
