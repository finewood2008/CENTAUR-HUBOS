import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Check } from 'lucide-react';

interface TextEditorProps {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  multiline?: boolean;
}

const TextEditor: React.FC<TextEditorProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Click to edit...',
  multiline = false,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      // Place cursor at end
      const len = draft.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [editing]);

  const confirm = () => {
    setEditing(false);
    onChange(draft);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      confirm();
    }
    if (e.key === 'Enter' && multiline && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      confirm();
    }
    if (e.key === 'Escape') {
      setDraft(value);
      setEditing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="card-glass-warm rounded-2xl p-4"
    >
      {label && (
        <div className="flex items-center gap-2 mb-2">
          <Pencil className="w-3.5 h-3.5 text-terracotta" />
          <span className="text-sm font-medium text-near-black font-serif">
            {label}
          </span>
        </div>
      )}

      {editing ? (
        <div className="relative">
          {multiline ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={confirm}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={4}
              className="w-full px-3 py-2 rounded-lg text-sm border border-terracotta/30 bg-parchment/50
                         text-near-black placeholder:text-stone-gray focus:outline-none focus:border-terracotta/50
                         focus:ring-2 focus:ring-terracotta/10 resize-y transition-all duration-200"
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={confirm}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full px-3 py-2 rounded-lg text-sm border border-terracotta/30 bg-parchment/50
                         text-near-black placeholder:text-stone-gray focus:outline-none focus:border-terracotta/50
                         focus:ring-2 focus:ring-terracotta/10 transition-all duration-200"
            />
          )}
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onMouseDown={(e) => {
              e.preventDefault();
              confirm();
            }}
            className="absolute top-2 right-2 p-1 rounded-md bg-terracotta/10 text-terracotta
                       hover:bg-terracotta/20 transition-colors duration-150 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      ) : (
        <motion.button
          type="button"
          onClick={() => setEditing(true)}
          className="w-full text-left group flex items-start gap-2 px-3 py-2 rounded-lg
                     bg-parchment/30 border border-border-cream hover:border-terracotta/30
                     hover:bg-warm-sand/20 transition-all duration-200 cursor-pointer"
        >
          <span
            className={`flex-1 text-sm ${
              value ? 'text-near-black' : 'text-stone-gray italic'
            }`}
          >
            {value || placeholder}
          </span>
          <Pencil
            className="w-3.5 h-3.5 text-olive-gray opacity-0 group-hover:opacity-100
                         transition-opacity duration-150 shrink-0 mt-0.5"
          />
        </motion.button>
      )}

      {editing && multiline && (
        <p className="text-xs text-stone-gray mt-1.5 ml-1">
          Press Ctrl+Enter to confirm · Esc to cancel
        </p>
      )}
    </motion.div>
  );
};

export default TextEditor;
