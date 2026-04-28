import { useState } from 'react';
import {
  Plus,
  X,
  Check,
  Calendar,
  Wallet,
  MessageSquare,
} from 'lucide-react';
import type {
  DashboardCard,
  DashboardCardType,
} from '../../data/partner';
import {
  ALL_DASHBOARD_CARDS,
} from '../../data/partner';

// ── Props ──
interface DashboardCardsProps {
  cards: DashboardCard[];
  onToggleCard?: (type: DashboardCardType) => void;
  onNav?: (tab: string) => void;
}

// ── Per-card content renderers ──

function TodoContent() {
  return (
    <div className="rounded-lg border border-dashed border-border-cream px-3 py-3 text-[12px] text-stone-gray">
      暂无本地审批 API 返回的待办事项。
    </div>
  );
}

function TeamStatusContent() {
  return (
    <div className="rounded-lg border border-dashed border-border-cream px-3 py-3 text-[12px] text-stone-gray">
      团队状态请以本地运行时返回的员工列表为准。
    </div>
  );
}

function EfficiencyContent() {
  return (
    <div className="rounded-lg border border-dashed border-border-cream px-3 py-3 text-[12px] text-stone-gray">
      团队效能请以右侧实时面板和本地运行时返回状态为准。
    </div>
  );
}

function QuickActionsContent({ onNav }: { onNav?: (tab: string) => void }) {
  const actions = [
    { label: '写文章', tab: 'employees', emoji: '✍️' },
    { label: '查线索', tab: 'employees', emoji: '🔍' },
    { label: '看报表', tab: 'finance', emoji: '📊' },
    { label: '管团队', tab: 'employees', emoji: '👥' },
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
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border-cream px-3 py-3 text-[12px] text-stone-gray">
      <Calendar size={12} className="text-terracotta shrink-0" />
      暂无本地工作流 API 返回的日程。
    </div>
  );
}

function FinanceContent() {
  return (
    <div className="space-y-2">
      <div className="text-[12px] text-charcoal-warm leading-5">
        财务数据已切换为本地实时账本，不再在看板里展示静态数值。
      </div>
      <div className="flex items-center gap-2 text-[11px] text-stone-gray">
        <Wallet size={12} className="text-terracotta" />
        打开财务中心查看账户余额、近 7 天用量和真实消费记录。
      </div>
    </div>
  );
}

function LeadsContent() {
  return (
    <div className="rounded-lg border border-dashed border-border-cream px-3 py-3 text-[12px] text-stone-gray">
      获客数据请进入小可工作台或通讯中心查看。
    </div>
  );
}

function RecentChatsContent() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border-cream px-3 py-3 text-[12px] text-stone-gray">
      <MessageSquare size={12} className="text-terracotta shrink-0" />
      暂无本地会话 API 返回的最近对话。
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
