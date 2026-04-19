import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import CentaurIndex from './CentaurIndex';
import EmployeeCards from './EmployeeCards';
import FeedStream from './FeedStream';
import { FinanceSnapshotWidget } from './WidgetsRight';
import { PendingTasksWidget } from './WidgetsLeft';
import { useToast } from '../shared/Toast';
import type { NavTab } from '../../types';
import {
  useConnection,
  useEnhancedDashboardData,
  useAgentManagement,
  useApprovalData,
  useFinanceData,
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

  // Toast
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

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

  // 员工对话 — 跳转到团队页（后续接入工作台）
  const handleChat = (agentId: string) => {
    toast('info', `正在连接 ${agentId}...`);
    onNav?.('team');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top bar — 极简 */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-border-cream bg-white/40 backdrop-blur-sm">
        <h1 className="heading-section text-[17px]">超级工作台</h1>
        <button
          onClick={handleRefreshAll}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-[12px] text-stone-gray hover:text-terracotta transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          刷新
        </button>
      </div>

      {/* Main content — 单列滚动 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1200px] mx-auto px-5 py-4 space-y-4">
          {/* 1. 半人马指数 */}
          <CentaurIndex />

          {/* 2. 员工卡片区 */}
          <div>
            <h2 className="text-[13px] font-semibold text-near-black mb-2">你的 AI 团队</h2>
            <EmployeeCards
              agents={agentData.agents || []}
              onChat={handleChat}
            />
          </div>

          {/* 3. 下方两栏：信息流 + 侧边统计 */}
          <div className="flex gap-4 min-h-[400px]">
            {/* 信息流 — 主区域 */}
            <div className="flex-1 min-w-0 card-glass rounded-xl overflow-hidden">
              <FeedStream
                activities={dashData.activities}
                alerts={dashData.alerts}
                isConnected={connected}
                onNav={onNav}
                onApprovalAction={handleApprovalAction}
              />
            </div>

            {/* 右侧统计栏 */}
            <aside className="w-[240px] shrink-0 space-y-3 max-md:hidden">
              <PendingTasksWidget
                approvals={approvals}
                loading={approvalLoading}
                isConnected={connected}
                activities={dashData.activities}
                onNav={onNav}
                onAction={handleApprovalAction}
              />
              <FinanceSnapshotWidget
                data={financeData}
                loading={financeLoading}
                isConnected={connected}
                onNav={onNav}
              />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
