// BlueprintCard — 数字员工蓝图总览卡片
// 一张卡展示所有配置，每个区块可点击触发编辑
import { motion } from 'framer-motion';
import {
  User, Brain, ListChecks, Layout, Zap, Pencil,
  ChevronRight, Sparkles, Shield, MessageSquare,
} from 'lucide-react';
import type { EmployeeSpec } from '../../../types';

export type BlueprintSection =
  | 'role'        // 角色定位
  | 'persona'     // 人设性格
  | 'capabilities'// 能力标签
  | 'workflow'    // 工作流
  | 'workspace'   // 工作台
  | 'checklist'   // 自检清单
  | 'commands';   // 快捷指令

interface Props {
  spec: EmployeeSpec;
  onEdit: (section: BlueprintSection) => void;
  onConfirm: () => void;
  onAdjust: () => void;
}

/* ── tiny section block ── */
function Section({
  icon: Icon,
  title,
  children,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 min-w-[140px] p-3 rounded-xl bg-parchment/60 border border-border-cream
                 hover:border-terracotta/25 hover:bg-terracotta/4 transition-all text-left group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Icon size={13} className="text-terracotta" />
          <span className="text-[11px] font-medium text-olive-gray">{title}</span>
        </div>
        <Pencil
          size={10}
          className="text-stone-gray opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
      <div className="text-xs text-near-black leading-relaxed">{children}</div>
    </button>
  );
}

/* ── tag pill ── */
function Tag({ text, accent }: { text: string; accent?: boolean }) {
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-[10px] mr-1 mb-1 ${
        accent
          ? 'bg-terracotta/10 text-terracotta'
          : 'bg-warm-sand/60 text-olive-gray'
      }`}
    >
      {text}
    </span>
  );
}

const WORKSPACE_LABELS: Record<string, string> = {
  'three-panel': '三栏工作台',
  dashboard: '仪表盘',
  chat: '纯对话',
  document: '文档编辑',
};

export default function BlueprintCard({ spec, onEdit, onConfirm, onAdjust }: Props) {
  const caps = spec.capabilities || [];
  const workflow = spec.workflow || [];
  const persona = spec.personaTags || [];
  const checklist = spec.checklist || [];
  const commands = spec.quickCommands || [];
  const wsLabel = WORKSPACE_LABELS[spec.workspaceType || 'chat'] || '对话';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card-glass-warm rounded-2xl overflow-hidden"
    >
      {/* ── Header: identity ── */}
      <button
        onClick={() => onEdit('role')}
        className="w-full p-5 pb-3 flex items-center gap-3 hover:bg-terracotta/4 transition-colors text-left group"
      >
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
            spec.color || 'from-slate-400 to-gray-300'
          } flex items-center justify-center text-2xl shadow-sm`}
        >
          {spec.avatar || '🤖'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-near-black font-semibold truncate">
              {spec.name || '新员工'}
            </h3>
            {spec.englishName && (
              <span className="text-xs text-stone-gray">{spec.englishName}</span>
            )}
            <Pencil
              size={10}
              className="text-stone-gray opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <p className="text-xs text-olive-gray truncate">
            {spec.tagline || spec.role || '描述待填写'}
          </p>
        </div>
      </button>

      {/* ── Body: sections grid ── */}
      <div className="px-5 pb-4 flex flex-wrap gap-2">
        {/* 能力 */}
        <Section icon={Zap} title="能力" onClick={() => onEdit('capabilities')}>
          {caps.length > 0 ? (
            <div className="flex flex-wrap">
              {caps.slice(0, 6).map((c) => (
                <Tag key={c} text={c} accent />
              ))}
              {caps.length > 6 && <Tag text={`+${caps.length - 6}`} />}
            </div>
          ) : (
            <span className="text-stone-gray">待配置</span>
          )}
        </Section>

        {/* 工作流 */}
        <Section icon={ListChecks} title="工作流" onClick={() => onEdit('workflow')}>
          {workflow.length > 0 ? (
            <div className="space-y-0.5">
              {workflow.slice(0, 4).map((s, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-terracotta/15 text-terracotta text-[9px] flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="truncate text-[11px]">{s}</span>
                </div>
              ))}
              {workflow.length > 4 && (
                <span className="text-[10px] text-stone-gray">+{workflow.length - 4} 步</span>
              )}
            </div>
          ) : (
            <span className="text-stone-gray">待配置</span>
          )}
        </Section>

        {/* 工作台 */}
        <Section icon={Layout} title="工作台" onClick={() => onEdit('workspace')}>
          <span>{wsLabel}</span>
        </Section>

        {/* 性格 */}
        <Section icon={MessageSquare} title="性格" onClick={() => onEdit('persona')}>
          {persona.length > 0 ? (
            <div className="flex flex-wrap">
              {persona.map((t) => (
                <Tag key={t} text={t} />
              ))}
            </div>
          ) : (
            spec.personality ? <span>{spec.personality}</span> : <span className="text-stone-gray">待配置</span>
          )}
        </Section>

        {/* 边界 */}
        {(spec.boundaries && spec.boundaries.length > 0) && (
          <Section icon={Shield} title="边界" onClick={() => onEdit('persona')}>
            <div className="space-y-0.5">
              {spec.boundaries.slice(0, 3).map((b, i) => (
                <div key={i} className="text-[11px] text-olive-gray truncate">· {b}</div>
              ))}
            </div>
          </Section>
        )}

        {/* 自检清单 */}
        {checklist.length > 0 && (
          <Section icon={ListChecks} title="自检" onClick={() => onEdit('checklist')}>
            <span className="text-[11px]">{checklist.length} 项检查</span>
          </Section>
        )}

        {/* 快捷指令 */}
        {commands.length > 0 && (
          <Section icon={Zap} title="快捷指令" onClick={() => onEdit('commands')}>
            <div className="flex flex-wrap">
              {commands.slice(0, 4).map((c) => (
                <Tag key={c} text={c} />
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* ── Footer: actions ── */}
      <div className="px-5 py-3 border-t border-border-cream flex items-center justify-between">
        <button
          onClick={onAdjust}
          className="text-xs text-olive-gray hover:text-terracotta transition-colors flex items-center gap-1"
        >
          <Pencil size={11} />
          我想调整
        </button>
        <button
          onClick={onConfirm}
          className="btn-terracotta text-xs px-5 py-2 gap-1.5"
        >
          <Sparkles size={13} />
          开始打造
        </button>
      </div>
    </motion.div>
  );
}
