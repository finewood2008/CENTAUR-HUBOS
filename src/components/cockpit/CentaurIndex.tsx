import { Clock, Users, Wallet, Sparkles } from 'lucide-react';

// ── Centaur Index — human vs AI work ratio widget ──
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

// Mock data
const humanPercent = 12;
const aiPercent = 88;
const hoursSaved = 32;
const stats = [
  { icon: Sparkles, label: '任务完成', value: '47' },
  { icon: Users, label: '员工在线', value: '5/5' },
  { icon: Wallet, label: '消耗', value: '¥126.4' },
] as const;

export default function CentaurIndex() {
  const greeting = getGreeting();

  return (
    <div className="card-glass p-5">
      {/* Greeting */}
      <div className="flex items-center gap-2 mb-4">
        <Clock size={15} className="text-terracotta" />
        <p className="text-[13px] text-charcoal-warm">
          <span className="font-serif font-semibold text-near-black">{greeting}</span>
          <span className="text-stone-gray">，</span>
          <span className="text-stone-gray">你的 AI 团队正在工作</span>
        </p>
      </div>

      {/* Progress bar — human vs AI */}
      <div className="mb-3">
        <div className="flex justify-between text-[11px] mb-1.5">
          <span className="text-terracotta font-medium">人工 {humanPercent}%</span>
          <span className="text-teal font-medium">AI {aiPercent}%</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden bg-border-cream flex">
          {/* Human segment */}
          <div
            className="h-full rounded-l-full bg-terracotta transition-all duration-700"
            style={{ width: `${humanPercent}%` }}
          />
          {/* AI segment */}
          <div
            className="h-full rounded-r-full transition-all duration-700"
            style={{
              width: `${aiPercent}%`,
              background: 'linear-gradient(90deg, #4a7c94, #3898ec)',
            }}
          />
        </div>
      </div>

      {/* Hours saved */}
      <p className="text-[12px] text-stone-gray mb-4">
        本周 AI 为你节省了{' '}
        <span className="text-teal font-semibold">{hoursSaved} 小时</span>
      </p>

      {/* Stats row */}
      <div className="flex items-center gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex-1 flex items-center gap-1.5 py-1.5 px-2 rounded-lg bg-parchment"
          >
            <s.icon size={13} className="text-stone-gray shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] text-stone-gray leading-tight truncate">{s.label}</div>
              <div className="text-[13px] text-near-black font-semibold leading-tight">{s.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
