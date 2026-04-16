// Finance 财务中心 - API Key 管理 & 用量统计
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Key, Plus, Eye, EyeOff, Trash2,
  DollarSign, TrendingUp, BarChart3, Shield,
} from 'lucide-react';
import type { ApiKey, FinanceOverview, EmployeeUsage } from '../../types';
import { FINANCE_DATA } from '../../data/digital-employees';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: 'easeOut' },
  }),
};

const statusLabels: Record<ApiKey['status'], { text: string; cls: string }> = {
  active:   { text: '运行中', cls: 'bg-success-green/15 text-success-green' },
  disabled: { text: '已禁用', cls: 'bg-stone-gray/15 text-stone-gray' },
  expired:  { text: '已过期', cls: 'bg-error-crimson/15 text-error-crimson' },
};

const employeeLabels: Record<string, string> = {
  all:      '全部员工',
  spark:    '火花 Spark',
  xiaoke:   '小克 Xiaoke',
  shuxi:    '数析 Shuxi',
  shuibao:  '税保 Shuibao',
  lvan:     '律安 Lvan',
};

function formatCurrency(n: number): string {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default function Finance() {
  const data: FinanceOverview = FINANCE_DATA;
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  const toggleReveal = (id: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const spentPercent = Math.min((data.monthlySpent / data.monthlyBudget) * 100, 100);

  return (
    <div className="flex-1 overflow-y-auto bg-parchment">
      {/* ── Header ── */}
      <div className="px-8 pt-8 pb-2">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-serif text-2xl text-near-black tracking-tight">
            财务中心
          </h1>
          <p className="text-sm text-stone-gray mt-1">
            API 密钥管理 · 用量监控 · 预算追踪
          </p>
        </motion.div>
      </div>

      <div className="px-8 pb-8 space-y-6">
        {/* ── Overview Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* 账户余额 */}
          <motion.div
            className="card-glass-warm p-5"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-success-green/10 flex items-center justify-center">
                <DollarSign size={16} className="text-success-green" />
              </div>
              <span className="text-xs text-stone-gray font-medium">账户余额</span>
            </div>
            <p className="text-2xl font-serif text-success-green font-semibold">
              ¥{formatCurrency(data.totalBalance)}
            </p>
            <p className="text-xs text-olive-gray mt-1">Anthropic API 账户</p>
          </motion.div>

          {/* 本月消费 */}
          <motion.div
            className="card-glass-warm p-5"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-terracotta/10 flex items-center justify-center">
                <TrendingUp size={16} className="text-terracotta" />
              </div>
              <span className="text-xs text-stone-gray font-medium">本月消费</span>
            </div>
            <p className="text-2xl font-serif text-near-black font-semibold">
              ¥{formatCurrency(data.monthlySpent)}
            </p>
            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-olive-gray mb-1">
                <span>已用 {spentPercent.toFixed(0)}%</span>
                <span>预算 ¥{formatCurrency(data.monthlyBudget)}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-warm-sand overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    spentPercent > 80 ? 'bg-error-crimson' : spentPercent > 60 ? 'bg-terracotta' : 'bg-success-green'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${spentPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                />
              </div>
            </div>
          </motion.div>

          {/* 月度预算 */}
          <motion.div
            className="card-glass-warm p-5"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-terracotta/10 flex items-center justify-center">
                <Shield size={16} className="text-terracotta" />
              </div>
              <span className="text-xs text-stone-gray font-medium">月度预算</span>
            </div>
            <p className="text-2xl font-serif text-near-black font-semibold">
              ¥{formatCurrency(data.monthlyBudget)}
            </p>
            <p className="text-xs text-olive-gray mt-1">
              剩余 ¥{formatCurrency(data.monthlyBudget - data.monthlySpent)}
            </p>
          </motion.div>
        </div>

        {/* ── API Key 管理 ── */}
        <motion.div
          className="card-glass p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Key size={18} className="text-terracotta" />
              <h2 className="font-serif text-lg text-near-black">API Key 管理</h2>
            </div>
            <button className="btn-terracotta text-xs gap-1.5 px-3 py-1.5">
              <Plus size={14} />
              添加密钥
            </button>
          </div>

          {/* Keys table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-warm-sand text-left">
                  <th className="pb-2 pr-4 text-xs font-medium text-stone-gray">名称</th>
                  <th className="pb-2 pr-4 text-xs font-medium text-stone-gray">密钥</th>
                  <th className="pb-2 pr-4 text-xs font-medium text-stone-gray">绑定员工</th>
                  <th className="pb-2 pr-4 text-xs font-medium text-stone-gray">状态</th>
                  <th className="pb-2 pr-4 text-xs font-medium text-stone-gray">额度 (月)</th>
                  <th className="pb-2 pr-4 text-xs font-medium text-stone-gray">最近使用</th>
                  <th className="pb-2 text-xs font-medium text-stone-gray">操作</th>
                </tr>
              </thead>
              <tbody>
                {data.keys.map((k, idx) => {
                  const st = statusLabels[k.status];
                  const isRevealed = revealedKeys.has(k.id);
                  const usedPercent = k.monthlyLimit > 0
                    ? Math.min((k.monthlyUsed / k.monthlyLimit) * 100, 100)
                    : 0;

                  return (
                    <motion.tr
                      key={k.id}
                      className="border-b border-warm-sand/50 hover:bg-ivory/60 transition-colors"
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      custom={idx + 3}
                    >
                      <td className="py-3 pr-4">
                        <span className="text-near-black font-medium">{k.name}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <code className="text-xs bg-warm-sand/50 px-2 py-0.5 rounded font-mono text-olive-gray">
                          {isRevealed ? k.key.replace('****', 'abcd') : k.key}
                        </code>
                      </td>
                      <td className="py-3 pr-4 text-olive-gray">
                        {employeeLabels[k.employeeId] || k.employeeId}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>
                          {st.text}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="space-y-1">
                          <span className="text-xs text-olive-gray">
                            ¥{formatCurrency(k.monthlyUsed)} / ¥{formatCurrency(k.monthlyLimit)}
                          </span>
                          <div className="w-20 h-1.5 rounded-full bg-warm-sand overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                usedPercent > 80 ? 'bg-error-crimson' : 'bg-terracotta'
                              }`}
                              style={{ width: `${usedPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-xs text-stone-gray">
                        {k.lastUsed}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleReveal(k.id)}
                            className="p-1.5 rounded-md hover:bg-warm-sand/60 text-olive-gray transition-colors"
                            title={isRevealed ? '隐藏' : '显示'}
                          >
                            {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button
                            className="p-1.5 rounded-md hover:bg-error-crimson/10 text-stone-gray hover:text-error-crimson transition-colors"
                            title="删除"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ── 员工用量明细 ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.35 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-terracotta" />
            <h2 className="font-serif text-lg text-near-black">员工用量明细</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.employeeUsage.map((eu, idx) => {
              const maxTokens = Math.max(...eu.dailyBreakdown.map((d) => d.tokens));

              return (
                <motion.div
                  key={eu.employeeId}
                  className="card-glass-warm p-5"
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={idx + 7}
                >
                  {/* Employee header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-serif text-near-black font-medium">
                        {eu.employeeName}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-olive-gray">
                          月 Tokens: {formatTokens(eu.monthlyTokens)}
                        </span>
                        <span className="text-xs text-terracotta font-medium">
                          ¥{formatCurrency(eu.monthlyCost)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 7-day bar chart (CSS-only) */}
                  <div className="flex items-end gap-1.5 h-24">
                    {eu.dailyBreakdown.map((day, di) => {
                      const pct = maxTokens > 0 ? (day.tokens / maxTokens) * 100 : 0;
                      return (
                        <div
                          key={day.date}
                          className="flex-1 flex flex-col items-center gap-1"
                        >
                          <motion.div
                            className="w-full rounded-t-md bg-terracotta/70 hover:bg-terracotta transition-colors relative group cursor-default"
                            initial={{ height: 0 }}
                            animate={{ height: `${pct}%` }}
                            transition={{
                              duration: 0.5,
                              delay: 0.4 + di * 0.06,
                              ease: 'easeOut',
                            }}
                          >
                            {/* Tooltip */}
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:block
                              bg-near-black text-ivory text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                              {formatTokens(day.tokens)} · ¥{day.cost.toFixed(0)}
                            </div>
                          </motion.div>
                          <span className="text-[10px] text-stone-gray leading-none">
                            {day.date.split('-')[1]}日
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
