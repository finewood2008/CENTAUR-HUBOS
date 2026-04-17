import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Tag } from 'lucide-react';

interface TagEditorProps {
  tags: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  allowCustom?: boolean;
  label?: string;
}

const TagEditor: React.FC<TagEditorProps> = ({
  tags,
  selected,
  onChange,
  allowCustom = false,
  label,
}) => {
  const [customInput, setCustomInput] = useState('');

  const toggleTag = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  const addCustomTag = () => {
    const trimmed = customInput.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
      setCustomInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomTag();
    }
  };

  // Merge tags and any selected custom tags not in original list
  const allTags = [...new Set([...tags, ...selected])];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="card-glass-warm rounded-2xl p-4"
    >
      {label && (
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-terracotta" />
          <span className="text-sm font-medium text-near-black font-serif">
            {label}
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => {
          const isSelected = selected.includes(tag);
          return (
            <motion.button
              key={tag}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleTag(tag)}
              className={`
                px-3 py-1.5 rounded-full text-sm border transition-colors duration-200 cursor-pointer
                ${
                  isSelected
                    ? 'bg-terracotta/15 text-terracotta border-terracotta/20'
                    : 'bg-warm-sand/50 text-olive-gray border-border-cream hover:bg-warm-sand/80'
                }
              `}
            >
              {tag}
            </motion.button>
          );
        })}

        {allowCustom && (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add..."
              className="px-3 py-1.5 rounded-full text-sm border border-border-cream bg-parchment/50
                         text-near-black placeholder:text-stone-gray focus:outline-none focus:border-terracotta/40
                         w-24 transition-colors duration-200"
            />
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={addCustomTag}
              disabled={!customInput.trim()}
              className="p-1.5 rounded-full bg-terracotta/10 text-terracotta hover:bg-terracotta/20
                         disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TagEditor;
