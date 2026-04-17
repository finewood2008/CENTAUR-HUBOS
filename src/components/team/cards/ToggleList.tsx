import React from 'react';
import { motion } from 'framer-motion';
import { ToggleRight } from 'lucide-react';

interface ToggleItem {
  id: string;
  label: string;
  description?: string;
  enabled: boolean;
}

interface ToggleListProps {
  items: ToggleItem[];
  onChange: (items: ToggleItem[]) => void;
  label?: string;
}

const ToggleSwitch: React.FC<{ enabled: boolean; onToggle: () => void }> = ({
  enabled,
  onToggle,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={enabled}
    onClick={onToggle}
    className={`
      relative inline-flex h-5 w-9 shrink-0 items-center rounded-full
      transition-colors duration-200 cursor-pointer focus:outline-none
      focus-visible:ring-2 focus-visible:ring-terracotta/30
      ${enabled ? 'bg-terracotta' : 'bg-warm-sand'}
    `}
  >
    <motion.span
      layout
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`
        inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm
        ${enabled ? 'ml-[18px]' : 'ml-[3px]'}
      `}
    />
  </button>
);

const ToggleList: React.FC<ToggleListProps> = ({ items, onChange, label }) => {
  const toggleItem = (id: string) => {
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item,
      ),
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="card-glass-warm rounded-2xl p-4"
    >
      {label && (
        <div className="flex items-center gap-2 mb-3">
          <ToggleRight className="w-4 h-4 text-terracotta" />
          <span className="text-sm font-medium text-near-black font-serif">
            {label}
          </span>
        </div>
      )}

      <div className="space-y-1">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.04 }}
            className="flex items-center justify-between gap-3 py-2 px-2 rounded-lg
                       hover:bg-warm-sand/20 transition-colors duration-150 group"
          >
            <div className="flex-1 min-w-0">
              <span
                className={`text-sm font-medium block transition-colors duration-200 ${
                  item.enabled ? 'text-near-black' : 'text-olive-gray'
                }`}
              >
                {item.label}
              </span>
              {item.description && (
                <span className="text-xs text-stone-gray block mt-0.5 leading-snug">
                  {item.description}
                </span>
              )}
            </div>

            <ToggleSwitch
              enabled={item.enabled}
              onToggle={() => toggleItem(item.id)}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ToggleList;
