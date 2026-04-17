import React from 'react';
import { motion } from 'framer-motion';
import { Layout } from 'lucide-react';

type LayoutOption = 'three-panel' | 'dashboard' | 'chat' | 'document';

interface LayoutPickerProps {
  value: LayoutOption;
  onChange: (v: LayoutOption) => void;
}

const layoutOptions: { key: LayoutOption; label: string }[] = [
  { key: 'three-panel', label: 'Three Panel' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'chat', label: 'Chat' },
  { key: 'document', label: 'Document' },
];

/** Mini visual thumbnail for each layout type */
const LayoutThumbnail: React.FC<{ type: LayoutOption }> = ({ type }) => {
  const base = 'w-full h-full rounded';

  switch (type) {
    case 'three-panel':
      return (
        <div className={`${base} flex gap-0.5 p-1`}>
          <div className="w-1/4 bg-terracotta/20 rounded-sm" />
          <div className="w-1/2 bg-terracotta/35 rounded-sm" />
          <div className="w-1/4 bg-terracotta/20 rounded-sm" />
        </div>
      );
    case 'dashboard':
      return (
        <div className={`${base} grid grid-cols-2 grid-rows-2 gap-0.5 p-1`}>
          <div className="bg-terracotta/25 rounded-sm" />
          <div className="bg-terracotta/35 rounded-sm" />
          <div className="bg-terracotta/35 rounded-sm" />
          <div className="bg-terracotta/25 rounded-sm" />
        </div>
      );
    case 'chat':
      return (
        <div className={`${base} flex flex-col gap-0.5 p-1`}>
          <div className="flex-1 flex flex-col gap-0.5 justify-end">
            <div className="w-3/4 h-1.5 bg-terracotta/20 rounded-full self-start" />
            <div className="w-1/2 h-1.5 bg-terracotta/35 rounded-full self-end" />
            <div className="w-2/3 h-1.5 bg-terracotta/20 rounded-full self-start" />
          </div>
          <div className="h-2.5 bg-terracotta/15 rounded-sm border border-terracotta/10" />
        </div>
      );
    case 'document':
      return (
        <div className={`${base} flex flex-col gap-0.5 p-1.5`}>
          <div className="w-2/3 h-1.5 bg-terracotta/35 rounded-full" />
          <div className="w-full h-1 bg-terracotta/15 rounded-full" />
          <div className="w-full h-1 bg-terracotta/15 rounded-full" />
          <div className="w-4/5 h-1 bg-terracotta/15 rounded-full" />
          <div className="w-full h-1 bg-terracotta/15 rounded-full" />
          <div className="w-3/5 h-1 bg-terracotta/15 rounded-full" />
        </div>
      );
  }
};

const LayoutPicker: React.FC<LayoutPickerProps> = ({ value, onChange }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="card-glass-warm rounded-2xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Layout className="w-4 h-4 text-terracotta" />
        <span className="text-sm font-medium text-near-black font-serif">
          Workspace Layout
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {layoutOptions.map((option) => {
          const isSelected = value === option.key;
          return (
            <motion.button
              key={option.key}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => onChange(option.key)}
              className={`
                flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all duration-200 cursor-pointer
                ${
                  isSelected
                    ? 'border-terracotta ring-2 ring-terracotta/20 bg-terracotta/5'
                    : 'border-border-cream bg-parchment/30 hover:border-terracotta/30 hover:bg-warm-sand/30'
                }
              `}
            >
              <div className="w-full aspect-[4/3] rounded-lg bg-parchment/60 border border-border-cream overflow-hidden">
                <LayoutThumbnail type={option.key} />
              </div>
              <span
                className={`text-xs font-medium transition-colors duration-200 ${
                  isSelected ? 'text-terracotta' : 'text-olive-gray'
                }`}
              >
                {option.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default LayoutPicker;
