import { useState } from 'react';
import {
  Plus,
  X,
  Check,
  TrendingUp,
  Users,
  Zap,
  Calendar,
  Wallet,
  Target,
  MessageSquare,
} from 'lucide-react';
import type {
  DashboardCard,
  DashboardCardType,
} from '../../data/partner';
import {
  ALL_DASHBOARD_CARDS,
  TEAM_MEMBERS,
} from '../../data/partner';

// ── Props ──
interface DashboardCardsProps {
  cards: DashboardCard[];
  onToggleCard?: (type: DashboardCardType) => void;
  onNav?: (tab: string) => void;
}

// ── Per-card content renderers ──

function TodoContent() {
  const items = [
    { text: '审批火花文章初稿', done: false },
    { text: '确认4月税务申报', done: false },
    { text: '回复供应商合同意见', done: true },
  ];
  return (
    <div className="space-y-1.5">
      {items.map((t) => (
        <label key={t.text} className="flex items-center gap-2 text-[12px] cursor-pointer group">
          <span
            className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
              t.done
                ? 'bg-terracotta/80 border-terracotta/80'
                : 'border-stone-gray/40 group-hover:border-terracotta/60'
            }`}
          >
            {t.done && <Check size={10} className="text-white" />}
          </span>
          <span className={t.done ? 'line-through text-stone-gray' : 'text-charcoal-warm'}>
            {t.text}
          </span>
        </label>
      ))}
    </div>
  );
}

function TeamStatusContent() {
  const statusDot: Record<string, string> = {
    online: 'bg-green-400',
    working: 'bg-amber-400 animate-pulse',
    offline: 'bg-gray-300',
  };
  const statusText: Record<string, string> = {
    online: '在线待命',
    working: '执行任务中',
    offline: '未激活',
  };
  return (
    <div className="space-y-1.5">
      {TEAM_MEMBERS.filter((m) => !m.locked).map((m) => (
        <div key={m.id} className="flex items-center gap-2 text-[12px]">
          <span className="text-sm">{m.avatar}</span>
          <span className="text-charcoal-warm font-medium">{m.name}</span>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot[m.status]}`} />
          <span className="text-stone-gray text-[11px] ml-auto truncate">
            {statusText[m.status]}
          </span>
        </div>
      ))}
    </div>
  );
}

function EfficiencyContent() {
  const metrics = [
    { label: '本周任务', value: '23项', icon: TrendingUp },
    { label: '节省时间', value: '18h', icon: Zap },
    { label: '满意度', value: '96%', icon: Users },
  ];
  return (
    <div className="flex gap-3">
      {metrics.map((m) => (
        <div key={m.label} className="flex-1 text-center">
          <m.icon size={13} className="text-terracotta mx-auto mb-0.5" />
          <div className="text-[13px] font-bold text-near-black">{m.value}</div>
          <div className="text-[10px] text-stone-gray">{m.label}</div>
        </div>
      ))}
    </div>
  );
}

function QuickActionsContent({ onNav }: { onNav?: (tab: string) => void }) {
  const actions = [
    { label: '写文章', tab: 'team', emoji: '✍️' },
    { label: '查线索', tab: 'team', emoji: '🔍' },
    { label: '看报表', tab: 'finance', emoji: '📊' },
    { label: '管团队', tab: 'team', emoji: '👥' },
  ];
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={() => onNav?.(a.tab)}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-parchment hover:bg-terracotta/10 text-[12px] text-charcoal-warm transition-colors"
        >
          <span>{a.emoji}</span>
          <span>{a.label}</span>
        </button>
      ))}
    </div>
  );
}

function ScheduleContent() {
  const items = [
    { time: '14:00', text: '团队周会', tag: '会议' },
    { time: '16:30', text: '客户演示 — 科技公司', tag: '外部' },
  ];
  return (
    <div className="space-y-1.5">
      {items.map((s) => (
        <div key={s.text} className="flex items-center gap-2 text-[12px]">
          <Calendar size={12} className="text-terracotta shrink-0" />
          <span className="text-stone-gray w-10 shrink-0">{s.time}</span>
          <span className="text-charcoal-warm truncate flex-1">{s.text}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-terracotta/10 text-terracotta shrink-0">
            {s.tag}
          </span>
        </div>
      ))}
    </div>
  );
}

function FinanceContent() {
  const balance = 8420.5;
  const monthSpent = 3180.0;
  const budgetPct = 38;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="text-[11px] text-stone-gray">余额</span>
        <span className="text-[15px] font-bold text-near-black font-serif">¥{balance.toFixed(0)}</span>
        <span className="text-[11px] text-stone-gray ml-auto">本月 ¥{monthSpent.toFixed(0)}</span>
      </div>
      <div className="h-1.5 bg-border-cream rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-terracotta/60 transition-all"
          style={{ width: `${budgetPct}%` }}
        />
      </div>
      <div className="text-[10px] text-stone-gray">预算使用 {budgetPct}%</div>
    </div>
  );
}

function LeadsContent() {
  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-1">
          <Target size={12} className="text-terracotta" />
          <span className="text-[11px] text-stone-gray">新线索</span>
        </div>
        <div className="text-[16px] font-bold text-near-black mt-0.5">12</div>
        <div className="text-[10px] text-stone-gray">较上周 +3</div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-1">
          <TrendingUp size={12} className="text-terracotta" />
          <span className="text-[11px] text-stone-gray">转化率</span>
        </div>
        <div className="text-[16px] font-bold text-near-black mt-0.5">18%</div>
        <div className="text-[10px] text-stone-gray">行业均值 12%</div>
      </div>
    </div>
  );
}

function RecentChatsContent() {
  const chats = [
    { name: '火花', msg: '文章初稿已完成，请查阅', time: '10:30' },
    { name: '小可', msg: '新增3条高意向线索', time: '09:15' },
    { name: '合伙人', msg: '今日安排已更新', time: '09:00' },
  ];
  return (
    <div className="space-y-1.5">
      {chats.map((c) => (
        <div key={c.name + c.time} className="flex items-center gap-2 text-[12px]">
          <MessageSquare size={12} className="text-terracotta shrink-0" />
          <span className="font-medium text-charcoal-warm shrink-0">{c.name}</span>
          <span className="text-stone-gray truncate flex-1">{c.msg}</span>
          <span className="text-[10px] text-stone-gray shrink-0">{c.time}</span>
        </div>
      ))}
    </div>
  );
}

// ── Card content dispatcher ──
function CardContent({
  type,
  onNav,
}: {
  type: DashboardCardType;
  onNav?: (tab: string) => void;
}) {
  switch (type) {
    case 'todo':
      return <TodoContent />;
    case 'team-status':
      return <TeamStatusContent />;
    case 'efficiency':
      return <EfficiencyContent />;
    case 'quick-actions':
      return <QuickActionsContent onNav={onNav} />;
    case 'schedule':
      return <ScheduleContent />;
    case 'finance':
      return <FinanceContent />;
    case 'leads':
      return <LeadsContent />;
    case 'recent-chats':
      return <RecentChatsContent />;
    default:
      return null;
  }
}

// ── Add-card popover ──
function AddCardPopover({
  cards,
  onToggle,
  onClose,
}: {
  cards: DashboardCard[];
  onToggle?: (type: DashboardCardType) => void;
  onClose: () => void;
}) {
  // Build enabled set from current cards prop
  const enabledSet = new Set(cards.filter((c) => c.enabled).map((c) => c.type));

  return (
    <div className="card-glass p-3 shadow-lg border border-border-cream">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-semibold text-near-black">管理卡片</span>
        <button
          onClick={onClose}
          className="p-0.5 rounded hover:bg-parchment text-stone-gray transition-colors"
        >
          <X size={14} />
        </button>
      </div>
      <div className="space-y-1">
        {ALL_DASHBOARD_CARDS.map((card) => {
          const isEnabled = enabledSet.has(card.type);
          return (
            <button
              key={card.type}
              onClick={() => onToggle?.(card.type)}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-parchment transition-colors text-left"
            >
              <span className="text-sm">{card.emoji}</span>
              <span className="text-[12px] text-charcoal-warm flex-1">{card.label}</span>
              <span
                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                  isEnabled
                    ? 'bg-terracotta border-terracotta'
                    : 'border-stone-gray/40'
                }`}
              >
                {isEnabled && <Check size={10} className="text-white" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ──
export default function DashboardCards({ cards, onToggleCard, onNav }: DashboardCardsProps) {
  const [showAdd, setShowAdd] = useState(false);

  const enabledCards = cards.filter((c) => c.enabled);

  return (
    <div className="space-y-3">
      {/* Rendered cards */}
      {enabledCards.map((card) => (
        <div key={card.type} className="card-glass p-3">
          {/* Header */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-sm">{card.emoji}</span>
            <h3 className="text-[13px] font-semibold text-near-black">{card.label}</h3>
          </div>
          {/* Content */}
          <CardContent type={card.type} onNav={onNav} />
        </div>
      ))}

      {/* Add card button + popover */}
      <div className="relative">
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-1.5 w-full justify-center py-2 rounded-xl border border-dashed border-stone-gray/30 text-[12px] text-stone-gray hover:border-terracotta/50 hover:text-terracotta transition-colors"
        >
          <Plus size={14} />
          <span>添加卡片</span>
        </button>

        {showAdd && (
          <div className="absolute bottom-full left-0 right-0 mb-2 z-20">
            <AddCardPopover
              cards={cards}
              onToggle={onToggleCard}
              onClose={() => setShowAdd(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
