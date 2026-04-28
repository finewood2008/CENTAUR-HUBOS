import React, { useState, useEffect, useMemo } from 'react';
// @ts-ignore
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import AgentFeedWidget from './widgets/AgentFeedWidget';
import { Settings, LayoutGrid, Save } from 'lucide-react';
import { useAgentManagement, useConnection } from '../../hooks/useQeeClaw';

interface WidgetData {
  id: string;
  type: 'agentFeed';
  agentId: string;
  agentName: string;
  status: 'idle' | 'working' | 'waiting';
  lastMessage?: string;
}

export default function DashboardGrid() {
  const { connected } = useConnection();
  const { data, loading } = useAgentManagement(connected);
  const [layouts, setLayouts] = useState<any[]>([]);
  const [hiddenWidgetIds, setHiddenWidgetIds] = useState<Set<string>>(new Set());
  const [isEditMode, setIsEditMode] = useState(false);
  const widgets = useMemo<WidgetData[]>(() => {
    if (!connected) return [];
    return data.agents
      .filter((agent) => !hiddenWidgetIds.has(`agent-${agent.id}`))
      .map((agent) => ({
        id: `agent-${agent.id}`,
        type: 'agentFeed',
        agentId: agent.id,
        agentName: agent.name,
        status: agent.status === 'running' ? 'working' : agent.status === 'error' ? 'waiting' : 'idle',
        lastMessage: agent.todaySummary || undefined,
      }));
  }, [connected, data.agents, hiddenWidgetIds]);

  useEffect(() => {
    const savedLayout = localStorage.getItem('hubos_dashboard_layout');
    let parsedLayout: any[] = [];
    if (savedLayout) {
      try { parsedLayout = JSON.parse(savedLayout); } catch { parsedLayout = []; }
    }
    const nextLayout = widgets.map((widget, index) => {
      return parsedLayout.find((item) => item.i === widget.id) ?? {
        i: widget.id,
        x: (index % 3) * 4,
        y: Math.floor(index / 3) * 4,
        w: 4,
        h: 4,
      };
    });
    setLayouts(nextLayout);
  }, [widgets]);

  const handleLayoutChange = (newLayout: any) => {
    setLayouts(newLayout);
    if (!isEditMode) {
      localStorage.setItem('hubos_dashboard_layout', JSON.stringify(newLayout));
    }
  };

  const handleSaveLayout = () => {
    localStorage.setItem('hubos_dashboard_layout', JSON.stringify(layouts));
    setIsEditMode(false);
  };

  const removeWidget = (id: string) => {
    setHiddenWidgetIds((prev) => new Set(prev).add(id));
    setLayouts(layouts.filter(l => l.i !== id));
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-cream">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-border-warm bg-white/50 backdrop-blur">
        <div className="flex items-center gap-2">
          <LayoutGrid size={20} className="text-terracotta" />
          <h2 className="text-lg font-bold text-near-black font-serif">中控台</h2>
        </div>
        
        <div className="flex items-center gap-3">
          {isEditMode ? (
            <button 
              onClick={handleSaveLayout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal text-white text-sm rounded-md hover:bg-teal/90 transition-colors"
            >
              <Save size={16} /> 保存布局
            </button>
          ) : (
            <button 
              onClick={() => setIsEditMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-border-cream text-near-black text-sm rounded-md border border-border-warm hover:bg-warm-sand/50 transition-colors"
            >
              <Settings size={16} /> 调整布局
            </button>
          )}
        </div>
      </div>

      {/* Grid Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {loading && (
          <div className="rounded-lg border border-border-warm bg-white/60 px-4 py-6 text-center text-sm text-stone-gray">
            正在读取本地运行时员工数据...
          </div>
        )}
        {!loading && widgets.length === 0 && (
          <div className="rounded-lg border border-dashed border-border-warm bg-white/60 px-4 py-6 text-center text-sm text-stone-gray">
            暂无本地运行时返回的员工看板数据。
          </div>
        )}
        {/* @ts-ignore */}
        {widgets.length > 0 && (
          <GridLayout
            className="layout"
            layout={layouts}
            cols={12}
            rowHeight={60}
            width={1200} // 理想情况下应该使用 ResponsiveGridLayout，为了简便先固定宽度或通过 ResizeObserver 动态获取
            onLayoutChange={handleLayoutChange}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            draggableHandle=".handle"
            {...({} as any)}
          >
            {widgets.map(widget => (
              <div key={widget.id}>
                {widget.type === 'agentFeed' && (
                  <AgentFeedWidget
                    {...widget}
                    onRemove={isEditMode ? removeWidget : undefined}
                  />
                )}
              </div>
            ))}
          </GridLayout>
        )}
      </div>
    </div>
  );
}
