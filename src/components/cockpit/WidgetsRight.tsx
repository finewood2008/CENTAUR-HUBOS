import { Wallet, Radio, Database, TrendingDown, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { FinanceData, ChannelsData, ChannelItem, KnowledgeData } from '../../hooks/useQeeClaw';
import type { NavTab } from '../../types';

// ── Mock fallback ──
const MOCK_FINANCE = { balance: 128.50, monthSpent: 42.30, budgetPercent: 33 };
const MOCK_CHANNELS = [
  { name: '企业微信',   status: 'online' as const },
  { name: '飞书',       status: 'online' as const },
  { name: '微信公众号',  status: 'online' as const },
  { name: 'Telegram',   status: 'offline' as const },
  { name: '邮件',       status: 'online' as const },
];
const MOCK_DOCS = [
  { name: '品牌VI手册 v3', time: '3分钟前', agent: '🔥' },
  { name: '3月财务报表', time: '2小时前', agent: '📊' },
  { name: '客户FAQ更新', time: '5小时前', agent: '💬' },
  { name: 'HR政策文档', time: '1天前', agent: '👤' },
];

// ── 财务快照 ──
interface FinanceSnapshotProps {
  data?: FinanceData;
  loading?: boolean;
  isConnected?: boolean;
  onNav?: (tab: NavTab) => void;
}

export function FinanceSnapshotWidget({ data, loading, isConnected, onNav }: FinanceSnapshotProps) {
  if (loading) {
    return (
      <div className="card-glass p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wallet size={15} className="text-terracotta" />
          <h3 className="text-[13px] font-semibold text-near-black">财务快照</h3>
        </div>
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-5 bg-border-cream/60 rounded animate-pulse" />)}
        </div>
      </div>
    );
  }

  const useSDK = isConnected && data?.wallet;
  const balance = useSDK ? (data!.wallet!.balance ?? 0) : MOCK_FINANCE.balance;
  const monthSpent = useSDK ? (data!.wallet!.currentMonthSpent ?? 0) : MOCK_FINANCE.monthSpent;
  // 7日消耗趋势 — SDK有costSummary时用真实数据
  const weeklySpent = useSDK && data!.costSummary
    ? (data!.costSummary as any).totalCost ?? monthSpent * 0.25
    : monthSpent * 0.25;
  const budgetPercent = useSDK
    ? Math.min(100, Math.round((monthSpent / Math.max(balance + monthSpent, 1)) * 100))
    : MOCK_FINANCE.budgetPercent;

  return (
    <div className="card-glass p-4 cursor-pointer hover:ring-1 hover:ring-terracotta/30 transition-all" onClick={() => onNav?.('finance')}>
      <div className="flex items-center gap-2 mb-3">
        <Wallet size={15} className="text-terracotta" />
        <h3 className="text-[13px] font-semibold text-near-black">财务快照</h3>
      </div>
      <div className="space-y-3">
        <div>
          <div className="text-[11px] text-stone-gray">账户余额</div>
          <div className="text-lg font-bold text-near-black font-serif">¥{balance.toFixed(2)}</div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="text-[11px] text-stone-gray">本月消耗</div>
            <div className="flex items-center gap-1">
              <span className="text-[13px] font-semibold text-near-black">¥{monthSpent.toFixed(1)}</span>
              <TrendingDown size={12} className="text-success-green" />
            </div>
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-stone-gray">近7日消耗</div>
            <div className="text-[13px] font-semibold text-near-black">¥{weeklySpent.toFixed(1)}</div>
          </div>
        </div>
        {/* Budget bar */}
        <div className="h-1.5 bg-border-cream rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${budgetPercent > 80 ? 'bg-red-400' : 'bg-terracotta/60'}`}
            style={{ width: `${budgetPercent}%` }}
          />
        </div>
        <div className="text-[10px] text-stone-gray">本月预算使用 {budgetPercent}%</div>
      </div>
    </div>
  );
}

// ── 通讯状态（紧凑横排） ──
interface ChannelStatusProps {
  data?: ChannelsData;
  loading?: boolean;
  isConnected?: boolean;
  onNav?: (tab: NavTab) => void;
}

export function ChannelStatusWidget({ data, loading, isConnected, onNav }: ChannelStatusProps) {
  if (loading) {
    return (
      <div className="card-glass p-4">
        <div className="flex items-center gap-2 mb-3">
          <Radio size={15} className="text-terracotta" />
          <h3 className="text-[13px] font-semibold text-near-black">通讯状态</h3>
        </div>
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-5 bg-border-cream/60 rounded animate-pulse" />)}
        </div>
      </div>
    );
  }

  const useSDK = isConnected && data && data.items && data.items.length > 0;

  type ChannelDisplay = { name: string; status: 'online' | 'offline' };
  let channels: ChannelDisplay[];

  if (useSDK) {
    channels = data!.items.map((ch: ChannelItem) => ({
      name: ch.channelName || ch.channelKey,
      status: ch.enabled && ch.configured ? 'online' : 'offline',
    }));
  } else {
    channels = MOCK_CHANNELS;
  }

  const onlineCount = channels.filter(c => c.status === 'online').length;
  const offlineChannels = channels.filter(c => c.status === 'offline');

  return (
    <div className="card-glass p-4 cursor-pointer hover:ring-1 hover:ring-terracotta/30 transition-all" onClick={() => onNav?.('channels')}>
      <div className="flex items-center gap-2 mb-3">
        <Radio size={15} className="text-terracotta" />
        <h3 className="text-[13px] font-semibold text-near-black">通讯状态</h3>
        <span className="text-[11px] text-success-green ml-auto">
          {onlineCount}/{channels.length} 在线
        </span>
      </div>

      {/* 离线通道警告 */}
      {offlineChannels.length > 0 && (
        <div className="mb-2 px-2 py-1.5 bg-red-50 border border-red-200/60 rounded-lg flex items-center gap-1.5">
          <AlertTriangle size={12} className="text-red-500 shrink-0" />
          <span className="text-[11px] text-red-600">
            {offlineChannels.map(c => c.name).join('、')} 离线
          </span>
        </div>
      )}

      {/* 紧凑横排 icon+状态点 */}
      <div className="flex flex-wrap gap-2">
        {channels.map(c => (
          <div
            key={c.name}
            className={`flex items-center gap-1.5 py-1 px-2 rounded-lg text-[11px] transition-colors ${
              c.status === 'offline'
                ? 'bg-red-50 text-red-600 border border-red-200/40'
                : 'bg-parchment text-charcoal-warm'
            }`}
            title={`${c.name}: ${c.status === 'online' ? '在线' : '离线'}`}
          >
            {c.status === 'online'
              ? <CheckCircle size={11} className="text-success-green shrink-0" />
              : <XCircle size={11} className="text-red-500 shrink-0 animate-pulse" />
            }
            <span className="truncate max-w-[64px]">{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 知识库动态 ──
interface KnowledgeRecentProps {
  data?: KnowledgeData;
  loading?: boolean;
  isConnected?: boolean;
  onNav?: (tab: NavTab) => void;
}

function timeAgoShort(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}小时前`;
  return `${Math.floor(hrs / 24)}天前`;
}

export function KnowledgeRecentWidget({ data, loading, isConnected, onNav }: KnowledgeRecentProps) {
  if (loading) {
    return (
      <div className="card-glass p-4">
        <div className="flex items-center gap-2 mb-3">
          <Database size={15} className="text-terracotta" />
          <h3 className="text-[13px] font-semibold text-near-black">知识库动态</h3>
        </div>
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-5 bg-border-cream/60 rounded animate-pulse" />)}
        </div>
      </div>
    );
  }

  const useSDK = isConnected && data && data.bases && data.bases.length > 0;

  type DocDisplay = { name: string; time: string; agent: string };
  let docs: DocDisplay[];

  if (useSDK) {
    docs = data!.bases.slice(0, 4).map(b => ({
      name: b.name,
      time: timeAgoShort(b.updated_time),
      agent: '📚',
    }));
  } else {
    docs = MOCK_DOCS;
  }

  return (
    <div className="card-glass p-4 cursor-pointer hover:ring-1 hover:ring-terracotta/30 transition-all" onClick={() => onNav?.('knowledge')}>
      <div className="flex items-center gap-2 mb-3">
        <Database size={15} className="text-terracotta" />
        <h3 className="text-[13px] font-semibold text-near-black">知识库动态</h3>
        {useSDK && data!.stats && (
          <span className="text-[10px] text-stone-gray ml-auto">
            共 {data!.stats.total_files} 文件
          </span>
        )}
      </div>
      <div className="space-y-2">
        {docs.map(d => (
          <div key={d.name} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-parchment rounded-lg px-1.5 transition-colors">
            <span className="text-sm">{d.agent}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-charcoal-warm truncate">{d.name}</div>
              <div className="text-[10px] text-stone-gray">{d.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
