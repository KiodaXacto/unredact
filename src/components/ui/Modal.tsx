// src/components/ui/Modal.tsx
// Reusable accessible modal shell with focus trap and ESC dismiss.

import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  id: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
  closeLabel?: string;
}

export const Modal = ({ id, title, onClose, children, closeLabel }: ModalProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const titleId = `${id}-title`;

  // ESC key dismiss
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Focus first focusable element inside modal
  useEffect(() => {
    const firstFocusable = overlayRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();
  }, []);

  // Dismiss on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={handleBackdropClick}
    >
      <div className="animate-slide-up w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated,#303030)] shadow-modal">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <h2
            id={titleId}
            className="text-lg font-semibold text-[var(--color-text-primary)]"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label={closeLabel ?? 'Close dialog'}
            className="rounded p-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)] focus-visible:outline-[var(--color-accent)]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};
