// TabHarness — 员工执行框架配置展示
import { useState } from 'react';
import { Shield, ChevronDown, Repeat, Map, Brain, ShieldCheck, Settings2, AlertTriangle, Lock } from 'lucide-react';
import type { DigitalEmployee } from '../../../types';
import { getEmployeeHarness } from '../../../data/employee-harness';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Repeat, Map, Brain, ShieldCheck, Settings2, AlertTriangle, Lock,
};

interface Props {
  emp: DigitalEmployee;
}

export default function TabHarness({ emp }: Props) {
  const harness = getEmployeeHarness(emp.id);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!harness) {
    if (emp.harness.length === 0) {
      return <p className="text-sm text-stone-gray">该员工暂无执行蓝图</p>;
    }

    return (
      <div className="space-y-3">
        {emp.harness.map((section) => (
          <section key={section.title} className="card-glass-warm p-5">
            <div className="mb-2 flex items-center gap-2">
              <Shield size={14} className="text-terracotta" />
              <h3 className="font-serif text-sm font-medium text-near-black">{section.title}</h3>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-olive-gray">{section.content || '暂无内容'}</p>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Philosophy 顶卡 */}
      <section className="card-glass-warm p-5 bg-gradient-to-br from-terracotta/5 to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={14} className="text-terracotta" />
          <h3 className="font-serif text-sm text-near-black font-medium">执行哲学</h3>
          <span className="text-[10px] text-stone-gray ml-auto">Harness {harness.version}</span>
        </div>
        <p className="text-base font-serif text-near-black">{harness.philosophy}</p>
      </section>

      {/* Modules */}
      <section>
        <h3 className="font-serif text-sm text-near-black font-medium mb-3 px-1">核心模块 · {harness.modules.length} 项</h3>
        <div className="space-y-2">
          {harness.modules.map((mod) => {
            const Icon = ICON_MAP[mod.icon] || Shield;
            const isOpen = expanded === mod.key;
            return (
              <div key={mod.key} className="card-glass-warm overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : mod.key)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-warm-sand/20 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-terracotta/10 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-terracotta" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-near-black font-medium">{mod.title}</p>
                    <p className="text-xs text-stone-gray mt-0.5 truncate">{mod.summary}</p>
                  </div>
                  <ChevronDown size={16} className={`text-stone-gray transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-border-cream/50">
                    <pre className="text-[11px] text-olive-gray whitespace-pre-wrap font-mono leading-relaxed bg-warm-sand/30 rounded-lg p-3 overflow-x-auto">{mod.content}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <p className="text-[11px] text-stone-gray italic text-center">
        Harness 是员工的执行框架 · 定义 Agent Loop / 上下文 / 记忆 / 安全 等核心行为
      </p>
    </div>
  );
}
