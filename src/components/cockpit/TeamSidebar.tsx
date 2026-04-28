import { Lock, Plus, Crown } from 'lucide-react';
import type { TeamMember, PartnerProfile } from '../../data/partner';

// ── Props ──
interface TeamSidebarProps {
  partner: PartnerProfile;
  teamMembers?: TeamMember[];
  onSelectMember?: (id: string) => void;
  activeChatTarget?: string | null; // 'partner' or employee id
}

// ── Status helpers ──
const STATUS_DOT: Record<TeamMember['status'], string> = {
  online:  'bg-green-400',
  working: 'bg-amber-400 animate-pulse',
  offline: 'bg-gray-500',
};

const STATUS_TEXT: Record<TeamMember['status'], string> = {
  online:  '在线待命',
  working: '执行任务中',
  offline: '未激活',
};

export default function TeamSidebar({
  partner,
  teamMembers = [],
  onSelectMember,
  activeChatTarget,
}: TeamSidebarProps) {
  const isPartnerActive = activeChatTarget === 'partner';

  return (
    <aside className="w-[220px] min-w-[220px] h-full flex flex-col bg-[#2c2520] text-white/90 select-none overflow-hidden">
      {/* ── Butler / 管家 section ── */}
      <button
        type="button"
        onClick={() => onSelectMember?.('partner')}
        className={[
          'flex items-center gap-3 px-4 py-5',
          'hover:bg-white/5 transition-colors cursor-pointer text-left',
          isPartnerActive ? 'bg-white/10' : '',
        ].join(' ')}
      >
        {/* Glowing avatar ring */}
        <div className="relative flex-shrink-0">
          <div className="w-11 h-11 rounded-full bg-[#3d332c] flex items-center justify-center text-2xl ring-2 ring-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.25)]">
            {partner.avatar || '🧑‍💼'}
          </div>
          {/* Crown badge */}
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
            <Crown className="w-2.5 h-2.5 text-white" />
          </span>
          {/* Online dot */}
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-[#2c2520]" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold truncate">
            {partner.name || '管家'}
          </div>
          <div className="text-[11px] text-white/50 truncate">
            {partner.tagline || '你的数字合伙人'}
          </div>
        </div>
      </button>

      {/* Divider */}
      <div className="mx-3 border-t border-white/10" />

      {/* ── Section label ── */}
      <div className="px-4 pt-3 pb-1.5 text-[10px] font-medium tracking-wider text-white/40 uppercase">
        团队成员
      </div>

      {/* ── Employee list ── */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5 scrollbar-thin scrollbar-thumb-white/10">
        {teamMembers.map((m) => (
          <EmployeeRow
            key={m.id}
            member={m}
            active={activeChatTarget === m.id}
            onSelect={() => onSelectMember?.(m.id)}
          />
        ))}
        {teamMembers.length === 0 && (
          <div className="px-2.5 py-3 text-[12px] text-white/35">
            暂无本地运行时员工数据
          </div>
        )}
      </div>

      {/* ── Add employee button ── */}
      <div className="px-3 py-3 border-t border-white/10">
        <button
          type="button"
          className="w-full flex items-center justify-center gap-1.5 text-[12px] text-white/40 hover:text-white/70 hover:bg-white/5 rounded-lg py-2 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          添加员工
        </button>
      </div>
    </aside>
  );
}

// ── Individual employee row ──
function EmployeeRow({
  member,
  active,
  onSelect,
}: {
  member: TeamMember;
  active: boolean;
  onSelect: () => void;
}) {
  const locked = member.locked;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={locked}
      className={[
        'w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors',
        locked
          ? 'opacity-40 cursor-not-allowed'
          : 'hover:bg-white/[.07] cursor-pointer',
        active && !locked ? 'bg-white/10' : '',
      ].join(' ')}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#3d332c] flex items-center justify-center text-lg">
          {member.avatar}
        </div>
        {/* Status dot */}
        <span
          className={[
            'absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#2c2520]',
            STATUS_DOT[member.status],
          ].join(' ')}
        />
      </div>

      {/* Text block */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="text-[13px] font-medium truncate">{member.name}</span>
          {locked && <Lock className="w-3 h-3 text-white/30 flex-shrink-0" />}
        </div>
        <div className="text-[11px] text-white/40 truncate leading-tight">
          {locked
            ? member.role
            : STATUS_TEXT[member.status]}
        </div>
      </div>

      {/* Role pill – only for unlocked, non-active */}
      {!locked && (
        <span className="hidden group-hover:inline text-[10px] text-white/30 flex-shrink-0">
          {member.role}
        </span>
      )}
    </button>
  );
}
