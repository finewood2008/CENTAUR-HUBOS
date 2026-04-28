/**
 * VirtualOffice — Hub OS pixel art virtual office.
 * Uses the pixel-agents engine (pure Canvas 2D).
 * Features:
 *  - SDK-backed employee roster and runtime status
 *  - Interactive buttons: 拍一下, 派任务, 请咖啡, 催一下
 *  - Toast notifications for real office actions
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OfficeState } from './engine/officeState';
import { OfficeCanvas } from './components/OfficeCanvas';
import { createHubOSLayout } from './hubosLayout';
import { loadAllAssets } from './assetLoader';
import { EditorState } from './editor/editorState';
import { useToast } from '../shared/Toast';
import {
  useOfficeData,
  type OfficeActionKind,
  type OfficeAgentActivity,
} from '../../hooks/useQeeClaw';

// ── Activity types ──────────────────────────────────────────────
const ACTIVITIES: Record<OfficeAgentActivity, { label: string; tool: string | null; emoji: string }> = {
  active: { label: '最近处理中', tool: 'Write', emoji: '⚡' },
  workflow: { label: '已挂工作流', tool: 'Bash', emoji: '🧩' },
  standby: { label: '在线待命', tool: 'Read', emoji: '🟢' },
  offline: { label: '离线', tool: null, emoji: '⚪' },
  attention: { label: '运行异常', tool: null, emoji: '⚠️' },
};

// ── Toast messages ──────────────────────────────────────────────
interface Toast {
  id: number;
  text: string;
  emoji: string;
}

let toastId = 0;

interface VirtualOfficeProps {
  isConnected: boolean;
}

export default function VirtualOffice({ isConnected }: VirtualOfficeProps) {
  const { toast } = useToast();
  const { agents, runtime, loading: dataLoading, error, triggerAction } = useOfficeData(isConnected);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [officeState, setOfficeState] = useState<OfficeState | null>(null);
  const [zoom, setZoom] = useState(3);
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [actionPending, setActionPending] = useState<OfficeActionKind | null>(null);
  const [taskComposerOpen, setTaskComposerOpen] = useState(false);
  const [taskDraft, setTaskDraft] = useState('');
  const panRef = useRef({ x: 0, y: 0 });
  const editorStateRef = useRef<EditorState>(new EditorState());
  const stateRef = useRef<OfficeState | null>(null);

  // ── Add toast ─────────────────────────────────────────────────
  const addToast = useCallback((text: string, emoji: string) => {
    const t: Toast = { id: ++toastId, text, emoji };
    setToasts(prev => [...prev.slice(-4), t]); // keep max 5
    setTimeout(() => {
      setToasts(prev => prev.filter(x => x.id !== t.id));
    }, 3000);
  }, []);

  // ── Initialize office ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      await loadAllAssets();
      if (cancelled) return;

      const layout = createHubOSLayout();
      const state = new OfficeState(layout);

      stateRef.current = state;
      setOfficeState(state);
      setAssetsLoading(false);
    }

    void init();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!officeState) return;

    const state = stateRef.current;
    if (!state) return;

    const nextIds = new Set(agents.map((agent) => agent.id));
    for (const id of Array.from(state.characters.keys())) {
      if (!nextIds.has(id)) {
        state.removeAgent(id);
      }
    }

    for (const agent of agents) {
      if (!state.characters.has(agent.id)) {
        if (agent.isLeader) {
          state.addAgent(agent.id, 0, 0, 'leader-chair', true);
        } else {
          state.addAgent(agent.id, undefined, undefined, undefined, true);
        }
      }

      const activityInfo = ACTIVITIES[agent.activity];
      state.setAgentTool(agent.id, activityInfo.tool);
      state.setAgentActive(agent.id, Boolean(activityInfo.tool));
    }
  }, [agents, officeState]);

  useEffect(() => {
    if (selectedAgent === null) return;
    if (agents.some((agent) => agent.id === selectedAgent)) return;
    setSelectedAgent(null);
    setTaskComposerOpen(false);
    setTaskDraft('');
  }, [agents, selectedAgent]);

  useEffect(() => {
    setTaskComposerOpen(false);
    setTaskDraft('');
  }, [selectedAgent]);

  const runSelectedAction = useCallback(async (
    action: OfficeActionKind,
    options?: { taskContent?: string },
  ) => {
    if (selectedAgent === null) return;

    const state = stateRef.current;
    setActionPending(action);
    if (state) {
      if (action === 'coffee') {
        state.showWaitingBubble(selectedAgent);
      } else {
        state.showPermissionBubble(selectedAgent);
        window.setTimeout(() => state.dismissBubble(selectedAgent), 1800);
      }
    }

    const result = await triggerAction(selectedAgent, action, options);
    addToast(result.message, result.emoji);
    if (!result.ok) {
      toast('error', result.message);
    }
    if (result.ok && action === 'task') {
      setTaskComposerOpen(false);
      setTaskDraft('');
    }
    setActionPending(null);
  }, [addToast, selectedAgent, toast, triggerAction]);

  // ── Interaction handlers ──────────────────────────────────────
  const handlePat = useCallback(() => {
    void runSelectedAction('pat');
  }, [runSelectedAction]);

  const handleTask = useCallback(() => {
    setTaskComposerOpen(true);
  }, []);

  const handleTaskSubmit = useCallback(() => {
    void runSelectedAction('task', { taskContent: taskDraft.trim() });
  }, [runSelectedAction, taskDraft]);

  const handleCoffee = useCallback(() => {
    void runSelectedAction('coffee');
  }, [runSelectedAction]);

  const handleRush = useCallback(() => {
    void runSelectedAction('rush');
  }, [runSelectedAction]);

  // ── Click handler ─────────────────────────────────────────────
  const handleClick = useCallback((agentId: number) => {
    setSelectedAgent(agentId === selectedAgent ? null : agentId);
  }, [selectedAgent]);

  // Editor no-ops
  const noop = useCallback(() => {}, []);

  // Selected agent info
  const selectedInfo = useMemo(() => {
    if (selectedAgent === null) return null;
    return agents.find((agent) => agent.id === selectedAgent) || null;
  }, [agents, selectedAgent]);

  const selectedActivity = selectedInfo?.activity ?? null;

  const loading = assetsLoading || dataLoading;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1a1a2e]">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🏢</div>
          <div className="text-white/60 font-mono text-sm">正在加载虚拟办公室...</div>
        </div>
      </div>
    );
  }

  if (!officeState) return null;

  return (
    <div className="flex-1 flex flex-col bg-[#1a1a2e] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#16213e] border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-lg">🏢</span>
          <span className="text-white/80 font-mono text-sm font-medium">虚拟办公室</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${runtime.runtimeOnline ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'}`}>
            ● {agents.length} 名智体 · {runtime.runtimeLabel} {runtime.runtimeOnline ? '在线' : '离线'}
          </span>
          {!isConnected && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30">
              SDK 未连接
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(z => Math.max(1, z - 1))}
            className="text-white/50 hover:text-white/80 px-2 py-1 text-sm font-mono"
          >−</button>
          <span className="text-white/40 text-xs font-mono">{zoom}x</span>
          <button
            onClick={() => setZoom(z => Math.min(6, z + 1))}
            className="text-white/50 hover:text-white/80 px-2 py-1 text-sm font-mono"
          >+</button>
        </div>
      </div>

      {(error || runtime.notes) && (
        <div className="px-4 py-2 bg-[#10192f] border-b border-white/5 text-[11px] text-white/45 font-mono">
          {error ?? runtime.notes}
        </div>
      )}

      {/* Canvas + Overlays */}
      <div className="flex-1 relative">
        <OfficeCanvas
          officeState={officeState}
          onClick={handleClick}
          isEditMode={false}
          editorState={editorStateRef.current}
          onEditorTileAction={noop}
          onEditorEraseAction={noop}
          onEditorSelectionChange={noop}
          onDeleteSelected={noop}
          onRotateSelected={noop}
          onDragMove={noop}
          editorTick={0}
          zoom={zoom}
          onZoomChange={setZoom}
          panRef={panRef}
        />

        {/* Toast notifications */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 pointer-events-none">
          {toasts.map(t => (
            <div
              key={t.id}
              className="bg-[#16213e]/95 backdrop-blur border border-white/10 rounded-lg px-3 py-2 shadow-xl animate-[slideIn_0.3s_ease-out] max-w-[260px]"
            >
              <span className="text-sm mr-1.5">{t.emoji}</span>
              <span className="text-white/80 text-xs">{t.text}</span>
            </div>
          ))}
        </div>

        {!loading && agents.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="rounded-2xl border border-white/10 bg-[#16213e]/90 px-5 py-4 text-center shadow-xl">
              <div className="text-3xl mb-2">🤖</div>
              <div className="text-white/80 text-sm font-medium">当前没有可展示的已入职智体</div>
              <div className="text-white/45 text-xs mt-1">办公室现在只展示 SDK 返回的真实 Agent。</div>
            </div>
          </div>
        )}

        {/* Selected agent interaction panel */}
        {selectedInfo && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#16213e]/95 backdrop-blur border border-white/10 rounded-xl px-5 py-3 shadow-2xl flex items-center gap-4">
            {/* Avatar + Info */}
            <div className="flex items-center gap-3 pr-4 border-r border-white/10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-lg">
                {selectedInfo.avatar}
              </div>
              <div>
                <div className="text-white text-sm font-medium">{selectedInfo.name}</div>
                <div className="text-white/40 text-[10px]">{selectedInfo.role}</div>
                <div className="text-white/30 text-[10px] mt-0.5">{selectedInfo.model} · {selectedInfo.runtimeLabel}</div>
                {selectedActivity && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs">{ACTIVITIES[selectedActivity].emoji}</span>
                    <span className="text-white/50 text-[10px]">{ACTIVITIES[selectedActivity].label}</span>
                  </div>
                )}
                {selectedInfo.lastActive && (
                  <div className="text-white/25 text-[10px] mt-0.5">最近活跃：{new Date(selectedInfo.lastActive).toLocaleString()}</div>
                )}
                {selectedInfo.workflowCount > 0 && (
                  <div className="text-white/25 text-[10px] mt-0.5">可用工作流：{selectedInfo.workflowCount}</div>
                )}
              </div>
            </div>

            {/* Interaction Buttons */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
              <button
                onClick={handlePat}
                disabled={actionPending !== null || !runtime.runtimeOnline}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 transition-all text-white/70 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                title="拍一下打个招呼"
              >
                <span className="text-base">👋</span>
                <span className="text-[9px]">拍一下</span>
              </button>
              {!selectedInfo.isLeader && (
                <>
                  <button
                    onClick={handleTask}
                    disabled={actionPending === 'task' || !runtime.runtimeOnline}
                    className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 active:bg-blue-500/30 transition-all text-white/70 hover:text-blue-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={selectedInfo.primaryWorkflowId ? '打开任务输入框并启动对应工作流' : '打开任务输入框并发送真实任务'}
                  >
                    <span className="text-base">📋</span>
                    <span className="text-[9px]">派任务</span>
                  </button>
                  <button
                    onClick={handleCoffee}
                    disabled={actionPending !== null || !runtime.runtimeOnline}
                    className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 active:bg-amber-500/30 transition-all text-white/70 hover:text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="请喝杯咖啡"
                  >
                    <span className="text-base">☕</span>
                    <span className="text-[9px]">请咖啡</span>
                  </button>
                  <button
                    onClick={handleRush}
                    disabled={actionPending !== null || !runtime.runtimeOnline}
                    className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 active:bg-red-500/30 transition-all text-white/70 hover:text-red-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="催一下加速"
                  >
                    <span className="text-base">🔔</span>
                    <span className="text-[9px]">催一下</span>
                  </button>
                </>
              )}
              </div>

              {taskComposerOpen && !selectedInfo.isLeader && (
                <div className="flex items-center gap-2">
                  <input
                    value={taskDraft}
                    onChange={(event) => setTaskDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        handleTaskSubmit();
                      }
                    }}
                    placeholder="输入任务内容，直接透传到 workflow.run 或 conversations.sendMessage"
                    className="w-[320px] rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white placeholder:text-white/25 outline-none focus:border-blue-400/50"
                  />
                  <button
                    onClick={handleTaskSubmit}
                    disabled={actionPending === 'task' || !taskDraft.trim() || !runtime.runtimeOnline}
                    className="rounded-lg bg-blue-500/20 px-3 py-2 text-[11px] text-blue-200 transition-colors hover:bg-blue-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    发送任务
                  </button>
                  <button
                    onClick={() => {
                      setTaskComposerOpen(false);
                      setTaskDraft('');
                    }}
                    className="rounded-lg px-2 py-2 text-[11px] text-white/40 hover:text-white/70"
                  >
                    取消
                  </button>
                </div>
              )}
            </div>

            {/* Close */}
            <button
              onClick={() => setSelectedAgent(null)}
              className="ml-1 text-white/20 hover:text-white/50 text-sm"
            >✕</button>
          </div>
        )}
      </div>

      {/* Footer — employee status strip */}
      <div className="px-4 py-1.5 bg-[#16213e] border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {agents.map(agent => {
            const info = ACTIVITIES[agent.activity];
            return (
              <button
                key={agent.id}
                onClick={() => handleClick(agent.id)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono transition-all ${
                  selectedAgent === agent.id
                    ? 'bg-white/10 text-white scale-105'
                    : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  agent.activity === 'attention' ? 'bg-red-400' :
                  agent.activity === 'offline' ? 'bg-white/30' :
                  agent.activity === 'workflow' ? 'bg-blue-400' :
                  agent.activity === 'active' ? 'bg-emerald-400' :
                  'bg-green-300'
                }`} />
                <span>{agent.name}</span>
                {info && <span className="text-[10px] opacity-60">{info.emoji}</span>}
              </button>
            );
          })}
        </div>
        <div className="text-white/20 text-[10px] font-mono">
          pixel-agents engine · SDK live data
        </div>
      </div>

      {/* Toast animation keyframes */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
