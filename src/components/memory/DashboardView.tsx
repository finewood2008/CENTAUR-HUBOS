// DashboardView.tsx — 记忆中心总览仪表盘
// 统计卡片 / 共享认知 / 员工认知卡片 / 系统日志

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  HardDrive,
  Users,
  TrendingUp,
  ChevronDown,
  Ghost,
  BookOpen,
  Sparkles,
  Clock,
} from 'lucide-react';
import { usePersonaStore } from '../../stores/personaStore';
import type { SystemLog } from '../../stores/personaStore';
import { useMemoryCenter } from '../../features/memory/useMemoryCenter';
import type { MemoryEntry } from '../../features/memory/types';
import { useSharedContext } from '../../features/shared-context/useSharedContext';
import { SharedContextCards } from '../shared/SharedContextCards';

// ─── Employee Config ───────────────────────────────────────────────
const LEADER = { id: 'leader', emoji: '🧑‍💼', name: '主管', role: '团队统管', color: 'indigo' } as const;

const EMPLOYEES = [
  { id: 'spark', emoji: '🔥', name: '火花', role: '品牌设计', color: 'orange' },
  { id: 'xiaoke', emoji: '🎯', name: '小可', role: '获客增长', color: 'blue' },
  { id: 'shuxi', emoji: '📚', name: '书熙', role: '数据分析', color: 'emerald' },
  { id: 'shuibao', emoji: '💰', name: '税宝', role: '财税合规', color: 'yellow' },
  { id: 'lvan', emoji: '🛡', name: '绿安', role: '法务风控', color: 'purple' },
] as const;

const ALL_MEMBERS = [LEADER, ...EMPLOYEES] as const;

const COLOR_MAP: Record<string, { bg: string; text: string; ring: string; bar: string }> = {
  indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-700',  ring: 'ring-indigo-200',  bar: 'bg-indigo-400' },
  orange:  { bg: 'bg-orange-50',  text: 'text-orange-700',  ring: 'ring-orange-200',  bar: 'bg-orange-400' },
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    ring: 'ring-blue-200',    bar: 'bg-blue-400' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', bar: 'bg-emerald-400' },
  yellow:  { bg: 'bg-yellow-50',  text: 'text-yellow-700',  ring: 'ring-yellow-200',  bar: 'bg-yellow-400' },
  purple:  { bg: 'bg-purple-50',  text: 'text-purple-700',  ring: 'ring-purple-200',  bar: 'bg-purple-400' },
};

const CATEGORY_LABELS: Record<string, string> = {
  preference: '偏好',
  fact: '事实',
  lesson: '经验',
  correction: '纠正',
};

const ACTION_LABELS: Record<string, string> = {
  memory_added: '新增记忆',
  memory_removed: '删除记忆',
  memory_updated: '更新记忆',
  soul_edited: '编辑灵魂',
  shared_updated: '更新共享',
};

// ─── Stat Card ─────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: typeof Database;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-glass rounded-2xl p-5 flex flex-col gap-2"
    >
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg ${accent} flex items-center justify-center`}>
          <Icon size={16} className="text-white" />
        </div>
        <span className="text-caption text-stone-gray">{label}</span>
      </div>
      <div className="text-2xl font-semibold text-near-black font-serif">{value}</div>
      {sub && <p className="text-caption text-stone-gray">{sub}</p>}
    </motion.div>
  );
}

// ─── Employee Card ─────────────────────────────────────────────────
function EmployeeCard({
  emp,
  memories,
  soul,
  charLimit,
  isLeader = false,
}: {
  emp: (typeof ALL_MEMBERS)[number];
  memories: MemoryEntry[];
  soul: string;
  charLimit: number;
  isLeader?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const colors = COLOR_MAP[emp.color];

  const totalChars = memories.reduce((sum, m) => sum + m.content.length, 0);
  const usagePct = Math.min(100, Math.round((totalChars / charLimit) * 100));

  // Category distribution
  const catDist = useMemo(() => {
    const dist: Record<string, number> = { preference: 0, fact: 0, lesson: 0, correction: 0 };
    memories.forEach((m) => { dist[m.category] = (dist[m.category] || 0) + 1; });
    return dist;
  }, [memories]);

  // Recent memories (last 3 for regular, last 5 for leader)
  const recent = useMemo(() => {
    return [...memories].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, isLeader ? 5 : 3);
  }, [memories, isLeader]);

  return (
    <motion.div
      layout
      className={`card-glass rounded-2xl overflow-hidden cursor-pointer transition-all duration-200
        ${isLeader ? 'col-span-full border-2 border-indigo-400/60 ring-1 ring-indigo-300/30' : ''}
        ${expanded && !isLeader ? 'col-span-2 row-span-2' : ''}
      `}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`${isLeader ? 'w-12 h-12' : 'w-10 h-10'} rounded-xl ${colors.bg} flex items-center justify-center ${isLeader ? 'text-xl' : 'text-lg'}`}>
              {emp.emoji}
            </div>
            <div>
              <p className={`font-medium text-near-black ${isLeader ? 'text-base' : 'text-sm'}`}>
                {emp.name}
                {isLeader && (
                  <span className="ml-2 inline-flex items-center gap-0.5 text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                    ☆ 团队领导
                  </span>
                )}
              </p>
              <p className="text-caption text-stone-gray">{emp.role}</p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={16} className="text-stone-gray" />
          </motion.div>
        </div>

        {/* Quick stats row */}
        <div className="flex items-center gap-3 mt-3">
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
            <BookOpen size={11} /> {memories.length}
          </span>
          <div className="flex-1 h-1.5 bg-warm-sand rounded-full overflow-hidden">
            <div
              className={`h-full ${colors.bar} rounded-full transition-all duration-300`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
          <span className="text-caption text-stone-gray text-xs">{usagePct}%</span>
        </div>
      </div>

      {/* Expanded Detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 pb-4 border-t border-border-cream pt-3 space-y-3">
              {/* Soul status */}
              <div className="flex items-start gap-2">
                <Ghost size={14} className="text-terracotta mt-0.5 flex-shrink-0" />
                <div className={isLeader ? 'flex-1' : ''}>
                  <p className="text-label mb-0.5">灵魂状态</p>
                  <p className={`text-body text-xs ${isLeader ? 'line-clamp-3' : 'line-clamp-2'}`}>
                    {soul ? soul.slice(0, isLeader ? 200 : 80) + (soul.length > (isLeader ? 200 : 80) ? '...' : '') : '未设置'}
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div className={`grid ${isLeader ? 'grid-cols-4' : 'grid-cols-2'} gap-2`}>
                <div className="bg-warm-sand/40 rounded-lg px-3 py-2">
                  <p className="text-caption text-stone-gray text-xs">记忆条数</p>
                  <p className="font-semibold text-near-black">{memories.length}</p>
                </div>
                <div className="bg-warm-sand/40 rounded-lg px-3 py-2">
                  <p className="text-caption text-stone-gray text-xs">字符用量</p>
                  <p className="font-semibold text-near-black">
                    {totalChars} <span className="text-xs text-stone-gray">/ {charLimit}</span>
                  </p>
                </div>
                {isLeader && (
                  <>
                    <div className="bg-warm-sand/40 rounded-lg px-3 py-2">
                      <p className="text-caption text-stone-gray text-xs">使用率</p>
                      <p className="font-semibold text-near-black">{usagePct}%</p>
                    </div>
                    <div className="bg-warm-sand/40 rounded-lg px-3 py-2">
                      <p className="text-caption text-stone-gray text-xs">角色</p>
                      <p className="font-semibold text-indigo-600">团队统管</p>
                    </div>
                  </>
                )}
              </div>

              {/* Category distribution */}
              <div>
                <p className="text-label mb-1.5">分类分布</p>
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(catDist).map(([cat, count]) => (
                    <span
                      key={cat}
                      className="badge text-xs"
                    >
                      {CATEGORY_LABELS[cat]} {count}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recent memories */}
              {recent.length > 0 && (
                <div>
                  <p className="text-label mb-1.5">最近记忆</p>
                  <div className="space-y-1.5">
                    {recent.map((m) => (
                      <div
                        key={m.id}
                        className="bg-parchment rounded-lg px-3 py-2 text-xs text-charcoal-warm"
                      >
                        <span className="badge-terracotta text-[10px] mr-1.5">{CATEGORY_LABELS[m.category]}</span>
                        {m.content.length > 60 ? m.content.slice(0, 60) + '...' : m.content}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── System Log Entry ──────────────────────────────────────────────
function LogEntry({ log }: { log: SystemLog }) {
  const empInfo = ALL_MEMBERS.find((e) => e.id === log.employeeId);
  const ts = new Date(log.timestamp);
  const timeStr = `${ts.getHours().toString().padStart(2, '0')}:${ts.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div className="flex items-start gap-3 py-2 px-3 hover:bg-warm-sand/30 rounded-lg transition-colors">
      <span className="text-caption text-stone-gray w-12 flex-shrink-0 pt-0.5">{timeStr}</span>
      {empInfo && (
        <span className="text-sm flex-shrink-0">{empInfo.emoji}</span>
      )}
      <div className="flex-1 min-w-0">
        <span className="badge text-[10px] mr-1.5">
          {ACTION_LABELS[log.action] ?? log.action}
        </span>
        <span className="text-body text-xs text-charcoal-warm">{log.detail}</span>
      </div>
    </div>
  );
}

// ─── Main Dashboard View ───────────────────────────────────────────
export default function DashboardView() {
  const employees = usePersonaStore((state) => state.employees);
  const logs = usePersonaStore((state) => state.logs);
  const { agentMemories } = useMemoryCenter();
  const { shared } = useSharedContext();

  // Compute stats
  const allMemories: MemoryEntry[] = Object.values(agentMemories).flat();
  const totalMemories = allMemories.length;
  const totalChars = allMemories.reduce((sum, m) => sum + m.content.length, 0);
  const activeEmployees = ALL_MEMBERS.map((member) => member.id).filter(
    (id) => (agentMemories[id]?.length ?? 0) > 0 || Boolean(employees[id]?.soul),
  ).length;

  // Today's new entries
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayNew = allMemories.filter((m) => new Date(m.createdAt) >= today).length;

  // Storage display
  const storageMB = (totalChars / 1024).toFixed(1);

  // Recent logs (last 20)
  const recentLogs = useMemo(() => {
    return [...logs].reverse().slice(0, 20);
  }, [logs]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Database} label="记忆总数" value={totalMemories} sub="所有员工记忆条目" accent="bg-terracotta" />
        <StatCard icon={HardDrive} label="存储用量" value={`${storageMB} KB`} sub={`${totalChars} 字符`} accent="bg-teal" />
        <StatCard icon={Users} label="活跃员工" value={`${activeEmployees}/6`} sub="已有认知数据" accent="bg-sage-green" />
        <StatCard icon={TrendingUp} label="今日新增" value={todayNew} sub="今日新增记忆" accent="bg-amber" />
      </div>

      {/* ── Shared Knowledge ── */}
      <div>
        <h2 className="heading-card text-near-black mb-3 flex items-center gap-2">
          <Sparkles size={16} className="text-terracotta" />
          共享认知
        </h2>
        <SharedContextCards shared={shared} />
      </div>

      {/* ── Employee Cognition Cards ── */}
      <div>
        <h2 className="heading-card text-near-black mb-3 flex items-center gap-2">
          <Users size={16} className="text-terracotta" />
          员工认知
        </h2>
        {/* Leader card — full width row */}
        <div className="grid grid-cols-1 gap-4 mb-4">
          <EmployeeCard
            emp={LEADER}
            memories={agentMemories.leader}
            soul={employees.leader?.soul ?? ''}
            charLimit={employees.leader?.memoryCharLimit ?? 3000}
            isLeader
          />
        </div>
        {/* Regular employee cards */}
        <div className="grid grid-cols-5 gap-4">
          {EMPLOYEES.map((emp) => (
            <EmployeeCard
              key={emp.id}
              emp={emp}
              memories={agentMemories[emp.id]}
              soul={employees[emp.id]?.soul ?? ''}
              charLimit={employees[emp.id]?.memoryCharLimit ?? 2000}
            />
          ))}
        </div>
      </div>

      {/* ── System Logs ── */}
      <div>
        <h2 className="heading-card text-near-black mb-3 flex items-center gap-2">
          <Clock size={16} className="text-terracotta" />
          系统日志
          <span className="badge text-xs ml-1">{logs.length} 条</span>
        </h2>
        <div className="card-glass rounded-2xl overflow-hidden">
          {recentLogs.length > 0 ? (
            <div className="divide-y divide-border-cream/50 max-h-80 overflow-y-auto">
              {recentLogs.map((log) => (
                <LogEntry key={log.id} log={log} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-stone-gray">
              <Clock size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">暂无系统日志</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
