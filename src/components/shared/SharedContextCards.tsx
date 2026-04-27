import { useState } from 'react';
import { Building2, Check, Crown, Edit3, User, UsersRound, X } from 'lucide-react';
import { useSharedContext, type SharedContextKey } from '../../features/shared-context/useSharedContext';

type SharedCardIcon = typeof Crown;

interface SharedContextCardProps {
  title: string;
  field: SharedContextKey;
  value: string;
  maxLen: number;
  icon: SharedCardIcon;
  placeholder?: string;
  tone?: 'glass' | 'warm';
}

export function SharedContextCard({
  icon: Icon,
  title,
  field,
  value,
  maxLen,
  placeholder,
  tone = 'glass',
}: SharedContextCardProps) {
  const { updateSharedContext } = useSharedContext();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const pct = Math.min(100, Math.round((value.length / maxLen) * 100));
  const cardClass = tone === 'warm'
    ? 'card-glass-warm p-4 flex flex-col'
    : 'card-glass rounded-2xl p-5 flex flex-col gap-3';

  const handleSave = () => {
    updateSharedContext(field, draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
  };

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-terracotta" />
          <span className="heading-card">{title}</span>
        </div>
        {!editing && (
          <button
            onClick={() => { setDraft(value); setEditing(true); }}
            className="btn-ghost p-1.5 rounded-lg"
          >
            <Edit3 size={14} />
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={tone === 'warm' ? 5 : 3}
            className="input-warm text-sm resize-none min-h-[120px]"
            maxLength={maxLen}
            placeholder={placeholder}
          />
          <div className="flex items-center justify-between">
            <span className="text-caption text-stone-gray">
              {draft.length} / {maxLen}
            </span>
            <div className="flex gap-1">
              <button onClick={handleCancel} className="btn-ghost p-1.5 rounded-lg">
                <X size={14} />
              </button>
              <button onClick={handleSave} className="btn-terracotta py-1.5 px-3 text-xs rounded-lg">
                <Check size={12} />
                保存
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="text-body text-sm line-clamp-3 min-h-[2.5rem] whitespace-pre-wrap">
            {value || <span className="text-stone-gray italic">尚未设置</span>}
          </p>
          <div className="flex items-center gap-2 mt-auto">
            <div className="flex-1 h-1.5 bg-warm-sand rounded-full overflow-hidden">
              <div
                className="h-full bg-terracotta/60 rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-caption text-stone-gray">{pct}%</span>
          </div>
        </>
      )}
    </div>
  );
}

interface SharedContextCardsProps {
  shared: {
    boss: string;
    company: string;
    team: string;
  };
  tone?: 'glass' | 'warm';
}

export function SharedContextCards({ shared, tone = 'glass' }: SharedContextCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <SharedContextCard
        icon={tone === 'warm' ? User : Crown}
        title="老板画像"
        field="boss"
        value={shared.boss}
        maxLen={500}
        placeholder="记录老板的沟通风格、审美偏好、决策习惯等..."
        tone={tone}
      />
      <SharedContextCard
        icon={Building2}
        title="企业画像"
        field="company"
        value={shared.company}
        maxLen={800}
        placeholder="记录企业行业、主营业务、目标客户、竞品等..."
        tone={tone}
      />
      <SharedContextCard
        icon={UsersRound}
        title="团队画像"
        field="team"
        value={shared.team}
        maxLen={500}
        placeholder="记录团队成员特长、协作方式、任务分工等..."
        tone={tone}
      />
    </div>
  );
}