import { Wallet, Radio, Database, TrendingUp, TrendingDown, CheckCircle, XCircle } from 'lucide-react';

// ── 财务快照 ──
export function FinanceSnapshotWidget() {
  return (
    <div className="card-glass p-4">
      <div className="flex items-center gap-2 mb-3">
        <Wallet size={15} className="text-terracotta" />
        <h3 className="text-[13px] font-semibold text-near-black">财务快照</h3>
      </div>
      <div className="space-y-3">
        <div>
          <div className="text-[11px] text-stone-gray">账户余额</div>
          <div className="text-lg font-bold text-near-black font-serif">¥128.50</div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="text-[11px] text-stone-gray">本月消耗</div>
            <div className="flex items-center gap-1">
              <span className="text-[13px] font-semibold text-near-black">¥42.30</span>
              <TrendingDown size={12} className="text-success-green" />
            </div>
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-stone-gray">上月消耗</div>
            <div className="flex items-center gap-1">
              <span className="text-[13px] font-semibold text-near-black">¥88.20</span>
              <TrendingUp size={12} className="text-terracotta" />
            </div>
          </div>
        </div>
        {/* Mini bar */}
        <div className="h-1.5 bg-border-cream rounded-full overflow-hidden">
          <div className="h-full bg-terracotta/60 rounded-full" style={{ width: '33%' }} />
        </div>
        <div className="text-[10px] text-stone-gray">本月预算使用 33%</div>
      </div>
    </div>
  );
}

// ── 通讯状态 ──
export function ChannelStatusWidget() {
  const channels = [
    { name: '企业微信',   status: 'online' as const },
    { name: '飞书',       status: 'online' as const },
    { name: '微信公众号',  status: 'online' as const },
    { name: 'Telegram',   status: 'offline' as const },
    { name: '邮件',       status: 'online' as const },
  ];

  return (
    <div className="card-glass p-4">
      <div className="flex items-center gap-2 mb-3">
        <Radio size={15} className="text-terracotta" />
        <h3 className="text-[13px] font-semibold text-near-black">通讯状态</h3>
        <span className="text-[11px] text-success-green ml-auto">
          {channels.filter(c => c.status === 'online').length}/{channels.length} 在线
        </span>
      </div>
      <div className="space-y-1.5">
        {channels.map(c => (
          <div key={c.name} className="flex items-center gap-2 py-1">
            {c.status === 'online'
              ? <CheckCircle size={13} className="text-success-green" />
              : <XCircle size={13} className="text-stone-gray" />
            }
            <span className="text-[12px] text-charcoal-warm flex-1">{c.name}</span>
            <span className={`text-[10px] ${c.status === 'online' ? 'text-success-green' : 'text-stone-gray'}`}>
              {c.status === 'online' ? '在线' : '离线'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 知识库动态 ──
export function KnowledgeRecentWidget() {
  const docs = [
    { name: '品牌VI手册 v3', time: '3分钟前', agent: '🔥' },
    { name: '3月财务报表', time: '2小时前', agent: '📊' },
    { name: '客户FAQ更新', time: '5小时前', agent: '💬' },
    { name: 'HR政策文档', time: '1天前', agent: '👤' },
  ];

  return (
    <div className="card-glass p-4">
      <div className="flex items-center gap-2 mb-3">
        <Database size={15} className="text-terracotta" />
        <h3 className="text-[13px] font-semibold text-near-black">知识库动态</h3>
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
