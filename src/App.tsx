// Hub OS - 主应用入口
// SDK 连接 → 真实数据；后端未启动 → 自动 fallback mock
import { useState, useEffect } from 'react';
import type { NavTab } from './types';
import Sidebar from './components/layout/Sidebar';
import DashboardGrid from './components/dashboard/DashboardGrid';
import Team from './components/team/Team';
import EmployeeBuilder from './components/team/EmployeeBuilder';
import Finance from './components/finance/Finance';
import Channels from './components/channels/Channels';
import Knowledge from './components/knowledge/Knowledge';
import Settings from './components/settings/Settings';
import { ToastProvider } from './components/shared/Toast';
import { AppProvider } from './stores/useAppStore';
import { useConnection, useDashboardData, useChannelsData, useKnowledgeData } from './hooks/useQeeClaw';

export default function App() {
  const [tab, setTab] = useState<NavTab>('dashboard');
  const [building, setBuilding] = useState(false);
  const { connected, checking } = useConnection();

  // 读取背景样式设置
  const [bgStyle, setBgStyle] = useState('grid');
  useEffect(() => {
    try {
      const raw = localStorage.getItem('hubos-settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.bgStyle) setBgStyle(parsed.bgStyle);
      }
    } catch { /* ignore */ }
    // 监听 storage 变化（跨标签页）+ 自定义事件（同页面设置页保存）
    const update = () => {
      try {
        const raw = localStorage.getItem('hubos-settings');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.bgStyle) setBgStyle(parsed.bgStyle);
        }
      } catch { /* ignore */ }
    };
    const storageHandler = (e: StorageEvent) => {
      if (e.key === 'hubos-settings') update();
    };
    window.addEventListener('storage', storageHandler);
    window.addEventListener('hubos-settings-changed', update);
    return () => {
      window.removeEventListener('storage', storageHandler);
      window.removeEventListener('hubos-settings-changed', update);
    };
  }, []);

  // 数据加载
  const { data: dashData } = useDashboardData(connected);
  const { data: channelsData, loading: channelsLoading, refresh: refreshChannels } = useChannelsData(connected);
  const { data: knowledgeData, loading: knowledgeLoading, refresh: refreshKnowledge } = useKnowledgeData(connected);

  return (
    <AppProvider>
    <ToastProvider>
      <div className="h-screen w-screen bg-parchment text-near-black flex overflow-hidden">
        <Sidebar active={tab} onNav={setTab} />
        <main className={`flex-1 flex flex-col overflow-hidden ${bgStyle === 'grid' ? 'bg-grid' : 'bg-parchment'}`}>
          {/* 连接状态指示 */}
          {!checking && (
            <div className={`px-4 py-1 text-[10px] flex items-center gap-1.5 border-b border-border-cream ${connected ? 'text-success-green' : 'text-yellow-600'}`}>
              <span className={`status-dot ${connected ? 'status-dot-active' : 'bg-yellow-500'}`} />
              {connected ? 'SDK 已连接 · 控制面在线' : 'SDK 离线 · 使用演示数据'}
            </div>
          )}

          {tab === 'dashboard' && (
            <DashboardGrid />
          )}
          {tab === 'team' && !building && <Team onStartBuilder={() => setBuilding(true)} />}
          {tab === 'team' && building && (
            <EmployeeBuilder
              onBack={() => setBuilding(false)}
              onComplete={(employee) => {
                try {
                  const raw = localStorage.getItem('hubos_custom_employees');
                  const list = raw ? JSON.parse(raw) : [];
                  list.push(employee);
                  localStorage.setItem('hubos_custom_employees', JSON.stringify(list));
                } catch { /* ignore */ }
                setBuilding(false);
              }}
            />
          )}
          {tab === 'finance' && <Finance />}
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
              onRefresh={refreshKnowledge}
            />
          )}
          {tab === 'settings' && (
            <Settings isConnected={connected} />
          )}
        </main>
      </div>
    </ToastProvider>
    </AppProvider>
  );
}
