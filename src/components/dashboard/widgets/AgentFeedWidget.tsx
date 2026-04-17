import React from 'react';
import BaseWidget from './BaseWidget';
import { User, MessageSquare, Clock } from 'lucide-react';

interface AgentFeedWidgetProps {
  id: string;
  agentId: string;
  agentName: string;
  status: 'idle' | 'working' | 'waiting';
  lastMessage?: string;
  onRemove?: (id: string) => void;
}

export default function AgentFeedWidget({ id, agentId, agentName, status, lastMessage, onRemove }: AgentFeedWidgetProps) {
  const statusConfig: Record<'idle' | 'working' | 'waiting', { color: string; text: string; pulse?: boolean }> = {
    idle: { color: 'bg-stone-gray', text: '空闲中' },
    working: { color: 'bg-teal', text: '工作中', pulse: true },
    waiting: { color: 'bg-terracotta', text: '等待确认' }
  };
  
  const currentStatus = statusConfig[status];

  return (
    <BaseWidget 
      id={id} 
      title={agentName} 
      icon={<User size={16} />}
      onRemove={onRemove}
    >
      <div className="flex flex-col h-full space-y-4">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <div className="relative flex h-3 w-3">
          {currentStatus.pulse && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentStatus.color}`}></span>
          )}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${currentStatus.color}`}></span>
          </div>
          <span className="text-xs font-medium text-stone-gray">{currentStatus.text}</span>
        </div>
        
        {/* Latest Feed Content */}
        <div className="flex-1 bg-border-cream/50 rounded-lg p-3 overflow-y-auto">
          {lastMessage ? (
            <div className="flex gap-2">
              <MessageSquare size={14} className="text-olive-gray mt-0.5 shrink-0" />
              <p className="text-sm text-near-black">{lastMessage}</p>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-stone-gray">
              <Clock size={20} className="mb-2 opacity-50" />
              <p className="text-xs">暂无最新汇报</p>
            </div>
          )}
        </div>
        
        {/* Quick Action */}
        <div className="pt-2 border-t border-border-warm">
          <button className="w-full py-1.5 text-xs font-medium text-terracotta bg-terracotta/10 rounded-md hover:bg-terracotta/20 transition-colors">
            分配新任务
          </button>
        </div>
      </div>
    </BaseWidget>
  );
}