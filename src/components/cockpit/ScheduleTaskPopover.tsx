import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Clock, CalendarDays, Plus, ListTodo } from 'lucide-react';
import type { ScheduledTask } from '../../data/partner';

// ── Props ──
interface ScheduleTaskPopoverProps {
  onClose: () => void;
  onSubmit: (task: Omit<ScheduledTask, 'id' | 'createdAt'>) => void;
  onToggle?: (id: string, enabled: boolean) => void;
  onDelete?: (id: string) => void;
  existingTasks: ScheduledTask[];
}

// ── Schedule type config ──
type ScheduleType = 'once' | 'daily' | 'weekly' | 'monthly';

const SCHEDULE_OPTIONS: { value: ScheduleType; label: string }[] = [
  { value: 'once', label: '单次' },
  { value: 'daily', label: '每天' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
];

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

// ── Helpers ──

function describeSchedule(s: ScheduledTask['schedule']): string {
  switch (s.type) {
    case 'daily':
      return `每天 ${s.time}`;
    case 'weekly':
      return `每周${WEEKDAY_NAMES[s.weekday ?? 0]} ${s.time}`;
    case 'monthly':
      return `每月${s.dayOfMonth ?? 1}日 ${s.time}`;
    case 'once':
      return `${s.date ?? ''} ${s.time}`;
    case 'cron':
      return s.cronExpr ?? '';
    default:
      return s.time;
  }
}

// ── Toggle Switch ──

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
        checked ? 'bg-terracotta' : 'bg-border-cream'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ── Tabs ──
type TabKey = 'create' | 'list';

const TABS: { key: TabKey; label: string; icon: typeof Plus }[] = [
  { key: 'create', label: '新建任务', icon: Plus },
  { key: 'list', label: '任务列表', icon: ListTodo },
];

// ── Main Component ──

export default function ScheduleTaskPopover({
  onClose,
  onSubmit,
  onToggle,
  onDelete,
  existingTasks,
}: ScheduleTaskPopoverProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('create');

  // ── Form state ──
  const [title, setTitle] = useState('');
  const [action, setAction] = useState('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily');
  const [time, setTime] = useState('09:00');
  const [date, setDate] = useState('');
  const [weekday, setWeekday] = useState(1); // Monday default
  const [dayOfMonth, setDayOfMonth] = useState(1);

  const canSubmit = title.trim() && action.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;

    const schedule: ScheduledTask['schedule'] = {
      type: scheduleType,
      time,
    };

    if (scheduleType === 'once') schedule.date = date;
    if (scheduleType === 'weekly') schedule.weekday = weekday;
    if (scheduleType === 'monthly') schedule.dayOfMonth = dayOfMonth;

    onSubmit({
      title: title.trim(),
      description: action.trim(),
      schedule,
      action: action.trim(),
      enabled: true,
    });

    // Reset form
    setTitle('');
    setAction('');
    setScheduleType('daily');
    setTime('09:00');
    setDate('');
    setWeekday(1);
    setDayOfMonth(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="absolute bottom-full left-0 right-0 mb-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-border-cream/50 z-50 overflow-hidden"
      style={{ maxHeight: '400px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-0">
        <div className="flex items-center gap-1.5">
          <Clock size={14} className="text-terracotta" />
          <span className="text-[13px] font-semibold text-near-black">定时任务</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-stone-gray hover:text-near-black hover:bg-parchment/60 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-2 pb-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                isActive
                  ? 'bg-terracotta/10 text-terracotta'
                  : 'text-stone-gray hover:text-near-black hover:bg-parchment/60'
              }`}
            >
              <Icon size={12} />
              {tab.label}
              {tab.key === 'list' && existingTasks.length > 0 && (
                <span className="ml-0.5 text-[10px] bg-parchment rounded-full px-1.5 py-0 tabular-nums">
                  {existingTasks.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="mx-4 mt-2 border-t border-border-cream/40" />

      {/* Content */}
      <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: '310px' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'create' ? (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.12 }}
              className="p-4 space-y-3"
            >
              {/* Task name */}
              <div>
                <label className="block text-[11px] text-stone-gray mb-1">任务名称</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例: 每日晨报"
                  className="w-full text-[13px] text-near-black bg-parchment/60 rounded-lg px-3 py-2 border border-border-cream/30 outline-none focus:border-terracotta/30 focus:ring-2 focus:ring-terracotta/5 placeholder:text-stone-gray/40 transition-all"
                />
              </div>

              {/* Action / instruction */}
              <div>
                <label className="block text-[11px] text-stone-gray mb-1">执行内容</label>
                <textarea
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  placeholder="给合伙人的指令，例: 汇总昨日数据，生成晨报发给我"
                  rows={2}
                  className="w-full text-[13px] text-near-black bg-parchment/60 rounded-lg px-3 py-2 border border-border-cream/30 outline-none focus:border-terracotta/30 focus:ring-2 focus:ring-terracotta/5 placeholder:text-stone-gray/40 resize-none transition-all"
                />
              </div>

              {/* Schedule type pills */}
              <div>
                <label className="block text-[11px] text-stone-gray mb-1.5">频率选择</label>
                <div className="flex gap-1.5">
                  {SCHEDULE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setScheduleType(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                        scheduleType === opt.value
                          ? 'bg-terracotta text-ivory shadow-sm'
                          : 'border border-border-cream text-stone-gray hover:text-near-black hover:border-near-black/20'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time picker */}
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] text-stone-gray mb-1">
                    <Clock size={10} className="inline mr-0.5 -mt-0.5" />
                    时间
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full text-[13px] text-near-black bg-parchment/60 rounded-lg px-3 py-2 border border-border-cream/30 outline-none focus:border-terracotta/30 focus:ring-2 focus:ring-terracotta/5 transition-all"
                  />
                </div>

                {/* Conditional: date for 'once' */}
                {scheduleType === 'once' && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex-1"
                  >
                    <label className="block text-[11px] text-stone-gray mb-1">
                      <CalendarDays size={10} className="inline mr-0.5 -mt-0.5" />
                      日期
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full text-[13px] text-near-black bg-parchment/60 rounded-lg px-3 py-2 border border-border-cream/30 outline-none focus:border-terracotta/30 focus:ring-2 focus:ring-terracotta/5 transition-all"
                    />
                  </motion.div>
                )}

                {/* Conditional: weekday for 'weekly' */}
                {scheduleType === 'weekly' && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex-1"
                  >
                    <label className="block text-[11px] text-stone-gray mb-1">星期</label>
                    <div className="flex gap-0.5">
                      {WEEKDAY_NAMES.map((name, idx) => (
                        <button
                          key={idx}
                          onClick={() => setWeekday(idx)}
                          className={`w-7 h-7 rounded-md text-[11px] font-medium transition-colors ${
                            weekday === idx
                              ? 'bg-terracotta text-ivory shadow-sm'
                              : 'bg-parchment/60 text-stone-gray hover:text-near-black border border-border-cream/30'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Conditional: day of month for 'monthly' */}
                {scheduleType === 'monthly' && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex-1"
                  >
                    <label className="block text-[11px] text-stone-gray mb-1">日期 (几号)</label>
                    <select
                      value={dayOfMonth}
                      onChange={(e) => setDayOfMonth(Number(e.target.value))}
                      className="w-full text-[13px] text-near-black bg-parchment/60 rounded-lg px-3 py-2 border border-border-cream/30 outline-none focus:border-terracotta/30 focus:ring-2 focus:ring-terracotta/5 transition-all"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          {d}日
                        </option>
                      ))}
                    </select>
                  </motion.div>
                )}
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`w-full py-2 rounded-lg text-[13px] font-medium transition-all ${
                  canSubmit
                    ? 'bg-terracotta text-ivory hover:bg-terracotta/90 shadow-sm'
                    : 'bg-border-cream/60 text-stone-gray/40 cursor-not-allowed'
                }`}
              >
                创建定时任务
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.12 }}
              className="p-4"
            >
              {existingTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-stone-gray">
                  <Clock size={24} className="mb-2 opacity-30" />
                  <p className="text-[12px]">暂无定时任务</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="mt-2 text-[12px] text-terracotta hover:text-terracotta/80 transition-colors"
                  >
                    创建第一个任务 →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {existingTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-colors ${
                        task.enabled
                          ? 'bg-white/60 border-border-cream/50'
                          : 'bg-parchment/30 border-border-cream/30 opacity-60'
                      }`}
                    >
                      {/* Task info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-near-black truncate">
                          {task.title}
                        </p>
                        <p className="text-[11px] text-stone-gray mt-0.5">
                          {describeSchedule(task.schedule)}
                        </p>
                        {task.nextRun && (
                          <p className="text-[10px] text-terracotta mt-0.5">
                            下次: {task.nextRun}
                          </p>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                        <ToggleSwitch
                          checked={task.enabled}
                          onChange={(v) => onToggle?.(task.id, v)}
                        />
                        <button
                          onClick={() => onDelete?.(task.id)}
                          className="p-1 rounded-md text-stone-gray/50 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="删除任务"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
