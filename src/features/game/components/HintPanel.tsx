// src/features/game/components/HintPanel.tsx
// Lumen hint system — three escalating hints that unlock after guess thresholds.

import type { HintLevel } from '@features/game/types';
import { getAvailableHints, HINT_THRESHOLDS } from '@features/game/utils/gameEngine';
import { useTranslation } from '@/locales/index';

interface HintPanelProps {
  guessCount: number;
  hintsUsed: HintLevel[];
  puzzle: {
    firstLetter: string;
    category: string;
    sampleSentence: string;
    difficulty: string;
  };
  onUseHint: (level: HintLevel) => void;
  language: 'en' | 'fr';
}

const HINT_META: Record<HintLevel, { label: string; icon: string; description: string }> = {
  1: { label: 'First Letter', icon: '🔡', description: 'Reveal the first letter of the title' },
  2: { label: 'Category',     icon: '🗂',  description: 'Reveal the article category' },
  3: { label: 'Sample Sentence', icon: '💬', description: 'Reveal a sentence from the article' },
};

export const HintPanel = ({
  guessCount,
  hintsUsed,
  puzzle,
  onUseHint,
  language,
}: HintPanelProps) => {
  const t = useTranslation(language);
  const allLevels: HintLevel[] = [1, 2, 3];
  const available = getAvailableHints(guessCount, hintsUsed);

  // Don't render if no hints are available or used
  const hasAny = available.length > 0 || hintsUsed.length > 0;
  if (!hasAny) return null;

  const getHintContent = (level: HintLevel): string => {
    if (!hintsUsed.includes(level)) return '';
    if (level === 1) return `${t('hintLevel1')}: ${puzzle.firstLetter.toUpperCase()}`;
    if (level === 2) return `${t('hintLevel2')}: ${puzzle.category}`;
    if (level === 3) return puzzle.sampleSentence;
    return '';
  };

  return (
    <div
      className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"
      aria-label="Hint panel — Lumen"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg" aria-hidden="true">💡</span>
        <span className="text-sm font-semibold text-amber-400">Lumen {t('hints')}</span>
        <span className="ml-auto text-xs text-[var(--color-text-muted)]">
          {hintsUsed.length}/3 {t('hintLevelUsed').toLowerCase()}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {allLevels.map((level) => {
          const meta = HINT_META[level];
          const isUsed = hintsUsed.includes(level);
          const isAvailable = available.includes(level);
          const isLocked = !isUsed && !isAvailable;
          const content = getHintContent(level);

          return (
            <div
              key={level}
              className={`rounded-lg border p-3 transition-colors ${
                isUsed
                  ? 'border-amber-500/40 bg-amber-500/10'
                  : isAvailable
                  ? 'border-amber-500/30 bg-[var(--color-bg-secondary)]'
                  : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] opacity-50'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true">{meta.icon}</span>
                  <div>
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      {t(`hintLevel${level}` as any)}
                    </span>
                    {isLocked && (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {t('hintUnlock', { count: HINT_THRESHOLDS[level] })}
                      </p>
                    )}
                  </div>
                </div>

                {isAvailable && (
                  <button
                    onClick={() => onUseHint(level)}
                    className="shrink-0 rounded-lg bg-amber-500 px-3 py-1 text-xs font-semibold text-white transition-all hover:bg-amber-400 active:scale-95"
                    aria-label={`Use hint: ${meta.label}`}
                  >
                    {t('hintLevelUsed')}
                  </button>
                )}

                {isUsed && (
                  <span className="text-xs text-amber-400">{t('hintLevelUsed')}</span>
                )}
              </div>

              {/* Revealed hint content */}
              {content && (
                <p className="mt-2 text-sm text-amber-200 italic">
                  {content}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
