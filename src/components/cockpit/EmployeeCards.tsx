import { MessageSquare } from 'lucide-react';
import type { Agent } from '../../types';

interface EmployeeCardsProps {
  agents: Agent[];
  onChat?: (agentId: string) => void;
}

// 五名核心员工的 ID
const CORE_IDS = new Set(['spark', 'xiaoke', 'shuxi', 'shuibao', 'lvan']);

export default function EmployeeCards({ agents, onChat }: EmployeeCardsProps) {
  const coreAgents = agents.filter(a => CORE_IDS.has(a.id));
  const displayAgents = coreAgents.length > 0 ? coreAgents : agents;

  if (displayAgents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-cream bg-parchment/50 px-4 py-5 text-center text-xs text-stone-gray">
        本地运行时暂无员工数据
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
      {displayAgents.map((agent) => (
        <div
          key={agent.id}
          className="card-glass rounded-xl p-3 min-w-[160px] max-w-[180px] flex-shrink-0 flex flex-col items-center gap-1.5 hover:ring-1 hover:ring-terracotta/30 transition-all"
        >
          {/* Avatar */}
          <span className="text-2xl leading-none">{agent.avatar}</span>

          {/* Name */}
          <span className="font-semibold text-[13px] text-near-black text-center leading-tight">
            {agent.name}
          </span>

          {/* Role */}
          <span className="text-[11px] text-stone-gray text-center leading-tight">
            {agent.role}
          </span>

          {/* Status */}
          <span className="flex items-center gap-1 text-[11px]">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                agent.status === 'running' ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
            <span className={agent.status === 'running' ? 'text-green-700' : 'text-stone-gray'}>
              {agent.status === 'running' ? '工作中' : '空闲'}
            </span>
          </span>

          {/* Latest activity */}
          <p className="text-[11px] text-charcoal-warm text-center leading-tight line-clamp-1 w-full">
            {agent.todaySummary || '暂无动态'}
          </p>

          {/* Chat button */}
          <button
            onClick={() => onChat?.(agent.id)}
            className="mt-auto flex items-center gap-1 px-2.5 py-1 rounded-lg bg-terracotta text-ivory text-[11px] font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            <MessageSquare className="w-3 h-3" />
            对话
          </button>
        </div>
      ))}
    </div>
  );
}
