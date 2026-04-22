import React, { createContext, useCallback, useContext, useState } from "react";

/*
 * Minimal toast system — provider mounts a fixed-position stack in the
 * bottom-right, exposes `useToast()` which returns helpers for the
 * three common variants. Toasts auto-dismiss after 3s by default; pass
 * a second arg to override the duration (ms), or 0 to make sticky.
 *
 *   const toast = useToast();
 *   toast.success("Saved!");
 *   toast.error("Could not save", 5000);
 */
const ToastContext = createContext(null);

let counter = 0;
const nextId = () => `t_${++counter}`;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, variant = "info", duration = 3000) => {
      const id = nextId();
      setToasts((prev) => [...prev, { id, message, variant }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const api = {
    success: (msg, d) => push(msg, "success", d),
    error: (msg, d) => push(msg, "error", d ?? 5000),
    info: (msg, d) => push(msg, "info", d),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.variant}`}>
            <span className="toast-dot" aria-hidden="true" />
            <span className="toast-message">{t.message}</span>
            <button
              type="button"
              className="toast-close"
              aria-label="Dismiss notification"
              onClick={() => dismiss(t.id)}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Graceful no-op when called outside provider (e.g. unit tests).
    return {
      success: () => {},
      error: () => {},
      info: () => {},
      dismiss: () => {},
    };
  }
  return ctx;
}
