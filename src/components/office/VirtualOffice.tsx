/**
 * VirtualOffice — Hub OS pixel art virtual office.
 * Uses the pixel-agents engine (pure Canvas 2D) instead of Phaser.
 * Connects to Hub OS employee data from digital-employees.ts.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DIGITAL_EMPLOYEES } from '../../data/digital-employees';
import { OfficeState } from './engine/officeState';
import { OfficeCanvas } from './components/OfficeCanvas';
import { ToolOverlay } from './components/ToolOverlay';
import { createHubOSLayout } from './hubosLayout';
import { loadAllAssets } from './assetLoader';
import { EditorState } from './editor/editorState';
import { TILE_SIZE } from './types';

// Map Hub OS employees to office agent IDs
const EMPLOYEE_AGENTS = DIGITAL_EMPLOYEES.map((emp, idx) => ({
  id: idx,
  name: emp.name,
  role: emp.role,
  hubId: emp.id,
  isLeader: emp.id === 'leader',
}));

export default function VirtualOffice() {
  const [loading, setLoading] = useState(true);
  const [officeState, setOfficeState] = useState<OfficeState | null>(null);
  const [zoom, setZoom] = useState(3);
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const panRef = useRef({ x: 0, y: 0 });
  const editorStateRef = useRef<EditorState>(new EditorState());

  // Initialize office
  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Load all pixel art assets
      await loadAllAssets();
      if (cancelled) return;

      // Create office with custom layout
      const layout = createHubOSLayout();
      const state = new OfficeState(layout);

      // Add employees as characters
      for (const agent of EMPLOYEE_AGENTS) {
        if (agent.isLeader) {
          // Leader gets the dedicated seat in their office
          state.addAgent(agent.id, 0, 0, 'leader-chair');
        } else {
          state.addAgent(agent.id, agent.id % 6);
        }
      }

      // Leader stays at desk (always typing/managing)
      for (const agent of EMPLOYEE_AGENTS) {
        if (agent.isLeader) {
          state.setAgentTool(agent.id, 'Write'); // Leader always working
        } else {
          // Non-leader employees periodically do tasks
          const tools = ['Write', 'Read', 'Edit', 'Bash', 'Search', 'Grep'];
          const tool = tools[agent.id % tools.length];
          state.setAgentTool(agent.id, tool);
        }
      }

      setOfficeState(state);
      setLoading(false);
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // Click handler for characters
  const handleClick = useCallback((agentId: number) => {
    setSelectedAgent(agentId === selectedAgent ? null : agentId);
  }, [selectedAgent]);

  // Editor callbacks (no-ops for view-only mode)
  const noop = useCallback(() => {}, []);
  const noopTile = useCallback((_col: number, _row: number) => {}, []);
  const noopDrag = useCallback((_uid: string, _col: number, _row: number) => {}, []);

  // Get selected agent info
  const selectedInfo = useMemo(() => {
    if (selectedAgent === null) return null;
    return EMPLOYEE_AGENTS.find(a => a.id === selectedAgent) || null;
  }, [selectedAgent]);

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
          >
            −
          </button>
          <span className="text-white/40 text-xs font-mono">{zoom}x</span>
          <button
            onClick={() => setZoom(z => Math.min(6, z + 1))}
            className="text-white/50 hover:text-white/80 px-2 py-1 text-sm font-mono"
          >
            +
          </button>
        </div>
      </div>

      {/* Canvas Area */}
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

        {/* Agent info overlay */}
        {selectedInfo && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#16213e]/95 backdrop-blur border border-white/10 rounded-lg px-4 py-3 flex items-center gap-3 shadow-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-bold">
              {selectedInfo.name[0]}
            </div>
            <div>
              <div className="text-white text-sm font-medium">{selectedInfo.name}</div>
              <div className="text-white/50 text-xs">{selectedInfo.role}</div>
            </div>
            <div className="ml-3 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs">工作中</span>
            </div>
            <button
              onClick={() => setSelectedAgent(null)}
              className="ml-2 text-white/30 hover:text-white/60 text-sm"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-1.5 bg-[#16213e] border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {EMPLOYEE_AGENTS.map(agent => (
            <button
              key={agent.id}
              onClick={() => handleClick(agent.id)}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                selectedAgent === agent.id
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${agent.isLeader ? 'bg-purple-400' : 'bg-green-400'}`} />
              {agent.name}
            </button>
          ))}
        </div>
        <div className="text-white/20 text-[10px] font-mono">
          pixel-agents engine · MIT
        </div>
      </div>
    </div>
  );
}
