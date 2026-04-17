import { useState } from 'react';
import { Settings } from 'lucide-react';
import FeedStream from './FeedStream';
import { TeamOverviewWidget, PendingTasksWidget, QuickActionsWidget } from './WidgetsLeft';
import { FinanceSnapshotWidget, ChannelStatusWidget, KnowledgeRecentWidget } from './WidgetsRight';
import WidgetPicker, { getEnabledWidgets } from './WidgetPicker';
import type { WidgetType } from './cockpitData';

// Widget 渲染映射
const WIDGET_COMPONENTS: Record<WidgetType, React.FC> = {
  team_overview:    TeamOverviewWidget,
  pending_tasks:    PendingTasksWidget,
  quick_actions:    QuickActionsWidget,
  finance_snapshot: FinanceSnapshotWidget,
  channel_status:   ChannelStatusWidget,
  knowledge_recent: KnowledgeRecentWidget,
};

const LEFT_WIDGETS: WidgetType[] = ['team_overview', 'pending_tasks', 'quick_actions'];
const RIGHT_WIDGETS: WidgetType[] = ['finance_snapshot', 'channel_status', 'knowledge_recent'];

export default function Cockpit() {
  const [enabled, setEnabled] = useState<WidgetType[]>(getEnabledWidgets);
  const [pickerOpen, setPickerOpen] = useState(false);

  const leftWidgets = LEFT_WIDGETS.filter(t => enabled.includes(t));
  const rightWidgets = RIGHT_WIDGETS.filter(t => enabled.includes(t));

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border-cream bg-white/40 backdrop-blur-sm">
        <h1 className="heading-section text-[17px]">超级工作台</h1>
        <button
          onClick={() => setPickerOpen(true)}
          className="btn-sand text-[12px] py-1.5 px-3"
        >
          <Settings size={14} />
          自定义面板
        </button>
      </div>

      {/* Three-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar widgets */}
        {leftWidgets.length > 0 && (
          <aside className="w-[260px] shrink-0 overflow-y-auto p-3 space-y-3 border-r border-border-cream/60 custom-scrollbar">
            {leftWidgets.map(t => {
              const Comp = WIDGET_COMPONENTS[t];
              return <Comp key={t} />;
            })}
          </aside>
        )}

        {/* Center feed */}
        <main className="flex-1 min-w-0 overflow-hidden">
          <FeedStream />
        </main>

        {/* Right sidebar widgets */}
        {rightWidgets.length > 0 && (
          <aside className="w-[260px] shrink-0 overflow-y-auto p-3 space-y-3 border-l border-border-cream/60 custom-scrollbar">
            {rightWidgets.map(t => {
              const Comp = WIDGET_COMPONENTS[t];
              return <Comp key={t} />;
            })}
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
