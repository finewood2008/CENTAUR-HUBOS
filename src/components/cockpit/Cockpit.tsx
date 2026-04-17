import { useState } from 'react';
import { Settings, AlertTriangle, ClipboardCheck, TrendingUp } from 'lucide-react';
import FeedStream from './FeedStream';
import { TeamOverviewWidget, PendingTasksWidget, QuickActionsWidget } from './WidgetsLeft';
import { FinanceSnapshotWidget, ChannelStatusWidget, KnowledgeRecentWidget } from './WidgetsRight';
import WidgetPicker, { getEnabledWidgets } from './WidgetPicker';
import type { WidgetType } from './cockpitData';
import type { NavTab } from '../../types';
import {
  useConnection,
  useEnhancedDashboardData,
  useAgentManagement,
  useApprovalData,
  useFinanceData,
  useChannelsData,
  useKnowledgeData,
} from '../../hooks/useQeeClaw';

const LEFT_WIDGETS: WidgetType[] = ['team_overview', 'pending_tasks', 'quick_actions'];
const RIGHT_WIDGETS: WidgetType[] = ['finance_snapshot', 'channel_status', 'knowledge_recent'];

interface CockpitProps {
  onNav?: (tab: NavTab) => void;
}

export default function Cockpit({ onNav }: CockpitProps) {
  const [enabled, setEnabled] = useState<WidgetType[]>(getEnabledWidgets);
  const [pickerOpen, setPickerOpen] = useState(false);
  // 响应式：小屏折叠侧栏
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // SDK hooks
  const { connected } = useConnection();
  const { data: dashData } = useEnhancedDashboardData(connected);
  const { data: agentData, loading: agentLoading } = useAgentManagement(connected);
  const { approvals, loading: approvalLoading } = useApprovalData(connected);
  const { data: financeData, loading: financeLoading } = useFinanceData(connected);
  const { data: channelsData, loading: channelsLoading } = useChannelsData(connected);
  const { data: knowledgeData, loading: knowledgeLoading } = useKnowledgeData(connected);

  const leftWidgets = LEFT_WIDGETS.filter(t => enabled.includes(t));
  const rightWidgets = RIGHT_WIDGETS.filter(t => enabled.includes(t));

  // 摘要指标
  const pendingApprovalCount = connected && approvals.length > 0
    ? approvals.length
    : dashData.activities.filter(a => a.type === 'approval_needed').length || 3;
  const alertCount = dashData.alerts.filter(a => a.severity === 'critical' || a.type === 'error').length || dashData.activities.filter(a => a.type === 'alert').length;
  const todaySpent = financeData.wallet
    ? financeData.wallet.currentMonthSpent ?? 0
    : 42.3;

  const WIDGET_RENDER: Record<WidgetType, () => React.ReactNode> = {
    team_overview:    () => <TeamOverviewWidget agents={agentData.agents} loading={agentLoading} isConnected={connected} />,
    pending_tasks:    () => <PendingTasksWidget approvals={approvals} loading={approvalLoading} isConnected={connected} activities={dashData.activities} />,
    quick_actions:    () => <QuickActionsWidget onNav={onNav} />,
    finance_snapshot: () => <FinanceSnapshotWidget data={financeData} loading={financeLoading} isConnected={connected} />,
    channel_status:   () => <ChannelStatusWidget data={channelsData} loading={channelsLoading} isConnected={connected} />,
    knowledge_recent: () => <KnowledgeRecentWidget data={knowledgeData} loading={knowledgeLoading} isConnected={connected} />,
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top bar with summary metrics */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-border-cream bg-white/40 backdrop-blur-sm">
        <div className="flex items-center gap-5">
          <h1 className="heading-section text-[17px]">超级工作台</h1>
          {/* 关键指标摘要 */}
          <div className="flex items-center gap-4 text-[12px]">
            {pendingApprovalCount > 0 && (
              <span className="flex items-center gap-1.5 text-terracotta font-medium">
                <ClipboardCheck size={13} />
                {pendingApprovalCount} 待审批
              </span>
            )}
            {alertCount > 0 && (
              <span className="flex items-center gap-1.5 text-red-500 font-medium">
                <AlertTriangle size={13} />
                {alertCount} 警告
              </span>
            )}
            <span className="flex items-center gap-1.5 text-stone-gray">
              <TrendingUp size={13} />
              今日消耗 ¥{todaySpent.toFixed(1)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* 响应式折叠按钮 */}
          <button
            onClick={() => setLeftCollapsed(!leftCollapsed)}
            className="btn-ghost text-[11px] py-1 px-2 lg:hidden"
            title={leftCollapsed ? '展开左栏' : '折叠左栏'}
          >
            {leftCollapsed ? '◀ 左栏' : '▶ 左栏'}
          </button>
          <button
            onClick={() => setRightCollapsed(!rightCollapsed)}
            className="btn-ghost text-[11px] py-1 px-2 lg:hidden"
            title={rightCollapsed ? '展开右栏' : '折叠右栏'}
          >
            {rightCollapsed ? '右栏 ▶' : '右栏 ◀'}
          </button>
          <button
            onClick={() => setPickerOpen(true)}
            className="btn-sand text-[12px] py-1.5 px-3"
          >
            <Settings size={14} />
            自定义面板
          </button>
        </div>
      </div>

      {/* Three-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar widgets */}
        {leftWidgets.length > 0 && !leftCollapsed && (
          <aside className="w-[260px] shrink-0 overflow-y-auto p-3 space-y-3 border-r border-border-cream/60 custom-scrollbar max-lg:w-[220px] max-md:hidden">
            {leftWidgets.map(t => (
              <div key={t}>{WIDGET_RENDER[t]()}</div>
            ))}
          </aside>
        )}

        {/* Center feed */}
        <main className="flex-1 min-w-0 overflow-hidden">
          <FeedStream activities={dashData.activities} alerts={dashData.alerts} isConnected={connected} />
        </main>

        {/* Right sidebar widgets */}
        {rightWidgets.length > 0 && !rightCollapsed && (
          <aside className="w-[260px] shrink-0 overflow-y-auto p-3 space-y-3 border-l border-border-cream/60 custom-scrollbar max-lg:w-[220px] max-md:hidden">
            {rightWidgets.map(t => (
              <div key={t}>{WIDGET_RENDER[t]()}</div>
            ))}
          </aside>
        )}
      </div>

      {/* Widget picker modal */}
      <WidgetPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        enabled={enabled}
        onChange={setEnabled}
      />
    </div>
  );
}
