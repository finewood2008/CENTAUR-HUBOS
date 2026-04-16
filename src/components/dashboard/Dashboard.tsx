// Hub OS - Dashboard 控制台首页（公司早报风格）
import { motion } from 'framer-motion';
import {
  Zap, TrendingUp, AlertTriangle, ShieldAlert, Plus, CreditCard, Wallet,
  ArrowUpRight, ArrowDownRight, Activity, Clock, CheckCircle2, XCircle,
} from 'lucide-react';
import type { Agent, Alert, UsageStat } from '../../types';

interface WalletData {
  balance: number;
  currency: string;
  currentMonthSpent: number;
  totalSpent: number;
}

interface DashboardProps {
  agents: Agent[];
  alerts: Alert[];
  usage: UsageStat[];
  wallet: WalletData | null;
  onGoAgents: () => void;
}

const statusDot: Record<string, string> = {
  running: 'bg-[#4a7c59] shadow-[0_0_0_2px_rgba(74,124,89,0.3)]',
  idle: 'bg-stone-gray',
  error: 'bg-[#b53333] shadow-[0_0_0_2px_rgba(181,51,51,0.3)] animate-pulse',
};

const statusLabel: Record<string, string> = {
  running: '工作中',
  idle: '待命',
  error: '异常',
};

export default function Dashboard({ agents, alerts, usage, wallet, onGoAgents }: DashboardProps) {
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
    <div className="flex-1 overflow-y-auto p-8 space-y-8">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-section text-xl text-near-black">早上好 👋</h1>
          <p className="text-sm text-stone-gray mt-0.5">
            {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })} · 今日公司早报
          </p>
          <p className="text-xs text-stone-gray mt-1">
            你的 {agents.length} 名 AI 员工已累计完成 {totalTasks} 项任务，节省约 {Math.round(totalTasks * 0.5)} 小时人力
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onGoAgents}
            className="btn-terracotta gap-1.5 text-xs"
          >
            <Plus size={14} /> 安装新员工
          </button>
          <button className="btn-sand gap-1.5 text-xs">
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
          color="text-[#4a7c59]"
          bg="bg-[#4a7c59]/10"
        />
        <StatCard
          icon={<CheckCircle2 size={18} />}
          label="今日任务"
          value={String(totalTasks)}
          sub="已完成"
          color="text-olive-gray"
          bg="bg-stone-gray/10"
        />
        <StatCard
          icon={<Zap size={18} />}
          label="今日消耗"
          value={todayUsage ? `${(todayUsage.tokens / 1000).toFixed(0)}K` : '—'}
          sub={
            <span className={`inline-flex items-center gap-0.5 ${isUp ? 'text-[#b53333]' : 'text-[#4a7c59]'}`}>
              {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(Number(usageDelta))}% vs 昨日
            </span>
          }
          color="text-terracotta"
          bg="bg-terracotta/10"
        />
        <StatCard
          icon={<ShieldAlert size={18} />}
          label="安全告警"
          value={String(alerts.length)}
          sub={alerts.filter((a) => a.severity === 'critical').length > 0 ? '有紧急事项' : '一切正常'}
          color={alerts.filter((a) => a.severity === 'critical').length > 0 ? 'text-[#b53333]' : 'text-stone-gray'}
          bg={alerts.filter((a) => a.severity === 'critical').length > 0 ? 'bg-[#b53333]/10' : 'bg-stone-gray/10'}
        />
      </div>

      {/* 双栏：工作汇报 + 算力趋势 */}
      <div className="grid grid-cols-5 gap-4">
        {/* 左侧：今日工作汇报 */}
        <div className="col-span-3 card p-5">
          <h2 className="heading-section text-sm text-near-black mb-4 flex items-center gap-2">
            <Clock size={16} className="text-terracotta" />
            今日工作汇报
          </h2>
          <div className="space-y-3">
            {agents.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-parchment ring-interactive"
              >
                <span className="text-xl mt-0.5">{agent.avatar}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-near-black">{agent.name}</span>
                    <span className={`badge text-[10px] ${
                      agent.status === 'running' ? 'badge-success' :
                      agent.status === 'error' ? 'badge-error' :
                      'bg-stone-gray/15 text-stone-gray'
                    }`}>
                      {statusLabel[agent.status]}
                    </span>
                    <span className="text-[10px] text-stone-gray">{agent.role}</span>
                  </div>
                  <p className="text-xs text-olive-gray mt-1 leading-relaxed">{agent.todaySummary}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-stone-gray">
                    <span>📋 {agent.todayTasks} 个任务</span>
                    <span>⚡ 配额 {agent.budgetUsed}/{agent.budgetPercent}%</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 右侧：算力消耗趋势 */}
        <div className="col-span-2 card p-5">
          <h2 className="heading-section text-sm text-near-black mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-olive-gray" />
            近 7 日算力消耗
          </h2>
          <div className="flex items-end gap-2 h-32 mt-2">
            {usage.map((u, i) => {
              const h = (u.tokens / maxTokens) * 100;
              const isToday = i === usage.length - 1;
              return (
                <div key={u.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-stone-gray">{(u.tokens / 1000).toFixed(0)}K</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className={`w-full rounded-t-md ${isToday ? 'bg-gradient-to-t from-terracotta to-[#d97757]' : 'bg-warm-sand'}`}
                  />
                  <span className={`text-[9px] ${isToday ? 'text-terracotta' : 'text-stone-gray'}`}>{u.date}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-border-cream space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-stone-gray">7 日总消耗</span>
              <span className="text-near-black">{(usage.reduce((s, u) => s + u.tokens, 0) / 1000).toFixed(0)}K tokens</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-stone-gray">日均消耗</span>
              <span className="text-near-black">{(usage.reduce((s, u) => s + u.tokens, 0) / usage.length / 1000).toFixed(0)}K tokens</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-stone-gray">预计剩余天数</span>
              <span className="text-terracotta font-medium">
                {(() => {
                  const dailyAvg = usage.reduce((s, u) => s + u.cost, 0) / usage.length;
                  if (wallet && dailyAvg > 0) {
                    return `约 ${Math.floor(wallet.balance / dailyAvg)} 天`;
                  }
                  return '—';
                })()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 钱包余额 */}
      {wallet && (
        <div className="card p-5">
          <h2 className="heading-section text-sm text-near-black mb-3 flex items-center gap-2">
            <Wallet size={16} className="text-[#4a7c59]" />
            账户钱包
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-[10px] text-stone-gray mb-1">当前余额</div>
              <div className="text-xl font-semibold text-[#4a7c59] font-serif">
                {wallet.currency === 'CNY' ? '¥' : '$'}{wallet.balance.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-stone-gray mb-1">本月已花费</div>
              <div className="text-xl font-semibold text-near-black font-serif">
                {wallet.currency === 'CNY' ? '¥' : '$'}{wallet.currentMonthSpent.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-stone-gray mb-1">累计花费</div>
              <div className="text-xl font-semibold text-olive-gray font-serif">
                {wallet.currency === 'CNY' ? '¥' : '$'}{wallet.totalSpent.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 异常告警 */}
      {alerts.length > 0 && (
        <div className="card p-5">
          <h2 className="heading-section text-sm text-near-black mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-terracotta" />
            异常告警
          </h2>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  alert.severity === 'critical' ? 'bg-[#b53333]/5 border border-[#b53333]/10' : 'bg-terracotta/5 border border-terracotta/10'
                }`}
              >
                {alert.severity === 'critical' ? (
                  <XCircle size={16} className="text-[#b53333] shrink-0" />
                ) : (
                  <AlertTriangle size={16} className="text-terracotta shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-olive-gray">
                    <span className="font-medium text-near-black">{alert.agentName}</span>
                    {' · '}
                    {alert.message}
                  </span>
                </div>
                <span className="text-[10px] text-stone-gray shrink-0">{alert.time}</span>
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
    <div className="stat-card">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value text-near-black">{value}</div>
      <div className="text-[11px] text-stone-gray mt-1">{sub}</div>
    </div>
  );
}
