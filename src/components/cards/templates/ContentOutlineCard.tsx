// 大纲确认卡片 — 树形大纲，可确认/修改
import { useState } from 'react';
import { List, GripVertical, Check, RotateCcw, Plus, X } from 'lucide-react';
import type { CardProps } from '../types';

interface OutlineItem {
  id: string;
  title: string;
  children?: OutlineItem[];
}

interface OutlineData {
  title: string;
  items: OutlineItem[];
  status?: 'draft' | 'confirmed';
}

function OutlineNode({ item, depth = 0, editable, onRemove }: { item: OutlineItem; depth?: number; editable?: boolean; onRemove?: (id: string) => void }) {
  return (
    <div>
      <div className={`flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-warm-sand/40 transition-colors group`} style={{ paddingLeft: depth * 16 + 8 }}>
        {editable && <GripVertical size={10} className="text-stone-gray/40 cursor-grab opacity-0 group-hover:opacity-100" />}
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${depth === 0 ? 'bg-terracotta' : 'bg-stone-gray/40'}`} />
        <span className={`text-xs flex-1 ${depth === 0 ? 'text-near-black font-medium' : 'text-olive-gray'}`}>{item.title}</span>
        {editable && onRemove && (
          <button onClick={() => onRemove(item.id)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-50">
            <X size={10} className="text-red-400" />
          </button>
        )}
      </div>
      {item.children?.map((child) => (
        <OutlineNode key={child.id} item={child} depth={depth + 1} editable={editable} onRemove={onRemove} />
      ))}
    </div>
  );
}

export default function ContentOutlineCard({ data, editable, onEdit, onAction }: CardProps<OutlineData>) {
  const [confirmed, setConfirmed] = useState(data.status === 'confirmed');

  const handleConfirm = () => {
    setConfirmed(true);
    onAction?.('confirm');
  };

  return (
    <div className="rounded-xl border border-border-cream bg-ivory/90 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-warm-sand/30 border-b border-border-cream">
        <div className="flex items-center gap-2">
          <List size={14} className="text-terracotta" />
          <span className="text-xs font-medium text-near-black">内容大纲</span>
          {confirmed && <span className="px-1.5 py-0.5 rounded text-[9px] bg-success-green/10 text-success-green">已确认</span>}
        </div>
      </div>

      <div className="p-3">
        <h4 className="text-sm font-serif font-medium text-near-black mb-2 px-2">{data.title}</h4>
        <div className="space-y-0.5">
          {data.items.map((item) => (
            <OutlineNode key={item.id} item={item} editable={editable && !confirmed} />
          ))}
        </div>

        {!confirmed && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border-cream">
            <button onClick={handleConfirm} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-terracotta text-ivory text-[11px]">
              <Check size={12} />确认大纲
            </button>
            <button onClick={() => onAction?.('regenerate')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-warm-sand text-olive-gray text-[11px] hover:bg-terracotta/10 hover:text-terracotta transition-colors">
              <RotateCcw size={12} />重新生成
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
