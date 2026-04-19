// TabSkills — 技能列表(来自 clawhub.ai)
import { useState } from 'react';
import { Zap, ExternalLink, Check } from 'lucide-react';
import type { DigitalEmployee } from '../../../types';
import { getEmployeeSkills, type EmployeeSkill } from '../../../data/employee-skills';

interface Props {
  emp: DigitalEmployee;
  readonly?: boolean;
}

export default function TabSkills({ emp, readonly }: Props) {
  const initialSkills = getEmployeeSkills(emp.id as any);
  const [skills, setSkills] = useState<EmployeeSkill[]>(initialSkills);

  const toggle = (id: string) => {
    if (readonly) return;
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  const enabled = skills.filter((s) => s.enabled);
  const available = skills.filter((s) => !s.enabled);

  return (
    <div className="space-y-5">
      {/* Header */}
      <section className="card-glass-warm p-5">
        <div className="flex items-center gap-2 mb-2">
          <Zap size={14} className="text-terracotta" />
          <h3 className="font-serif text-sm text-near-black font-medium">技能库</h3>
          <span className="ml-auto text-[10px] text-stone-gray">
            已启用 {enabled.length} / 共 {skills.length}
          </span>
        </div>
        <p className="text-xs text-olive-gray">
          技能来自 <a href="https://clawhub.ai" target="_blank" rel="noreferrer" className="text-terracotta hover:underline inline-flex items-center gap-0.5">clawhub.ai<ExternalLink size={10} /></a> 技能库 · 可按需启用/禁用,自动匹配当前任务
        </p>
      </section>

      {/* Enabled skills */}
      {enabled.length > 0 && (
        <section>
          <h4 className="text-xs text-stone-gray font-medium mb-2 px-1">● 已启用 · {enabled.length}</h4>
          <div className="space-y-2">
            {enabled.map((s) => (
              <SkillRow key={s.id} skill={s} onToggle={() => toggle(s.id)} readonly={readonly} />
            ))}
          </div>
        </section>
      )}

      {/* Available skills */}
      {available.length > 0 && (
        <section>
          <h4 className="text-xs text-stone-gray font-medium mb-2 px-1">○ 可启用 · {available.length}</h4>
          <div className="space-y-2">
            {available.map((s) => (
              <SkillRow key={s.id} skill={s} onToggle={() => toggle(s.id)} readonly={readonly} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SkillRow({ skill, onToggle, readonly }: { skill: EmployeeSkill; onToggle: () => void; readonly?: boolean }) {
  return (
    <div className={`card-glass-warm p-3.5 flex items-center gap-3 ${skill.enabled ? '' : 'opacity-70'}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${skill.enabled ? 'bg-terracotta/12' : 'bg-warm-sand/60'}`}>
        <Zap size={15} className={skill.enabled ? 'text-terracotta' : 'text-stone-gray'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs text-near-black font-medium font-mono">{skill.name}</p>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-warm-sand/60 text-stone-gray">{skill.category}</span>
          <span className="text-[9px] text-stone-gray/60">{skill.version}</span>
        </div>
        <p className="text-[11px] text-olive-gray mt-0.5 truncate">{skill.description}</p>
        {skill.enabled && skill.invocations !== undefined && (
          <p className="text-[10px] text-stone-gray/80 mt-1">
            调用 {skill.invocations} 次 · 成功率 {skill.successRate}%
          </p>
        )}
      </div>
      <button
        onClick={onToggle}
        disabled={readonly}
        className={`
          px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors shrink-0
          ${skill.enabled
            ? 'bg-terracotta/10 text-terracotta hover:bg-terracotta/15'
            : 'bg-warm-sand text-stone-gray hover:bg-terracotta/10 hover:text-terracotta'}
          ${readonly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
        `}
      >
        {skill.enabled ? <span className="flex items-center gap-1"><Check size={11} /> 已启用</span> : '启用'}
      </button>
    </div>
  );
}
