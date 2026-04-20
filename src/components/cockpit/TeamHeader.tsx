import { useState, useRef, useEffect } from 'react';
import { Crown, Lock, Edit2, Sparkles } from 'lucide-react';
import { TEAM_MEMBERS, CENTAUR_LEVELS, type TeamMember, type PartnerProfile, type CentaurIndex } from '../../data/partner';

interface TeamHeaderProps {
  partner: PartnerProfile;
  centaur: CentaurIndex;
  onPartnerNameChange?: (name: string) => void;
  onMemberClick?: (id: string) => void;
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
  partner,
  centaur,
  onPartnerNameChange,
  onMemberClick,
}: TeamHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(partner.name || '管家');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleNameConfirm = () => {
    const trimmed = editName.trim();
    if (trimmed) {
      onPartnerNameChange?.(trimmed);
    } else {
      setEditName(partner.name || '管家');
    }
    setEditing(false);
  };

  const levelInfo = CENTAUR_LEVELS[centaur.level];

  return (
    <div className="shrink-0 bg-white/70 backdrop-blur-sm border-b border-border-cream/30">
      <div className="flex items-center gap-6 px-6 py-3">
        {/* ── Partner Section ── */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center text-2xl ring-2 ring-amber-300/50 shadow-[0_0_12px_rgba(251,191,36,0.2)]">
              {partner.avatar || '🧑‍💼'}
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center shadow-sm">
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
                <span className="text-[15px] font-semibold text-near-black">{partner.name || '管家'}</span>
                <Edit2 size={11} className="text-stone-gray/0 group-hover:text-stone-gray/60 transition-colors" />
              </button>
            )}
            <div className="text-[11px] text-stone-gray/70 mt-0.5">
              {partner.tagline || '你的数字合伙人'} · 在线
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="w-px h-10 bg-border-cream/40 shrink-0" />

        {/* ── Team Members Row ── */}
        <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
          {TEAM_MEMBERS.map(m => (
            <button
              key={m.id}
              onClick={() => onMemberClick?.(m.id)}
              disabled={m.locked}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all shrink-0 ${
                m.locked ? 'opacity-35 cursor-not-allowed' : 'hover:bg-warm-sand/50 cursor-pointer'
              }`}
              title={m.locked ? `${m.name} — 未激活` : `${m.name} — ${m.role}`}
            >
              <div className="relative">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${
                  m.locked ? 'bg-gray-100' : 'bg-gradient-to-br from-parchment to-warm-sand'
                }`}>
                  {m.avatar}
                  {m.locked && (
                    <div className="absolute inset-0 rounded-full bg-white/60 flex items-center justify-center">
                      <Lock size={12} className="text-stone-gray/60" />
                    </div>
                  )}
                </div>
                {!m.locked && (
                  <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border-[1.5px] border-white ${STATUS_DOT[m.status]}`} />
                )}
              </div>
              <span className={`text-[10px] leading-tight ${m.locked ? 'text-stone-gray/50' : 'text-charcoal-warm'}`}>
                {m.name}
              </span>
              {!m.locked && m.status === 'working' && CURRENT_TASKS[m.id] && (
                <span className="text-[9px] text-amber-600/70 truncate max-w-[60px]">{CURRENT_TASKS[m.id]}</span>
              )}
              {!m.locked && m.status !== 'working' && (
                <span className="text-[9px] text-stone-gray/50">{STATUS_TEXT[m.status]}</span>
              )}
            </button>
          ))}
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
              <span className={`text-[18px] font-bold leading-none ml-auto ${levelInfo.color}`}>
                {centaur.overall}
              </span>
            </div>

            {/* Progress bar: AI vs Human */}
            <div className="w-full flex items-center gap-1.5">
              <span className="text-[9px] text-terracotta/70 shrink-0">AI</span>
              <div className="flex-1 h-[6px] rounded-full bg-gray-100 overflow-hidden flex">
                <div
                  className="h-full rounded-l-full bg-gradient-to-r from-terracotta to-amber-400 transition-all duration-700"
                  style={{ width: `${centaur.overall}%` }}
                />
                <div
                  className="h-full rounded-r-full bg-gradient-to-r from-blue-200 to-blue-300"
                  style={{ width: `${100 - centaur.overall}%` }}
                />
              </div>
              <span className="text-[9px] text-blue-400/70 shrink-0">人</span>
            </div>

            {/* Level label */}
            <div className="flex items-center gap-1 w-full justify-end">
              <span className={`text-[10px] font-medium ${levelInfo.color}`}>{centaur.levelLabel}</span>
              <span className="text-[9px] text-stone-gray/50">AI {centaur.overall}% · 人 {100 - centaur.overall}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
