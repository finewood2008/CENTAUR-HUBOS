import React, { useState, useEffect } from 'react';
// @ts-ignore
import GridLayout from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import AgentFeedWidget from './widgets/AgentFeedWidget';
import { Settings, LayoutGrid, Save } from 'lucide-react';

interface WidgetData {
  id: string;
  type: 'agentFeed';
  agentId: string;
  agentName: string;
  status: 'idle' | 'working' | 'waiting';
  lastMessage?: string;
}

// 模拟初始数据
const INITIAL_WIDGETS: WidgetData[] = [
  { id: 'widget-1', type: 'agentFeed', agentId: 'spark', agentName: 'Spark (火花)', status: 'working', lastMessage: '正在为您生成最新的品牌Logo草图，预计需要2分钟。' },
  { id: 'widget-2', type: 'agentFeed', agentId: 'hr_bot', agentName: 'HR 助理', status: 'idle', lastMessage: '今天所有新入职员工的资料已归档。' },
  { id: 'widget-3', type: 'agentFeed', agentId: 'data_analyst', agentName: '数据分析师', status: 'waiting', lastMessage: '本周销售报表已生成，是否需要发送至您的邮箱？' }
];

const INITIAL_LAYOUT: any[] = [
  { i: 'widget-1', x: 0, y: 0, w: 4, h: 4 },
  { i: 'widget-2', x: 4, y: 0, w: 3, h: 3 },
  { i: 'widget-3', x: 7, y: 0, w: 3, h: 3 }
];

export default function DashboardGrid() {
  const [layouts, setLayouts] = useState<any[]>(INITIAL_LAYOUT);
  const [widgets, setWidgets] = useState<WidgetData[]>(INITIAL_WIDGETS);
  const [isEditMode, setIsEditMode] = useState(false);

  // 尝试从 localStorage 恢复布局
  useEffect(() => {
    const savedLayout = localStorage.getItem('hubos_dashboard_layout');
    if (savedLayout) {
      try {
        setLayouts(JSON.parse(savedLayout));
      } catch (e) {
        console.error('Failed to parse layout from localStorage');
      }
    }
  }, []);

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
    setWidgets(widgets.filter(w => w.id !== id));
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
        {/* @ts-ignore */}
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
      </div>
    </div>
  );
}