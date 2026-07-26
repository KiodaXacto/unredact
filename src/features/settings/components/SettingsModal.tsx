// src/features/settings/components/SettingsModal.tsx
// Settings modal — theme, font size, POS colors, high contrast.

import { Modal } from '@components/ui/Modal';
import type { Settings, Theme, FontSize } from '@features/settings/types';

interface SettingsModalProps {
  settings: Settings;
  onUpdate: (partial: Partial<Settings>) => void;
  onReset: () => void;
  onClose: () => void;
}

// ── Sub-components ─────────────────────────────────────────────────

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
    {children}
  </p>
);

const ToggleRow = ({
  label,
  description,
  checked,
  onChange,
  id,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  id: string;
}) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <label htmlFor={id} className="text-sm font-medium text-[var(--color-text-primary)]">
        {label}
      </label>
      {description && (
        <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
      )}
    </div>
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 flex-shrink-0 rounded-full border-2 transition-colors focus-visible:outline-[var(--color-accent)] ${
        checked
          ? 'border-[var(--color-accent)] bg-[var(--color-accent)]'
          : 'border-[var(--color-border)] bg-[var(--color-bg-tertiary,#2e2e2e)]'
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
        aria-hidden="true"
      />
    </button>
  </div>
);

interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (val: T) => void;
  name: string;
}

const SegmentedControl = <T extends string>({
  label,
  value,
  options,
  onChange,
  name,
}: SegmentedControlProps<T>) => (
  <div>
    <SectionLabel>{label}</SectionLabel>
    <div
      role="radiogroup"
      aria-label={label}
      className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-1"
    >
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`flex-1 cursor-pointer rounded-md py-1.5 text-center text-sm font-medium transition-colors ${
            value === opt.value
              ? 'bg-[var(--color-accent)] text-[var(--color-text-inverse)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="sr-only"
          />
          {opt.label}
        </label>
      ))}
    </div>
  </div>
);

// ── Main component ─────────────────────────────────────────────────

export const SettingsModal = ({
  settings,
  onUpdate,
  onReset,
  onClose,
}: SettingsModalProps) => (
  <Modal id="settings" title="Settings" onClose={onClose}>
    <div className="flex flex-col gap-6">
      {/* Theme */}
      <SegmentedControl<Theme>
        label="Theme"
        name="theme"
        value={settings.theme}
        onChange={(val) => onUpdate({ theme: val })}
        options={[
          { value: 'dark', label: '🌙 Dark' },
          { value: 'light', label: '☀️ Light' },
          { value: 'system', label: '🖥 System' },
        ]}
      />

      {/* Font size */}
      <SegmentedControl<FontSize>
        label="Font Size"
        name="font-size"
        value={settings.fontSize}
        onChange={(val) => onUpdate({ fontSize: val })}
        options={[
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' },
        ]}
      />

      {/* Toggles */}
      <div className="flex flex-col gap-4">
        <SectionLabel>Features</SectionLabel>

        <ToggleRow
          id="toggle-pos-colors"
          label="Part-of-Speech Colors"
          description="Color code nouns, verbs, adjectives, and numbers"
          checked={settings.posColorsEnabled}
          onChange={(val) => onUpdate({ posColorsEnabled: val })}
        />

        <ToggleRow
          id="toggle-high-contrast"
          label="High Contrast"
          description="Improve readability for low-vision users"
          checked={settings.highContrastEnabled}
          onChange={(val) => onUpdate({ highContrastEnabled: val })}
        />
      </div>

      {/* Reset */}
      <div className="border-t border-[var(--color-border)] pt-4">
        <button
          onClick={onReset}
          className="w-full rounded-lg py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:text-red-400"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  </Modal>
);
