// SparkWorkspaceV2.tsx — 火花工作台 v2
// 使用统一架构: WorkspaceShell + ChatFlow + Harness 引擎
import { useCallback } from 'react';
import { Calendar, FileText } from 'lucide-react';
import { WorkspaceShell } from '../workspace';
import { ChatFlow } from '../chat-engine';
import type { ChatFlowConfig } from '../chat-engine/types';
import { BoardPanel } from '../workspace';
import { useHarnessChat } from '../../hooks/useHarnessChat';

interface Props {
  onBack: () => void;
}

// 火花的 ChatFlow 配置
const SPARK_CONFIG: ChatFlowConfig = {
  employeeId: 'spark',
  employeeName: '火花',
  employeeAvatar: '🔥',
  employeeColor: 'from-orange-500 to-amber-400',
  accentColor: 'text-orange-600',
  greeting: '你的品牌创意总监，随时为你创作内容',
  quickActions: [
    { label: '写一篇公众号文章', action: 'write-article', icon: '📝' },
    { label: '写小红书笔记', action: 'write-xhs', icon: '📕' },
    { label: '生成内容日历', action: 'content-calendar', icon: '📅' },
    { label: '品牌风格指导', action: 'brand-guide', icon: '🎨' },
  ],
  placeholder: '告诉火花你想创作什么...',
};

export default function SparkWorkspaceV2({ onBack }: Props) {
  const {
    messages,
    isStreaming,
    flowStatus,
    currentStepLabel,
    handleSend,
    handleCardAction,
    handleCardEdit,
  } = useHarnessChat('spark');

  // 看板 tabs
  const boardTabs = [
    { key: 'calendar', label: '内容日历', icon: <Calendar size={12} /> },
    { key: 'drafts', label: '草稿箱', icon: <FileText size={12} /> },
  ];

  // 顶栏额外内容：流程状态指示
  const topBarExtra = flowStatus ? (
    <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-terracotta/8">
      <span className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse" />
      <span className="text-[11px] text-terracotta font-medium">
        {currentStepLabel || '流程进行中'}
      </span>
    </div>
  ) : null;

  // 左栏：对话流
  const chatPanel = (
    <ChatFlow
      config={SPARK_CONFIG}
      messages={messages}
      onSend={handleSend}
      isStreaming={isStreaming}
      onCardEdit={handleCardEdit}
      onCardAction={handleCardAction}
    />
  );

  // 右栏：看板（MVP 先展示空状态）
  const boardContent = (
    <BoardPanel
      title="内容日历"
      listItems={[]}
    >
      <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
        <div className="w-12 h-12 rounded-2xl bg-warm-sand/60 flex items-center justify-center text-2xl mb-3">
          📅
        </div>
        <p className="text-sm text-near-black font-medium">内容日历</p>
        <p className="text-xs text-stone-gray mt-1">
          通过对话创作内容后，会自动出现在这里
        </p>
        <p className="text-[10px] text-stone-gray/60 mt-3">
          试试说「帮我规划下周的内容日历」
        </p>
      </div>
    </BoardPanel>
  );

  return (
    <WorkspaceShell
      employeeName="火花"
      employeeAvatar="🔥"
      employeeColor="from-orange-500 to-amber-400"
      onBack={onBack}
      chatPanel={chatPanel}
      boardPanel={boardContent}
      boardTabs={boardTabs}
      activeBoardTab="calendar"
      topBarExtra={topBarExtra}
    />
  );
}
