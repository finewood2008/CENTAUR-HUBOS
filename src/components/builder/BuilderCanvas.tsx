import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileCheck,
  Flag,
  GitBranch,
  ShieldCheck,
  Target,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export interface CanvasNode {
  id: string;
  layer: 1 | 2 | 3;
  type:
    | 'role-goal'
    | 'service-target'
    | 'data-source'
    | 'workflow'
    | 'tool-permission'
    | 'approval'
    | 'exception'
    | 'acceptance'
    | 'launch';
  title: string;
  subtitle?: string;
  icon: string;
  status: 'empty' | 'configuring' | 'done' | 'blocked';
  data?: Record<string, unknown>;
}

export interface BuilderCanvasProps {
  activeLayer: number;
  nodes: CanvasNode[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  target: Target,
  users: Users,
  database: Database,
  workflow: GitBranch,
  zap: Zap,
  shield: ShieldCheck,
  alert: AlertTriangle,
  check: FileCheck,
  flag: Flag,
};

const LAYERS = [
  { id: 1, title: '岗位设定', desc: '目标、服务对象、数据来源', tone: 'text-terracotta bg-terracotta/8 border-terracotta/15' },
  { id: 2, title: '工作设计', desc: '流程、工具权限、人工确认', tone: 'text-teal bg-teal/8 border-teal/15' },
  { id: 3, title: '验收上线', desc: '异常、验收指标、上线清单', tone: 'text-success-green bg-success-green/8 border-success-green/15' },
] as const;

function NodeCard({
  node,
  selected,
  onSelect,
}: {
  node: CanvasNode;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const Icon = ICON_MAP[node.icon] ?? Zap;
  const isDone = node.status === 'done';
  const isBlocked = node.status === 'blocked';
  const border = selected
    ? 'border-terracotta ring-2 ring-terracotta/20'
    : isBlocked
      ? 'border-red-400/60'
      : isDone
      ? 'border-success-green/35'
      : node.status === 'configuring'
        ? 'border-terracotta/40'
        : 'border-border-warm';

  return (
    <motion.button
      layout
      onClick={() => onSelect(node.id)}
      className={`group flex min-h-[128px] flex-col rounded-2xl border bg-ivory p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${border}`}
      whileTap={{ scale: 0.985 }}
    >
      <div className="flex items-start gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isBlocked ? 'bg-red-500/10 text-red-500' : isDone ? 'bg-success-green/10 text-success-green' : 'bg-terracotta/10 text-terracotta'}`}>
          <Icon size={18} strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-sm font-semibold text-near-black">{node.title}</h3>
            {isDone && <CheckCircle2 size={14} className="text-success-green" />}
            {isBlocked && <AlertTriangle size={14} className="text-red-500" />}
          </div>
          {node.subtitle && <p className="mt-0.5 text-[11px] leading-snug text-stone-gray">{node.subtitle}</p>}
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {Object.entries(node.data ?? {}).slice(0, 3).map(([key, value]) => (
          <div key={key} className="rounded-lg bg-warm-sand/40 px-2.5 py-1.5 text-[11px] leading-snug text-olive-gray">
            <span className="text-stone-gray">{key}：</span>
            {Array.isArray(value) ? value.slice(0, 3).join('、') : String(value)}
          </div>
        ))}
        {Object.keys(node.data ?? {}).length === 0 && (
          <p className="rounded-lg border border-dashed border-border-warm px-2.5 py-2 text-[11px] text-stone-gray">
            等待 Builder 根据访谈生成配置
          </p>
        )}
      </div>
    </motion.button>
  );
}

export default function BuilderCanvas({
  activeLayer,
  nodes,
  selectedNodeId,
  onSelectNode,
}: BuilderCanvasProps) {
  const grouped = useMemo(() => {
    const map: Record<number, CanvasNode[]> = { 1: [], 2: [], 3: [] };
    nodes.forEach((node) => map[node.layer].push(node));
    return map;
  }, [nodes]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-parchment">
      <div className="border-b border-border-cream bg-ivory px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-semibold text-near-black">员工蓝图画布</h2>
            <p className="mt-0.5 text-xs text-stone-gray">用业务语言展示这个数字员工如何工作，不做自由拖拽流程编排。</p>
          </div>
          <span className="rounded-full bg-warm-sand/60 px-3 py-1 text-[11px] text-olive-gray">
            {nodes.filter((node) => node.status === 'done').length}/{nodes.length} 已确认
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {LAYERS.map((layer) => {
          const isActive = activeLayer === layer.id;
          return (
            <section
              key={layer.id}
              className={`rounded-2xl border p-4 ${layer.tone} ${isActive ? 'ring-2 ring-current/10' : 'opacity-85'}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-sm font-semibold">{layer.title}</h3>
                  <p className="text-[11px] text-stone-gray">{layer.desc}</p>
                </div>
                {isActive && <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium">当前阶段</span>}
              </div>
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {grouped[layer.id].map((node) => (
                  <NodeCard
                    key={node.id}
                    node={node}
                    selected={selectedNodeId === node.id}
                    onSelect={onSelectNode}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
