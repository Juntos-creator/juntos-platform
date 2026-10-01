'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

type Toast = { id: number; title: string; description?: string; variant?: 'default' | 'success' | 'error' };
type Ctx = { toast: (t: Omit<Toast, 'id'>) => void };

const ToastContext = React.createContext<Ctx>({ toast: () => {} });
export const useToast = () => React.useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const toast = React.useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { ...t, id }]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'rounded-md border p-4 shadow-lg bg-white animate-in',
              t.variant === 'success' && 'border-juntos-green bg-juntos-green-50',
              t.variant === 'error' && 'border-destructive bg-red-50'
            )}
          >
            <p className="text-sm font-semibold">{t.title}</p>
            {t.description && <p className="text-xs text-muted-foreground mt-1">{t.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
