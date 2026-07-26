// src/components/ui/Toast.tsx
// Aria-live toast notification system.
// Toasts auto-dismiss after 3 seconds. Max 3 visible at once.

import { useState, useCallback, useEffect } from 'react';

export type ToastVariant = 'default' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
}

// Generate a unique ID for each toast
let counter = 0;
export const createToastId = (): string => `toast-${++counter}`;

// ── Toast variants ────────────────────────────────────────────────
const VARIANT_CLASSES: Record<ToastVariant, string> = {
  default: 'bg-[var(--color-bg-elevated,#303030)] text-[var(--color-text-primary)] border-[var(--color-border)]',
  success: 'bg-green-900/80 text-green-200 border-green-700',
  warning: 'bg-amber-900/80 text-amber-200 border-amber-600',
  error:   'bg-red-900/80 text-red-200 border-red-700',
};

// ── Single toast item ─────────────────────────────────────────────
const ToastItem = ({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`animate-slide-up flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm shadow-toast ${VARIANT_CLASSES[toast.variant]}`}
    >
      <span>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 opacity-60 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
};

// ── Toast container ───────────────────────────────────────────────
interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer = ({ toasts, onDismiss }: ToastContainerProps) => (
  <div
    aria-label="Notifications"
    className="fixed bottom-24 right-4 z-50 flex max-w-sm flex-col gap-2"
  >
    {toasts.slice(-3).map((toast) => (
      <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
    ))}
  </div>
);

// ── useToast hook ─────────────────────────────────────────────────
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = 'default') => {
    const id = createToastId();
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
};
