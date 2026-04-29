'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within Toaster');
  return ctx;
}

const icons = {
  success: CheckCircle,
  error:   AlertCircle,
  info:    Info,
  warning: AlertTriangle,
};

const colors = {
  success: { bg: '#0d2a1a', border: '#166534', icon: '#22c55e', text: '#86efac' },
  error:   { bg: '#2a0d0d', border: '#991b1b', icon: '#ef4444', text: '#fca5a5' },
  info:    { bg: '#0d1a2a', border: '#1e40af', icon: '#3b82f6', text: '#93c5fd' },
  warning: { bg: '#2a1e0d', border: '#92400e', icon: '#f59e0b', text: '#fcd34d' },
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          maxWidth: 380,
          width: '100%',
        }}
      >
        {toasts.map((t) => {
          const Icon = icons[t.type];
          const c = colors[t.type];
          return (
            <div
              key={t.id}
              className="animate-slide-in"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: 12,
                padding: '12px 16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              <Icon size={18} color={c.icon} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ flex: 1, color: c.text, fontSize: 14, lineHeight: 1.5 }}>
                {t.message}
              </span>
              <button
                onClick={() => dismiss(t.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: c.icon, opacity: 0.6 }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
