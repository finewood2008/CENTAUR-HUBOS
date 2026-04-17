// Finance 财务中心 - SDK 对接版（billing + models + apikey）
import { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  Key, Plus, Eye, EyeOff, Trash2,
  DollarSign, TrendingUp, BarChart3, Shield,
  Loader2,
} from 'lucide-react';
import { useFinanceData, type FinanceData } from '../../hooks/useQeeClaw';
import { getApiKeyModule } from '../../services/qeeclaw';
import { useToast } from '../shared/Toast';
import { FINANCE_DATA } from '../../data/digital-employees';
import type { AppKeyRecord, LLMKeyRecord, ModelCostBreakdownItem } from '@qeeclaw/core-sdk';

interface FinanceProps {
  isConnected: boolean;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

function formatCurrency(n: number): string {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default function Finance({ isConnected }: FinanceProps) {
  const { data, loading, refresh } = useFinanceData(isConnected);
  const { toast } = useToast();
  const hasSdkData = data.wallet !== null;

  const totalBalance = hasSdkData ? data.wallet!.balance : FINANCE_DATA.totalBalance;
  const monthlySpent = hasSdkData ? data.wallet!.currentMonthSpent : FINANCE_DATA.monthlySpent;
  const monthlyBudget = data.quota?.monthlyLimit ?? FINANCE_DATA.monthlyBudget;
  const spentPercent = Math.min((monthlySpent / (monthlyBudget || 1)) * 100, 100);

  return (
    <div className="flex-1 overflow-y-auto bg-parchment">
      {/* Header */}
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
            {hasSdkData && <span className="ml-2 text-success-green text-xs">· SDK</span>}
          </p>
        </motion.div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 text-stone-gray animate-spin" />
        </div>
      ) : (
        <div className="px-8 pb-8 space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <motion.div className="card-glass-warm p-5" variants={fadeUp} initial="hidden" animate="visible" custom={0}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-success-green/10 flex items-center justify-center">
                  <DollarSign size={16} className="text-success-green" />
                </div>
                <span className="text-xs text-stone-gray font-medium">账户余额</span>
              </div>
              <p className="text-2xl font-serif text-success-green font-semibold">
                {hasSdkData ? data.wallet!.currency : '¥'}{formatCurrency(totalBalance)}
              </p>
              <p className="text-xs text-olive-gray mt-1">QeeClaw AI 账户</p>
            </motion.div>

            <motion.div className="card-glass-warm p-5" variants={fadeUp} initial="hidden" animate="visible" custom={1}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-terracotta/10 flex items-center justify-center">
                  <TrendingUp size={16} className="text-terracotta" />
                </div>
                <span className="text-xs text-stone-gray font-medium">本月消费</span>
              </div>
              <p className="text-2xl font-serif text-near-black font-semibold">
                ¥{formatCurrency(monthlySpent)}
              </p>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-olive-gray mb-1">
                  <span>已用 {spentPercent.toFixed(0)}%</span>
                  <span>预算 ¥{formatCurrency(monthlyBudget)}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-warm-sand overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      spentPercent > 80 ? 'bg-error-crimson' : spentPercent > 60 ? 'bg-terracotta' : 'bg-success-green'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${spentPercent}%` }}
                    transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
                  />
                </div>
              </div>
            </motion.div>

            <motion.div className="card-glass-warm p-5" variants={fadeUp} initial="hidden" animate="visible" custom={2}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-terracotta/10 flex items-center justify-center">
                  <Shield size={16} className="text-terracotta" />
                </div>
                <span className="text-xs text-stone-gray font-medium">月度预算</span>
              </div>
              <p className="text-2xl font-serif text-near-black font-semibold">
                ¥{formatCurrency(monthlyBudget)}
              </p>
              <p className="text-xs text-olive-gray mt-1">
                {data.quota?.monthlyUnlimited ? '无限额' : `剩余 ¥${formatCurrency(monthlyBudget - monthlySpent)}`}
              </p>
            </motion.div>
          </div>

          {/* API Key 管理 */}
          <ApiKeySection data={data} hasSdkData={hasSdkData} isConnected={isConnected} onRefresh={refresh} toast={toast} />

          {/* 用量明细 */}
          <UsageSection data={data} hasSdkData={hasSdkData} />
        </div>
      )}
    </div>
  );
}

// ── API Key 管理区 ────────────────────────────────────
function ApiKeySection({ data, hasSdkData, isConnected, onRefresh, toast }: {
  data: FinanceData;
  hasSdkData: boolean;
  isConnected: boolean;
  onRefresh: () => Promise<void>;
  toast: (type: 'success' | 'error' | 'info', msg: string) => void;
}) {
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  const toggleReveal = (id: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateKey = async () => {
    if (!isConnected) { toast('error', 'SDK 离线，无法创建密钥'); return; }
    setCreating(true);
    try {
      const result = await getApiKeyModule().create();
      toast('success', `密钥已创建：${result.appKey.slice(0, 8)}...`);
      await refresh();
    } catch {
      toast('error', '创建密钥失败');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAppKey = async (id: number, name: string) => {
    if (!isConnected) { toast('error', 'SDK 离线，无法删除'); return; }
    try {
      await getApiKeyModule().remove(id);
      toast('success', `已删除「${name}」`);
      await refresh();
    } catch {
      toast('error', '删除失败');
    }
  };

  const handleDeleteLLMKey = async (id: number, name: string) => {
    if (!isConnected) { toast('error', 'SDK 离线，无法删除'); return; }
    try {
      await getApiKeyModule().removeLLMKey(id);
      toast('success', `已删除「${name}」`);
      await refresh();
    } catch {
      toast('error', '删除失败');
    }
  };

  const appKeys = hasSdkData ? data.appKeys : [];
  const llmKeys = hasSdkData ? data.llmKeys : [];
  const mockKeys = !hasSdkData ? FINANCE_DATA.keys : [];

  return (
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
        <button onClick={handleCreateKey} disabled={creating} className="btn-terracotta text-xs gap-1.5 px-3 py-1.5 disabled:opacity-50">
          {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          添加密钥
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-warm-sand text-left">
              <th className="pb-2 pr-4 text-xs font-medium text-stone-gray">名称</th>
              <th className="pb-2 pr-4 text-xs font-medium text-stone-gray">密钥</th>
              <th className="pb-2 pr-4 text-xs font-medium text-stone-gray">类型</th>
              <th className="pb-2 pr-4 text-xs font-medium text-stone-gray">状态</th>
              <th className="pb-2 pr-4 text-xs font-medium text-stone-gray">创建时间</th>
              <th className="pb-2 text-xs font-medium text-stone-gray">操作</th>
            </tr>
          </thead>
          <tbody>
            {/* SDK App Keys */}
            {appKeys.map((k, idx) => (
              <AppKeyRow key={`app-${k.id}`} record={k} idx={idx} revealed={revealedKeys.has(`app-${k.id}`)} onToggle={() => toggleReveal(`app-${k.id}`)} onDelete={() => handleDeleteAppKey(k.id, k.keyName || `App Key #${k.id}`)} />
            ))}
            {/* SDK LLM Keys */}
            {llmKeys.map((k, idx) => (
              <LLMKeyRow key={`llm-${k.id}`} record={k} idx={appKeys.length + idx} revealed={revealedKeys.has(`llm-${k.id}`)} onToggle={() => toggleReveal(`llm-${k.id}`)} onDelete={() => handleDeleteLLMKey(k.id, k.name || `LLM Key #${k.id}`)} />
            ))}
            {/* Mock fallback */}
            {mockKeys.map((k, idx) => (
              <motion.tr
                key={k.id}
                className="border-b border-warm-sand/50 hover:bg-ivory/60 transition-colors"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={idx + 3}
              >
                <td className="py-3 pr-4"><span className="text-near-black font-medium">{k.name}</span></td>
                <td className="py-3 pr-4">
                  <code className="text-xs bg-warm-sand/50 px-2 py-0.5 rounded font-mono text-olive-gray">
                    {revealedKeys.has(k.id) ? k.key.replace('****', 'abcd') : k.key}
                  </code>
                </td>
                <td className="py-3 pr-4 text-olive-gray text-xs">App</td>
                <td className="py-3 pr-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${k.status === 'active' ? 'bg-success-green/15 text-success-green' : k.status === 'disabled' ? 'bg-stone-gray/15 text-stone-gray' : 'bg-error-crimson/15 text-error-crimson'}`}>
                    {k.status === 'active' ? '运行中' : k.status === 'disabled' ? '已禁用' : '已过期'}
                  </span>
                </td>
                <td className="py-3 pr-4 text-xs text-stone-gray">{k.createdAt}</td>
                <td className="py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleReveal(k.id)} className="p-1.5 rounded-md hover:bg-warm-sand/60 text-olive-gray transition-colors">
                      {revealedKeys.has(k.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button onClick={() => toast('info', '演示模式不支持删除')} className="p-1.5 rounded-md hover:bg-error-crimson/10 text-stone-gray hover:text-error-crimson transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {appKeys.length === 0 && llmKeys.length === 0 && mockKeys.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-stone-gray text-sm">暂无密钥</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function AppKeyRow({ record, idx, revealed, onToggle, onDelete }: { record: AppKeyRecord; idx: number; revealed: boolean; onToggle: () => void; onDelete: () => void }) {
  const masked = `${record.appKey.slice(0, 6)}****${record.appKey.slice(-4)}`;
  return (
    <motion.tr className="border-b border-warm-sand/50 hover:bg-ivory/60 transition-colors" variants={fadeUp} initial="hidden" animate="visible" custom={idx + 3}>
      <td className="py-3 pr-4"><span className="text-near-black font-medium">{record.keyName || `App Key #${record.id}`}</span></td>
      <td className="py-3 pr-4">
        <code className="text-xs bg-warm-sand/50 px-2 py-0.5 rounded font-mono text-olive-gray">
          {revealed ? record.appKey : masked}
        </code>
      </td>
      <td className="py-3 pr-4 text-olive-gray text-xs">{record.role}</td>
      <td className="py-3 pr-4">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${record.isActive ? 'bg-success-green/15 text-success-green' : 'bg-stone-gray/15 text-stone-gray'}`}>
          {record.isActive ? '运行中' : '已禁用'}
        </span>
      </td>
      <td className="py-3 pr-4 text-xs text-stone-gray">{record.createTime?.split('T')[0]}</td>
      <td className="py-3">
        <div className="flex items-center gap-1">
          <button onClick={onToggle} className="p-1.5 rounded-md hover:bg-warm-sand/60 text-olive-gray transition-colors">
            {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-md hover:bg-error-crimson/10 text-stone-gray hover:text-error-crimson transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

function LLMKeyRow({ record, idx, revealed, onToggle, onDelete }: { record: LLMKeyRecord; idx: number; revealed: boolean; onToggle: () => void; onDelete: () => void }) {
  const masked = `${record.key.slice(0, 6)}****${record.key.slice(-4)}`;
  return (
    <motion.tr className="border-b border-warm-sand/50 hover:bg-ivory/60 transition-colors" variants={fadeUp} initial="hidden" animate="visible" custom={idx + 3}>
      <td className="py-3 pr-4"><span className="text-near-black font-medium">{record.name || `LLM Key #${record.id}`}</span></td>
      <td className="py-3 pr-4">
        <code className="text-xs bg-warm-sand/50 px-2 py-0.5 rounded font-mono text-olive-gray">
          {revealed ? record.key : masked}
        </code>
      </td>
      <td className="py-3 pr-4 text-olive-gray text-xs">LLM</td>
      <td className="py-3 pr-4">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${record.isActive ? 'bg-success-green/15 text-success-green' : 'bg-stone-gray/15 text-stone-gray'}`}>
          {record.isActive ? '运行中' : '已禁用'}
        </span>
      </td>
      <td className="py-3 pr-4 text-xs text-stone-gray">{record.createdTime?.split('T')[0]}</td>
      <td className="py-3">
        <div className="flex items-center gap-1">
          <button onClick={onToggle} className="p-1.5 rounded-md hover:bg-warm-sand/60 text-olive-gray transition-colors">
            {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-md hover:bg-error-crimson/10 text-stone-gray hover:text-error-crimson transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

// ── 用量明细区 ───────────────────────────────────────
function UsageSection({ data, hasSdkData }: { data: FinanceData; hasSdkData: boolean }) {
  const breakdown: { name: string; label: string; calls: number; chars: number; cost: number }[] = [];

  if (hasSdkData && data.costSummary && data.costSummary.breakdown.length > 0) {
    const usageMap = new Map<string, { inputChars: number; outputChars: number }>();
    if (data.usageSummary) {
      for (const item of data.usageSummary.breakdown) {
        usageMap.set(item.productName, { inputChars: item.textInputChars, outputChars: item.textOutputChars });
      }
    }

    for (const item of data.costSummary.breakdown) {
      const usage = usageMap.get(item.productName);
      breakdown.push({
        name: item.productName,
        label: item.label,
        calls: item.callCount,
        chars: (usage?.inputChars ?? 0) + (usage?.outputChars ?? 0),
        cost: item.amount ?? 0,
      });
    }
  }

  if (breakdown.length === 0 && !hasSdkData) {
    for (const eu of FINANCE_DATA.employeeUsage) {
      breakdown.push({
        name: eu.employeeId,
        label: eu.employeeName,
        calls: 0,
        chars: eu.monthlyTokens,
        cost: eu.monthlyCost,
      });
    }
  }

  const maxChars = Math.max(...breakdown.map(b => b.chars), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.35 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={18} className="text-terracotta" />
        <h2 className="font-serif text-lg text-near-black">
          {hasSdkData ? '模型用量明细（近7天）' : '员工用量明细'}
        </h2>
      </div>

      {breakdown.length === 0 ? (
        <div className="card-glass-warm p-8 text-center text-stone-gray text-sm">暂无用量数据</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {breakdown.map((item, idx) => (
            <motion.div
              key={item.name}
              className="card-glass-warm p-5"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={idx + 7}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif text-near-black font-medium">{item.label}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-olive-gray">
                      {hasSdkData ? `${item.calls} 次调用` : `月 Tokens: ${formatTokens(item.chars)}`}
                    </span>
                    <span className="text-xs text-terracotta font-medium">
                      ¥{formatCurrency(item.cost)}
                    </span>
                  </div>
                </div>
              </div>
              {/* 用量条 */}
              <div className="mt-2">
                <div className="flex justify-between text-xs text-olive-gray mb-1">
                  <span>{formatTokens(item.chars)} chars</span>
                </div>
                <div className="w-full h-2 rounded-full bg-warm-sand overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-terracotta/70"
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.chars / maxChars) * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.4 + idx * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
