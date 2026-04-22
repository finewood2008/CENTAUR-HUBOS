/**
 * VirtualOffice — Hub OS pixel art virtual office.
 * Uses the pixel-agents engine (pure Canvas 2D).
 * Features:
 *  - Random employee activity cycles (work → break → wander → coffee)
 *  - Interactive buttons: 拍一下, 派任务, 请咖啡, 催一下
 *  - Fun character reactions & toast notifications
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DIGITAL_EMPLOYEES } from '../../data/digital-employees';
import { OfficeState } from './engine/officeState';
import { OfficeCanvas } from './components/OfficeCanvas';
import { createHubOSLayout } from './hubosLayout';
import { loadAllAssets } from './assetLoader';
import { EditorState } from './editor/editorState';

// ── Employee agent mapping ──────────────────────────────────────
const EMPLOYEE_AGENTS = DIGITAL_EMPLOYEES.map((emp, idx) => ({
  id: idx,
  name: emp.name,
  role: emp.role,
  hubId: emp.id,
  isLeader: emp.id === 'leader',
  emoji: emp.id === 'leader' ? '👔' : ['🔥', '🎯', '📊', '💰', '🌿'][idx - 1] || '👤',
}));

// ── Activity types ──────────────────────────────────────────────
type Activity = 'coding' | 'reading' | 'meeting' | 'coffee' | 'idle' | 'slacking';
const ACTIVITIES: Record<Activity, { label: string; tool: string | null; emoji: string }> = {
  coding:  { label: '写代码',  tool: 'Write',  emoji: '⌨️' },
  reading: { label: '看文档',  tool: 'Read',   emoji: '📖' },
  meeting: { label: '开会中',  tool: 'Write',  emoji: '🗣️' },
  coffee:  { label: '喝咖啡',  tool: null,     emoji: '☕' },
  idle:    { label: '发呆中',  tool: null,     emoji: '💭' },
  slacking:{ label: '在摸鱼',  tool: null,     emoji: '🐟' },
};

// ── Toast messages ──────────────────────────────────────────────
interface Toast {
  id: number;
  text: string;
  emoji: string;
  ts: number;
}

// ── Reactions for interactions ───────────────────────────────────
const PAT_REACTIONS = ['被拍了一下，开心地跳了起来！', '害羞地低下了头', '回头看了你一眼 👀', '打了个哈欠 🥱', '敬了个礼 🫡'];
const TASK_TYPES = ['写一篇公众号文章', '做个数据报表', '设计一张海报', '整理客户资料', '写个需求文档', '做个竞品分析'];
const COFFEE_REACTIONS = ['开心地接过咖啡 ☕', '说了声谢谢老板！', '感动得热泪盈眶', '立刻精神百倍！', '偷偷加了三块糖'];
const RUSH_REACTIONS = ['加快了打字速度 💨', '紧张地看了眼进度条', '默默叹了口气...', '表示马上就好！', '假装没听到 🙈'];

let toastId = 0;

export default function VirtualOffice() {
  const [loading, setLoading] = useState(true);
  const [officeState, setOfficeState] = useState<OfficeState | null>(null);
  const [zoom, setZoom] = useState(3);
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [agentActivities, setAgentActivities] = useState<Record<number, Activity>>({});
  const [, forceUpdate] = useState(0);
  const panRef = useRef({ x: 0, y: 0 });
  const editorStateRef = useRef<EditorState>(new EditorState());
  const stateRef = useRef<OfficeState | null>(null);

  // ── Add toast ─────────────────────────────────────────────────
  const addToast = useCallback((text: string, emoji: string) => {
    const t: Toast = { id: ++toastId, text, emoji, ts: Date.now() };
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

      // Add all employees
      for (const agent of EMPLOYEE_AGENTS) {
        if (agent.isLeader) {
          state.addAgent(agent.id, 0, 0, 'leader-chair');
        } else {
          state.addAgent(agent.id, agent.id % 6);
        }
      }

      // Initial activities
      const activities: Record<number, Activity> = {};
      for (const agent of EMPLOYEE_AGENTS) {
        if (agent.isLeader) {
          activities[agent.id] = 'coding';
          state.setAgentTool(agent.id, 'Write');
        } else {
          const initial: Activity[] = ['coding', 'reading', 'coding', 'meeting', 'coding'];
          const act = initial[agent.id - 1] || 'coding';
          activities[agent.id] = act;
          state.setAgentTool(agent.id, ACTIVITIES[act].tool);
        }
      }

      stateRef.current = state;
      setAgentActivities(activities);
      setOfficeState(state);
      setLoading(false);
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // ── Random activity cycle for non-leader employees ────────────
  useEffect(() => {
    if (!officeState) return;

    const interval = setInterval(() => {
      const state = stateRef.current;
      if (!state) return;

      // Pick a random non-leader employee to change activity
      const nonLeaders = EMPLOYEE_AGENTS.filter(a => !a.isLeader);
      const agent = nonLeaders[Math.floor(Math.random() * nonLeaders.length)];

      const activityList: Activity[] = ['coding', 'reading', 'coffee', 'idle', 'slacking', 'meeting', 'coding', 'coding'];
      const newActivity = activityList[Math.floor(Math.random() * activityList.length)];
      const info = ACTIVITIES[newActivity];

      // Update engine state
      if (info.tool) {
        state.setAgentActive(agent.id, true);
        state.setAgentTool(agent.id, info.tool);
      } else {
        state.setAgentTool(agent.id, null);
        state.setAgentActive(agent.id, false);
      }

      setAgentActivities(prev => ({ ...prev, [agent.id]: newActivity }));

      // Occasional toast for fun activities
      if (newActivity === 'coffee') {
        addToast(`${agent.name} 去倒了杯咖啡`, '☕');
      } else if (newActivity === 'slacking') {
        addToast(`${agent.name} 在偷偷摸鱼`, '🐟');
      } else if (newActivity === 'meeting') {
        addToast(`${agent.name} 加入了一个会议`, '🗣️');
      }
    }, 5000 + Math.random() * 5000); // 5-10 seconds

    return () => clearInterval(interval);
  }, [officeState, addToast]);

  // ── Interaction handlers ──────────────────────────────────────
  const handlePat = useCallback(() => {
    if (selectedAgent === null || !stateRef.current) return;
    const agent = EMPLOYEE_AGENTS.find(a => a.id === selectedAgent);
    if (!agent) return;

    // Show bubble
    stateRef.current.showPermissionBubble(selectedAgent);
    setTimeout(() => stateRef.current?.dismissBubble(selectedAgent), 2000);

    const reaction = PAT_REACTIONS[Math.floor(Math.random() * PAT_REACTIONS.length)];
    addToast(`${agent.name} ${reaction}`, '👋');
  }, [selectedAgent, addToast]);

  const handleTask = useCallback(() => {
    if (selectedAgent === null || !stateRef.current) return;
    const agent = EMPLOYEE_AGENTS.find(a => a.id === selectedAgent);
    if (!agent) return;

    const task = TASK_TYPES[Math.floor(Math.random() * TASK_TYPES.length)];

    // Employee goes back to desk and starts typing
    stateRef.current.setAgentActive(selectedAgent, true);
    stateRef.current.setAgentTool(selectedAgent, 'Write');
    setAgentActivities(prev => ({ ...prev, [selectedAgent]: 'coding' }));

    // Show bubble to indicate task received
    stateRef.current.showPermissionBubble(selectedAgent);
    setTimeout(() => {
      stateRef.current?.dismissBubble(selectedAgent);
      stateRef.current?.showWaitingBubble(selectedAgent);
    }, 1500);

    addToast(`给 ${agent.name} 派了任务：${task}`, '📋');
  }, [selectedAgent, addToast]);

  const handleCoffee = useCallback(() => {
    if (selectedAgent === null || !stateRef.current) return;
    const agent = EMPLOYEE_AGENTS.find(a => a.id === selectedAgent);
    if (!agent) return;

    // Employee gets coffee break
    stateRef.current.setAgentTool(selectedAgent, null);
    stateRef.current.setAgentActive(selectedAgent, false);
    setAgentActivities(prev => ({ ...prev, [selectedAgent]: 'coffee' }));

    stateRef.current.showWaitingBubble(selectedAgent);

    const reaction = COFFEE_REACTIONS[Math.floor(Math.random() * COFFEE_REACTIONS.length)];
    addToast(`${agent.name} ${reaction}`, '☕');

    // Return to work after a bit
    setTimeout(() => {
      if (stateRef.current) {
        stateRef.current.setAgentActive(selectedAgent, true);
        stateRef.current.setAgentTool(selectedAgent, 'Write');
        setAgentActivities(prev => ({ ...prev, [selectedAgent]: 'coding' }));
      }
    }, 8000);
  }, [selectedAgent, addToast]);

  const handleRush = useCallback(() => {
    if (selectedAgent === null || !stateRef.current) return;
    const agent = EMPLOYEE_AGENTS.find(a => a.id === selectedAgent);
    if (!agent) return;

    // Rush them back to work
    stateRef.current.setAgentActive(selectedAgent, true);
    stateRef.current.setAgentTool(selectedAgent, 'Bash');
    setAgentActivities(prev => ({ ...prev, [selectedAgent]: 'coding' }));

    // Flash bubbles
    stateRef.current.showPermissionBubble(selectedAgent);
    setTimeout(() => {
      stateRef.current?.dismissBubble(selectedAgent);
    }, 1000);

    const reaction = RUSH_REACTIONS[Math.floor(Math.random() * RUSH_REACTIONS.length)];
    addToast(`催了一下 ${agent.name}，${reaction}`, '🔔');
  }, [selectedAgent, addToast]);

  // ── Click handler ─────────────────────────────────────────────
  const handleClick = useCallback((agentId: number) => {
    setSelectedAgent(agentId === selectedAgent ? null : agentId);
  }, [selectedAgent]);

  // Editor no-ops
  const noop = useCallback(() => {}, []);
  const noopTile = useCallback((_col: number, _row: number) => {}, []);
  const noopDrag = useCallback((_uid: string, _col: number, _row: number) => {}, []);

  // Selected agent info
  const selectedInfo = useMemo(() => {
    if (selectedAgent === null) return null;
    return EMPLOYEE_AGENTS.find(a => a.id === selectedAgent) || null;
  }, [selectedAgent]);

  const selectedActivity = selectedAgent !== null ? agentActivities[selectedAgent] : null;

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
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
            ● {EMPLOYEE_AGENTS.length} 人在线
          </span>
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

      {/* Canvas + Overlays */}
      <div className="flex-1 relative">
        <OfficeCanvas
          officeState={officeState}
          onClick={handleClick}
          isEditMode={false}
          editorState={editorStateRef.current}
          onEditorTileAction={noopTile}
          onEditorEraseAction={noopTile}
          onEditorSelectionChange={noop}
          onDeleteSelected={noop}
          onRotateSelected={noop}
          onDragMove={noopDrag}
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

        {/* Selected agent interaction panel */}
        {selectedInfo && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#16213e]/95 backdrop-blur border border-white/10 rounded-xl px-5 py-3 shadow-2xl flex items-center gap-4">
            {/* Avatar + Info */}
            <div className="flex items-center gap-3 pr-4 border-r border-white/10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-lg">
                {selectedInfo.emoji}
              </div>
              <div>
                <div className="text-white text-sm font-medium">{selectedInfo.name}</div>
                <div className="text-white/40 text-[10px]">{selectedInfo.role}</div>
                {selectedActivity && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs">{ACTIVITIES[selectedActivity].emoji}</span>
                    <span className="text-white/50 text-[10px]">{ACTIVITIES[selectedActivity].label}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Interaction Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePat}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 transition-all text-white/70 hover:text-white"
                title="拍一下打个招呼"
              >
                <span className="text-base">👋</span>
                <span className="text-[9px]">拍一下</span>
              </button>
              {!selectedInfo.isLeader && (
                <>
                  <button
                    onClick={handleTask}
                    className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 active:bg-blue-500/30 transition-all text-white/70 hover:text-blue-300"
                    title="随机派一个任务"
                  >
                    <span className="text-base">📋</span>
                    <span className="text-[9px]">派任务</span>
                  </button>
                  <button
                    onClick={handleCoffee}
                    className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 active:bg-amber-500/30 transition-all text-white/70 hover:text-amber-300"
                    title="请喝杯咖啡"
                  >
                    <span className="text-base">☕</span>
                    <span className="text-[9px]">请咖啡</span>
                  </button>
                  <button
                    onClick={handleRush}
                    className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 active:bg-red-500/30 transition-all text-white/70 hover:text-red-300"
                    title="催一下加速"
                  >
                    <span className="text-base">🔔</span>
                    <span className="text-[9px]">催一下</span>
                  </button>
                </>
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
          {EMPLOYEE_AGENTS.map(agent => {
            const act = agentActivities[agent.id];
            const info = act ? ACTIVITIES[act] : null;
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
                  agent.isLeader ? 'bg-purple-400' :
                  act === 'slacking' ? 'bg-yellow-400' :
                  act === 'coffee' || act === 'idle' ? 'bg-amber-400' :
                  'bg-green-400'
                }`} />
                <span>{agent.name}</span>
                {info && <span className="text-[10px] opacity-60">{info.emoji}</span>}
              </button>
            );
          })}
        </div>
        <div className="text-white/20 text-[10px] font-mono">
          pixel-agents engine · MIT
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
