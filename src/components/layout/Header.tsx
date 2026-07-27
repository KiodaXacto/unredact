// src/components/layout/Header.tsx
// Top navigation bar — logo, date, difficulty badge, theme toggle, menu.

import { useState } from 'react';
import type { Puzzle } from '@features/game/types';
import type { Settings } from '@features/settings/types';
import { useTranslation } from '@/locales/index';

interface HeaderProps {
  puzzle: Puzzle | null;
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
  onOpenSettings: () => void;
  onOpenStats: () => void;
  onOpenArchive: () => void;
  onOpenUnlimited: () => void;
}

const DIFFICULTY_BADGE: Record<string, { labelKey: string; color: string; emoji: string }> = {
  straightforward: { labelKey: 'difficultyEasy',       color: 'bg-blue-500/20 text-blue-300 border-blue-500/40',   emoji: '🔵' },
  challenging:     { labelKey: 'difficultyChallenging', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', emoji: '🟡' },
  obscure:         { labelKey: 'difficultyObscure',     color: 'bg-red-500/20 text-red-300 border-red-500/40',     emoji: '🔴' },
};

export const Header = ({
  puzzle,
  settings,
  updateSettings,
  onOpenSettings,
  onOpenStats,
  onOpenArchive,
  onOpenUnlimited,
}: HeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslation(settings.language);

  const badge = puzzle ? DIFFICULTY_BADGE[puzzle.difficulty] : null;

  const formattedDate = puzzle
    ? new Date(puzzle.id + 'T00:00:00').toLocaleDateString(settings.language === 'fr' ? 'fr-FR' : 'en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        {/* Hamburger menu */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="nav-menu"
          className="rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] focus-visible:outline-[var(--color-accent)]"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Title + date + badge */}
        <div className="flex flex-col items-center gap-0.5">
          <h1 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
            Unredact
          </h1>
          {formattedDate && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--color-text-muted)]">{formattedDate}</span>
              {badge && (
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-medium ${badge.color}`}
                  aria-label={`${t('difficulty')}: ${t(badge.labelKey as any)}`}
                >
                  {badge.emoji} {t(badge.labelKey as any)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right side: Lang + Stats */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={() => updateSettings({ language: settings.language === 'en' ? 'fr' : 'en' })}
            aria-label="Toggle language"
            className="rounded px-2 py-1 text-sm font-bold text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] focus-visible:outline-[var(--color-accent)] uppercase"
          >
            {settings.language}
          </button>

          {/* Stats button */}
          <button
            onClick={onOpenStats}
            aria-label="View statistics"
            className="rounded p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] focus-visible:outline-[var(--color-accent)]"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6"  y1="20" x2="6"  y2="14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Dropdown navigation menu */}
      {menuOpen && (
        <nav
          id="nav-menu"
          className="absolute left-0 right-0 top-full z-40 animate-slide-down border-b border-[var(--color-border)] bg-[var(--color-bg-elevated,#303030)] shadow-modal"
        >
          <ul className="divide-y divide-[var(--color-border)]">
            {[
              { label: `📅 ${t('archive')}`, action: onOpenArchive },
              { label: `∞  ${t('unlimited')}`, action: onOpenUnlimited },
              { label: `⚙️  ${t('settings')}`, action: onOpenSettings },
            ].map(({ label, action }) => (
              <li key={label}>
                <button
                  onClick={() => { action(); setMenuOpen(false); }}
                  className="w-full px-6 py-3 text-left text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] focus-visible:outline-[var(--color-accent)]"
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
};
