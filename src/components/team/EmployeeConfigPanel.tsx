// EmployeeConfigPanel — 数字员工完整配置工作台
// 左侧导航(7 个模块) + 右侧配置内容 + 锁定状态处理
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Sparkles, Lock, Play,
  LayoutDashboard, Cpu, Shield, Zap,
  BookOpen, Brain, Monitor,
} from 'lucide-react';
import type { DigitalEmployee, ActivationStatus } from '../../types';
import { useEmployeeConfig } from '../../hooks/useEmployeeConfig';
import TabOverview from './tabs/TabOverview';
import TabModel from './tabs/TabModel';
import TabHarness from './tabs/TabHarness';
import TabSkills from './tabs/TabSkills';
import TabKnowledge from './tabs/TabKnowledge';
import TabMemory from './tabs/TabMemory';
import TabWorkspace from './tabs/TabWorkspace';

interface Props {
  emp: DigitalEmployee;
  isConnected: boolean;
  onBack: () => void;
  onActivate: (emp: DigitalEmployee) => void;
  onWorkbench: (emp: DigitalEmployee) => void;
}

type TabKey = 'overview' | 'model' | 'harness' | 'skills' | 'knowledge' | 'memory' | 'workspace';

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { key: 'overview',  label: '概览',       icon: LayoutDashboard },
  { key: 'model',     label: '模型',       icon: Cpu },
  { key: 'harness',   label: 'Harness',   icon: Shield },
  { key: 'skills',    label: '技能',       icon: Zap },
  { key: 'knowledge', label: '知识库 RAG', icon: BookOpen },
  { key: 'memory',    label: '个人记忆',    icon: Brain },
  { key: 'workspace', label: '工作台',      icon: Monitor },
];

const statusConfig: Record<ActivationStatus, { label: string; dot: string; bg: string }> = {
  active:     { label: '在岗',   dot: 'bg-success-green', bg: 'bg-success-green/12 text-success-green' },
  activating: { label: '激活中', dot: 'bg-amber-500',     bg: 'bg-amber-500/12 text-amber-600' },
  inactive:   { label: '待入职', dot: 'bg-stone-gray',    bg: 'bg-stone-gray/12 text-stone-gray' },
};

export default function EmployeeConfigPanel({ emp, isConnected, onBack, onActivate, onWorkbench }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const config = useEmployeeConfig(emp, isConnected);

  const isLocked = emp.status !== 'active';
  const workspaceUnlocked = emp.id === 'spark' || emp.id === 'xiaoke';
  const st = statusConfig[emp.status];

  return (
    <motion.div
      className="flex-1 flex flex-col overflow-hidden"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Header */}
      <div className="px-8 pt-6 pb-4 border-b border-border-cream bg-parchment/70 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-olive-gray hover:text-terracotta transition-colors mb-4"
        >
          <ArrowLeft size={16} /> 返回团队
        </button>

        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${emp.color} flex items-center justify-center text-3xl shadow-md`}>
            {emp.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif text-2xl text-near-black">{emp.name}</h1>
              <span className="text-sm text-olive-gray">{emp.englishName}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${st.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
              {isLocked && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warm-sand text-stone-gray text-[10px] font-medium">
                  <Lock size={10} /> 配置只读
                </span>
              )}
            </div>
            <p className="text-sm text-stone-gray mt-0.5">{emp.role} · {emp.tagline}</p>
          </div>

          {/* 快捷动作 */}
          <div className="flex items-center gap-2">
            {emp.status === 'active' ? (
              workspaceUnlocked ? (
                <button onClick={() => onWorkbench(emp)} className="btn-terracotta px-4 py-2 text-sm gap-1.5">
                  <Play size={14} /> 进入工作台
                </button>
              ) : (
                <button disabled className="px-4 py-2 rounded-xl bg-warm-sand text-stone-gray text-sm font-medium flex items-center gap-1.5 cursor-not-allowed">
                  <Lock size={14} /> 工作台即将上线
                </button>
              )
            ) : (
              <button
                onClick={() => onActivate(emp)}
                disabled
                className="px-4 py-2 rounded-xl bg-warm-sand text-stone-gray text-sm font-medium flex items-center gap-1.5 cursor-not-allowed opacity-70"
                title="演示版本暂不可激活"
              >
                <Sparkles size={14} /> 激活入职
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Body: 左 nav + 右 content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Nav */}
        <nav className="w-52 shrink-0 border-r border-border-cream bg-parchment/40 overflow-y-auto py-4">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = activeTab === key;
            const tabLocked = key === 'workspace' && !workspaceUnlocked;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`
                  w-full flex items-center gap-2.5 px-5 py-2.5 text-sm transition-all relative
                  ${active
                    ? 'text-terracotta bg-terracotta/8 font-medium'
                    : 'text-olive-gray hover:text-near-black hover:bg-warm-sand/40'
                  }
                `}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-terracotta rounded-r" />}
                <Icon size={15} className={active ? 'text-terracotta' : ''} />
                <span className="flex-1 text-left">{label}</span>
                {tabLocked && <Lock size={11} className="text-stone-gray/60" />}
              </button>
            );
          })}
        </nav>

        {/* Right Content */}
        <main className="flex-1 overflow-y-auto bg-parchment">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="px-8 py-6 max-w-4xl"
            >
              {activeTab === 'overview'  && <TabOverview emp={emp} config={config} />}
              {activeTab === 'model'     && <TabModel emp={emp} config={config} readonly={isLocked} />}
              {activeTab === 'harness'   && <TabHarness emp={emp} />}
              {activeTab === 'skills'    && <TabSkills emp={emp} readonly={isLocked} />}
              {activeTab === 'knowledge' && <TabKnowledge emp={emp} config={config} readonly={isLocked} />}
              {activeTab === 'memory'    && <TabMemory emp={emp} config={config} readonly={isLocked} />}
              {activeTab === 'workspace' && <TabWorkspace emp={emp} unlocked={workspaceUnlocked} onOpen={() => onWorkbench(emp)} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </motion.div>
  );
}
