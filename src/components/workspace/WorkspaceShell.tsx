// WorkspaceShell — 双栏工作台外壳，所有员工共用
import { useState } from 'react';
import { ArrowLeft, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  employeeName: string;
  employeeAvatar: string;
  employeeColor: string;
  onBack: () => void;
  chatPanel: React.ReactNode;
  boardPanel?: React.ReactNode;
  boardTabs?: { key: string; label: string; icon?: React.ReactNode }[];
  activeBoardTab?: string;
  onBoardTabChange?: (key: string) => void;
  topBarExtra?: React.ReactNode;
}

export default function WorkspaceShell({
  employeeName,
  employeeAvatar,
  employeeColor,
  onBack,
  chatPanel,
  boardPanel,
  boardTabs,
  activeBoardTab,
  onBoardTabChange,
  topBarExtra,
}: Props) {
  const [boardOpen, setBoardOpen] = useState(true);

  return (
    <motion.div
      className="flex flex-col h-full bg-parchment"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* 顶栏 */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border-cream bg-ivory/60 backdrop-blur-sm shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-olive-gray hover:text-terracotta transition-colors"
        >
          <ArrowLeft size={16} />
        </button>

        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${employeeColor} flex items-center justify-center text-sm shadow-sm`}>
          {employeeAvatar}
        </div>
        <span className="font-serif text-near-black font-medium text-sm">{employeeName}工作台</span>

        {/* 看板 tabs */}
        {boardTabs && boardTabs.length > 0 && (
          <div className="flex items-center gap-1 ml-4">
            {boardTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => onBoardTabChange?.(tab.key)}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors flex items-center gap-1 ${
                  activeBoardTab === tab.key
                    ? 'bg-terracotta/10 text-terracotta font-medium'
                    : 'text-stone-gray hover:text-olive-gray hover:bg-warm-sand/50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1" />

        {topBarExtra}

        {boardPanel && (
          <button
            onClick={() => setBoardOpen(!boardOpen)}
            className="p-1.5 rounded-md text-stone-gray hover:text-terracotta hover:bg-warm-sand/50 transition-colors"
            title={boardOpen ? '收起看板' : '展开看板'}
          >
            {boardOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
        )}
      </div>

      {/* 主体双栏 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左栏：对话流 */}
        <div className={`flex flex-col overflow-hidden transition-all duration-300 ${
          boardOpen && boardPanel ? 'flex-[6]' : 'flex-1'
        }`}>
          {chatPanel}
        </div>

        {/* 右栏：看板 */}
        {boardPanel && boardOpen && (
          <div className="flex-[4] border-l border-border-cream overflow-hidden flex flex-col">
            {boardPanel}
          </div>
        )}
      </div>
    </motion.div>
  );
}
