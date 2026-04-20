import { useState, useCallback } from 'react';
import { PanelRightOpen, PanelRightClose } from 'lucide-react';
import PartnerChat from './PartnerChat';
import TeamHeader from './TeamHeader';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import type { NavTab } from '../../types';
import {
  DEFAULT_PARTNER,
  MOCK_MORNING_BRIEFING,
  MOCK_TASKS,
  MOCK_CENTAUR_INDEX,
  TEAM_MEMBERS,
  ALL_EMPLOYEES,
  DEFAULT_TEAM_IDS,
} from '../../data/partner';
import type { ChatMessage, Task, PartnerProfile } from '../../data/partner';
import type { DigitalEmployeeId } from '../../types';

interface CockpitProps {
  onNav?: (tab: NavTab) => void;
}

export default function Cockpit({ onNav }: CockpitProps) {
  // Partner state
  const [partner, setPartner] = useState<PartnerProfile>({
    ...DEFAULT_PARTNER,
    name: '阿拓',
    isConfigured: true,
  });

  // Chat messages
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MORNING_BRIEFING);

  // Tasks
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);

  // Team members (dynamic — users can add/remove)
  const [teamIds, setTeamIds] = useState<DigitalEmployeeId[]>([...DEFAULT_TEAM_IDS]);
  const teamMembers = teamIds
    .map(id => ALL_EMPLOYEES.find(e => e.id === id))
    .filter(Boolean) as typeof ALL_EMPLOYEES;

  // ── Derived ──
  const reviewTasks = tasks.filter(t => t.status === 'review');

  // Right panel toggle (default closed)
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  // ── Handlers ──

  const handlePartnerNameChange = useCallback((name: string) => {
    setPartner(prev => ({ ...prev, name }));
  }, []);

  const handleSendMessage = useCallback((text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: { type: 'user' },
      content: text,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);

    // Mock partner reply after short delay
    setTimeout(() => {
      const mentionMatch = text.match(/@(\S+)/);
      const member = mentionMatch
        ? TEAM_MEMBERS.find(m => m.name === mentionMatch[1])
        : null;

      let replyContent = '收到，我来安排。';
      if (member && !member.locked) {
        replyContent = `好的，我让${member.name}来处理。`;
      } else if (member && member.locked) {
        replyContent = `${member.name}还在入职准备中，暂时由我来处理这个需求。`;
      } else if (text.includes('数据') || text.includes('报表')) {
        replyContent = '好的，我来帮你拉一下数据。';
      } else if (text.includes('文章') || text.includes('内容')) {
        replyContent = '内容相关的事我交给火花来处理。';
      } else if (text.includes('客户') || text.includes('线索')) {
        replyContent = '获客的事我交给小可来跟进。';
      }

      const partnerReply: ChatMessage = {
        id: `partner-${Date.now()}`,
        sender: { type: 'partner' },
        content: replyContent,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, partnerReply]);

      if (member && !member.locked) {
        setTimeout(() => {
          const employeeReply: ChatMessage = {
            id: `emp-${Date.now()}`,
            sender: {
              type: 'employee',
              id: member.id,
              name: member.name,
              avatar: member.avatar,
              color: member.color,
            },
            content: '收到，我来处理。有进展会及时汇报。',
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages(prev => [...prev, employeeReply]);
        }, 800);
      }
    }, 600);
  }, []);

  const handleMemberClick = useCallback((id: string) => {
    const member = TEAM_MEMBERS.find(m => m.id === id);
    if (member && member.locked) {
      onNav?.('employees');
    }
  }, [onNav]);

  const handleApproveTask = useCallback((taskId: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: 'completed' as const, progress: 100 } : t))
    );
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const msg: ChatMessage = {
        id: `sys-${Date.now()}`,
        sender: { type: 'system' },
        content: `已批准：${task.assigneeName}的「${task.title}」`,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, msg]);
    }
  }, [tasks]);

  const handleRejectTask = useCallback((taskId: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: 'pending' as const } : t))
    );
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const msg: ChatMessage = {
        id: `sys-${Date.now()}`,
        sender: { type: 'system' },
        content: `已驳回：${task.assigneeName}的「${task.title}」，已退回修改`,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, msg]);
    }
  }, [tasks]);

  const handleQuickAction = useCallback((action: string) => {
    handleSendMessage(action);
  }, [handleSendMessage]);

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
        partner={partner}
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
            onApprove={handleApproveTask}
            onReject={handleRejectTask}
            onQuickAction={handleQuickAction}
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
              messages={messages}
              partner={partner}
              onSendMessage={handleSendMessage}
              onMemberClick={handleMemberClick}
            />
          </div>
        </div>

        {/* Right Panel: Centaur Index + Stats + Feed (toggle) */}
        {rightPanelOpen && (
          <aside className="w-[280px] min-w-[280px] border-l border-border-cream/30 bg-white/30 backdrop-blur-sm flex flex-col overflow-hidden max-lg:hidden">
            <RightPanel centaur={MOCK_CENTAUR_INDEX} />
          </aside>
        )}

      </div>
    </div>
  );
}
