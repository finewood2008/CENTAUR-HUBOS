import { useState, useMemo } from 'react';
import { MOCK_FEED } from './cockpitData';
import type { FeedItem } from './cockpitData';
import type { ActivityItem, Alert } from '../../types';
import {
  CheckCircle, AlertTriangle, FileText, Lightbulb,
  ClipboardCheck, ChevronDown, ChevronUp, Filter,
} from 'lucide-react';

const TYPE_CONFIG: Record<FeedItem['type'], { icon: typeof CheckCircle; label: string; badgeClass: string }> = {
  report:    { icon: FileText,       label: '汇报',   badgeClass: 'badge' },
  task_done: { icon: CheckCircle,    label: '已完成', badgeClass: 'badge-success' },
  approval:  { icon: ClipboardCheck, label: '待审批', badgeClass: 'badge-terracotta' },
  alert:     { icon: AlertTriangle,  label: '警告',   badgeClass: 'badge-error' },
  insight:   { icon: Lightbulb,      label: '洞察',   badgeClass: 'badge' },
};

// 优先级对应的左色条
const PRIORITY_BAR: Record<string, string> = {
  approval: 'border-l-[3px] border-l-terracotta',
  alert:    'border-l-[3px] border-l-red-400',
  insight:  'border-l-[3px] border-l-amber-400',
  report:   '',
  task_done: '',
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
  const cfg = TYPE_CONFIG[item.type];
  const priorityBar = PRIORITY_BAR[item.type] || '';
  // 高优先级背景微调
  const urgentBg = (item.type === 'approval' || item.type === 'alert') && !item.read
    ? 'bg-terracotta/[0.03]'
    : '';

  return (
    <div className={`card-glass p-0 transition-all ${priorityBar} ${urgentBg} ${!item.read ? 'ring-1 ring-terracotta/20' : ''}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0"
            style={{ backgroundColor: item.agentColor + '18' }}
          >
            {item.agentAvatar}
          </div>

          <div className="flex-1 min-w-0">
            {/* Name + badge + time */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-near-black">{item.agentName}</span>
              <span className={`${cfg.badgeClass} text-[11px] px-1.5 py-0.5 leading-none`}>
                {cfg.label}
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

      {/* Unread indicator — inside card to avoid overflow clip */}
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

  // 合并数据源：SDK → FeedItem 或 fallback MOCK
  const feedItems: FeedItem[] = useMemo(() => {
    if (isConnected && activities && activities.length > 0) {
      const items = activities.map(activityToFeedItem);
      // 追加alerts
      if (alerts && alerts.length > 0) {
        const alertItems = alerts.map(alertToFeedItem);
        items.push(...alertItems);
      }
      // 按时间倒序
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
          <button className="btn-ghost text-[12px] py-1 px-2">
            <Filter size={14} />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {([
            ['all', '全部'],
            ['approval', '待审批'],
            ['alert', '警告'],
            ['task_done', '已完成'],
            ['report', '汇报'],
            ['insight', '洞察'],
          ] as [FilterType, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`text-[12px] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                filter === key
                  ? 'bg-terracotta text-ivory'
                  : 'bg-border-cream text-olive-gray hover:bg-warm-sand'
              }`}
            >
              {label}
            </button>
          ))}
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
