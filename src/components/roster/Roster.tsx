import { Users, Plus, Loader2 } from 'lucide-react';
import { useAgentManagement } from '../../hooks/useQeeClaw';
import type { Agent } from '../../types';

interface RosterProps {
  isConnected: boolean;
  agents?: Agent[];
  onAdd?: () => void;
}

export default function Roster({ isConnected, agents: externalAgents, onAdd }: RosterProps) {
  const { data, loading } = useAgentManagement(isConnected);
  const agents = externalAgents ?? data.agents;

  return (
    <div className="w-full h-full border-r border-border-cream flex flex-col p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-near-black flex items-center gap-2" style={{ fontFamily: 'Georgia, serif' }}>
          <Users className="w-5 h-5 text-terracotta" />
          花名册
        </h2>
        <button onClick={onAdd} className="text-terracotta hover:text-coral bg-terracotta/10 hover:bg-terracotta/20 p-2 rounded-full transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 text-stone-gray animate-spin" />
          </div>
        )}
        {!loading && agents.map((agent) => (
          <div key={agent.id} className="p-4 card-glass cursor-pointer group" style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.03)' }}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{agent.avatar}</span>
                <h3 className="text-near-black font-medium">{agent.name}</h3>
              </div>
              <span className={`w-2 h-2 rounded-full mt-1.5 ${agent.status === 'running' ? 'bg-emerald-500' : agent.status === 'idle' ? 'bg-amber-500' : 'bg-stone-gray'}`} />
            </div>
            <p className="text-xs text-stone-gray">{agent.role}</p>
            {agent.model && (
              <p className="text-[10px] text-warm-silver mt-1">{agent.model}</p>
            )}
          </div>
        ))}
        {!loading && agents.length === 0 && (
          <div className="text-center py-8 text-stone-gray text-sm">暂无员工</div>
        )}
      </div>
    </div>
  );
}
