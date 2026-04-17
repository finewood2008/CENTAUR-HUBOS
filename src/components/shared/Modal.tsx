// 通用 Modal 组件
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const widthClass = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* backdrop */}
          <motion.div
            className="absolute inset-0 bg-near-black/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          {/* panel */}
          <motion.div
            ref={ref}
            className={`relative ${widthClass} w-full bg-ivory rounded-2xl shadow-2xl border border-border-cream overflow-hidden`}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {title && (
              <div className="flex items-center justify-between px-6 pt-5 pb-2">
                <h2 className="font-serif text-lg text-near-black font-semibold">{title}</h2>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-warm-sand transition-colors text-stone-gray">
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="px-6 pb-6 pt-2">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
