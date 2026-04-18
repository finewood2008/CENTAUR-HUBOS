// EmployeeBuilderV2 — 数字员工构建工作台 主容器
// Three-panel layout: Chat (left) | Canvas (center) | DetailPanel (right)

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import BuilderCanvas, { type CanvasNode, type BuilderCanvasProps } from './BuilderCanvas';
import BuilderChat, { type EmployeeSpecV2, type BuilderChatProps } from './BuilderChat';
import NodeDetailPanel, { type NodeDetailPanelProps } from './NodeDetailPanel';

/* ═══════════════════════════════════════════
   Props
   ═══════════════════════════════════════════ */

interface Props {
  onBack: () => void;
  onComplete: (spec: any) => void;
}

/* ═══════════════════════════════════════════
   Default nodes initialization (all status 'empty')
   ═══════════════════════════════════════════ */

const INITIAL_LAYER_1: CanvasNode[] = [
  { id: 'role-card', layer: 1, type: 'role-card', title: '角色卡', subtitle: 'Role Card', icon: 'user', status: 'empty' },
  { id: 'knowledge', layer: 1, type: 'knowledge', title: '知识库', subtitle: 'Knowledge Base', icon: 'book-open', status: 'empty' },
  { id: 'memory', layer: 1, type: 'memory', title: '记忆体系', subtitle: 'Memory', icon: 'brain', status: 'empty' },
  { id: 'guardrails', layer: 1, type: 'guardrails', title: '行为准则', subtitle: 'Guardrails', icon: 'shield-check', status: 'empty' },
];

const INITIAL_LAYER_3: CanvasNode[] = [
  { id: 'trigger', layer: 3, type: 'trigger', title: '触发器', subtitle: 'Trigger', icon: 'play', status: 'empty' },
  { id: 'step', layer: 3, type: 'step', title: '处理步骤', subtitle: 'Steps', icon: 'list-checks', status: 'empty' },
  { id: 'review', layer: 3, type: 'review', title: '审核节点', subtitle: 'Review', icon: 'eye', status: 'empty' },
  { id: 'output', layer: 3, type: 'output', title: '输出', subtitle: 'Output', icon: 'file-output', status: 'empty' },
];

const INITIAL_LAYER_2: CanvasNode[] = [
  { id: 'skill', layer: 2, type: 'skill', title: '能力套件', subtitle: 'Capability Kit', icon: 'wrench', status: 'empty' },
  { id: 'tool', layer: 2, type: 'tool', title: '工具集成', subtitle: 'Tool Integration', icon: 'zap', status: 'empty' },
];

const INITIAL_NODES: CanvasNode[] = [...INITIAL_LAYER_1, ...INITIAL_LAYER_2, ...INITIAL_LAYER_3];

/* ═══════════════════════════════════════════
   Layer metadata for bottom bar
   ═══════════════════════════════════════════ */

interface LayerMeta {
  layer: number;
  label: string;
  activeColor: string;       // bg when active
  activeBorder: string;      // ring when active
  activeTextColor: string;   // label text when active
}

const LAYERS: LayerMeta[] = [
  {
    layer: 1,
    label: '身份层',
    activeColor: 'bg-terracotta',
    activeBorder: 'ring-terracotta/40',
    activeTextColor: 'text-terracotta',
  },
  {
    layer: 2,
    label: '能力层',
    activeColor: 'bg-teal',
    activeBorder: 'ring-teal/40',
    activeTextColor: 'text-teal',
  },
  {
    layer: 3,
    label: '工作流层',
    activeColor: 'bg-sage-green',
    activeBorder: 'ring-sage-green/40',
    activeTextColor: 'text-sage-green',
  },
];

/* ═══════════════════════════════════════════
   EmployeeBuilderV2 (exported)
   ═══════════════════════════════════════════ */

export default function EmployeeBuilderV2({ onBack, onComplete }: Props) {
  /* ── State ── */
  const [activeLayer, setActiveLayer] = useState<number>(1);
  const [nodes, setNodes] = useState<CanvasNode[]>(INITIAL_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [completedSpec, setCompletedSpec] = useState<EmployeeSpecV2 | null>(null);

  /* ── Derived ── */
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  const totalNodes = nodes.length;
  const doneNodes = useMemo(() => nodes.filter((n) => n.status === 'done').length, [nodes]);
  const progressPct = totalNodes > 0 ? Math.round((doneNodes / totalNodes) * 100) : 0;

  /* ── Handlers ── */

  const handleLayerChange = useCallback((layer: number) => {
    setActiveLayer(layer);
  }, []);

  const handleNodeUpdate = useCallback((updatedNode: CanvasNode) => {
    setNodes((prev) => {
      const idx = prev.findIndex((n) => n.id === updatedNode.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedNode;
        return next;
      }
      // Node doesn't exist yet — add it (Layer 2 dynamic nodes)
      return [...prev, updatedNode];
    });
  }, []);

  const handleSelectNode = useCallback((id: string) => {
    setSelectedNodeId((prev) => (prev === id ? null : id));
  }, []);

  const handleDetailUpdate = useCallback((updatedNode: CanvasNode) => {
    handleNodeUpdate(updatedNode);
  }, [handleNodeUpdate]);

  const handleDetailClose = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleChatComplete = useCallback(
    (spec: EmployeeSpecV2) => {
      setCompletedSpec(spec);
      onComplete(spec);
    },
    [onComplete],
  );

  /* ── Render ── */

  return (
    <div className="flex h-full w-full flex-col bg-parchment">
      {/* ════════════════════════════════════════
          HEADER
          ════════════════════════════════════════ */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex items-center gap-4 border-b border-border-cream bg-ivory px-5 py-3"
      >
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border-warm text-stone-gray transition-colors hover:border-terracotta/40 hover:text-terracotta hover:bg-terracotta/5"
          aria-label="返回"
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-lg font-semibold leading-tight text-near-black">
            数字员工构建工作台
          </h1>
          <p className="text-[12px] leading-tight text-stone-gray mt-0.5">
            通过自然语言对话，可视化构建你的专属 AI 员工
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-stone-gray whitespace-nowrap">
            {doneNodes}/{totalNodes} 已完成
          </span>
          <div className="h-2 w-32 overflow-hidden rounded-full bg-warm-sand">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-terracotta to-coral"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />
          </div>
          <span className="text-xs font-semibold text-terracotta min-w-[3ch] text-right">
            {progressPct}%
          </span>
        </div>
      </motion.header>

      {/* ════════════════════════════════════════
          THREE-PANEL BODY
          ════════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <LayoutGroup>
          {/* ── Left: Chat Panel ── */}
          <BuilderChat
            activeLayer={activeLayer}
            nodes={nodes}
            onLayerChange={handleLayerChange}
            onNodeUpdate={handleNodeUpdate}
            onComplete={handleChatComplete}
          />

          {/* ── Center: Canvas ── */}
          <motion.div
            layout
            className="flex-1 min-w-0 overflow-hidden"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <BuilderCanvas
              activeLayer={activeLayer}
              nodes={nodes}
              selectedNodeId={selectedNodeId}
              onSelectNode={handleSelectNode}
            />
          </motion.div>

          {/* ── Right: Detail Panel (conditional) ── */}
          <AnimatePresence mode="wait">
            {selectedNode && (
              <motion.div
                key="detail-panel"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="overflow-hidden"
              >
                <NodeDetailPanel
                  node={selectedNode}
                  onUpdate={handleDetailUpdate}
                  onClose={handleDetailClose}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </LayoutGroup>
      </div>

      {/* ════════════════════════════════════════
          BOTTOM BAR
          ════════════════════════════════════════ */}
      <motion.footer
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.15 }}
        className="flex items-center justify-between border-t border-border-cream bg-ivory px-6 py-2.5"
      >
        {/* Layer indicators */}
        <div className="flex items-center gap-6">
          {LAYERS.map((lm) => {
            const isActive = activeLayer === lm.layer;
            return (
              <button
                key={lm.layer}
                onClick={() => handleLayerChange(lm.layer)}
                className="group flex items-center gap-2 transition-colors"
              >
                {/* Circle indicator */}
                <motion.span
                  layout
                  className={`
                    flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-200
                    ${isActive
                      ? `${lm.activeColor} text-white ring-2 ${lm.activeBorder} shadow-sm`
                      : 'bg-warm-sand text-stone-gray group-hover:bg-warm-silver/50'
                    }
                  `}
                >
                  {lm.layer}
                </motion.span>
                {/* Label */}
                <span
                  className={`text-xs font-medium transition-colors duration-200 ${
                    isActive ? lm.activeTextColor : 'text-stone-gray group-hover:text-charcoal-warm'
                  }`}
                >
                  {lm.label}
                </span>
                {/* Active dot */}
                {isActive && (
                  <motion.span
                    layoutId="active-layer-dot"
                    className={`h-1.5 w-1.5 rounded-full ${lm.activeColor}`}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Progress percentage */}
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-warm-sand">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-terracotta/80 to-coral/80"
              animate={{ width: `${progressPct}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />
          </div>
          <span className="text-[11px] font-medium text-stone-gray">
            整体进度 <span className="font-semibold text-terracotta">{progressPct}%</span>
          </span>
        </div>
      </motion.footer>
    </div>
  );
}
