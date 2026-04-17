import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, X, Plus, ListOrdered } from 'lucide-react';

interface StepEditorProps {
  steps: string[];
  onChange: (steps: string[]) => void;
  label?: string;
}

const StepEditor: React.FC<StepEditorProps> = ({ steps, onChange, label }) => {
  const [newStep, setNewStep] = useState('');

  const addStep = () => {
    const trimmed = newStep.trim();
    if (trimmed) {
      onChange([...steps, trimmed]);
      setNewStep('');
    }
  };

  const removeStep = (index: number) => {
    onChange(steps.filter((_, i) => i !== index));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...steps];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange(updated);
  };

  const moveDown = (index: number) => {
    if (index === steps.length - 1) return;
    const updated = [...steps];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onChange(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addStep();
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
        <div className="flex items-center gap-2 mb-3">
          <ListOrdered className="w-4 h-4 text-terracotta" />
          <span className="text-sm font-medium text-near-black font-serif">
            {label}
          </span>
        </div>
      )}

      <div className="space-y-1.5">
        <AnimatePresence mode="popLayout">
          {steps.map((step, index) => (
            <motion.div
              key={`${index}-${step}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8, height: 0 }}
              transition={{ duration: 0.2 }}
              layout
              className="flex items-center gap-2 group"
            >
              {/* Step number */}
              <span className="w-6 h-6 rounded-full bg-terracotta/15 text-terracotta text-xs
                             flex items-center justify-center font-medium shrink-0">
                {index + 1}
              </span>

              {/* Step text */}
              <span className="flex-1 text-sm text-near-black py-1.5 px-2 rounded-lg
                             bg-parchment/30 border border-border-cream">
                {step}
              </span>

              {/* Reorder buttons */}
              <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button
                  type="button"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="p-0.5 text-olive-gray hover:text-terracotta disabled:opacity-30
                           disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(index)}
                  disabled={index === steps.length - 1}
                  className="p-0.5 text-olive-gray hover:text-terracotta disabled:opacity-30
                           disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => removeStep(index)}
                className="p-1 text-olive-gray hover:text-coral opacity-0 group-hover:opacity-100
                         transition-all duration-150 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add new step */}
      <div className="flex items-center gap-2 mt-3">
        <input
          type="text"
          value={newStep}
          onChange={(e) => setNewStep(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a step..."
          className="flex-1 px-3 py-1.5 rounded-lg text-sm border border-border-cream bg-parchment/50
                     text-near-black placeholder:text-stone-gray focus:outline-none focus:border-terracotta/40
                     transition-colors duration-200"
        />
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={addStep}
          disabled={!newStep.trim()}
          className="p-2 rounded-lg bg-terracotta/10 text-terracotta hover:bg-terracotta/20
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default StepEditor;
