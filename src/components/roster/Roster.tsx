import React from 'react';
import { Users, Plus } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'training' | 'offline';
}

const agents: Agent[] = [
  { id: '1', name: 'Spark (火花)', role: 'CMO / 品牌设计专家', status: 'active' }
];

export default function Roster() {
  return (
    <div className="w-full h-full bg-[#0A0C10] border-r border-slate-800 flex flex-col p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-orange-500" />
          花名册
        </h2>
        <button className="text-orange-500 hover:text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 p-2 rounded-full transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {agents.map((agent) => (
          <div key={agent.id} className="p-4 rounded-xl bg-[#11141A] border border-slate-800 hover:border-orange-500/50 cursor-pointer transition-all group">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-white font-medium">{agent.name}</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            </div>
            <p className="text-xs text-slate-500">{agent.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
