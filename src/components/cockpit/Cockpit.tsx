import { useState, useCallback } from 'react';
import { PanelRightOpen, PanelRightClose } from 'lucide-react';
import PartnerChat from './PartnerChat';
import TeamHeader from './TeamHeader';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import type { NavTab } from '../../types';
import type { TeamMember } from '../../data/partner';
import type { ChatMessage, Task, PartnerProfile, ScheduledTask } from '../../data/partner';
import { useAgentManagement, useConnection } from '../../hooks/useQeeClaw';
import { useCockpit } from '../../hooks/useCockpit';

interface CockpitProps {
  onNav?: (tab: NavTab) => void;
}

export default function Cockpit({ onNav }: CockpitProps) {
  const { connected } = useConnection();
  const { data: agentManagementData } = useAgentManagement(connected);
  const runtimeTeamMembers: TeamMember[] = agentManagementData.agents.map((agent) => {
    return {
      id: agent.id,
      name: agent.name,
      avatar: agent.avatar ?? '🤖',
      color: 'border-l-indigo-400',
      role: agent.role,
      status: 'online',
      locked: false,
    };
  });

  const teamMembers = connected ? runtimeTeamMembers : [];
  const {
    data,
    loading,
    sending,
    sendMessage,
    loadApprovals,
    loadSchedule,
    handlePartnerNameChange,
    approveTask,
    rejectTask,
    toggleSchedule,
    deleteSchedule
  } = useCockpit(connected, teamMembers);

  // ── Derived ──
  const reviewTasks = data.tasks.filter((t: Task) => t.status === 'review');

  // Right panel toggle (default closed)
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [pendingQuickAction, setPendingQuickAction] = useState<{ id: number; text: string } | null>(null);

  const handleMemberClick = useCallback((id: string) => {
    if (id) {
      onNav?.('employees');
    }
  }, [onNav]);

  const handleQuickAction = useCallback((action: string) => {
    if (!connected || !data.sessionId || !data.partner.isConfigured || sending) {
      setPendingQuickAction({ id: Date.now(), text: action });
      return;
    }

    sendMessage(action);
  }, [connected, data.partner.isConfigured, data.sessionId, sendMessage, sending]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-parchment">
      {/* ── Top: Team Header ── */}
      <TeamHeader
        connected={connected}
        partner={data.partner}
        centaur={null}
        teamMembers={teamMembers}
        onPartnerNameChange={handlePartnerNameChange}
        onMemberClick={handleMemberClick}
        onAddMember={undefined}
        onRemoveMember={undefined}
      />

      {/* ── Main: Three-column layout — chat is center stage ── */}
      <div className="flex-1 overflow-hidden flex">

        {/* Left Panel: Action Queue + Quick Actions */}
        <aside className="w-[240px] min-w-[240px] border-r border-border-cream/30 bg-white/30 backdrop-blur-sm flex flex-col overflow-hidden max-lg:hidden">
          <LeftPanel
            reviewTasks={reviewTasks}
            onApprove={approveTask}
            onReject={rejectTask}
            onQuickAction={handleQuickAction}
            scheduledTasks={data.scheduledTasks}
            onScheduleToggle={toggleSchedule}
            onScheduleDelete={deleteSchedule}
          />
        </aside>

        {/* Center: THE Chat — absolute core */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Right panel toggle button */}
          <button
            onClick={() => setRightPanelOpen(p => !p)}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-warm-sand/50 transition-colors text-stone-gray hover:text-charcoal-warm"
            title={rightPanelOpen ? '收起面板' : '展开数据面板'}
          >
            {rightPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
          <div className="flex-1 min-h-0 flex flex-col">
            <PartnerChat
              messages={data.messages}
              partner={data.partner}
              teamMembers={teamMembers}
              onSendMessage={sendMessage}
              onMemberClick={handleMemberClick}
              pendingQuickAction={pendingQuickAction}
              onPendingQuickActionApplied={() => setPendingQuickAction(null)}
            />
          </div>
        </div>

        {/* Right Panel: Centaur Index + Stats + Feed (toggle) */}
        {rightPanelOpen && (
          <aside className="w-[280px] min-w-[280px] border-l border-border-cream/30 bg-white/30 backdrop-blur-sm flex flex-col overflow-hidden max-lg:hidden">
            <RightPanel
              connected={connected}
              centaur={null}
              teamMembers={teamMembers}
              reviewTasks={reviewTasks}
              scheduledTasks={data.scheduledTasks}
            />
          </aside>
        )}    </div>
    </div>
  );
}
