// TimelineView.tsx — 记忆同步时间线
// 展示前端本地操作与同步日志，不代表服务端审计流水

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  ChevronDown,
  Plus,
  RefreshCw,
  Minus,
  Clock,
  User,
  FileText,
} from 'lucide-react';
import { usePersonaStore } from '../../stores/personaStore';
import type { SystemLog } from '../../stores/personaStore';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// ─── Employee Config ───────────────────────────────────────────────
const EMPLOYEES = [
  { id: 'spark', emoji: '🔥', name: '火花', role: '品牌设计', color: 'orange' },
  { id: 'xiaoke', emoji: '🎯', name: '小可', role: '获客增长', color: 'blue' },
  { id: 'shuxi', emoji: '📚', name: '书熙', role: '数据分析', color: 'emerald' },
  { id: 'shuibao', emoji: '💰', name: '税宝', role: '财税合规', color: 'yellow' },
  { id: 'lvan', emoji: '🛡', name: '绿安', role: '法务风控', color: 'purple' },
] as const;

const EMP_MAP = Object.fromEntries(EMPLOYEES.map((e) => [e.id, e]));

const CATEGORY_FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'memory_added', label: '新增' },
  { key: 'memory_updated', label: '替换' },
  { key: 'memory_removed', label: '删除' },
  { key: 'soul_edited', label: '灵魂编辑' },
  { key: 'shared_updated', label: '共享更新' },
] as const;

const DOT_COLORS: Record<string, string> = {
  memory_added: 'bg-emerald-400',
  memory_updated: 'bg-amber-400',
  memory_removed: 'bg-red-400',
  soul_edited: 'bg-purple-400',
  shared_updated: 'bg-blue-400',
};

const ACTION_ICONS: Record<string, { icon: typeof Plus; label: string }> = {
  memory_added:   { icon: Plus,      label: '+ 新增' },
  memory_updated: { icon: RefreshCw, label: '≈ 替换' },
  memory_removed: { icon: Minus,     label: '− 删除' },
  soul_edited:    { icon: User,      label: '✎ 灵魂' },
  shared_updated: { icon: FileText,  label: '⇄ 共享' },
};

// ─── Group logs by date ────────────────────────────────────────────
interface DateGroup {
  label: string;
  key: string;
  logs: SystemLog[];
}

function groupLogsByDate(logs: SystemLog[]): DateGroup[] {
  const groups: Map<string, DateGroup> = new Map();

  const sorted = [...logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  for (const log of sorted) {
    const d = new Date(log.timestamp);
    let label: string;
    let key: string;

    if (isToday(d)) {
      label = '今天';
      key = 'today';
    } else if (isYesterday(d)) {
      label = '昨天';
      key = 'yesterday';
    } else {
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 3) {
        label = `${diffDays} 天前`;
        key = `${diffDays}d`;
      } else {
        label = format(d, 'yyyy-MM-dd');
        key = label;
      }
    }

    if (!groups.has(key)) {
      groups.set(key, { label, key, logs: [] });
    }
    groups.get(key)!.logs.push(log);
  }

  return Array.from(groups.values());
}

// ─── Timeline Node ─────────────────────────────────────────────────
function TimelineNode({ log, isLast }: { log: SystemLog; isLast: boolean }) {
  const emp = log.employeeId ? EMP_MAP[log.employeeId] : null;
  const actionInfo = ACTION_ICONS[log.action] ?? { icon: Clock, label: log.action };
  const ActionIcon = actionInfo.icon;
  const dotColor = DOT_COLORS[log.action] ?? 'bg-stone-gray';
  const ts = new Date(log.timestamp);
  const timeStr = format(ts, 'HH:mm:ss');
  const relativeStr = formatDistanceToNow(ts, { locale: zhCN, addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-4"
    >
      {/* Timeline spine */}
      <div className="flex flex-col items-center w-6 flex-shrink-0">
        <div className={`w-3 h-3 rounded-full ${dotColor} ring-4 ring-parchment flex-shrink-0 mt-1.5`} />
        {!isLast && <div className="w-0.5 flex-1 bg-border-warm mt-1" />}
      </div>

      {/* Content card */}
      <div className="flex-1 pb-5">
        <div className="card-glass rounded-xl px-4 py-3 hover:shadow-md transition-shadow">
          {/* Top row: time + employee + action */}
          <div className="flex items-center gap-3 mb-1.5">
            <span className="text-caption text-stone-gray flex items-center gap-1">
              <Clock size={11} />
              {timeStr}
            </span>
            <span className="text-caption text-warm-silver">·</span>
            <span className="text-caption text-stone-gray">{relativeStr}</span>

            {emp && (
              <>
                <span className="text-caption text-warm-silver">·</span>
                <span className="flex items-center gap-1 text-xs font-medium text-charcoal-warm">
                  {emp.emoji} {emp.name}
                </span>
              </>
            )}

            <span className="ml-auto">
              <span className={`
                inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full
                ${log.action === 'memory_added' ? 'bg-emerald-50 text-emerald-700' : ''}
                ${log.action === 'memory_updated' ? 'bg-amber-50 text-amber-700' : ''}
                ${log.action === 'memory_removed' ? 'bg-red-50 text-red-700' : ''}
                ${log.action === 'soul_edited' ? 'bg-purple-50 text-purple-700' : ''}
                ${log.action === 'shared_updated' ? 'bg-blue-50 text-blue-700' : ''}
              `}>
                <ActionIcon size={10} />
                {actionInfo.label}
              </span>
            </span>
          </div>

          {/* Detail content */}
          <p className="text-body text-sm text-charcoal-warm leading-relaxed">
            {log.detail}
          </p>

          {/* Source badge */}
          <div className="flex items-center gap-2 mt-2">
            <span className="badge text-[10px]">
              {log.action.includes('memory') ? '本地记忆日志' : log.action === 'soul_edited' ? '本地灵魂日志' : '本地共享日志'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Timeline View ────────────────────────────────────────────
export default function TimelineView() {
  const { logs } = usePersonaStore();
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [empDropdownOpen, setEmpDropdownOpen] = useState(false);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedEmployee !== 'all' && log.employeeId !== selectedEmployee) return false;
      if (selectedCategory !== 'all' && log.action !== selectedCategory) return false;
      return true;
    });
  }, [logs, selectedEmployee, selectedCategory]);

  // Group by date
  const dateGroups = useMemo(() => groupLogsByDate(filteredLogs), [filteredLogs]);

  const selectedEmpInfo = selectedEmployee === 'all'
    ? null
    : EMPLOYEES.find((e) => e.id === selectedEmployee);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-4 rounded-2xl border border-border-cream bg-warm-sand/35 px-5 py-4">
        <p className="text-sm font-medium text-near-black">本地同步日志</p>
        <p className="mt-1 text-xs leading-relaxed text-stone-gray">
          这里展示的是前端记录的记忆编辑、缓存与同步事件，便于排查本地状态变化；它不是服务端审计流水，也不保证覆盖所有后端操作。
        </p>
      </div>

      {/* ── Filter Bar ── */}
      <div className="card-glass rounded-2xl px-5 py-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Employee dropdown */}
          <div className="relative">
            <button
              onClick={() => setEmpDropdownOpen(!empDropdownOpen)}
              className="btn-sand flex items-center gap-2 min-w-[140px] justify-between"
            >
              <span className="flex items-center gap-1.5">
                <Filter size={14} />
                {selectedEmpInfo ? (
                  <>{selectedEmpInfo.emoji} {selectedEmpInfo.name}</>
                ) : (
                  '全部员工'
                )}
              </span>
              <ChevronDown size={14} className={`transition-transform ${empDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {empDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full left-0 mt-1 w-48 bg-ivory rounded-xl shadow-lg border border-border-cream z-20 overflow-hidden"
                >
                  <button
                    onClick={() => { setSelectedEmployee('all'); setEmpDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-warm-sand/50 transition-colors
                      ${selectedEmployee === 'all' ? 'bg-warm-sand/30 font-medium' : ''}
                    `}
                  >
                    全部员工
                  </button>
                  {EMPLOYEES.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => { setSelectedEmployee(emp.id); setEmpDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-warm-sand/50 transition-colors flex items-center gap-2
                        ${selectedEmployee === emp.id ? 'bg-warm-sand/30 font-medium' : ''}
                      `}
                    >
                      <span>{emp.emoji}</span>
                      <span>{emp.name}</span>
                      <span className="text-caption text-stone-gray ml-auto">{emp.role}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Category filter tags */}
          <div className="flex gap-1.5 flex-wrap flex-1">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer
                  ${selectedCategory === cat.key
                    ? 'bg-terracotta text-ivory shadow-sm'
                    : 'bg-warm-sand/60 text-charcoal-warm hover:bg-warm-sand'
                  }
                `}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Count */}
          <span className="text-caption text-stone-gray flex-shrink-0">
            {filteredLogs.length} 条记录
          </span>
        </div>
      </div>

      {/* ── Timeline Content ── */}
      {dateGroups.length > 0 ? (
        <div className="space-y-6">
          {dateGroups.map((group) => (
            <div key={group.key}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="heading-card text-near-black">{group.label}</span>
                <div className="flex-1 h-px bg-border-warm" />
                <span className="badge text-xs">{group.logs.length} 条</span>
              </div>

              {/* Timeline nodes */}
              <div className="ml-2">
                {group.logs.map((log, idx) => (
                  <TimelineNode
                    key={log.id}
                    log={log}
                    isLast={idx === group.logs.length - 1}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Empty State ── */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-warm-sand/50 flex items-center justify-center mb-4">
            <Clock size={32} className="text-stone-gray opacity-40" />
          </div>
          <p className="text-lg font-medium text-charcoal-warm mb-1">暂无本地同步记录</p>
          <p className="text-caption text-stone-gray max-w-sm">
            当页面发生记忆编辑、缓存回退或同步动作时，本地日志会按时间线展示在这里。
            <br />
            试试新增、删除记忆，或在离线后恢复连接观察同步行为。
          </p>
        </motion.div>
      )}
    </div>
  );
}
