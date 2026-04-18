// NodeDetailPanel — 数字员工构建器 V2 右侧节点详情面板
// Right panel: shows editable detail for the currently selected node.

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import type { CanvasNode } from './BuilderCanvas';

/* ═══════════════════════════════════════════
   Types
   ═══════════════════════════════════════════ */

export interface NodeDetailPanelProps {
  node: CanvasNode | null;
  onUpdate: (updated: CanvasNode) => void;
  onClose: () => void;
}

/* ═══════════════════════════════════════════
   Status badge
   ═══════════════════════════════════════════ */

function StatusBadge({ status }: { status: CanvasNode['status'] }) {
  const styles = {
    empty: 'bg-warm-sand text-stone-gray',
    configuring: 'bg-terracotta/10 text-terracotta',
    done: 'bg-success-green/10 text-success-green',
  };
  const labels = {
    empty: '未配置',
    configuring: '配置中',
    done: '已完成',
  };

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

/* ═══════════════════════════════════════════
   NodeDetailPanel (exported)
   ═══════════════════════════════════════════ */

export default function NodeDetailPanel({ node, onUpdate, onClose }: NodeDetailPanelProps) {
  const [localData, setLocalData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (node) {
      setLocalData(node.data ?? {});
    }
  }, [node]);

  if (!node) return null;

  const handleSave = () => {
    onUpdate({
      ...node,
      data: localData,
      status: 'done',
    });
  };

  const handleMarkConfiguring = () => {
    onUpdate({
      ...node,
      status: 'configuring',
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        key={node.id}
        initial={{ x: 80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="flex h-full w-80 flex-col border-l border-border-cream bg-ivory"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-cream px-4 py-3">
          <div>
            <h3 className="font-serif text-sm font-semibold text-near-black">
              {node.title}
            </h3>
            {node.subtitle && (
              <p className="text-[11px] text-stone-gray">{node.subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={node.status} />
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full text-stone-gray transition-colors hover:bg-warm-sand hover:text-near-black"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-gray">
              节点类型
            </label>
            <p className="text-sm text-near-black">{node.type}</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-stone-gray">
              所属层级
            </label>
            <p className="text-sm text-near-black">
              Layer {node.layer} · {node.layer === 1 ? '身份层' : node.layer === 2 ? '能力层' : '工作流层'}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-gray">
              配置备注
            </label>
            <textarea
              value={(localData.notes as string) ?? ''}
              onChange={(e) => setLocalData((d) => ({ ...d, notes: e.target.value }))}
              placeholder="添加配置说明..."
              rows={4}
              className="w-full resize-none rounded-[var(--radius-standard)] border border-border-warm bg-parchment px-3 py-2 text-sm text-near-black outline-none placeholder:text-stone-gray/50 focus:border-terracotta/40 focus:ring-1 focus:ring-terracotta/20"
            />
          </div>

          {/* Data preview */}
          {Object.keys(localData).length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-gray">
                节点数据
              </label>
              <pre className="max-h-40 overflow-auto rounded-[var(--radius-standard)] bg-warm-sand/40 p-3 font-mono text-[11px] text-charcoal-warm">
                {JSON.stringify(localData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2 border-t border-border-cream px-4 py-3">
          {node.status !== 'configuring' && (
            <button
              onClick={handleMarkConfiguring}
              className="flex-1 rounded-[var(--radius-standard)] border border-terracotta/30 px-3 py-1.5 text-xs font-medium text-terracotta transition-colors hover:bg-terracotta/5"
            >
              标记为配置中
            </button>
          )}
          <button
            onClick={handleSave}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-standard)] bg-terracotta px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
          >
            <CheckCircle2 size={13} strokeWidth={2} />
            完成配置
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
