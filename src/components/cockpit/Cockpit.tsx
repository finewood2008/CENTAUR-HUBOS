import { useState, useCallback } from 'react';
import { PanelRightOpen, PanelRightClose } from 'lucide-react';
import PartnerChat from './PartnerChat';
import TeamHeader from './TeamHeader';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import type { NavTab } from '../../types';
import {
  DEFAULT_PARTNER,
  MOCK_CENTAUR_INDEX,
  TEAM_MEMBERS,
  ALL_EMPLOYEES,
  DEFAULT_TEAM_IDS,
} from '../../data/partner';
import type { ChatMessage, Task, PartnerProfile, ScheduledTask } from '../../data/partner';
import type { DigitalEmployeeId } from '../../types';
import { useConnection } from '../../hooks/useQeeClaw';
import { useCockpit } from '../../hooks/useCockpit';

interface CockpitProps {
  onNav?: (tab: NavTab) => void;
}

export default function Cockpit({ onNav }: CockpitProps) {
  const { connected } = useConnection();
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
  } = useCockpit(connected);

  // Team members (dynamic — users can add/remove)
  const [teamIds, setTeamIds] = useState<DigitalEmployeeId[]>([...DEFAULT_TEAM_IDS]);
  const teamMembers = teamIds
    .map(id => ALL_EMPLOYEES.find(e => e.id === id))
    .filter(Boolean) as typeof ALL_EMPLOYEES;

  // ── Derived ──
  const reviewTasks = data.tasks.filter((t: Task) => t.status === 'review');

  // Right panel toggle (default closed)
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  const handleMemberClick = useCallback((id: string) => {
    const member = TEAM_MEMBERS.find(m => m.id === id);
    if (member && member.locked) {
      onNav?.('employees');
    }
  }, [onNav]);

  const handleQuickAction = useCallback((action: string) => {
    sendMessage(action);
  }, [sendMessage]);



  const handleAddMember = useCallback((id: DigitalEmployeeId) => {
    setTeamIds(prev => prev.includes(id) ? prev : [...prev, id]);
  }, []);

  const handleRemoveMember = useCallback((id: DigitalEmployeeId) => {
    setTeamIds(prev => prev.filter(tid => tid !== id));
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-parchment">
      {/* ── Top: Team Header ── */}
      <TeamHeader
        partner={data.partner}
        centaur={MOCK_CENTAUR_INDEX}
        teamMembers={teamMembers}
        onPartnerNameChange={handlePartnerNameChange}
        onMemberClick={handleMemberClick}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
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
              onSendMessage={sendMessage}
              onMemberClick={handleMemberClick}
            />
          </div>
        </div>

        {/* Right Panel: Centaur Index + Stats + Feed (toggle) */}
        {rightPanelOpen && (
          <aside className="w-[280px] min-w-[280px] border-l border-border-cream/30 bg-white/30 backdrop-blur-sm flex flex-col overflow-hidden max-lg:hidden">
            <RightPanel centaur={MOCK_CENTAUR_INDEX} />
          </aside>
        )}    </div>
    </div>
  );
}
