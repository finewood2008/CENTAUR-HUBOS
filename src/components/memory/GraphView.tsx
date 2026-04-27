// GraphView.tsx — Cognitive Graph visualization for CENTAUR-HUBOS
// Force-directed graph showing leader(center) → employees → memories, boss → leader relationships

import ForceGraph2D from 'react-force-graph-2d';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePersonaStore } from '../../stores/personaStore';
import { useMemoryCenter } from '../../features/memory/useMemoryCenter';
import { useSharedContext } from '../../features/shared-context/useSharedContext';

// ─── Color constants ────────────────────────────────────────────────

const EMPLOYEE_COLORS: Record<string, string> = {
  leader: '#6366f1',
  spark: '#f97316',
  xiaoke: '#3b82f6',
  shuxi: '#10b981',
  shuibao: '#eab308',
  lvan: '#8b5cf6',
};

const EMPLOYEE_LABELS: Record<string, string> = {
  leader: '主管',
  spark: 'Spark',
  xiaoke: '小可',
  shuxi: '书熙',
  shuibao: '税宝',
  lvan: '绿安',
};

const SHARED_COLORS: Record<string, string> = {
  boss: '#ef4444',
  company: '#6366f1',
  team: '#14b8a6',
};

const CATEGORY_COLORS: Record<string, string> = {
  preference: '#f59e0b',
  fact: '#22c55e',
  lesson: '#a855f7',
  correction: '#ef4444',
};

const CATEGORY_LABELS: Record<string, string> = {
  preference: '偏好',
  fact: '事实',
  lesson: '经验',
  correction: '纠正',
};

// ─── Graph node / link types ────────────────────────────────────────

interface GraphNode {
  id: string;
  label: string;
  type: 'boss' | 'leader' | 'person' | 'shared' | 'memory';
  color: string;
  size: number;
  content?: string; // full text for tooltip
  category?: string; // memory category
  employeeId?: string;
}

interface GraphLink {
  source: string;
  target: string;
  color?: string;
}

// ─── Legend item ────────────────────────────────────────────────────

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 12 }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: color,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 11, color: '#94a3b8' }}>{label}</span>
    </span>
  );
}

// ─── Component ──────────────────────────────────────────────────────

function GraphView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Store data
  const employees = usePersonaStore((s) => s.employees);
  const { agentMemories } = useMemoryCenter();
  const { shared } = useSharedContext();

  // ── Resize observer ───────────────────────────────────────────────

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width: Math.floor(width), height: Math.floor(height) });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Build graph data ──────────────────────────────────────────────

  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Leader node (center)
    nodes.push({
      id: 'leader',
      label: '主管',
      type: 'leader',
      color: '#6366f1',
      size: 24,
      content: '团队统管 — 协调所有员工',
    });

    // Boss node (connects to leader, no longer center)
    nodes.push({
      id: 'boss',
      label: '老板',
      type: 'boss',
      color: SHARED_COLORS.boss,
      size: 20,
      content: shared.boss || '(未设置)',
    });
    links.push({ source: 'boss', target: 'leader', color: SHARED_COLORS.boss + '66' });

    // Shared knowledge nodes (company, team) → connect to boss
    if (shared.company) {
      nodes.push({
        id: 'shared-company',
        label: '公司',
        type: 'shared',
        color: SHARED_COLORS.company,
        size: Math.min(12, Math.max(4, Math.round(shared.company.length / 20))),
        content: shared.company,
      });
      links.push({ source: 'boss', target: 'shared-company', color: SHARED_COLORS.company + '66' });
    }

    if (shared.team) {
      nodes.push({
        id: 'shared-team',
        label: '团队',
        type: 'shared',
        color: SHARED_COLORS.team,
        size: Math.min(12, Math.max(4, Math.round(shared.team.length / 20))),
        content: shared.team,
      });
      links.push({ source: 'boss', target: 'shared-team', color: SHARED_COLORS.team + '66' });
    }

    // Employee IDs we care about
    const employeeIds = ['spark', 'xiaoke', 'shuxi', 'shuibao', 'lvan'];

    for (const eid of employeeIds) {
      const emp = employees[eid];
      const color = EMPLOYEE_COLORS[eid] || '#888888';
      const label = EMPLOYEE_LABELS[eid] || eid;

      // Employee node
      nodes.push({
        id: eid,
        label,
        type: 'person',
        color,
        size: 16,
        content: emp?.soul || `${label} (未初始化)`,
        employeeId: eid,
      });

      // Leader → Employee link (employees report to leader)
      links.push({ source: 'leader', target: eid, color: color + '55' });

      // Memory nodes
      for (const mem of agentMemories[eid] ?? []) {
          const memNodeId = `mem-${eid}-${mem.id}`;
          const memColor = CATEGORY_COLORS[mem.category] || '#888888';
          const contentLen = mem.content.length;
          // Map content length 0..200 → size 4..12
          const memSize = Math.min(12, Math.max(4, Math.round(4 + (contentLen / 200) * 8)));

          nodes.push({
            id: memNodeId,
            label: `${CATEGORY_LABELS[mem.category] || mem.category}`,
            type: 'memory',
            color: memColor,
            size: memSize,
            content: mem.content,
            category: mem.category,
            employeeId: eid,
          });

          links.push({ source: eid, target: memNodeId, color: memColor + '44' });
        }
    }

    return { nodes, links };
  }, [agentMemories, employees, shared]);

  // ── Empty state check ─────────────────────────────────────────────

  const isEmpty = graphData.nodes.length <= 2; // only boss + leader nodes

  // ── Highlight links for selected node ─────────────────────────────

  const highlightedLinks = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const set = new Set<string>();
    for (const link of graphData.links) {
      const src = typeof link.source === 'object' ? (link.source as any).id : link.source;
      const tgt = typeof link.target === 'object' ? (link.target as any).id : link.target;
      if (src === selectedNodeId || tgt === selectedNodeId) {
        set.add(`${src}→${tgt}`);
      }
    }
    return set;
  }, [selectedNodeId, graphData.links]);

  // ── Callbacks ─────────────────────────────────────────────────────

  const handleNodeHover = useCallback((node: GraphNode | null, event?: MouseEvent) => {
    setHoveredNode(node);
    if (event) {
      setTooltipPos({ x: event.clientX, y: event.clientY });
    }
  }, []);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
  }, []);

  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const { x, y, size, color, label, type } = node as GraphNode & { x: number; y: number };
      if (x == null || y == null) return;

      const r = size / 2;
      const isSelected = selectedNodeId === node.id;

      // Draw glow for selected
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(x, y, r + 3, 0, 2 * Math.PI);
        ctx.fillStyle = color + '44';
        ctx.fill();
      }

      // Draw node circle
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // Draw border
      ctx.strokeStyle = isSelected ? '#ffffff' : color + '88';
      ctx.lineWidth = isSelected ? 1.5 : 0.5;
      ctx.stroke();

      // Label for boss, leader, person and shared nodes
      if (type === 'boss' || type === 'leader' || type === 'person' || type === 'shared') {
        const fontSize = Math.max(10, 12 / globalScale);
        ctx.font = `${fontSize}px "Inter", "PingFang SC", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(label, x, y + r + 2);
      }
    },
    [selectedNodeId],
  );

  const linkColor = useCallback(
    (link: any) => {
      const src = typeof link.source === 'object' ? link.source.id : link.source;
      const tgt = typeof link.target === 'object' ? link.target.id : link.target;
      const key = `${src}→${tgt}`;
      if (highlightedLinks.has(key)) {
        return link.color ? link.color.slice(0, 7) + 'cc' : '#ffffff88';
      }
      return link.color || '#ffffff22';
    },
    [highlightedLinks],
  );

  const linkWidth = useCallback(
    (link: any) => {
      const src = typeof link.source === 'object' ? link.source.id : link.source;
      const tgt = typeof link.target === 'object' ? link.target.id : link.target;
      const key = `${src}→${tgt}`;
      return highlightedLinks.has(key) ? 2 : 0.5;
    },
    [highlightedLinks],
  );

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 400,
        display: 'flex',
        flexDirection: 'column',
        background: '#1a1a2e',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #ffffff11',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
          🧠 认知图谱
        </span>
        <span style={{ fontSize: 11, color: '#64748b' }}>
          {graphData.nodes.length} 节点 · {graphData.links.length} 连接
        </span>
      </div>

      {/* Graph container */}
      <div
        ref={containerRef}
        style={{ flex: 1, position: 'relative', minHeight: 300 }}
      >
        {isEmpty ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 36 }}>🕸️</span>
            <span style={{ fontSize: 13 }}>暂无认知数据</span>
            <span style={{ fontSize: 11, color: '#475569' }}>
              为员工添加记忆后，图谱将自动生成
            </span>
          </div>
        ) : (
          <ForceGraph2D
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            backgroundColor="#1a1a2e"
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
              const r = ((node as GraphNode).size || 6) / 2 + 2;
              ctx.beginPath();
              ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
              ctx.fillStyle = color;
              ctx.fill();
            }}
            onNodeHover={handleNodeHover}
            onNodeClick={handleNodeClick}
            linkColor={linkColor}
            linkWidth={linkWidth}
            linkDirectionalParticles={0}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
            cooldownTicks={100}
            enableZoomInteraction={true}
            enablePanInteraction={true}
          />
        )}

        {/* Tooltip */}
        {hoveredNode && (
          <div
            style={{
              position: 'fixed',
              left: tooltipPos.x + 12,
              top: tooltipPos.y - 10,
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 6,
              padding: '6px 10px',
              maxWidth: 260,
              zIndex: 999,
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: hoveredNode.color,
                marginBottom: 2,
              }}
            >
              {hoveredNode.label}
              {hoveredNode.category && (
                <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 6 }}>
                  [{CATEGORY_LABELS[hoveredNode.category] || hoveredNode.category}]
                </span>
              )}
              {hoveredNode.employeeId && hoveredNode.type === 'memory' && (
                <span style={{ fontSize: 10, color: '#64748b', marginLeft: 6 }}>
                  @{EMPLOYEE_LABELS[hoveredNode.employeeId] || hoveredNode.employeeId}
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#cbd5e1',
                lineHeight: 1.4,
                wordBreak: 'break-all',
              }}
            >
              {hoveredNode.content
                ? hoveredNode.content.length > 120
                  ? hoveredNode.content.slice(0, 120) + '…'
                  : hoveredNode.content
                : '(空)'}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          padding: '6px 12px',
          borderTop: '1px solid #ffffff11',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '2px 0',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 10, color: '#475569', marginRight: 8 }}>图例:</span>
        <LegendDot color="#6366f1" label="主管" />
        <LegendDot color={SHARED_COLORS.boss} label="老板" />
        {Object.entries(EMPLOYEE_COLORS).filter(([id]) => id !== 'leader').map(([id, c]) => (
          <LegendDot key={id} color={c} label={EMPLOYEE_LABELS[id] || id} />
        ))}
        <span style={{ width: 1, height: 12, background: '#334155', margin: '0 6px' }} />
        <LegendDot color={SHARED_COLORS.company} label="公司" />
        <LegendDot color={SHARED_COLORS.team} label="团队" />
        <span style={{ width: 1, height: 12, background: '#334155', margin: '0 6px' }} />
        {Object.entries(CATEGORY_COLORS).map(([cat, c]) => (
          <LegendDot key={cat} color={c} label={CATEGORY_LABELS[cat] || cat} />
        ))}
      </div>
    </div>
  );
}

export default GraphView;
