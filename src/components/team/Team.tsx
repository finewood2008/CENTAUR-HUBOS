// Team 数字团队 — 员工卡片 + 详情面板 + 激活入口
// SDK 连接后合并真实 agent 状态
import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Users, Sparkles, ArrowLeft, ChevronRight, Zap, Brain,
  Wrench, BarChart3, Clock, Star, Play, Lock,
  Cpu, Layers, MessageSquare, BookOpen,
} from 'lucide-react';
import type { DigitalEmployee, ActivationStatus } from '../../types';
import { DIGITAL_EMPLOYEES } from '../../data/digital-employees';
import { useAgentManagement } from '../../hooks/useQeeClaw';
import { getAgentModule } from '../../services/qeeclaw';
import { useToast } from '../shared/Toast';

interface TeamProps {
  isConnected: boolean;
}

// ── animations ──
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const statusConfig: Record<ActivationStatus, { label: string; dot: string; bg: string }> = {
  active:     { label: '在岗',   dot: 'bg-success-green', bg: 'bg-success-green/12 text-success-green' },
  activating: { label: '激活中', dot: 'bg-amber-500',     bg: 'bg-amber-500/12 text-amber-600' },
  inactive:   { label: '待入职', dot: 'bg-stone-gray',    bg: 'bg-stone-gray/12 text-stone-gray' },
};

// ── sub: EmployeeCard ──
function EmployeeCard({
  emp, index, onClick, onActivate, onWorkbench,
}: { emp: DigitalEmployee; index: number; onClick: () => void; onActivate: (emp: DigitalEmployee) => void; onWorkbench: () => void }) {
  const st = statusConfig[emp.status];
  return (
    <motion.div
      className="card-glass-warm p-5 cursor-pointer hover:shadow-md transition-shadow group"
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      custom={index}
      onClick={onClick}
      whileHover={{ y: -2 }}
    >
      {/* header */}
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${emp.color} flex items-center justify-center text-2xl shadow-sm`}>
          {emp.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-near-black font-semibold truncate">{emp.name}</h3>
            <span className="text-xs text-olive-gray">{emp.englishName}</span>
          </div>
          <p className="text-xs text-stone-gray mt-0.5">{emp.role}</p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${st.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
          {st.label}
        </span>
      </div>

      {/* tagline */}
      <p className="text-xs text-olive-gray mb-3 line-clamp-1">{emp.tagline}</p>

      {/* capabilities */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {emp.capabilities.slice(0, 4).map((c) => (
          <span key={c} className="px-2 py-0.5 rounded-md bg-warm-sand/60 text-[10px] text-olive-gray">
            {c}
          </span>
        ))}
        {emp.capabilities.length > 4 && (
          <span className="px-2 py-0.5 rounded-md bg-warm-sand/40 text-[10px] text-stone-gray">
            +{emp.capabilities.length - 4}
          </span>
        )}
      </div>

      {/* stats */}
      {emp.status === 'active' && (
        <div className="flex items-center gap-4 text-[10px] text-stone-gray border-t border-border-cream pt-3">
          <span className="flex items-center gap-1"><Zap size={10} className="text-terracotta" />{emp.stats.monthlyTasks} 任务/月</span>
          <span className="flex items-center gap-1"><Clock size={10} />{emp.stats.hoursSaved}h 已节省</span>
          <span className="flex items-center gap-1"><Star size={10} className="text-amber-500" />{emp.stats.satisfaction}%</span>
        </div>
      )}

      {/* action hint */}
      <div className="mt-3 flex items-center justify-between">
        {emp.status === 'active' ? (
          <button onClick={(e) => { e.stopPropagation(); onWorkbench(); }} className="btn-terracotta text-[11px] px-3 py-1.5 gap-1">
            <Play size={12} /> 进入工作台
          </button>
        ) : emp.status === 'activating' ? (
          <button className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 text-[11px] font-medium flex items-center gap-1">
            <Sparkles size={12} /> 激活中...
          </button>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); onActivate(emp); }} className="px-3 py-1.5 rounded-lg bg-warm-sand text-olive-gray text-[11px] font-medium flex items-center gap-1 hover:bg-terracotta/10 hover:text-terracotta transition-colors">
            <Lock size={12} /> 激活入职
          </button>
        )}
        <ChevronRight size={14} className="text-stone-gray opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </motion.div>
  );
}

// ── sub: DetailPanel ──
function DetailPanel({ emp, onBack, onActivate, onWorkbench }: { emp: DigitalEmployee; onBack: () => void; onActivate: (emp: DigitalEmployee) => void; onWorkbench: () => void }) {
  return (
    <motion.div
      className="flex-1 overflow-y-auto"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="px-8 pt-6 pb-8 space-y-6 max-w-3xl">
        {/* back */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-olive-gray hover:text-terracotta transition-colors"
        >
          <ArrowLeft size={16} /> 返回团队
        </button>

        {/* header */}
        <div className="flex items-start gap-4">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${emp.color} flex items-center justify-center text-3xl shadow-md`}>
            {emp.avatar}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl text-near-black">{emp.name}</h1>
              <span className="text-sm text-olive-gray">{emp.englishName}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusConfig[emp.status].bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[emp.status].dot}`} />
                {statusConfig[emp.status].label}
              </span>
            </div>
            <p className="text-sm text-stone-gray mt-0.5">{emp.role}</p>
            <p className="text-xs text-terracotta mt-1">{emp.tagline}</p>
          </div>
        </div>

        {/* introduction */}
        <div className="card-glass-warm p-5">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={14} className="text-terracotta" />
            <h3 className="font-serif text-sm text-near-black font-medium">自我介绍</h3>
          </div>
          <p className="text-sm text-olive-gray leading-relaxed">{emp.introduction}</p>
        </div>

        {/* capabilities */}
        <div className="card-glass-warm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-terracotta" />
            <h3 className="font-serif text-sm text-near-black font-medium">核心能力</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {emp.capabilities.map((c) => (
              <span key={c} className="px-2.5 py-1 rounded-lg bg-terracotta/8 text-xs text-terracotta font-medium">{c}</span>
            ))}
          </div>
        </div>

        {/* model info */}
        <div className="card-glass-warm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Cpu size={14} className="text-terracotta" />
            <h3 className="font-serif text-sm text-near-black font-medium">模型信息</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-warm-sand/50 rounded-lg p-3">
              <span className="text-stone-gray">基座模型</span>
              <p className="text-near-black font-medium mt-0.5">{emp.modelInfo.base}</p>
            </div>
            <div className="bg-warm-sand/50 rounded-lg p-3">
              <span className="text-stone-gray">推理能力</span>
              <p className="text-near-black font-medium mt-0.5">{emp.modelInfo.reasoning}</p>
            </div>
            <div className="bg-warm-sand/50 rounded-lg p-3">
              <span className="text-stone-gray">上下文</span>
              <p className="text-near-black font-medium mt-0.5">{emp.modelInfo.context}</p>
            </div>
            <div className="bg-warm-sand/50 rounded-lg p-3">
              <span className="text-stone-gray">专精方向</span>
              <p className="text-near-black font-medium mt-0.5">{emp.modelInfo.specialization}</p>
            </div>
          </div>
        </div>

        {/* skills */}
        <div className="card-glass-warm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} className="text-terracotta" />
            <h3 className="font-serif text-sm text-near-black font-medium">技能清单</h3>
          </div>
          <div className="space-y-2">
            {emp.skills.map((s) => (
              <div key={s.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-warm-sand/30 hover:bg-warm-sand/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-terracotta/8 flex items-center justify-center">
                  <Zap size={14} className="text-terracotta" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-near-black font-medium">{s.name}</p>
                  <p className="text-[10px] text-stone-gray">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* tools */}
        <div className="card-glass-warm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wrench size={14} className="text-terracotta" />
            <h3 className="font-serif text-sm text-near-black font-medium">工具集</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {emp.tools.map((t) => (
              <div key={t.name} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-warm-sand/30">
                <div className="w-7 h-7 rounded-md bg-terracotta/8 flex items-center justify-center">
                  <Wrench size={12} className="text-terracotta" />
                </div>
                <div>
                  <p className="text-xs text-near-black font-medium">{t.name}</p>
                  <p className="text-[10px] text-stone-gray">{t.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* memory system */}
        <div className="card-glass-warm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={14} className="text-terracotta" />
            <h3 className="font-serif text-sm text-near-black font-medium">记忆系统</h3>
          </div>
          <p className="text-xs text-olive-gray mb-3">{emp.memorySystem.description}</p>
          <div className="flex flex-wrap gap-2">
            {emp.memorySystem.layers.map((l) => (
              <span key={l} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-warm-sand/50 text-[10px] text-olive-gray">
                <Layers size={10} className="text-terracotta" />{l}
              </span>
            ))}
          </div>
        </div>

        {/* workspace */}
        <div className="card-glass-warm p-5">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={14} className="text-terracotta" />
            <h3 className="font-serif text-sm text-near-black font-medium">工作台</h3>
            {emp.workspace.comingSoon && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/12 text-amber-600 text-[10px] font-medium">即将上线</span>
            )}
          </div>
          <p className="text-sm text-near-black font-medium">{emp.workspace.label}</p>
          <p className="text-xs text-stone-gray mt-0.5">{emp.workspace.description}</p>
        </div>

        {/* stats (active only) */}
        {emp.status === 'active' && (
          <div className="card-glass-warm p-5">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={14} className="text-terracotta" />
              <h3 className="font-serif text-sm text-near-black font-medium">工作统计</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-serif text-near-black">{emp.stats.monthlyTasks}</p>
                <p className="text-[10px] text-stone-gray mt-0.5">月度任务</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-serif text-terracotta">{emp.stats.hoursSaved}h</p>
                <p className="text-[10px] text-stone-gray mt-0.5">节省时间</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-serif text-success-green">{emp.stats.satisfaction}%</p>
                <p className="text-[10px] text-stone-gray mt-0.5">满意度</p>
              </div>
            </div>
          </div>
        )}

        {/* action button */}
        <div className="pt-2 pb-4">
          {emp.status === 'active' ? (
            <button onClick={onWorkbench} className="btn-terracotta w-full py-3 text-sm gap-2">
              <Play size={16} /> 进入 {emp.name} 工作台
            </button>
          ) : emp.workspace.comingSoon ? (
            <button className="w-full py-3 rounded-xl bg-warm-sand text-stone-gray text-sm font-medium flex items-center justify-center gap-2 cursor-not-allowed">
              <Lock size={16} /> 即将上线，敬请期待
            </button>
          ) : (
            <button onClick={() => onActivate(emp)} className="w-full py-3 rounded-xl bg-terracotta/10 text-terracotta text-sm font-medium flex items-center justify-center gap-2 hover:bg-terracotta hover:text-ivory transition-colors">
              <Sparkles size={16} /> 激活 {emp.name} 入职
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── main: Team ──
export default function Team({ isConnected }: TeamProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<DigitalEmployee | null>(null);
  const { data: sdkData, loading, refresh } = useAgentManagement(isConnected);
  const { toast } = useToast();
  const [activating, setActivating] = useState(false);

  // SDK agents 按 name 建立查询表，用于合并状态
  const sdkAgentMap = new Map(sdkData.agents.map(a => [a.name.toLowerCase(), a]));

  // 合并：如果 SDK 中有匹配的 agent，更新状态为 active
  const employees = DIGITAL_EMPLOYEES.map(emp => {
    const sdkMatch = sdkAgentMap.get(emp.name.toLowerCase()) || sdkAgentMap.get(emp.englishName.toLowerCase());
    if (sdkMatch) {
      return {
        ...emp,
        status: 'active' as ActivationStatus,
        model: sdkMatch.model || emp.model,
      };
    }
    return emp;
  });

  // 追加 SDK 中有但 DIGITAL_EMPLOYEES 里没有的 agent
  const knownNames = new Set(DIGITAL_EMPLOYEES.flatMap(e => [e.name.toLowerCase(), e.englishName.toLowerCase()]));
  const extraSdkAgents: DigitalEmployee[] = sdkData.agents
    .filter(a => !knownNames.has(a.name.toLowerCase()))
    .map((a, i) => ({
      id: a.id as any,
      name: a.name,
      englishName: a.name,
      role: a.role || 'AI 员工',
      tagline: '来自 SDK 的数字员工',
      introduction: a.role || '',
      avatar: a.avatar || '🤖',
      color: 'from-blue-500 to-cyan-400',
      accentColor: 'text-blue-600',
      status: (a.status === 'running' ? 'active' : 'inactive') as ActivationStatus,
      model: a.model || 'unknown',
      capabilities: a.skills.length > 0 ? a.skills : ['AI 对话'],
      skills: [],
      tools: [],
      harness: [],
      modelInfo: { base: a.model || 'unknown', reasoning: '-', context: '-', specialization: '-' },
      memorySystem: { description: '', layers: [] },
      workspace: { type: 'chat' as const, label: '对话工作台', description: '' },
      onboardingPreferences: [],
      trainingDataSources: [],
      stats: { monthlyTasks: 0, hoursSaved: 0, satisfaction: 0 },
    }));

  const allEmployees = [...employees, ...extraSdkAgents];
  const activeCount = allEmployees.filter((e) => e.status === 'active').length;

  const handleActivate = async (emp: DigitalEmployee) => {
    if (!isConnected) { toast('error', 'SDK 离线，无法激活'); return; }
    setActivating(true);
    try {
      await getAgentModule().create({
        name: emp.name,
        description: emp.tagline,
        model: emp.model || 'gpt-4o',
        runtimeType: 'hermes',
      });
      toast('success', `${emp.name} 激活成功！`);
      await refresh();
    } catch {
      toast('error', `${emp.name} 激活失败`);
    } finally {
      setActivating(false);
    }
  };

  const handleWorkbench = () => {
    toast('info', '工作台功能即将上线');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-parchment">
      <AnimatePresence mode="wait">
        {selectedEmployee ? (
          <DetailPanel
            key="detail"
            emp={selectedEmployee}
            onBack={() => setSelectedEmployee(null)}
            onActivate={handleActivate}
            onWorkbench={handleWorkbench}
          />
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-2">
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-terracotta/10 flex items-center justify-center">
                    <Users size={18} className="text-terracotta" />
                  </div>
                  <div>
                    <h1 className="font-serif text-2xl text-near-black tracking-tight">数字团队</h1>
                    <p className="text-sm text-stone-gray mt-0.5">
                      {activeCount} 名员工在岗 · 共 {allEmployees.length} 名团队成员
                      {isConnected && <span className="ml-1 text-success-green text-xs">· SDK</span>}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Grid */}
            <div className="px-8 pb-8 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {allEmployees.map((emp, i) => (
                  <EmployeeCard
                    key={emp.id}
                    emp={emp}
                    index={i}
                    onClick={() => setSelectedEmployee(emp)}
                    onActivate={handleActivate}
                    onWorkbench={handleWorkbench}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
