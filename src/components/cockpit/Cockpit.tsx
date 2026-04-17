import { useState, useCallback } from 'react';
import { Settings, AlertTriangle, ClipboardCheck, TrendingUp, X } from 'lucide-react';
import FeedStream from './FeedStream';
import { TeamOverviewWidget, PendingTasksWidget, QuickActionsWidget } from './WidgetsLeft';
import { FinanceSnapshotWidget, ChannelStatusWidget, KnowledgeRecentWidget } from './WidgetsRight';
import { loadLayout, saveLayout, EditToolbar } from './WidgetPicker';
import DraggableWidget from './DraggableWidget';
import { getWidgetConfig } from './cockpitData';
import type { WidgetType, WidgetLayout } from './cockpitData';
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

interface CockpitProps {
  onNav?: (tab: NavTab) => void;
}

export default function Cockpit({ onNav }: CockpitProps) {
  const [layout, setLayout] = useState<WidgetLayout>(loadLayout);
  const [editing, setEditing] = useState(false);
  const [draggingType, setDraggingType] = useState<WidgetType | null>(null);
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

  // ── 布局操作 ──
  const updateLayout = useCallback((newLayout: WidgetLayout) => {
    setLayout(newLayout);
    saveLayout(newLayout);
  }, []);

  // 删除widget
  const handleRemove = useCallback((type: WidgetType) => {
    const newLayout = {
      left: layout.left.filter(t => t !== type),
      right: layout.right.filter(t => t !== type),
      disabled: [...layout.disabled, type],
    };
    updateLayout(newLayout);
  }, [layout, updateLayout]);

  // 添加已删除的widget回来
  const handleAdd = useCallback((type: WidgetType, side: 'left' | 'right') => {
    const newLayout = {
      left: side === 'left' ? [...layout.left, type] : layout.left,
      right: side === 'right' ? [...layout.right, type] : layout.right,
      disabled: layout.disabled.filter(t => t !== type),
    };
    updateLayout(newLayout);
  }, [layout, updateLayout]);

  // ── 拖拽逻辑 ──
  const draggingSize = draggingType ? getWidgetConfig(draggingType).size : null;

  const isDropTarget = useCallback((targetType: WidgetType): boolean => {
    if (!draggingType || draggingType === targetType) return false;
    const targetSize = getWidgetConfig(targetType).size;
    return targetSize === draggingSize;
  }, [draggingType, draggingSize]);

  const handleDragStart = useCallback((type: WidgetType) => {
    setDraggingType(type);
  }, []);

  const handleDrop = useCallback((targetType: WidgetType) => {
    if (!draggingType || draggingType === targetType) return;
    if (getWidgetConfig(targetType).size !== getWidgetConfig(draggingType).size) return;

    // 找到两个widget各在哪个列
    const srcSide = layout.left.includes(draggingType) ? 'left' : 'right';
    const dstSide = layout.left.includes(targetType) ? 'left' : 'right';

    const newLeft = [...layout.left];
    const newRight = [...layout.right];

    const srcList = srcSide === 'left' ? newLeft : newRight;
    const dstList = dstSide === 'left' ? newLeft : newRight;

    const srcIdx = srcList.indexOf(draggingType);
    const dstIdx = dstList.indexOf(targetType);

    if (srcSide === dstSide) {
      // 同列：直接交换位置
      srcList[srcIdx] = targetType;
      srcList[dstIdx] = draggingType;
    } else {
      // 跨列：互换
      srcList[srcIdx] = targetType;
      dstList[dstIdx] = draggingType;
    }

    updateLayout({ left: newLeft, right: newRight, disabled: layout.disabled });
  }, [draggingType, layout, updateLayout]);

  const handleDragEnd = useCallback(() => {
    setDraggingType(null);
  }, []);

  // ── 渲染widget（编辑/正常模式通用） ──
  const renderWidget = (type: WidgetType) => (
    <DraggableWidget
      key={type}
      type={type}
      editing={editing}
      onRemove={handleRemove}
      onDragStart={handleDragStart}
      onDragOver={(e) => { if (isDropTarget(type)) e.preventDefault(); }}
      onDrop={() => handleDrop(type)}
      onDragEnd={handleDragEnd}
      dropTarget={isDropTarget(type)}
      dragActive={!!draggingType}
    >
      {WIDGET_RENDER[type]()}
    </DraggableWidget>
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-border-cream bg-white/40 backdrop-blur-sm">
        <div className="flex items-center gap-5">
          <h1 className="heading-section text-[17px]">超级工作台</h1>
          {/* 关键指标摘要 */}
          {!editing && (
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
          )}
          {editing && (
            <span className="text-[12px] text-terracotta font-medium">
              拖拽卡片调整位置 · 同尺寸可互换
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* 响应式折叠按钮 */}
          {!editing && (
            <>
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
            </>
          )}
          {editing ? (
            <button
              onClick={() => setEditing(false)}
              className="btn-ghost text-[12px] py-1.5 px-3 flex items-center gap-1"
            >
              <X size={14} />
              退出编辑
            </button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="btn-sand text-[12px] py-1.5 px-3"
            >
              <Settings size={14} />
              自定义面板
            </button>
          )}
        </div>
      </div>

      {/* Three-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        {layout.left.length > 0 && !leftCollapsed && (
          <aside className="w-[260px] shrink-0 overflow-y-auto p-3 space-y-3 border-r border-border-cream/60 custom-scrollbar max-lg:w-[220px] max-md:hidden">
            {layout.left.map(t => renderWidget(t))}
          </aside>
        )}

        {/* Center feed */}
        <main className="flex-1 min-w-0 overflow-hidden">
          <FeedStream activities={dashData.activities} alerts={dashData.alerts} isConnected={connected} />
        </main>

        {/* Right sidebar */}
        {layout.right.length > 0 && !rightCollapsed && (
          <aside className="w-[260px] shrink-0 overflow-y-auto p-3 space-y-3 border-l border-border-cream/60 custom-scrollbar max-lg:w-[220px] max-md:hidden">
            {layout.right.map(t => renderWidget(t))}
          </aside>
        )}
      </div>

      {/* 编辑模式底部工具条 */}
      {editing && (
        <EditToolbar
          layout={layout}
          onAdd={handleAdd}
          onDone={() => setEditing(false)}
        />
      )}
    </div>
  );
}
