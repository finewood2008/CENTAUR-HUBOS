// 内容日历卡片 — 周视图，每天的选题计划
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CardProps } from '../types';

interface DayPlan {
  date: string;       // YYYY-MM-DD
  dayLabel: string;   // 周一 etc
  topics: { title: string; platform: string; status: 'planned' | 'writing' | 'published' }[];
}

interface CalendarData {
  weekLabel: string;
  days: DayPlan[];
}

const statusDot: Record<string, string> = {
  planned: 'bg-amber-400',
  writing: 'bg-blue-400',
  published: 'bg-success-green',
};

const statusLabel: Record<string, string> = {
  planned: '计划中',
  writing: '撰写中',
  published: '已发布',
};

const platformEmoji: Record<string, string> = {
  wechat: '📝',
  xiaohongshu: '📕',
  douyin: '🎬',
};

export default function ContentCalendarCard({ data, editable, onEdit, onAction }: CardProps<CalendarData>) {
  return (
    <div className="rounded-xl border border-border-cream bg-ivory/90 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-warm-sand/30 border-b border-border-cream">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-terracotta" />
          <span className="text-xs font-medium text-near-black">内容日历</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 rounded hover:bg-warm-sand"><ChevronLeft size={12} className="text-stone-gray" /></button>
          <span className="text-[10px] text-olive-gray px-2">{data.weekLabel}</span>
          <button className="p-1 rounded hover:bg-warm-sand"><ChevronRight size={12} className="text-stone-gray" /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 divide-x divide-border-cream">
        {data.days.map((day) => (
          <div key={day.date} className="p-2 min-h-[80px]">
            <div className="text-[10px] text-stone-gray mb-1">{day.dayLabel}</div>
            <div className="text-[10px] text-olive-gray mb-2">{day.date.slice(5)}</div>
            <div className="space-y-1">
              {day.topics.map((topic, i) => (
                <div
                  key={i}
                  className="p-1.5 rounded-md bg-warm-sand/40 cursor-pointer hover:bg-terracotta/8 transition-colors"
                  onClick={() => onAction?.('editTopic', { date: day.date, index: i })}
                >
                  <div className="flex items-center gap-1">
                    <span className={`w-1 h-1 rounded-full ${statusDot[topic.status]}`} />
                    <span className="text-[9px]">{platformEmoji[topic.platform] || '📄'}</span>
                  </div>
                  <p className="text-[9px] text-near-black mt-0.5 line-clamp-2">{topic.title}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* legend */}
      <div className="flex items-center gap-3 px-4 py-2 border-t border-border-cream text-[9px] text-stone-gray">
        {Object.entries(statusLabel).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${statusDot[key]}`} />{label}
          </span>
        ))}
      </div>
    </div>
  );
}
