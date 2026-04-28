// 全局 Toast 通知
import { useState, useCallback, createContext, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastCtx {
  toast: (type: ToastType, message: string) => void;
}

const Ctx = createContext<ToastCtx>({ toast: () => {} });
export const useToast = () => useContext(Ctx);

let _id = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = ++_id;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<Partial<Toast>>).detail;
      if (!detail?.message) return;
      toast(detail.type ?? 'info', detail.message);
    };

    const handleBuilderWarning = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      toast('info', detail?.message || '远程保存失败，项目已保存到本地草稿');
    };

    window.addEventListener('hubos:toast', handleToast);
    window.addEventListener('builder:save-warning', handleBuilderWarning);
    return () => {
      window.removeEventListener('hubos:toast', handleToast);
      window.removeEventListener('builder:save-warning', handleBuilderWarning);
    };
  }, [toast]);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const iconMap = { success: CheckCircle2, error: AlertTriangle, info: Info };
  const colorMap = {
    success: 'bg-success-green/10 text-success-green border-success-green/20',
    error: 'bg-red-50 text-red-600 border-red-200',
    info: 'bg-terracotta/10 text-terracotta border-terracotta/20',
  };

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = iconMap[t.type];
            return (
              <motion.div
                key={t.id}
                className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium ${colorMap[t.type]}`}
                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                transition={{ duration: 0.25 }}
              >
                <Icon size={16} />
                <span className="flex-1">{t.message}</span>
                <button onClick={() => dismiss(t.id)} className="p-0.5 opacity-60 hover:opacity-100">
                  <X size={12} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
