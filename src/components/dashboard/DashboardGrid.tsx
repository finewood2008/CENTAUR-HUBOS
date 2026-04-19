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

// 模拟初始数据 — 与 5 名核心数字员工统一
const INITIAL_WIDGETS: WidgetData[] = [
  { id: 'widget-1', type: 'agentFeed', agentId: 'spark',   agentName: '火花 Spark',   status: 'working', lastMessage: '正在为您生成最新的品牌推文，预计需要2分钟。' },
  { id: 'widget-2', type: 'agentFeed', agentId: 'xiaoke',  agentName: '小可 Xiaoke',  status: 'idle',    lastMessage: '今日新增 3 条线索已录入 CRM，等待跟进。' },
  { id: 'widget-3', type: 'agentFeed', agentId: 'shuxi',   agentName: '书熙 Shuxi',   status: 'waiting', lastMessage: '劳动合同续签模板已生成，请确认后发送给员工。' },
  { id: 'widget-4', type: 'agentFeed', agentId: 'shuibao', agentName: '税宝 Shuibao', status: 'idle',    lastMessage: '4月增值税申报表已预填，待您审核。' },
  { id: 'widget-5', type: 'agentFeed', agentId: 'lvan',    agentName: '绿安 Lvan',    status: 'working', lastMessage: '正在扫描本周新增应用的安全漏洞，已完成60%。' },
];

const INITIAL_LAYOUT: any[] = [
  { i: 'widget-1', x: 0, y: 0, w: 4, h: 4 },
  { i: 'widget-2', x: 4, y: 0, w: 4, h: 4 },
  { i: 'widget-3', x: 8, y: 0, w: 4, h: 4 },
  { i: 'widget-4', x: 0, y: 4, w: 4, h: 4 },
  { i: 'widget-5', x: 4, y: 4, w: 4, h: 4 },
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