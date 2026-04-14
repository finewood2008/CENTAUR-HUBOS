// Hub OS - 主应用入口
import { useState } from 'react';
import type { NavTab } from './types';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/dashboard/Dashboard';
import AgentManagement from './components/agents/AgentManagement';
import Channels from './components/channels/Channels';
import Knowledge from './components/knowledge/Knowledge';
import { AGENTS, TEMPLATES, ALERTS, USAGE_7DAYS } from './data/mock';

export default function App() {
  const [tab, setTab] = useState<NavTab>('dashboard');

  return (
    <div className="h-screen w-screen bg-gray-950 text-white flex overflow-hidden">
      <Sidebar active={tab} onNav={setTab} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {tab === 'dashboard' && (
          <Dashboard
            agents={AGENTS}
            alerts={ALERTS}
            usage={USAGE_7DAYS}
            onGoAgents={() => setTab('agents')}
          />
        )}
        {tab === 'agents' && (
          <AgentManagement agents={AGENTS} templates={TEMPLATES} />
        )}
        {tab === 'channels' && <Channels />}
        {tab === 'knowledge' && <Knowledge />}
      </main>
    </div>
  );
}
