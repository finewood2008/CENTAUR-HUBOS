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
    <div className="w-full h-full bg-[#faf9f5] border-r border-[#f0eee6] flex flex-col p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#141413] flex items-center gap-2" style={{ fontFamily: 'Georgia, serif' }}>
          <Users className="w-5 h-5 text-[#c96442]" />
          花名册
        </h2>
        <button className="text-[#c96442] hover:text-[#d97757] bg-[#c96442]/10 hover:bg-[#c96442]/20 p-2 rounded-full transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {agents.map((agent) => (
          <div key={agent.id} className="p-4 rounded-xl bg-[#f5f4ed] border border-[#e8e6dc] hover:border-[#c96442]/40 cursor-pointer transition-all group" style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.03)' }}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-[#141413] font-medium">{agent.name}</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5"></span>
            </div>
            <p className="text-xs text-[#87867f]">{agent.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
