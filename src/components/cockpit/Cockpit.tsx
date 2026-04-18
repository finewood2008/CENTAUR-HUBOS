import { AlertTriangle, ClipboardCheck, TrendingUp } from 'lucide-react';
import FeedStream from './FeedStream';
import { TeamOverviewWidget, PendingTasksWidget } from './WidgetsLeft';
import { FinanceSnapshotWidget } from './WidgetsRight';
import type { NavTab } from '../../types';
import {
  useConnection,
  useEnhancedDashboardData,
  useAgentManagement,
  useApprovalData,
  useFinanceData,
} from '../../hooks/useQeeClaw';

interface CockpitProps {
  onNav?: (tab: NavTab) => void;
}

export default function Cockpit({ onNav }: CockpitProps) {
  // SDK hooks
  const { connected } = useConnection();
  const { data: dashData } = useEnhancedDashboardData(connected);
  const { data: agentData, loading: agentLoading } = useAgentManagement(connected);
  const { approvals, loading: approvalLoading } = useApprovalData(connected);
  const { data: financeData, loading: financeLoading } = useFinanceData(connected);

  // 摘要指标
  const pendingApprovalCount = connected && approvals.length > 0
    ? approvals.length
    : dashData.activities.filter(a => a.type === 'approval_needed').length || 3;
  const alertCount = dashData.alerts.filter(a => a.severity === 'critical' || a.type === 'error').length || dashData.activities.filter(a => a.type === 'alert').length;
  const todaySpent = financeData.wallet
    ? financeData.wallet.currentMonthSpent ?? 0
    : 42.3;

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
      </div>

      {/* Two-column layout: left widgets + right feed */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar — widgets */}
        <aside className="w-[280px] shrink-0 overflow-y-auto p-3 space-y-3 border-r border-border-cream/60 custom-scrollbar max-lg:w-[240px] max-md:hidden">
          <TeamOverviewWidget agents={agentData.agents} loading={agentLoading} isConnected={connected} onNav={onNav} />
          <PendingTasksWidget approvals={approvals} loading={approvalLoading} isConnected={connected} activities={dashData.activities} onNav={onNav} />
          <FinanceSnapshotWidget data={financeData} loading={financeLoading} isConnected={connected} onNav={onNav} />
        </aside>

        {/* Main feed */}
        <main className="flex-1 min-w-0 overflow-hidden">
          <FeedStream activities={dashData.activities} alerts={dashData.alerts} isConnected={connected} />
        </main>
      </div>
    </div>
  );
}
