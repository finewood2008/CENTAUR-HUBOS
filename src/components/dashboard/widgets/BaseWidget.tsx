import React from 'react';
import { motion } from 'framer-motion';

export interface BaseWidgetProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  onRemove?: (id: string) => void;
  children: React.ReactNode;
  className?: string;
}

export default function BaseWidget({ id, title, icon, onRemove, children, className = '' }: BaseWidgetProps) {
  return (
    <div className={`card-glass flex flex-col h-full w-full overflow-hidden ${className}`}>
      {/* Widget Header / Drag Handle */}
      <div className="flex items-center justify-between p-3 border-b border-border-warm bg-warm-sand/50 handle cursor-move">
        <div className="flex items-center gap-2">
          {icon && <span className="text-terracotta">{icon}</span>}
          <h3 className="text-sm font-semibold text-near-black font-serif">{title}</h3>
        </div>
        {onRemove && (
          <button 
            onClick={() => onRemove(id)}
            className="text-stone-gray hover:text-coral transition-colors p-1"
          >
            ✕
          </button>
        )}
      </div>
      
      {/* Widget Content */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        {children}
      </div>
    </div>
  );
}