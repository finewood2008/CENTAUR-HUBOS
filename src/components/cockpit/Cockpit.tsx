import { useState } from 'react';
import { AlertTriangle, ClipboardCheck, TrendingUp, RefreshCw } from 'lucide-react';
import FeedStream from './FeedStream';
import { TeamOverviewWidget, PendingTasksWidget, QuickActionsWidget } from './WidgetsLeft';
import { FinanceSnapshotWidget, ChannelStatusWidget, KnowledgeRecentWidget } from './WidgetsRight';
import { useToast } from '../shared/Toast';
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
import { getApprovalModule } from '../../services/qeeclaw';

interface CockpitProps {
  onNav?: (tab: NavTab) => void;
}

export default function Cockpit({ onNav }: CockpitProps) {
  // SDK hooks
  const { connected } = useConnection();
  const { data: dashData, refresh: refreshDash } = useEnhancedDashboardData(connected);
  const { data: agentData, loading: agentLoading } = useAgentManagement(connected);
  const { approvals, loading: approvalLoading, refresh: refreshApprovals } = useApprovalData(connected);
  const { data: financeData, loading: financeLoading } = useFinanceData(connected);
  const { data: channelsData, loading: channelsLoading } = useChannelsData(connected);
  const { data: knowledgeData, loading: knowledgeLoading } = useKnowledgeData(connected);

  // Toast
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  // 摘要指标
  const pendingApprovalCount = connected && approvals.length > 0
    ? approvals.length
    : dashData.activities.filter(a => a.type === 'approval_needed').length;
  const alertCount = dashData.alerts.filter(a => a.severity === 'critical' || a.type === 'error').length || dashData.activities.filter(a => a.type === 'alert').length;
  const todaySpent = financeData.wallet
    ? financeData.wallet.currentMonthSpent ?? 0
    : 0;

  // 全局刷新
  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshDash(), refreshApprovals()]);
      toast('success', '数据已刷新');
    } catch {
      toast('error', '刷新失败');
    } finally {
      setRefreshing(false);
    }
  };

  // 审批操作回调
  const handleApprovalAction = async (id: string | number, action: 'approved' | 'rejected') => {
    const label = action === 'approved' ? '已通过' : '已驳回';
    if (connected) {
      try {
        await getApprovalModule().resolve(String(id), { approved: action === 'approved' });
        toast(action === 'approved' ? 'success' : 'info', `审批项${label}`);
        await refreshApprovals();
      } catch (err) {
        toast('error', `审批操作失败: ${err instanceof Error ? err.message : '未知错误'}`);
      }
    } else {
      toast(action === 'approved' ? 'success' : 'info', `审批项 ${id} ${label}（演示模式）`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-border-cream bg-white/40 backdrop-blur-sm">
        <div className="flex items-center gap-5">
          <h1 className="heading-section text-[17px]">超级工作台</h1>
          <div className="flex items-center gap-4 text-[12px]">
            {pendingApprovalCount > 0 && (
              <span className="flex items-center gap-1.5 text-terracotta font-medium cursor-pointer hover:opacity-80" onClick={() => onNav?.('team')}>
                <ClipboardCheck size={13} />
                {pendingApprovalCount} 待审批
              </span>
            )}
            {alertCount > 0 && (
              <span className="flex items-center gap-1.5 text-red-500 font-medium cursor-pointer hover:opacity-80" onClick={() => onNav?.('team')}>
                <AlertTriangle size={13} />
                {alertCount} 警告
              </span>
            )}
            <span className="flex items-center gap-1.5 text-stone-gray cursor-pointer hover:opacity-80" onClick={() => onNav?.('finance')}>
              <TrendingUp size={13} />
              今日消耗 ¥{todaySpent.toFixed(1)}
            </span>
          </div>
        </div>
        <button
          onClick={handleRefreshAll}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-[12px] text-stone-gray hover:text-terracotta transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          刷新
        </button>
      </div>

      {/* Two-column layout: left widgets + right feed */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar — widgets */}
        <aside className="w-[280px] shrink-0 overflow-y-auto p-3 space-y-3 border-r border-border-cream/60 custom-scrollbar max-lg:w-[240px] max-md:hidden">
          <TeamOverviewWidget agents={agentData.agents} loading={agentLoading} isConnected={connected} onNav={onNav} />
          <PendingTasksWidget approvals={approvals} loading={approvalLoading} isConnected={connected} activities={dashData.activities} onNav={onNav} onAction={handleApprovalAction} />
          <FinanceSnapshotWidget data={financeData} loading={financeLoading} isConnected={connected} onNav={onNav} />
          <ChannelStatusWidget data={channelsData} loading={channelsLoading} isConnected={connected} onNav={onNav} />
          <KnowledgeRecentWidget data={knowledgeData} loading={knowledgeLoading} isConnected={connected} onNav={onNav} />
          <QuickActionsWidget onNav={onNav} />
        </aside>

        {/* Main feed */}
        <main className="flex-1 min-w-0 overflow-hidden">
          <FeedStream activities={dashData.activities} alerts={dashData.alerts} isConnected={connected} onNav={onNav} onApprovalAction={handleApprovalAction} />
        </main>
      </div>
    </div>
  );
}
