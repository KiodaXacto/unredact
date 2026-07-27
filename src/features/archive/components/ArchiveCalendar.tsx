// src/features/archive/components/ArchiveCalendar.tsx
// Grid view of all past puzzles with difficulty badges and played status.

import type { ArchiveEntry } from '@features/archive/types';
import { useTranslation } from '@/locales/index';
import type { Language } from '@/locales/index';

interface ArchiveCalendarProps {
  entries: ArchiveEntry[];
  playedIds: Set<string>;
  language: Language;
  onSelect: (entry: ArchiveEntry) => void;
}

const DIFFICULTY_STYLE: Record<string, string> = {
  straightforward: 'border-blue-500/40  bg-blue-500/10  text-blue-300',
  challenging:     'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
  obscure:         'border-red-500/40    bg-red-500/10    text-red-300',
};

const DIFFICULTY_EMOJI: Record<string, string> = {
  straightforward: '🔵',
  challenging:     '🟡',
  obscure:         '🔴',
};

const formatDate = (id: string, language: string): string => {
  const d = new Date(id + 'T00:00:00');
  return d.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const ArchiveCalendar = ({ entries, playedIds, language, onSelect }: ArchiveCalendarProps) => {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const t = useTranslation(language);

  return (
    <div
      className="grid gap-3 sm:grid-cols-2"
      role="list"
      aria-label="Past puzzles"
    >
      {sorted.map((entry) => {
        const played = playedIds.has(entry.id);
        return (
          <button
            key={entry.id}
            role="listitem"
            onClick={() => onSelect(entry)}
            className={`group flex items-center justify-between rounded-xl border p-4 text-left transition-all hover:brightness-110 active:scale-98 ${
              DIFFICULTY_STYLE[entry.difficulty] ?? 'border-[var(--color-border)] bg-[var(--color-bg-secondary)]'
            }`}
            aria-label={`${formatDate(entry.id, language)} puzzle — ${entry.difficulty}${played ? ' (completed)' : ''}`}
          >
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {formatDate(entry.id, language)}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <span>{DIFFICULTY_EMOJI[entry.difficulty]}</span>
                <span className="capitalize">{
                  entry.difficulty === 'straightforward' 
                    ? t('difficultyEasy') 
                    : t(`difficulty${entry.difficulty.charAt(0).toUpperCase() + entry.difficulty.slice(1)}`)
                }</span>
                <span>·</span>
                <span>~{entry.wordCount} {t('words', { fallback: 'words' })}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {played && (
                <span
                  className="text-lg"
                  aria-label="Completed"
                  title="Completed"
                >
                  ✓
                </span>
              )}
              <svg
                width="16" height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="opacity-40 group-hover:opacity-80 transition-opacity"
                aria-hidden="true"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </button>
        );
      })}
    </div>
  );
};
