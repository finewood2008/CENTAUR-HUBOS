import { useRef, useState } from 'react';
import { GripVertical, X } from 'lucide-react';
import { getWidgetConfig } from './cockpitData';
import type { WidgetType, WidgetSize } from './cockpitData';

const SIZE_LABEL: Record<WidgetSize, string> = { S: '小', M: '中' };
const SIZE_COLOR: Record<WidgetSize, string> = {
  S: 'bg-blue-100 text-blue-600',
  M: 'bg-amber-100 text-amber-700',
};

interface DraggableWidgetProps {
  type: WidgetType;
  editing: boolean;
  children: React.ReactNode;
  onRemove?: (type: WidgetType) => void;
  // DnD
  onDragStart?: (type: WidgetType) => void;
  onDragOver?: (e: React.DragEvent, type: WidgetType) => void;
  onDrop?: (type: WidgetType) => void;
  onDragEnd?: () => void;
  dropTarget?: boolean;       // 是否是合法放置目标（同尺寸）
  dragActive?: boolean;       // 全局是否有拖拽进行中
}

export default function DraggableWidget({
  type, editing, children,
  onRemove, onDragStart, onDragOver, onDrop, onDragEnd,
  dropTarget, dragActive,
}: DraggableWidgetProps) {
  const config = getWidgetConfig(type);
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);

  if (!editing) {
    return <div>{children}</div>;
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', type);
    setIsDragging(true);
    onDragStart?.(type);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!dropTarget) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsOver(true);
    onDragOver?.(e, type);
  };

  const handleDragLeave = () => setIsOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    if (!dropTarget) return;
    onDrop?.(type);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd?.();
  };

  return (
    <div
      ref={ref}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      className={[
        'relative transition-all',
        'widget-editing',
        isDragging ? 'opacity-40 scale-95' : '',
        isOver && dropTarget ? 'widget-drop-target' : '',
        dragActive && !dropTarget && !isDragging ? 'opacity-40 pointer-events-none' : '',
      ].filter(Boolean).join(' ')}
    >
      {/* Edit overlay bar */}
      <div className="absolute -top-0.5 left-0 right-0 z-10 flex items-center gap-1.5 px-2 py-1 rounded-t-2xl bg-near-black/80 backdrop-blur-sm">
        {/* Drag handle */}
        <GripVertical size={14} className="text-white/60 cursor-grab active:cursor-grabbing shrink-0" />
        {/* Size badge */}
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${SIZE_COLOR[config.size]}`}>
          {SIZE_LABEL[config.size]}
        </span>
        {/* Name */}
        <span className="text-[11px] text-white/80 flex-1 truncate">{config.label}</span>
        {/* Remove button */}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove?.(type); }}
          className="p-0.5 rounded hover:bg-red-500/30 transition-colors"
        >
          <X size={13} className="text-white/70 hover:text-red-300" />
        </button>
      </div>

      {/* Widget content with top padding for overlay */}
      <div className="pt-6">
        {children}
      </div>
    </div>
  );
}
