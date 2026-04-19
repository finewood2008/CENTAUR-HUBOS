import { useState, useCallback, useMemo } from 'react';
import { Calendar, Users, CheckCircle2, Star } from 'lucide-react';
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

  // ── Derived header data ──

  const onlineCount = useMemo(
    () => TEAM_MEMBERS.filter(m => m.status === 'online' || m.status === 'working').length,
    []
  );

  const pendingCount = useMemo(
    () => reports.filter(r => r.type === 'approval' && r.status === 'pending').length,
    [reports]
  );

  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早上好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  }, []);

  const dateLabel = useMemo(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[now.getDay()];
    return `${month}月${day}日 · ${weekday}`;
  }, []);

  // ── Active (non-locked) team avatars for header ──
  const activeMembers = useMemo(
    () => TEAM_MEMBERS.filter(m => !m.locked),
    []
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-parchment">
      {/* ── Welcome Header ── */}
      <header className="shrink-0 pt-5 pb-3 px-8 flex items-end justify-between">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-bold text-near-black tracking-tight">
            {timeGreeting}
          </h1>
          <div className="flex items-center gap-2 text-[13px] text-stone-gray/70">
            <Calendar className="w-3.5 h-3.5" />
            <span>{dateLabel}</span>
          </div>
        </div>

        {/* Right: compact team summary */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-4 text-[13px] text-olive-gray/80">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400/70" />
              <span>{onlineCount} 员工在线</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-terracotta/50" />
              <span>{pendingCount} 待办</span>
            </div>
          </div>

          {/* Mini avatar stack */}
          <div className="flex -space-x-1.5">
            {activeMembers.map(m => (
              <span
                key={m.id}
                className="w-7 h-7 rounded-full bg-warm-sand border-2 border-parchment flex items-center justify-center text-xs shadow-sm"
                title={m.name}
              >
                {m.avatar}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-hidden px-6 pb-6">
        <div className="grid grid-cols-[1fr_380px] gap-6 h-full max-lg:grid-cols-1">
          {/* Chat Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] border border-white/60 flex flex-col overflow-hidden">
            {/* Card header — partner name + team avatars */}
            <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-border-cream/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-lg ring-2 ring-amber-200/40">
                  {partner.avatar || '🧑‍💼'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-semibold text-near-black">{partner.name}</span>
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                  </div>
                  <span className="text-[11px] text-stone-gray/70">{partner.tagline}</span>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {TEAM_MEMBERS.map(m => (
                  <span
                    key={m.id}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] transition-all ${
                      m.locked ? 'opacity-30 grayscale' : 'hover:scale-110'
                    } ${(m.status === 'online' || m.status === 'working') && !m.locked ? 'ring-1.5 ring-green-400/40' : ''}`}
                    title={`${m.name} — ${m.role}`}
                  >
                    {m.avatar}
                  </span>
                ))}
              </div>
            </div>

            {/* Chat content */}
            <div className="flex-1 min-h-0 flex flex-col">
              <PartnerChat
                messages={messages}
                partner={partner}
                onSendMessage={handleSendMessage}
                onMemberClick={handleMemberClick}
              />
            </div>
          </div>

          {/* Panel Card */}
          <aside className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] border border-white/60 overflow-hidden flex flex-col max-lg:hidden">
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
      </div>
    </div>
  );
}
