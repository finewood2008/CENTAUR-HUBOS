// Hub OS - Dashboard 控制台首页（公司早报风格）
import { motion } from 'framer-motion';
import {
  Zap, TrendingUp, AlertTriangle, ShieldAlert, Plus, CreditCard,
  ArrowUpRight, ArrowDownRight, Activity, Clock, CheckCircle2, XCircle,
} from 'lucide-react';
import type { Agent, Alert, UsageStat } from '../../types';

interface DashboardProps {
  agents: Agent[];
  alerts: Alert[];
  usage: UsageStat[];
  onGoAgents: () => void;
}

const statusDot: Record<string, string> = {
  running: 'bg-green-400 shadow-green-400/50',
  idle: 'bg-gray-400',
  error: 'bg-red-400 shadow-red-400/50 animate-pulse',
};

const statusLabel: Record<string, string> = {
  running: '工作中',
  idle: '待命',
  error: '异常',
};

export default function Dashboard({ agents, alerts, usage, onGoAgents }: DashboardProps) {
  const totalTasks = agents.reduce((s, a) => s + a.todayTasks, 0);
  const runningCount = agents.filter((a) => a.status === 'running').length;
  const todayUsage = usage[usage.length - 1];
  const yesterdayUsage = usage[usage.length - 2];
  const usageDelta = todayUsage && yesterdayUsage
    ? ((todayUsage.tokens - yesterdayUsage.tokens) / yesterdayUsage.tokens * 100).toFixed(0)
    : '0';
  const isUp = Number(usageDelta) >= 0;

  // 简单 bar chart 计算
  const maxTokens = Math.max(...usage.map((u) => u.tokens));

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">早上好 👋</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })} · 今日公司早报
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onGoAgents}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 text-orange-400 text-xs rounded-lg hover:bg-orange-500/20 transition-colors border border-orange-500/20"
          >
            <Plus size={14} /> 安装新员工
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-gray-400 text-xs rounded-lg hover:bg-white/10 transition-colors border border-white/5">
            <CreditCard size={14} /> 充值电量
          </button>
        </div>
      </div>

      {/* 指标卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<Activity size={18} />}
          label="在线员工"
          value={`${runningCount}/${agents.length}`}
          sub="正在工作"
          color="text-green-400"
          bg="bg-green-500/10"
        />
        <StatCard
          icon={<CheckCircle2 size={18} />}
          label="今日任务"
          value={String(totalTasks)}
          sub="已完成"
          color="text-blue-400"
          bg="bg-blue-500/10"
        />
        <StatCard
          icon={<Zap size={18} />}
          label="今日消耗"
          value={todayUsage ? `${(todayUsage.tokens / 1000).toFixed(0)}K` : '—'}
          sub={
            <span className={`inline-flex items-center gap-0.5 ${isUp ? 'text-red-400' : 'text-green-400'}`}>
              {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(Number(usageDelta))}% vs 昨日
            </span>
          }
          color="text-orange-400"
          bg="bg-orange-500/10"
        />
        <StatCard
          icon={<ShieldAlert size={18} />}
          label="安全告警"
          value={String(alerts.length)}
          sub={alerts.filter((a) => a.severity === 'critical').length > 0 ? '有紧急事项' : '一切正常'}
          color={alerts.filter((a) => a.severity === 'critical').length > 0 ? 'text-red-400' : 'text-gray-400'}
          bg={alerts.filter((a) => a.severity === 'critical').length > 0 ? 'bg-red-500/10' : 'bg-white/5'}
        />
      </div>

      {/* 双栏：工作汇报 + 算力趋势 */}
      <div className="grid grid-cols-5 gap-4">
        {/* 左侧：今日工作汇报 */}
        <div className="col-span-3 bg-white/[0.03] rounded-xl border border-white/5 p-5">
          <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Clock size={16} className="text-orange-400" />
            今日工作汇报
          </h2>
          <div className="space-y-3">
            {agents.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
              >
                <span className="text-xl mt-0.5">{agent.avatar}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{agent.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      agent.status === 'running' ? 'bg-green-500/15 text-green-400' :
                      agent.status === 'error' ? 'bg-red-500/15 text-red-400' :
                      'bg-gray-500/15 text-gray-400'
                    }`}>
                      {statusLabel[agent.status]}
                    </span>
                    <span className="text-[10px] text-gray-600">{agent.role}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{agent.todaySummary}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-600">
                    <span>📋 {agent.todayTasks} 个任务</span>
                    <span>⚡ 配额 {agent.budgetUsed}/{agent.budgetPercent}%</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 右侧：算力消耗趋势 */}
        <div className="col-span-2 bg-white/[0.03] rounded-xl border border-white/5 p-5">
          <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-400" />
            近 7 日算力消耗
          </h2>
          <div className="flex items-end gap-2 h-32 mt-2">
            {usage.map((u, i) => {
              const h = (u.tokens / maxTokens) * 100;
              const isToday = i === usage.length - 1;
              return (
                <div key={u.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-gray-500">{(u.tokens / 1000).toFixed(0)}K</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className={`w-full rounded-t-md ${isToday ? 'bg-gradient-to-t from-orange-600 to-orange-400' : 'bg-white/10'}`}
                  />
                  <span className={`text-[9px] ${isToday ? 'text-orange-400' : 'text-gray-600'}`}>{u.date}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">7 日总消耗</span>
              <span className="text-white">{(usage.reduce((s, u) => s + u.tokens, 0) / 1000).toFixed(0)}K tokens</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">日均消耗</span>
              <span className="text-white">{(usage.reduce((s, u) => s + u.tokens, 0) / usage.length / 1000).toFixed(0)}K tokens</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">预计剩余天数</span>
              <span className="text-orange-400 font-medium">约 18 天</span>
            </div>
          </div>
        </div>
      </div>

      {/* 异常告警 */}
      {alerts.length > 0 && (
        <div className="bg-white/[0.03] rounded-xl border border-white/5 p-5">
          <h2 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400" />
            异常告警
          </h2>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  alert.severity === 'critical' ? 'bg-red-500/5 border border-red-500/10' : 'bg-amber-500/5 border border-amber-500/10'
                }`}
              >
                {alert.severity === 'critical' ? (
                  <XCircle size={16} className="text-red-400 shrink-0" />
                ) : (
                  <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-gray-300">
                    <span className="font-medium text-white">{alert.agentName}</span>
                    {' · '}
                    {alert.message}
                  </span>
                </div>
                <span className="text-[10px] text-gray-600 shrink-0">{alert.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 指标卡片组件
function StatCard({
  icon, label, value, sub, color, bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: React.ReactNode;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-white/[0.03] rounded-xl border border-white/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="text-[11px] text-gray-500 mt-1">{sub}</div>
    </div>
  );
}
