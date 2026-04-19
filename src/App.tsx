// Hub OS - 主应用入口
// SDK 连接 → 真实数据；后端未启动 → 自动 fallback mock
import { useState, useEffect } from 'react';
import type { NavTab } from './types';
import Sidebar from './components/layout/Sidebar';
import Cockpit from './components/cockpit';
import Team from './components/team/Team';
import EmployeeBuilderV2 from './components/builder';
import Finance from './components/finance/Finance';
import Channels from './components/channels/Channels';
import Knowledge from './components/knowledge/Knowledge';
import Settings from './components/settings/Settings';
import { ToastProvider, useToast } from './components/shared/Toast';
import { AppProvider, useTheme } from './stores/useAppStore';
import { useConnection, useEnhancedDashboardData, useChannelsData, useKnowledgeData } from './hooks/useQeeClaw';
import { getAgentModule } from './services/qeeclaw';

// 背景样式映射
const BG_CLASS_MAP: Record<string, string> = {
  grid: 'bg-grid',
  solid: '',
  paper: 'bg-paper',
  gradient: 'bg-gradient',
};

function AppInner() {
  const [tab, setTab] = useState<NavTab>('dashboard');
  const [building, setBuilding] = useState(false);
  const { connected, checking } = useConnection();
  const { bgStyle } = useTheme();
  const { toast } = useToast();

  // 数据加载
  const { data: dashData, refresh: refreshDashboard } = useEnhancedDashboardData(connected);
  const { data: channelsData, loading: channelsLoading, refresh: refreshChannels } = useChannelsData(connected);
  const { data: knowledgeData, loading: knowledgeLoading, refresh: refreshKnowledge } = useKnowledgeData(connected);

  const handleBuilderComplete = async (spec: any) => {
    try {
      const raw = localStorage.getItem('hubos_custom_employees');
      const list = raw ? JSON.parse(raw) : [];
      list.push(spec);
      localStorage.setItem('hubos_custom_employees', JSON.stringify(list));
    } catch { /* ignore */ }

    if (connected) {
      try {
        await getAgentModule().create({
          name: spec?.name || '自定义员工',
          description: spec?.description || spec?.role || '',
          model: spec?.layers?.capability?.model || 'gpt-4o',
          runtimeType: 'hermes',
        });
        toast('success', `${spec?.name || '员工'} 已创建并入职`);
      } catch (err) {
        toast('error', `创建失败：${err instanceof Error ? err.message : '未知错误'}`);
      }
    } else {
      toast('info', '已保存到本地，SDK 离线暂未落库');
    }
    setBuilding(false);
  };

  return (
    <>
    <ToastProvider>
      <div className="h-screen w-screen bg-parchment text-near-black flex overflow-hidden">
        <Sidebar active={tab} onNav={setTab} />
        <main className={`flex-1 flex flex-col overflow-hidden bg-parchment ${BG_CLASS_MAP[bgStyle] || ''}`}>
          {/* 连接状态指示 — 仅在工作台页面显示，极简化 */}
          {!checking && tab === 'dashboard' && (
            <div className="px-8 pt-2 pb-0">
              <div className={`text-[10px] flex items-center gap-1.5 ${connected ? 'text-stone-gray/50' : 'text-yellow-600/70'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400/60' : 'bg-yellow-500/60'}`} />
                {connected ? '已连接' : '离线'}
              </div>
            </div>
          )}

          {tab === 'dashboard' && (
            <Cockpit onNav={setTab} />
          )}
          {tab === 'team' && !building && <Team isConnected={connected} />}
          {tab === 'team' && building && (
            <EmployeeBuilderV2
              onBack={() => setBuilding(false)}
              onComplete={handleBuilderComplete}
            />
          )}
          {tab === 'finance' && <Finance isConnected={connected} />}
          {tab === 'channels' && (
            <Channels
              agents={dashData.agents}
              channelsData={channelsData}
              channelsLoading={channelsLoading}
              onRefresh={refreshChannels}
            />
          )}
          {tab === 'knowledge' && (
            <Knowledge
              knowledgeData={knowledgeData}
              knowledgeLoading={knowledgeLoading}
              isConnected={connected}
              onRefresh={refreshKnowledge}
            />
          )}
          {tab === 'settings' && (
            <Settings isConnected={connected} />
          )}
        </main>
      </div>
    </ToastProvider>
    </>
  );
}

// 外层包裹 AppProvider，确保 useTheme 可用
export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
