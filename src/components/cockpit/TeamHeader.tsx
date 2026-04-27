import { useState, useRef, useEffect } from 'react';
import { Crown, Lock, Edit2, Sparkles, Plus, X } from 'lucide-react';
import { CENTAUR_LEVELS, ALL_EMPLOYEES, type TeamMember, type PartnerProfile, type CentaurIndex } from '../../data/partner';
import type { DigitalEmployeeId } from '../../types';

interface TeamHeaderProps {
  connected: boolean;
  partner: PartnerProfile;
  centaur: CentaurIndex | null;
  teamMembers: TeamMember[];
  onPartnerNameChange?: (name: string) => void;
  onMemberClick?: (id: string) => void;
  onAddMember?: (id: DigitalEmployeeId) => void;
  onRemoveMember?: (id: DigitalEmployeeId) => void;
}

const STATUS_DOT: Record<TeamMember['status'], string> = {
  online: 'bg-green-400',
  working: 'bg-amber-400 animate-pulse',
  offline: 'bg-gray-300',
};

const STATUS_TEXT: Record<TeamMember['status'], string> = {
  online: '在线',
  working: '工作中',
  offline: '离线',
};

const CURRENT_TASKS: Record<string, string> = {
  spark: '设计展会海报',
};

export default function TeamHeader({
  connected,
  partner,
  centaur,
  teamMembers,
  onPartnerNameChange,
  onMemberClick,
  onAddMember,
  onRemoveMember,
}: TeamHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(partner.name || '管家');
  const [showPicker, setShowPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPicker]);

  const handleNameConfirm = () => {
    const trimmed = editName.trim();
    if (trimmed) {
      onPartnerNameChange?.(trimmed);
    } else {
      setEditName(partner.name || '管家');
    }
    setEditing(false);
  };

  const levelInfo = centaur ? CENTAUR_LEVELS[centaur.level] : null;
  const visibleTeamMembers = connected
    ? teamMembers
    : teamMembers.map((member) => ({ ...member, status: 'offline' as const }));
  const onlineTeamCount = connected
    ? visibleTeamMembers.filter((member) => member.status === 'online' || member.status === 'working').length
    : 0;

  // Employees available to add (in ALL_EMPLOYEES but not in teamMembers)
  const teamIds = new Set(visibleTeamMembers.map(m => m.id));
  const availableToAdd = ALL_EMPLOYEES.filter(e => e.id !== 'leader' && !teamIds.has(e.id));

  return (
    <div className="shrink-0 bg-white/70 backdrop-blur-sm border-b border-border-cream/30">
      <div className="flex items-center gap-6 px-6 py-3">
        {/* ── Partner Section ── */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-2xl ring-3 ring-indigo-300/40 shadow-[0_0_18px_rgba(129,140,248,0.3)]">
              {partner.avatar || '🧑‍💼'}
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center shadow-sm">
              <Crown className="w-2.5 h-2.5 text-white" />
            </span>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white" />
          </div>
          <div className="min-w-0">
            {editing ? (
              <input
                ref={inputRef}
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={handleNameConfirm}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleNameConfirm();
                  if (e.key === 'Escape') { setEditName(partner.name || '管家'); setEditing(false); }
                }}
                className="text-[15px] font-semibold text-near-black bg-parchment/60 rounded-lg px-2 py-0.5 outline-none ring-1 ring-amber-300/50 w-24"
              />
            ) : (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1 group cursor-pointer">
                <span className="text-[17px] font-semibold text-near-black">{partner.name || '管家'}</span>
                <Edit2 size={11} className="text-stone-gray/0 group-hover:text-stone-gray/60 transition-colors" />
              </button>
            )}
            <div className="text-[11px] text-stone-gray/70 mt-0.5">
              {partner.tagline || '你的数字合伙人'} · {connected ? '在线' : '离线'}
            </div>
            <div className="text-[10px] text-indigo-500/60 mt-0.5">
              COO · 统管团队
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="w-px h-10 bg-border-cream/40 shrink-0" />

        {/* ── Team Members Row ── */}
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center gap-1 px-3">
            <span className="text-[10px] text-stone-gray/60">{connected ? '团队在线' : '团队状态'}</span>
            <span className="text-[10px] text-stone-gray/60 font-medium">{connected ? `${onlineTeamCount}人` : '离线'}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="bg-warm-sand/20 rounded-2xl px-3 py-2 flex items-center gap-1 overflow-x-auto flex-1 min-w-0">
          {visibleTeamMembers.map(m => (
            <div
              key={m.id}
              onClick={() => onMemberClick?.(m.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onMemberClick?.(m.id);
                }
              }}
              role="button"
              tabIndex={0}
              className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all shrink-0 hover:bg-warm-sand/50 cursor-pointer group"
              title={`${m.name} — ${m.role}`}
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg bg-gradient-to-br from-parchment to-warm-sand">
                  {m.avatar}
                </div>
                <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border-[1.5px] border-white ${STATUS_DOT[m.status]}`} />
                {/* Remove button on hover */}
                {onRemoveMember && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveMember(m.id); }}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-400 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    title={`移除${m.name}`}
                    type="button"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
              <span className="text-[10px] leading-tight text-charcoal-warm">
                {m.name}
              </span>
              {m.status === 'working' && CURRENT_TASKS[m.id] && (
                <span className="text-[9px] text-amber-600/70 truncate max-w-[60px]">{CURRENT_TASKS[m.id]}</span>
              )}
              {m.status !== 'working' && (
                <span className="text-[9px] text-stone-gray/50">{STATUS_TEXT[m.status]}</span>
              )}
            </div>
          ))}
            </div>

          {/* ── Add Member Button (outside overflow container) ── */}
          {availableToAdd.length > 0 && (
            <div className="relative shrink-0" ref={pickerRef}>
              <button
                onClick={() => setShowPicker(p => !p)}
                className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all hover:bg-warm-sand/50 cursor-pointer"
                title="添加团队成员"
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-dashed border-stone-gray/30 hover:border-terracotta/50 transition-colors">
                  <Plus size={16} className="text-stone-gray/50" />
                </div>
                <span className="text-[10px] leading-tight text-stone-gray/50">添加</span>
              </button>

              {/* ── Picker Popover ── */}
              {showPicker && (
                <div
                  className="absolute top-full right-0 mt-2 z-[100] w-[200px] rounded-xl border border-border-cream/60 bg-white shadow-lg py-2"
                  style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)' }}
                >
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-stone-gray border-b border-border-cream/30 mb-1">
                    选择员工加入团队
                  </div>
                  {availableToAdd.map(emp => (
                    <button
                      key={emp.id}
                      onClick={() => {
                        onAddMember?.(emp.id);
                        if (availableToAdd.length <= 1) setShowPicker(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-parchment/60 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-base bg-gradient-to-br from-parchment to-warm-sand">
                        {emp.avatar}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-near-black">{emp.name}</div>
                        <div className="text-[10px] text-stone-gray">{emp.role}</div>
                      </div>
                      {emp.locked && (
                        <Lock size={12} className="text-stone-gray/40 ml-auto shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="w-px h-10 bg-border-cream/40 shrink-0" />

        {/* ── Centaur Index (精简版) ── */}
        <div className="flex items-center gap-3 shrink-0 pl-1">
          <div className="flex flex-col items-end gap-1 min-w-[130px]">
            {/* Title + value */}
            <div className="flex items-center gap-2 w-full">
              <Sparkles size={13} className="text-terracotta shrink-0" />
              <span className="text-[10px] text-stone-gray font-medium">半人马指数</span>
              <span className={`text-[18px] font-bold leading-none ml-auto ${connected && levelInfo ? levelInfo.color : 'text-stone-gray/50'}`}>
                {connected && centaur ? centaur.overall : '--'}
              </span>
            </div>

            {/* Progress bar: AI vs Human */}
            <div className="w-full flex items-center gap-1.5">
              <span className="text-[9px] text-terracotta/70 shrink-0">AI</span>
              <div className="flex-1 h-[6px] rounded-full bg-gray-100 overflow-hidden flex">
                <div
                  className="h-full rounded-l-full bg-gradient-to-r from-terracotta to-amber-400 transition-all duration-700"
                  style={{ width: `${connected && centaur ? centaur.overall : 0}%` }}
                />
                <div
                  className="h-full rounded-r-full bg-gradient-to-r from-blue-200 to-blue-300"
                  style={{ width: `${connected && centaur ? 100 - centaur.overall : 100}%` }}
                />
              </div>
              <span className="text-[9px] text-blue-400/70 shrink-0">人</span>
            </div>

            {/* Level label */}
            <div className="flex items-center gap-1 w-full justify-end">
              <span className={`text-[10px] font-medium ${connected && levelInfo ? levelInfo.color : 'text-stone-gray/50'}`}>{connected && centaur ? centaur.levelLabel : '未接入'}</span>
              <span className="text-[9px] text-stone-gray/50">{connected && centaur ? `AI ${centaur.overall}% · 人 ${100 - centaur.overall}%` : '等待真实运行时指标'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
