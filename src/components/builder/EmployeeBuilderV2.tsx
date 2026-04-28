import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, FlaskConical, Rocket } from 'lucide-react';
import type { DigitalEmployee } from '../../types';
import type { NavFocusIntent, NavTab } from '../../types';
import type { BuilderProject, BuilderStage } from '../../features/builder/types';
import { blueprintToEmployee } from '../../features/builder/mappers/blueprintToEmployee';
import { getAgentModule, getBuilderModule } from '../../services/qeeclaw';
import { loadLatestDraftProject, saveBuilderProject } from '../../features/builder/persistence';
import { createBuilderLaunchApprovals, recordBuilderAudit } from '../../features/builder/governance';
import { hasBlockingPreflight, runBuilderPreflight } from '../../features/builder/preflight';
import { buildBuilderAgentDescription, buildBuilderAgentMetadata, syncBuilderProjectToAgent } from '../../features/builder/agentSync';
import BuilderCanvas, { type CanvasNode } from './BuilderCanvas';
import BuilderChat, { buildNodesFromProject } from './BuilderChat';
import NodeDetailPanel from './NodeDetailPanel';

interface Props {
  onBack: () => void;
  onComplete: (employee: DigitalEmployee) => void;
  onNavigate?: (tab: NavTab, intent?: NavFocusIntent) => void;
}

const EMPTY_NODES: CanvasNode[] = [
  { id: 'role-goal', layer: 1, type: 'role-goal', title: '岗位目标', subtitle: '这个员工要完成什么业务结果', icon: 'target', status: 'configuring' },
  { id: 'service-target', layer: 1, type: 'service-target', title: '服务对象', subtitle: '为老板、主管、会计还是客户工作', icon: 'users', status: 'empty' },
  { id: 'data-sources', layer: 1, type: 'data-source', title: '数据来源', subtitle: '文件、IM、台账、知识库', icon: 'database', status: 'empty' },
  { id: 'workflow', layer: 2, type: 'workflow', title: '工作流程', subtitle: '触发、判断、动作、输出', icon: 'workflow', status: 'empty' },
  { id: 'tool-permissions', layer: 2, type: 'tool-permission', title: '工具权限', subtitle: '只允许必要工具', icon: 'zap', status: 'empty' },
  { id: 'approval', layer: 2, type: 'approval', title: '人工确认', subtitle: '高风险动作必须确认', icon: 'shield', status: 'empty' },
  { id: 'exceptions', layer: 3, type: 'exception', title: '异常处理', subtitle: '无法判断时转人工', icon: 'alert', status: 'empty' },
  { id: 'acceptance', layer: 3, type: 'acceptance', title: '验收指标', subtitle: '上线前用样本验证', icon: 'check', status: 'empty' },
  { id: 'launch', layer: 3, type: 'launch', title: '上线清单', subtitle: '确认配置、权限和测试结果', icon: 'flag', status: 'empty' },
];

const STAGES: { key: BuilderStage; label: string }[] = [
  { key: 'idea', label: '需求描述' },
  { key: 'interview', label: '业务访谈' },
  { key: 'blueprint', label: '蓝图生成' },
  { key: 'test', label: '测试运行' },
  { key: 'launch', label: '上线确认' },
  { key: 'optimize', label: '持续优化' },
];

function stageIndex(stage: BuilderStage | undefined): number {
  return Math.max(0, STAGES.findIndex((item) => item.key === (stage ?? 'idea')));
}

export default function EmployeeBuilderV2({ onBack, onComplete, onNavigate }: Props) {
  const [project, setProject] = useState<BuilderProject | null>(null);
  const [nodes, setNodes] = useState<CanvasNode[]>(EMPTY_NODES);
  const [activeLayer, setActiveLayer] = useState(1);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('role-goal');
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadLatestDraftProject().then((draft) => {
      if (cancelled || !draft || project) return;
      setProject(draft);
      setNodes(buildNodesFromProject(draft));
      setActiveLayer(draft.stage === 'idea' || draft.stage === 'interview' ? 1 : draft.stage === 'blueprint' ? 2 : 3);
    });
    return () => {
      cancelled = true;
    };
  }, [project]);

  const handleProjectChange = useCallback((nextProject: BuilderProject) => {
    setProject(nextProject);
    void saveBuilderProject(nextProject);
  }, []);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );
  const progress = project ? Math.round(((stageIndex(project.stage) + 1) / STAGES.length) * 100) : 12;
  const latestRun = project?.testRuns[0];
  const canTest = Boolean(project && (project.stage === 'blueprint' || project.stage === 'test' || project.stage === 'launch'));
  const canLaunch = Boolean(project && project.status === 'ready_to_deploy' && latestRun?.status === 'passed' && !hasBlockingPreflight(project));

  const handleRunTest = useCallback(() => {
    if (!project) return;
    setActiveLayer(3);
    setSelectedNodeId('launch');
    void (async () => {
      try {
        await saveBuilderProject(project);
        const tested = await getBuilderModule().runTest(project.id) as BuilderProject;
        const checked = await runBuilderPreflight(tested);
        setProject(checked);
        await saveBuilderProject(checked);
        void recordBuilderAudit(checked, 'test_passed', '样本测试与上线预检完成', hasBlockingPreflight(checked) ? 'high' : 'low');
        setNodes((prev) =>
          prev.map((node) =>
            node.id === 'launch'
              ? {
                  ...node,
                  status: hasBlockingPreflight(checked) ? 'blocked' : 'done',
                  data: {
                    清单: checked.blueprint.launchChecklist.map((item) => `${item.status === 'passed' ? '已通过' : item.status === 'blocked' ? '阻塞' : '待确认'} ${item.label}`),
                  },
                }
              : node,
          ),
        );
      } catch (error) {
        console.error('[Builder] run test failed:', error);
      }
    })();
  }, [project]);

  const handleLaunch = useCallback(async () => {
    if (!project || !canLaunch || launching) return;
    setLaunching(true);
    const now = new Date().toISOString();
    const deployedProject: BuilderProject = {
      ...project,
      status: 'deployed',
      stage: 'optimize',
      employeeId: `builder_${project.blueprint.roleType}_${Date.now().toString(36)}`,
      updatedAt: now,
      versions: [
        ...project.versions,
        {
          id: `${project.id}_deploy`,
          version: 'v1.0',
          summary: `${project.blueprint.name} 已确认上线`,
          createdAt: now,
          snapshot: {
            blueprint: project.blueprint,
            viewConfig: project.viewConfig,
          },
        },
      ],
    };
    try {
      let syncedProject = deployedProject;
      let agentCreationFailed = false;
      try {
        const createdAgent = await getAgentModule().create({
          name: deployedProject.blueprint.name,
          description: buildBuilderAgentDescription(deployedProject),
          model: deployedProject.blueprint.runtime.model || 'gpt-4o',
          runtimeType: 'hermes',
          metadata: buildBuilderAgentMetadata(deployedProject),
        });
        syncedProject = {
          ...deployedProject,
          deployedAgent: {
            id: createdAgent.id,
            code: createdAgent.code,
            runtimeType: createdAgent.runtimeType ?? 'hermes',
            syncedAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        console.error('[Builder] Agent creation failed:', error);
        agentCreationFailed = true;
        alert('员工创建失败，请稍后在员工详情页重试激活。错误：' + (error instanceof Error ? error.message : String(error)));
      }

      await saveBuilderProject(syncedProject);
      void createBuilderLaunchApprovals(syncedProject);
      void recordBuilderAudit(syncedProject, 'deployed', '确认上线', 'medium');
      const employee = {
        ...blueprintToEmployee(syncedProject),
        status: syncedProject.deployedAgent ? 'active' as const : 'inactive' as const,
      };
      onComplete(employee);
    } finally {
      setLaunching(false);
    }
  }, [canLaunch, launching, onComplete, project]);

  const handleRollback = useCallback((versionId: string) => {
    if (!project) return;
    const targetVersion = project.versions.find((version) => version.id === versionId);
    if (!targetVersion?.snapshot) return;

    const rolledBack: BuilderProject = {
      ...project,
      blueprint: targetVersion.snapshot.blueprint,
      viewConfig: targetVersion.snapshot.viewConfig,
      status: 'blueprint_ready',
      stage: 'blueprint',
      updatedAt: new Date().toISOString(),
      versions: [
        ...project.versions,
        {
          id: `${project.id}_rollback_${Date.now().toString(36)}`,
          version: `v${project.versions.length + 1}.0`,
          summary: `回滚到 ${targetVersion.version}`,
          createdAt: new Date().toISOString(),
          snapshot: targetVersion.snapshot,
        },
      ],
    };

    setProject(rolledBack);
    setNodes(buildNodesFromProject(rolledBack));
    setActiveLayer(2);
    setSelectedNodeId('role-goal');
    void saveBuilderProject(rolledBack);
    void syncBuilderProjectToAgent(rolledBack).then((syncedProject) => saveBuilderProject(syncedProject));
    void recordBuilderAudit(rolledBack, 'rolled_back', `回滚到 ${targetVersion.version}`, 'medium');
  }, [project]);

  return (
    <div className="flex h-full w-full flex-col bg-parchment">
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-b border-border-cream bg-ivory px-5 py-3"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border-warm text-stone-gray transition-colors hover:border-terracotta/40 hover:text-terracotta"
            aria-label="返回"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-lg font-semibold leading-tight text-near-black">数字员工岗位共创工作台</h1>
            <p className="mt-0.5 text-xs text-stone-gray">从岗位想法到测试上线，不暴露 Prompt 和 API 配置。</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunTest}
              disabled={!canTest}
              className="flex items-center gap-1.5 rounded-xl border border-border-warm px-3 py-2 text-xs font-medium text-olive-gray transition-colors hover:border-terracotta/30 hover:text-terracotta disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FlaskConical size={14} />
              运行测试
            </button>
            <button
              onClick={handleLaunch}
              disabled={!canLaunch || launching}
              title={project && hasBlockingPreflight(project) ? '上线清单存在阻塞项，请先处理通道或资料配置' : undefined}
              className="btn-terracotta px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Rocket size={14} />
              {launching ? '上线中' : '确认上线'}
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          {STAGES.map((stage, index) => {
            const active = index <= stageIndex(project?.stage);
            return (
              <div key={stage.key} className="flex min-w-0 flex-1 items-center gap-2">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${active ? 'bg-terracotta text-white' : 'bg-warm-sand text-stone-gray'}`}>
                  {active ? <CheckCircle2 size={12} /> : index + 1}
                </span>
                <span className={`truncate text-[11px] ${active ? 'text-near-black' : 'text-stone-gray'}`}>{stage.label}</span>
                {index < STAGES.length - 1 && <span className="h-px flex-1 bg-border-warm" />}
              </div>
            );
          })}
          <span className="ml-2 text-[11px] font-medium text-terracotta">{progress}%</span>
        </div>
      </motion.header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <LayoutGroup>
          <BuilderChat
            project={project}
            nodes={nodes}
            onProjectChange={handleProjectChange}
            onNodesChange={setNodes}
            onActiveLayerChange={setActiveLayer}
          />
          <motion.div layout className="min-w-0 flex-1 overflow-hidden">
            <BuilderCanvas
              activeLayer={activeLayer}
              nodes={nodes}
              selectedNodeId={selectedNodeId}
              onSelectNode={(id) => setSelectedNodeId((prev) => (prev === id ? null : id))}
            />
          </motion.div>
          <AnimatePresence mode="wait">
            {selectedNode && (
              <NodeDetailPanel
                key={selectedNode.id}
                node={selectedNode}
                project={project}
                onClose={() => setSelectedNodeId(null)}
                onRunTest={handleRunTest}
                onNavigate={onNavigate}
                onRollback={handleRollback}
              />
            )}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  );
}
