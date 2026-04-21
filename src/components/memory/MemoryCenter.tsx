// MemoryCenter.tsx — 记忆中心主页面
// Tab 切换：总览 / 时间线 / 图谱

import { useState } from 'react';
import { Brain, BarChart3, Clock, GitBranch } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardView from './DashboardView';
import TimelineView from './TimelineView';
import GraphView from './GraphView';

type ViewTab = 'dashboard' | 'timeline' | 'graph';

const TABS: { key: ViewTab; label: string; icon: typeof Brain }[] = [
  { key: 'dashboard', label: '总览', icon: BarChart3 },
  { key: 'timeline', label: '时间线', icon: Clock },
  { key: 'graph', label: '图谱', icon: GitBranch },
];

export default function MemoryCenter() {
  const [activeView, setActiveView] = useState<ViewTab>('dashboard');

  return (
    <div className="h-full flex flex-col bg-parchment overflow-hidden">
      {/* ── Header ── */}
      <div className="flex-shrink-0 px-6 pt-5 pb-3 border-b border-border-cream">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-terracotta/12 flex items-center justify-center">
              <Brain size={20} className="text-terracotta" />
            </div>
            <div>
              <h1 className="heading-section text-near-black">记忆中心</h1>
              <p className="text-caption text-stone-gray">管理 AI 员工的认知与记忆</p>
            </div>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex gap-1 bg-warm-sand/50 rounded-xl p-1 w-fit">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveView(tab.key)}
                className={`
                  relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200 cursor-pointer
                  ${isActive
                    ? 'text-near-black'
                    : 'text-stone-gray hover:text-charcoal-warm'
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="memory-tab-bg"
                    className="absolute inset-0 bg-ivory rounded-lg shadow-sm"
                    style={{ boxShadow: 'var(--shadow-ring-warm)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon size={16} />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── View Content ── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeView === 'dashboard' && <DashboardView />}
            {activeView === 'timeline' && <TimelineView />}
            {activeView === 'graph' && <GraphView />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
