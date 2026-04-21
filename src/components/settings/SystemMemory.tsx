// SystemMemory — 系统级记忆总览（共享认知 + 操作日志 + 各员工记忆概览）
import { useState, useMemo } from 'react';
import { Building2, User, Users, ScrollText, Sparkles, Plus, Minus, Pencil, Globe, Brain, Save, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { usePersonaStore } from '../../stores/personaStore';

const ACTION_META: Record<string, { icon: typeof Plus; label: string; color: string }> = {
  memory_added:   { icon: Plus,     label: '新增记忆', color: 'text-success-green' },
  memory_removed: { icon: Minus,    label: '删除记忆', color: 'text-red-500' },
  memory_updated: { icon: Pencil,   label: '更新记忆', color: 'text-amber-600' },
  soul_edited:    { icon: Sparkles, label: '编辑灵魂', color: 'text-purple-500' },
  shared_updated: { icon: Globe,    label: '更新共享', color: 'text-blue-500' },
};

const EMPLOYEE_NAMES: Record<string, string> = {
  spark: '🔥 火花', xiaoke: '🎯 小可', shuxi: '📚 书熙',
  shuibao: '💰 税宝', lvan: '🛡 绿安',
};

function formatTime(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

interface SharedCardProps {
  title: string;
  icon: typeof Building2;
  value: string;
  storeKey: 'boss' | 'company' | 'team';
  placeholder: string;
}

function SharedCard({ title, icon: Icon, value, storeKey, placeholder }: SharedCardProps) {
  const store = usePersonaStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [toast, setToast] = useState('');

  const save = () => {
    store.updateShared(storeKey, draft);
    setEditing(false);
    setToast('已保存');
    setTimeout(() => setToast(''), 1500);
  };

  const charCount = (editing ? draft : value).length;

  return (
    <div className="card-glass-warm p-4 flex flex-col">
      {toast && (
        <div className="absolute -top-2 right-2 bg-near-black text-white text-[10px] px-2 py-1 rounded shadow-lg z-10">
          {toast}
        </div>
      )}
      <div className="flex items-center gap-2 mb-3">
        <Icon size={13} className="text-terracotta" />
        <h4 className="font-serif text-xs text-near-black font-medium">{title}</h4>
        <span className="ml-auto text-[10px] text-stone-gray">{charCount} 字</span>
      </div>
      {editing ? (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="flex-1 text-xs bg-warm-sand/30 border border-border-cream rounded-lg p-3 min-h-[120px] focus:outline-none focus:border-terracotta/40 leading-relaxed resize-none"
            placeholder={placeholder}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setEditing(false)} className="text-[11px] text-stone-gray hover:text-near-black px-2 py-1">取消</button>
            <button onClick={save} className="flex items-center gap-1 text-[11px] text-white bg-terracotta hover:bg-terracotta/90 px-2.5 py-1 rounded-md">
              <Save size={10} />保存
            </button>
          </div>
        </>
      ) : (
        <>
          {value ? (
            <div className="flex-1 text-xs text-olive-gray leading-relaxed whitespace-pre-wrap">
              {value.split('§').map((seg, i) => (
                <p key={i} className={i > 0 ? 'mt-2 pt-2 border-t border-border-cream/30' : ''}>
                  {seg.trim()}
                </p>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-6">
              <p className="text-[11px] text-stone-gray">暂未建立，通过日常对话自动积累，或手动添加</p>
            </div>
          )}
          <button
            onClick={() => { setDraft(value); setEditing(true); }}
            className="mt-3 flex items-center gap-1 text-[11px] text-terracotta hover:text-terracotta/80 self-end"
          >
            <Pencil size={10} />{value ? '编辑' : '手动添加'}
          </button>
        </>
      )}
    </div>
  );
}

export default function SystemMemory() {
  const store = usePersonaStore();
  const shared = store.getShared();
  const logs = store.getLogs();
  const [logExpanded, setLogExpanded] = useState(true);

  // Employee memory overview
  const employeeIds = ['spark', 'xiaoke', 'shuxi', 'shuibao', 'lvan'];
  const employeeOverview = useMemo(() => {
    return employeeIds.map((id) => {
      const memories = store.getMemories(id);
      const soul = store.getSoul(id);
      const latestMem = memories.length > 0
        ? memories.reduce((a, b) => new Date(a.updatedAt) > new Date(b.updatedAt) ? a : b)
        : null;
      return {
        id,
        name: EMPLOYEE_NAMES[id] || id,
        memoryCount: memories.length,
        hasSoul: !!soul,
        lastUpdated: latestMem?.updatedAt || null,
      };
    });
  }, [store.employees]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-terracotta/20 to-amber-100 flex items-center justify-center">
          <Brain size={16} className="text-terracotta" />
        </div>
        <div>
          <h2 className="font-serif text-base text-near-black font-medium">系统记忆</h2>
          <p className="text-[11px] text-stone-gray">团队共享认知、操作日志和记忆概览</p>
        </div>
      </div>

      {/* Shared Knowledge Cards */}
      <section>
        <h3 className="font-serif text-sm text-near-black font-medium mb-3 flex items-center gap-2">
          <Globe size={13} className="text-terracotta" />
          共享认知
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SharedCard
            title="老板画像"
            icon={User}
            value={shared.boss}
            storeKey="boss"
            placeholder="记录老板的沟通风格、审美偏好、决策习惯等..."
          />
          <SharedCard
            title="企业画像"
            icon={Building2}
            value={shared.company}
            storeKey="company"
            placeholder="记录企业行业、主营业务、目标客户、竞品等..."
          />
          <SharedCard
            title="团队认知"
            icon={Users}
            value={shared.team}
            storeKey="team"
            placeholder="记录团队成员特长、协作方式、任务分工等..."
          />
        </div>
      </section>

      {/* Employee Memory Overview */}
      <section className="card-glass-warm p-5">
        <h3 className="font-serif text-sm text-near-black font-medium mb-3 flex items-center gap-2">
          <Brain size={13} className="text-terracotta" />
          记忆总览
        </h3>
        <div className="space-y-1">
          <div className="grid grid-cols-4 text-[10px] text-stone-gray uppercase tracking-wider px-3 py-1.5">
            <span>员工</span><span className="text-center">灵魂</span><span className="text-center">记忆</span><span className="text-right">最近更新</span>
          </div>
          {employeeOverview.map((e) => (
            <div key={e.id} className="grid grid-cols-4 items-center px-3 py-2.5 rounded-lg hover:bg-warm-sand/30 transition-colors">
              <span className="text-xs text-near-black font-medium">{e.name}</span>
              <span className="text-center text-xs">{e.hasSoul ? <span className="text-success-green">✓</span> : <span className="text-stone-gray">—</span>}</span>
              <span className="text-center text-xs text-olive-gray">{e.memoryCount} 条</span>
              <span className="text-right text-[10px] text-stone-gray">{e.lastUpdated ? formatTime(e.lastUpdated) : '—'}</span>
            </div>
          ))}
        </div>
      </section>

      {/* System Logs */}
      <section className="card-glass-warm p-5">
        <button
          onClick={() => setLogExpanded(!logExpanded)}
          className="w-full flex items-center gap-2 mb-3"
        >
          <ScrollText size={13} className="text-terracotta" />
          <h3 className="font-serif text-sm text-near-black font-medium">系统日志</h3>
          <span className="text-[10px] text-stone-gray ml-1">最近 {logs.length} 条</span>
          <span className="ml-auto">
            {logExpanded ? <ChevronDown size={12} className="text-stone-gray" /> : <ChevronRight size={12} className="text-stone-gray" />}
          </span>
        </button>
        {logExpanded && (
          <div className="max-h-[360px] overflow-y-auto space-y-1 pr-1">
            {logs.length === 0 ? (
              <p className="text-xs text-stone-gray text-center py-8">暂无操作记录</p>
            ) : (
              logs.slice().reverse().map((log) => {
                const meta = ACTION_META[log.action] || { icon: Clock, label: log.action, color: 'text-stone-gray' };
                const LogIcon = meta.icon;
                return (
                  <div key={log.id} className="flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-warm-sand/20 transition-colors">
                    <div className={`mt-0.5 ${meta.color}`}>
                      <LogIcon size={11} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-medium ${meta.color}`}>{meta.label}</span>
                        {log.employeeId && (
                          <span className="text-[10px] text-stone-gray">{EMPLOYEE_NAMES[log.employeeId] || log.employeeId}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-olive-gray truncate">{log.detail}</p>
                    </div>
                    <span className="text-[10px] text-stone-gray shrink-0">{formatTime(log.timestamp)}</span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>
    </div>
  );
}
