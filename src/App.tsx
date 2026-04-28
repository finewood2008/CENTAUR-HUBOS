// Hub OS - 主应用入口
// SDK 连接 → 真实数据；后端未启动 → 空态/错误态
import { Suspense, lazy, useCallback, useState } from 'react';
import type { NavFocusIntent, NavTab } from './types';
import Sidebar from './components/layout/Sidebar';
import type { DigitalEmployee } from './types';
import { ToastProvider, useToast } from './components/shared/Toast';
import { AppProvider, useTheme } from './stores/useAppStore';
import { useConnection, useEnhancedDashboardData, useChannelsData, useKnowledgeData } from './hooks/useQeeClaw';
import { getClientAsync } from './services/qeeclaw';
import { refreshBuilderPreflightProjects } from './features/builder/preflight';

const Cockpit = lazy(() => import('./components/cockpit'));
const Team = lazy(() => import('./components/team/Team'));
const EmployeeBuilderV2 = lazy(() => import('./components/builder'));
const Finance = lazy(() => import('./components/finance/Finance'));
const Channels = lazy(() => import('./components/channels/Channels'));
const Knowledge = lazy(() => import('./components/knowledge/Knowledge'));
const MemoryCenter = lazy(() => import('./components/memory/MemoryCenter'));
const VirtualOffice = lazy(() => import('./components/office/VirtualOffice'));
const Settings = lazy(() => import('./components/settings/Settings'));

// 背景样式映射
const BG_CLASS_MAP: Record<string, string> = {
  grid: 'bg-grid',
  solid: '',
  paper: 'bg-paper',
  gradient: 'bg-gradient',
};

function TabFallback() {
  return (
    <div className="flex flex-1 items-center justify-center px-8">
      <div className="rounded-2xl border border-border-cream bg-warm-sand/40 px-5 py-4 text-sm text-stone-gray">
        正在加载工作台...
      </div>
    </div>
  );
}

function storeCustomEmployee(spec: DigitalEmployee) {
  try {
    const raw = localStorage.getItem('hubos_custom_employees');
    const list = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(list)
      ? [spec, ...list.filter((item: DigitalEmployee) => item.id !== spec.id)]
      : [spec];
    localStorage.setItem('hubos_custom_employees', JSON.stringify(next));
  } catch {
    /* ignore local display cache failures */
  }
}

function AppInner() {
  const [tab, setTab] = useState<NavTab>('team');
  const [focusIntent, setFocusIntent] = useState<NavFocusIntent | null>(null);
  const [building, setBuilding] = useState(false);
  const { connected, checking } = useConnection();
  const { bgStyle } = useTheme();
  const { toast } = useToast();

  // 数据加载
  const { data: dashData } = useEnhancedDashboardData(connected);
  const { data: channelsData, loading: channelsLoading, error: channelsError, refresh: refreshChannels } = useChannelsData(connected);
  const { data: knowledgeData, loading: knowledgeLoading, refresh: refreshKnowledge } = useKnowledgeData(connected);

  const refreshBuilderPreflight = useCallback(() => {
    void refreshBuilderPreflightProjects();
  }, []);

  const handleChannelsRefresh = useCallback(async () => {
    await refreshChannels();
    refreshBuilderPreflight();
  }, [refreshBuilderPreflight, refreshChannels]);

  const handleKnowledgeRefresh = useCallback(async () => {
    await refreshKnowledge();
    refreshBuilderPreflight();
  }, [refreshBuilderPreflight, refreshKnowledge]);

  const handleBuilderComplete = async (spec: DigitalEmployee) => {
    if (spec.builder?.agentId) {
      storeCustomEmployee({ ...spec, status: 'active' });
      toast('success', `${spec?.name || '员工'} 已创建并入职`);
    } else if (connected) {
      try {
        const client = await getClientAsync();
        const created = await client.agent.create({
          name: spec?.name || '自定义员工',
          description: spec?.tagline || spec?.role || '',
          model: spec?.model || 'gpt-4o',
          runtimeType: 'hermes',
        });
        storeCustomEmployee({
          ...spec,
          status: 'active',
          builder: spec.builder
            ? { ...spec.builder, agentId: Number(created.id) }
            : spec.builder,
        });
        toast('success', `${spec?.name || '员工'} 已创建并入职`);
      } catch (err) {
        toast('error', `创建失败：${err instanceof Error ? err.message : '未知错误'}`);
        return;
      }
    } else {
      storeCustomEmployee(spec);
      toast('info', '已保存为本地草稿，SDK 离线暂未创建真实员工');
    }
    setBuilding(false);
  };

  const handleNav = (nextTab: NavTab, intent?: NavFocusIntent) => {
    setTab(nextTab);
    setFocusIntent(intent ?? null);
  };

  return (
    <>
      <div className="h-screen w-screen bg-parchment text-near-black flex overflow-hidden">
        <Sidebar active={tab} onNav={(nextTab) => handleNav(nextTab)} />
        <main className={`flex-1 flex flex-col overflow-hidden bg-parchment ${BG_CLASS_MAP[bgStyle] || ''}`}>
          {/* 连接状态指示 — 仅在团队页面显示，极简化 */}
          {!checking && tab === 'team' && (
            <div className="px-8 pt-2 pb-0">
              <div className={`text-[10px] flex items-center gap-1.5 ${connected ? 'text-stone-gray/50' : 'text-yellow-600/70'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400/60' : 'bg-yellow-500/60'}`} />
                {connected ? '已连接' : '离线'}
              </div>
            </div>
          )}
          <Suspense fallback={<TabFallback />}>
            {tab === 'team' && (
              <Cockpit onNav={(nextTab) => handleNav(nextTab)} />
            )}
            {tab === 'employees' && !building && <Team isConnected={connected} onNav={handleNav} />}
            {tab === 'employees' && building && (
              <EmployeeBuilderV2
                onBack={() => setBuilding(false)}
                onComplete={handleBuilderComplete}
                onNavigate={handleNav}
              />
            )}
            {tab === 'finance' && <Finance isConnected={connected} />}
            {tab === 'channels' && (
              <Channels
                agents={dashData.agents}
                channelsData={channelsData}
                channelsLoading={channelsLoading}
                channelsError={channelsError}
                onRefresh={handleChannelsRefresh}
                focusChannelKey={focusIntent?.tab === 'channels' ? focusIntent.target : undefined}
              />
            )}
            {tab === 'memory' && <MemoryCenter />}
            {tab === 'office' && <VirtualOffice isConnected={connected} />}
            {tab === 'knowledge' && (
              <Knowledge
                knowledgeData={knowledgeData}
                knowledgeLoading={knowledgeLoading}
                isConnected={connected}
                onRefresh={handleKnowledgeRefresh}
                focusAction={focusIntent?.tab === 'knowledge' ? focusIntent.action : undefined}
                focusQuery={focusIntent?.tab === 'knowledge' ? focusIntent.target : undefined}
              />
            )}
            {tab === 'settings' && (
              <Settings isConnected={connected} />
            )}
          </Suspense>
        </main>
      </div>
    </>
  );
}

// 外层包裹 AppProvider，确保 useTheme 可用
export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </AppProvider>
  );
}
