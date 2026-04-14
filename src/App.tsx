// Hub OS - 主应用入口
// SDK 连接 → 真实数据；后端未启动 → 自动 fallback mock
import { useState } from 'react';
import type { NavTab } from './types';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/dashboard/Dashboard';
import AgentManagement from './components/agents/AgentManagement';
import Channels from './components/channels/Channels';
import Knowledge from './components/knowledge/Knowledge';
import Settings from './components/settings/Settings';
import { useConnection, useDashboardData, useAgentManagement, useChannelsData, useKnowledgeData } from './hooks/useQeeClaw';

export default function App() {
  const [tab, setTab] = useState<NavTab>('dashboard');
  const { connected, checking } = useConnection();

  // 数据加载
  const { data: dashData, loading: dashLoading } = useDashboardData(connected);
  const { data: agentData, loading: agentLoading } = useAgentManagement(connected);
  const { data: channelsData, loading: channelsLoading, refresh: refreshChannels } = useChannelsData(connected);
  const { data: knowledgeData, loading: knowledgeLoading, refresh: refreshKnowledge } = useKnowledgeData(connected);

  return (
    <div className="h-screen w-screen bg-gray-950 text-white flex overflow-hidden">
      <Sidebar active={tab} onNav={setTab} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 连接状态指示 */}
        {!checking && (
          <div className={`px-4 py-1 text-[10px] flex items-center gap-1.5 border-b border-white/5 ${connected ? 'text-green-500' : 'text-yellow-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400' : 'bg-yellow-400'}`} />
            {connected ? 'SDK 已连接 · 控制面在线' : 'SDK 离线 · 使用演示数据'}
          </div>
        )}

        {tab === 'dashboard' && (
          <Dashboard
            agents={dashData.agents}
            alerts={dashData.alerts}
            usage={dashData.usage}
            wallet={dashData.wallet}
            onGoAgents={() => setTab('agents')}
          />
        )}
        {tab === 'agents' && (
          <AgentManagement agents={agentData.agents} templates={agentData.templates} isConnected={connected} />
        )}
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
  );
}
