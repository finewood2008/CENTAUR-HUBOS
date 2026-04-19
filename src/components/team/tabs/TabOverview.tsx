// TabOverview — 员工概览
import { Zap, Clock, Star, MessageSquare, Sparkles } from 'lucide-react';
import type { DigitalEmployee } from '../../../types';

interface Props {
  emp: DigitalEmployee;
  config: ReturnType<typeof import('../../../hooks/useEmployeeConfig').useEmployeeConfig>;
}

export default function TabOverview({ emp }: Props) {
  return (
    <div className="space-y-5">
      {/* 自我介绍 */}
      <section className="card-glass-warm p-5">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare size={14} className="text-terracotta" />
          <h3 className="font-serif text-sm text-near-black font-medium">自我介绍</h3>
        </div>
        <p className="text-sm text-olive-gray leading-relaxed">{emp.introduction}</p>
      </section>

      {/* 核心能力 */}
      <section className="card-glass-warm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-terracotta" />
          <h3 className="font-serif text-sm text-near-black font-medium">核心能力</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {emp.capabilities.map((c) => (
            <span key={c} className="px-2.5 py-1 rounded-lg bg-terracotta/8 text-xs text-terracotta font-medium">{c}</span>
          ))}
        </div>
      </section>

      {/* 工作统计 */}
      {emp.status === 'active' && (
        <section className="card-glass-warm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={14} className="text-terracotta" />
            <h3 className="font-serif text-sm text-near-black font-medium">工作统计(最近 30 天)</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <StatBox icon={<Zap size={16} className="text-terracotta" />} value={emp.stats.monthlyTasks} label="月度任务" color="terracotta" />
            <StatBox icon={<Clock size={16} className="text-olive-gray" />} value={`${emp.stats.hoursSaved}h`} label="节省时间" color="olive" />
            <StatBox icon={<Star size={16} className="text-amber-500" />} value={`${emp.stats.satisfaction}%`} label="满意度" color="amber" />
          </div>
        </section>
      )}

      {/* 入职偏好 */}
      {emp.onboardingPreferences && emp.onboardingPreferences.length > 0 && (
        <section className="card-glass-warm p-5">
          <h3 className="font-serif text-sm text-near-black font-medium mb-3">入职时需要了解</h3>
          <div className="grid grid-cols-2 gap-3">
            {emp.onboardingPreferences.map((p) => (
              <div key={p.key} className="bg-warm-sand/50 rounded-lg p-3">
                <p className="text-xs text-stone-gray">{p.label}</p>
                <p className="text-[11px] text-olive-gray mt-1">
                  {p.type === 'select' && p.options ? p.options.join(' / ') : (p.placeholder || '自由输入')}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatBox({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string; color: string }) {
  return (
    <div className="bg-warm-sand/40 rounded-xl p-4 text-center">
      <div className="flex justify-center mb-1.5">{icon}</div>
      <p className="font-serif text-2xl text-near-black">{value}</p>
      <p className="text-[10px] text-stone-gray mt-0.5">{label}</p>
    </div>
  );
}
