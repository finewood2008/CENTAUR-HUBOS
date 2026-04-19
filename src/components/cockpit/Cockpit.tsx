import { useState, useCallback } from 'react';
import PartnerChat from './PartnerChat';
import SidePanel from './SidePanel';
import type { NavTab } from '../../types';
import type { DashboardCardType } from '../../data/partner';
import {
  DEFAULT_PARTNER,
  MOCK_MORNING_BRIEFING,
  MOCK_REPORTS,
  ALL_DASHBOARD_CARDS,
  TEAM_MEMBERS,
} from '../../data/partner';
import type { ChatMessage, ReportItem, DashboardCard, PartnerProfile } from '../../data/partner';

interface CockpitProps {
  onNav?: (tab: NavTab) => void;
}

export default function Cockpit({ onNav }: CockpitProps) {
  // Partner state
  const [partner] = useState<PartnerProfile>({
    ...DEFAULT_PARTNER,
    name: '阿拓',
    isConfigured: true,
  });

  // Chat messages
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MORNING_BRIEFING);

  // Reports
  const [reports, setReports] = useState<ReportItem[]>(MOCK_REPORTS);

  // Dashboard cards
  const [cards, setCards] = useState<DashboardCard[]>(ALL_DASHBOARD_CARDS);

  // ── Handlers ──

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
      // Check if message contains @employee
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

      // If mentioning an unlocked employee, add their reply too
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
            content: `收到，我来处理。有进展会及时汇报。`,
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
      // Navigate to team page for locked members
      onNav?.('team');
    }
  }, [onNav]);

  const handleApprove = useCallback((id: string) => {
    setReports(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'approved' as const } : r))
    );
    // Add partner notification in chat
    const report = reports.find(r => r.id === id);
    if (report) {
      const msg: ChatMessage = {
        id: `sys-${Date.now()}`,
        sender: { type: 'system' },
        content: `已批准：${report.employeeName}的「${report.title}」`,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, msg]);
    }
  }, [reports]);

  const handleReject = useCallback((id: string) => {
    setReports(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'rejected' as const } : r))
    );
    const report = reports.find(r => r.id === id);
    if (report) {
      const msg: ChatMessage = {
        id: `sys-${Date.now()}`,
        sender: { type: 'system' },
        content: `已驳回：${report.employeeName}的「${report.title}」`,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, msg]);
    }
  }, [reports]);

  const handleToggleCard = useCallback((type: DashboardCardType) => {
    setCards(prev =>
      prev.map(c => (c.type === type ? { ...c, enabled: !c.enabled } : c))
    );
  }, []);

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Left: Partner Chat (main area) */}
      <div className="flex-1 min-w-0 flex flex-col border-r border-border-cream">
        <PartnerChat
          messages={messages}
          partner={partner}
          onSendMessage={handleSendMessage}
          onMemberClick={handleMemberClick}
        />
      </div>

      {/* Right: Side Panel (reports + dashboard) */}
      <aside className="w-[340px] shrink-0 bg-white/20 backdrop-blur-sm max-lg:w-[300px] max-md:hidden">
        <SidePanel
          reports={reports}
          cards={cards}
          onApprove={handleApprove}
          onReject={handleReject}
          onToggleCard={handleToggleCard}
          onNav={onNav}
        />
      </aside>
    </div>
  );
}
