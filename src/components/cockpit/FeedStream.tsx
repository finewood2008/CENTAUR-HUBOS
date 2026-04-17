import { useState, useMemo } from 'react';
import { MOCK_FEED } from './cockpitData';
import type { FeedItem } from './cockpitData';
import type { ActivityItem, Alert } from '../../types';
import {
  CheckCircle, AlertTriangle, FileText, Lightbulb,
  ClipboardCheck, ChevronDown, ChevronUp, Filter,
} from 'lucide-react';

// ── 每种类型的完整视觉配置 ──
const TYPE_STYLE: Record<FeedItem['type'], {
  icon: typeof CheckCircle;
  label: string;
  cardClass: string;       // 语义卡片样式
  badgeClass: string;      // badge 样式
  iconColor: string;       // 图标颜色
  avatarRing: string;      // 头像外圈
}> = {
  alert: {
    icon: AlertTriangle,
    label: '警告',
    cardClass: 'card-glass-alert',
    badgeClass: 'badge-error',
    iconColor: 'text-red-500',
    avatarRing: 'ring-2 ring-red-300/40',
  },
  approval: {
    icon: ClipboardCheck,
    label: '待审批',
    cardClass: 'card-glass-warm',
    badgeClass: 'badge-terracotta',
    iconColor: 'text-terracotta',
    avatarRing: 'ring-2 ring-terracotta/30',
  },
  insight: {
    icon: Lightbulb,
    label: '洞察',
    cardClass: 'card-glass-blue',
    badgeClass: 'badge-insight',
    iconColor: 'text-blue-500',
    avatarRing: 'ring-2 ring-blue-300/30',
  },
  task_done: {
    icon: CheckCircle,
    label: '已完成',
    cardClass: 'card-glass-success',
    badgeClass: 'badge-success',
    iconColor: 'text-success-green',
    avatarRing: 'ring-2 ring-green-300/30',
  },
  report: {
    icon: FileText,
    label: '汇报',
    cardClass: 'card-glass',
    badgeClass: 'badge',
    iconColor: 'text-stone-gray',
    avatarRing: '',
  },
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} 小时前`;
  return `${Math.floor(hrs / 24)} 天前`;
}

function FeedCard({ item }: { item: FeedItem }) {
  const [expanded, setExpanded] = useState(false);
  const style = TYPE_STYLE[item.type];
  const Icon = style.icon;

  // 未读 + 可操作 = 脉冲呼吸
  const pulse = !item.read && item.actionable ? 'feed-pulse' : '';
  // 已读项整体降透明度
  const readFade = item.read ? 'opacity-65 hover:opacity-90' : '';

  return (
    <div className={`${style.cardClass} p-0 transition-all relative ${pulse} ${readFade}`}>
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Avatar with semantic ring */}
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 ${style.avatarRing}`}
            style={{ backgroundColor: item.agentColor + '18' }}
          >
            {item.agentAvatar}
          </div>

          <div className="flex-1 min-w-0">
            {/* Name + icon + badge + time */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-near-black">{item.agentName}</span>
              <Icon size={13} className={style.iconColor} />
              <span className={`${style.badgeClass} text-[11px] px-1.5 py-0.5 leading-none`}>
                {style.label}
              </span>
              <span className="text-[11px] text-stone-gray ml-auto shrink-0">
                {timeAgo(item.timestamp)}
              </span>
            </div>

            {/* Content */}
            <p className="text-[13px] text-charcoal-warm mt-1.5 leading-relaxed">
              {item.content}
            </p>

            {/* Expandable detail */}
            {item.detail && (
              <>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 mt-2 text-[12px] text-stone-gray hover:text-terracotta transition-colors"
                >
                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {expanded ? '收起' : '展开详情'}
                </button>
                {expanded && (
                  <div className="mt-2 p-3 bg-parchment rounded-lg text-[12px] text-olive-gray leading-relaxed">
                    {item.detail}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Action button */}
        {item.actionable && (
          <div className="mt-3 pt-3 border-t border-border-cream flex justify-end">
            <button className="btn-terracotta text-[12px] py-1.5 px-3">
              {item.actionLabel || '处理'}
            </button>
          </div>
        )}
      </div>

      {/* Unread dot */}
      {!item.read && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-terracotta" />
      )}
    </div>
  );
}

type FilterType = 'all' | FeedItem['type'];

// SDK ActivityItem → FeedItem 转换
function activityToFeedItem(a: ActivityItem): FeedItem {
  const typeMap: Record<string, FeedItem['type']> = {
    task_done: 'task_done',
    content_published: 'task_done',
    report_ready: 'report',
    alert: 'alert',
    approval_needed: 'approval',
    insight: 'insight',
    customer_reply: 'alert',
    lead_captured: 'insight',
    email_sent: 'task_done',
  };

  return {
    id: a.id,
    agentId: a.agentId,
    agentName: a.agentName,
    agentAvatar: a.agentAvatar || '🤖',
    agentColor: '#7c8a9e',
    type: typeMap[a.type] || 'report',
    content: a.title,
    detail: a.detail,
    timestamp: a.time || new Date(a.timestamp).toISOString(),
    read: false,
    actionable: a.actionType === 'approve' || a.actionType === 'reply',
    actionLabel: a.actionLabel,
  };
}

// SDK Alert → FeedItem 转换
function alertToFeedItem(a: Alert): FeedItem {
  return {
    id: a.id,
    agentId: a.agentId,
    agentName: a.agentName,
    agentAvatar: '⚠️',
    agentColor: a.severity === 'critical' ? '#dc2626' : '#d97706',
    type: 'alert',
    content: a.message,
    timestamp: new Date().toISOString(),
    read: false,
    actionable: a.severity === 'critical',
    actionLabel: '立即处理',
  };
}

interface FeedStreamProps {
  activities?: ActivityItem[];
  alerts?: Alert[];
  isConnected?: boolean;
}

export default function FeedStream({ activities, alerts, isConnected }: FeedStreamProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');

  // 合并数据源
  const feedItems: FeedItem[] = useMemo(() => {
    if (isConnected && activities && activities.length > 0) {
      const items = activities.map(activityToFeedItem);
      if (alerts && alerts.length > 0) {
        items.push(...alerts.map(alertToFeedItem));
      }
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return items;
    }
    return MOCK_FEED;
  }, [isConnected, activities, alerts]);

  const agents = Array.from(new Set(feedItems.map(f => f.agentId)));
  const agentNames: Record<string, string> = {};
  feedItems.forEach(f => { agentNames[f.agentId] = f.agentName; });

  const filtered = feedItems
    .filter(f => filter === 'all' || f.type === filter)
    .filter(f => agentFilter === 'all' || f.agentId === agentFilter);

  const unreadCount = feedItems.filter(f => !f.read).length;

  // 筛选tab的图标+计数
  const filterTabs: { key: FilterType; label: string; icon: typeof CheckCircle; color: string }[] = [
    { key: 'all',       label: '全部',   icon: Filter,         color: '' },
    { key: 'approval',  label: '待审批', icon: ClipboardCheck, color: 'text-terracotta' },
    { key: 'alert',     label: '警告',   icon: AlertTriangle,  color: 'text-red-500' },
    { key: 'task_done', label: '已完成', icon: CheckCircle,    color: 'text-success-green' },
    { key: 'report',    label: '汇报',   icon: FileText,       color: 'text-stone-gray' },
    { key: 'insight',   label: '洞察',   icon: Lightbulb,      color: 'text-blue-500' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="heading-card">信息流</h2>
            {unreadCount > 0 && (
              <span className="badge-terracotta text-[11px] px-1.5 py-0.5">
                {unreadCount} 条未读
              </span>
            )}
          </div>
        </div>

        {/* Filter tabs with icons */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {filterTabs.map(({ key, label, icon: TabIcon, color }) => {
            const count = key === 'all' ? feedItems.length : feedItems.filter(f => f.type === key).length;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                  filter === key
                    ? 'bg-terracotta text-ivory'
                    : 'bg-border-cream text-olive-gray hover:bg-warm-sand'
                }`}
              >
                <TabIcon size={12} className={filter === key ? '' : color} />
                {label}
                {count > 0 && (
                  <span className={`text-[10px] ${filter === key ? 'text-ivory/70' : 'text-stone-gray'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Agent filter */}
        <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
          <button
            onClick={() => setAgentFilter('all')}
            className={`text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap transition-colors ${
              agentFilter === 'all'
                ? 'bg-near-black text-ivory'
                : 'bg-transparent text-stone-gray hover:text-near-black'
            }`}
          >
            全部员工
          </button>
          {agents.map(aid => (
            <button
              key={aid}
              onClick={() => setAgentFilter(aid)}
              className={`text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap transition-colors ${
                agentFilter === aid
                  ? 'bg-near-black text-ivory'
                  : 'bg-transparent text-stone-gray hover:text-near-black'
              }`}
            >
              {agentNames[aid]}
            </button>
          ))}
        </div>
      </div>

      {/* Feed list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-stone-gray text-sm">
            <Filter size={24} className="mb-2 opacity-40" />
            暂无匹配的消息
          </div>
        ) : (
          filtered.map(item => <FeedCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}
