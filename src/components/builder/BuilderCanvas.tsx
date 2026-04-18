// BuilderCanvas — 数字员工构建器 V2 中央画布
// Center panel: three swim-lane layers (Identity / Capability / Workflow)
// with animated node cards, SVG connectors, and layer-based dimming.

import { useRef, useLayoutEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Puzzle,
  GitBranch,
  CheckCircle2,
  User,
  BookOpen,
  Brain,
  ShieldCheck,
  Wrench,
  Zap,
  Play,
  ListChecks,
  Eye,
  FileOutput,
  type LucideIcon,
} from 'lucide-react';

/* ═══════════════════════════════════════════
   Types
   ═══════════════════════════════════════════ */

export interface CanvasNode {
  id: string;
  layer: 1 | 2 | 3;
  type:
    | 'role-card'
    | 'knowledge'
    | 'memory'
    | 'guardrails'
    | 'skill'
    | 'tool'
    | 'trigger'
    | 'step'
    | 'review'
    | 'output';
  title: string;
  subtitle?: string;
  icon: string; // lucide icon name as string
  status: 'empty' | 'configuring' | 'done';
  data?: Record<string, unknown>;
}

export interface BuilderCanvasProps {
  /** Current layer being configured (1, 2, or 3) */
  activeLayer: number;
  /** Node data for each layer */
  nodes: CanvasNode[];
  /** Which node is selected (shows detail in right panel) */
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
}

/* ═══════════════════════════════════════════
   Icon resolver
   ═══════════════════════════════════════════ */

const ICON_MAP: Record<string, LucideIcon> = {
  shield: Shield,
  'shield-check': ShieldCheck,
  puzzle: Puzzle,
  'git-branch': GitBranch,
  user: User,
  'book-open': BookOpen,
  brain: Brain,
  wrench: Wrench,
  zap: Zap,
  play: Play,
  'list-checks': ListChecks,
  eye: Eye,
  'file-output': FileOutput,
};

function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Zap;
}

/* ═══════════════════════════════════════════
   Default placeholder nodes for empty state
   ═══════════════════════════════════════════ */

const DEFAULT_LAYER_1: CanvasNode[] = [
  { id: '_l1_role', layer: 1, type: 'role-card', title: '角色卡', subtitle: 'Role Card', icon: 'user', status: 'empty' },
  { id: '_l1_kb', layer: 1, type: 'knowledge', title: '知识库', subtitle: 'Knowledge Base', icon: 'book-open', status: 'empty' },
  { id: '_l1_mem', layer: 1, type: 'memory', title: '记忆体系', subtitle: 'Memory', icon: 'brain', status: 'empty' },
  { id: '_l1_guard', layer: 1, type: 'guardrails', title: '行为准则', subtitle: 'Guardrails', icon: 'shield-check', status: 'empty' },
];

const DEFAULT_LAYER_2: CanvasNode[] = [
  { id: '_l2_skill1', layer: 2, type: 'skill', title: '能力套件', subtitle: 'Capability Kit', icon: 'wrench', status: 'empty' },
  { id: '_l2_tool1', layer: 2, type: 'tool', title: '工具集成', subtitle: 'Tool Integration', icon: 'zap', status: 'empty' },
];

const DEFAULT_LAYER_3: CanvasNode[] = [
  { id: '_l3_trigger', layer: 3, type: 'trigger', title: '触发器', subtitle: 'Trigger', icon: 'play', status: 'empty' },
  { id: '_l3_step', layer: 3, type: 'step', title: '处理步骤', subtitle: 'Steps', icon: 'list-checks', status: 'empty' },
  { id: '_l3_review', layer: 3, type: 'review', title: '审核节点', subtitle: 'Review', icon: 'eye', status: 'empty' },
  { id: '_l3_output', layer: 3, type: 'output', title: '输出', subtitle: 'Output', icon: 'file-output', status: 'empty' },
];

/* ═══════════════════════════════════════════
   Layer config
   ═══════════════════════════════════════════ */

interface LayerConfig {
  layer: 1 | 2 | 3;
  label: string;
  Icon: LucideIcon;
  gradient: string; // subtle bg
  accentRing: string;
  labelColor: string;
  defaults: CanvasNode[];
}

const LAYER_CONFIGS: LayerConfig[] = [
  {
    layer: 1,
    label: 'Layer 1 · 身份层',
    Icon: Shield,
    gradient: 'from-terracotta/[0.05] to-coral/[0.03]',
    accentRing: 'ring-terracotta/30',
    labelColor: 'text-terracotta',
    defaults: DEFAULT_LAYER_1,
  },
  {
    layer: 2,
    label: 'Layer 2 · 能力层',
    Icon: Puzzle,
    gradient: 'from-teal/[0.06] to-focus-blue/[0.03]',
    accentRing: 'ring-teal/30',
    labelColor: 'text-teal',
    defaults: DEFAULT_LAYER_2,
  },
  {
    layer: 3,
    label: 'Layer 3 · 工作流层',
    Icon: GitBranch,
    gradient: 'from-success-green/[0.06] to-sage-green/[0.03]',
    accentRing: 'ring-success-green/30',
    labelColor: 'text-success-green',
    defaults: DEFAULT_LAYER_3,
  },
];

/* ═══════════════════════════════════════════
   Connector SVG between nodes in a lane
   ═══════════════════════════════════════════ */

interface ConnectorProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  nodeIds: string[];
  isActive: boolean;
}

function SwimLaneConnectors({ containerRef, nodeIds, isActive }: ConnectorProps) {
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const newLines: typeof lines = [];
    for (let i = 0; i < nodeIds.length - 1; i++) {
      const elA = container.querySelector(`[data-node-id="${nodeIds[i]}"]`);
      const elB = container.querySelector(`[data-node-id="${nodeIds[i + 1]}"]`);
      if (!elA || !elB) continue;
      const rA = elA.getBoundingClientRect();
      const rB = elB.getBoundingClientRect();
      newLines.push({
        x1: rA.right - rect.left,
        y1: rA.top + rA.height / 2 - rect.top,
        x2: rB.left - rect.left,
        y2: rB.top + rB.height / 2 - rect.top,
      });
    }
    setLines(newLines);
  }, [containerRef, nodeIds]);

  useLayoutEffect(() => {
    measure();
    const timer = setTimeout(measure, 350); // re-measure after framer-motion settles
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  if (lines.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ zIndex: 0 }}
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={isActive ? '#87867f' : '#b0aea5'} />
        </marker>
      </defs>
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={isActive ? '#87867f' : '#d1cfc5'}
          strokeWidth={1.5}
          strokeDasharray="6 4"
          markerEnd="url(#arrow)"
        >
          {isActive && (
            <animate
              attributeName="stroke-dashoffset"
              from="20"
              to="0"
              dur="1.2s"
              repeatCount="indefinite"
            />
          )}
        </line>
      ))}
    </svg>
  );
}

/* ═══════════════════════════════════════════
   Node Card
   ═══════════════════════════════════════════ */

interface NodeCardProps {
  node: CanvasNode;
  isActive: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function NodeCard({ node, isActive, isSelected, onSelect }: NodeCardProps) {
  const Icon = resolveIcon(node.icon);

  // Border style by status
  const borderClass =
    node.status === 'empty'
      ? 'border-2 border-dashed border-stone-gray/40'
      : node.status === 'configuring'
        ? 'border-2 border-terracotta/60'
        : 'border-2 border-success-green/50';

  // Pulsing ring for configuring
  const pulseRing =
    node.status === 'configuring'
      ? 'ring-2 ring-terracotta/40 animate-pulse'
      : '';

  // Selected ring
  const selectedRing = isSelected
    ? 'ring-2 ring-terracotta shadow-[0_0_0_4px_rgba(201,100,66,0.15)]'
    : '';

  // Opacity for inactive layer
  const opacityClass = isActive ? 'opacity-100' : 'opacity-40';

  // Icon bg by status
  const iconBg =
    node.status === 'done'
      ? 'bg-success-green/10 text-success-green'
      : node.status === 'configuring'
        ? 'bg-terracotta/10 text-terracotta'
        : 'bg-warm-sand/80 text-stone-gray';

  return (
    <motion.button
      data-node-id={node.id}
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: isActive ? 1 : 0.4 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      whileHover={isActive ? { scale: 1.04, y: -2 } : {}}
      whileTap={isActive ? { scale: 0.97 } : {}}
      onClick={() => onSelect(node.id)}
      className={`
        relative flex flex-col items-center gap-2 rounded-[var(--radius-generous)] bg-ivory
        px-5 py-4 text-center transition-shadow duration-200
        cursor-pointer select-none min-w-[120px] max-w-[156px]
        ${borderClass} ${pulseRing} ${selectedRing} ${opacityClass}
        hover:shadow-[var(--shadow-whisper)]
      `}
      style={{ zIndex: 1 }}
    >
      {/* Icon circle */}
      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBg}`}>
        <Icon size={20} strokeWidth={1.8} />
      </span>

      {/* Title */}
      <span className="font-serif text-sm font-semibold leading-tight text-near-black">
        {node.title}
      </span>

      {/* Subtitle */}
      {node.subtitle && (
        <span className="text-[11px] leading-tight text-stone-gray">
          {node.subtitle}
        </span>
      )}

      {/* Done badge */}
      {node.status === 'done' && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-success-green text-white shadow-sm"
        >
          <CheckCircle2 size={14} strokeWidth={2.5} />
        </motion.span>
      )}

      {/* Configuring dot */}
      {node.status === 'configuring' && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-terracotta shadow-sm"
        />
      )}
    </motion.button>
  );
}

/* ═══════════════════════════════════════════
   Swim Lane
   ═══════════════════════════════════════════ */

interface SwimLaneProps {
  config: LayerConfig;
  nodes: CanvasNode[];
  isActive: boolean;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
}

function SwimLane({ config, nodes, isActive, selectedNodeId, onSelectNode }: SwimLaneProps) {
  const laneRef = useRef<HTMLDivElement | null>(null);
  const { label, Icon, gradient, labelColor } = config;

  // Use provided nodes, fill remaining slots with defaults
  const effectiveNodes = useMemo(() => {
    if (nodes.length > 0) return nodes;
    return config.defaults;
  }, [nodes, config.defaults]);

  const nodeIds = effectiveNodes.map((n) => n.id);

  return (
    <motion.div
      ref={laneRef}
      layout
      className={`
        relative rounded-[var(--radius-featured)] bg-gradient-to-r ${gradient}
        border border-border-cream/60 px-5 py-4
      `}
      animate={{ opacity: isActive ? 1 : 0.6 }}
      transition={{ duration: 0.35 }}
    >
      {/* Lane header */}
      <div className={`mb-4 flex items-center gap-2 ${labelColor}`}>
        <Icon size={16} strokeWidth={2} />
        <span className="font-serif text-xs font-semibold tracking-wide uppercase">
          {label}
        </span>
        {isActive && (
          <motion.span
            layoutId="active-badge"
            className="ml-auto rounded-full bg-terracotta/10 px-2.5 py-0.5 text-[10px] font-semibold text-terracotta"
          >
            配置中
          </motion.span>
        )}
      </div>

      {/* Connector lines SVG */}
      <SwimLaneConnectors
        containerRef={laneRef}
        nodeIds={nodeIds}
        isActive={isActive}
      />

      {/* Node cards row */}
      <div className="relative flex flex-wrap items-center gap-4">
        <AnimatePresence mode="popLayout">
          {effectiveNodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              isActive={isActive}
              isSelected={selectedNodeId === node.id}
              onSelect={onSelectNode}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   BuilderCanvas (exported)
   ═══════════════════════════════════════════ */

export default function BuilderCanvas({
  activeLayer,
  nodes,
  selectedNodeId,
  onSelectNode,
}: BuilderCanvasProps) {
  // Partition nodes by layer
  const nodesByLayer = useMemo(() => {
    const map: Record<number, CanvasNode[]> = { 1: [], 2: [], 3: [] };
    for (const n of nodes) {
      if (map[n.layer]) map[n.layer].push(n);
    }
    return map;
  }, [nodes]);

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-[var(--radius-featured)] bg-parchment p-4">
      {/* Title strip */}
      <div className="flex items-center justify-between px-1">
        <h2 className="font-serif text-base font-semibold text-near-black">
          构建画布 <span className="text-stone-gray font-sans text-xs font-normal ml-1.5">Builder Canvas</span>
        </h2>
        <span className="text-[11px] text-stone-gray">
          {nodes.filter((n) => n.status === 'done').length}/{nodes.length} 已完成
        </span>
      </div>

      {/* Swim lanes */}
      <div className="flex flex-1 flex-col gap-4">
        {LAYER_CONFIGS.map((cfg) => (
          <SwimLane
            key={cfg.layer}
            config={cfg}
            nodes={nodesByLayer[cfg.layer]}
            isActive={activeLayer === cfg.layer}
            selectedNodeId={selectedNodeId}
            onSelectNode={onSelectNode}
          />
        ))}
      </div>
    </div>
  );
}
