import { getAgentModule } from '../../services/qeeclaw';
import { recordBuilderAudit } from './governance';
import type { BuilderDeployedAgent, BuilderProject } from './types';

function summarizeList(items: string[], max = 5): string {
  return items.slice(0, max).join('；');
}

export function buildBuilderAgentDescription(project: BuilderProject): string {
  const { blueprint } = project;
  const approvals = blueprint.approvalPolicies
    .filter((policy) => policy.required)
    .map((policy) => `${policy.action}需${policy.approverRole}确认`);
  const tools = blueprint.toolPermissions
    .filter((tool) => tool.approvalRequired || tool.riskLevel !== 'low')
    .map((tool) => `${tool.label}(${tool.riskLevel})`);
  const sources = blueprint.inputSources.map((source) => source.label);

  return [
    `岗位目标：${blueprint.goal}`,
    `服务对象：${summarizeList(blueprint.serviceTarget) || '未指定'}`,
    `核心职责：${summarizeList(blueprint.responsibilities) || '未指定'}`,
    `数据来源：${summarizeList(sources) || '未指定'}`,
    approvals.length ? `人工确认：${summarizeList(approvals)}` : '人工确认：按默认风险策略执行',
    tools.length ? `高风险工具：${summarizeList(tools)}` : '高风险工具：无',
    `Builder项目：${project.id}`,
  ].join('\n');
}

export function buildBuilderAgentMetadata(project: BuilderProject): Record<string, unknown> {
  return {
    builder: {
      projectId: project.id,
      status: project.status,
      stage: project.stage,
      employeeId: project.employeeId,
      roleType: project.blueprint.roleType,
      runtimeType: 'hermes',
      updatedAt: project.updatedAt,
      blueprint: project.blueprint,
      viewConfig: project.viewConfig,
      version: project.versions[project.versions.length - 1]?.version,
      launchChecklist: project.blueprint.launchChecklist,
    },
  };
}

function normalizeAgentId(value: unknown): number | null {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

async function resolveDeployedAgent(project: BuilderProject): Promise<BuilderDeployedAgent | null> {
  if (project.deployedAgent?.id) {
    return project.deployedAgent;
  }

  try {
    const agents = await getAgentModule().listMyAgents();
    const matched = agents.find((agent: { id: number; code?: string; name?: string; runtimeType?: string | null }) =>
      agent.code === project.deployedAgent?.code || agent.name === project.blueprint.name,
    );
    if (!matched) return null;
    return {
      id: matched.id,
      code: matched.code || String(matched.id),
      runtimeType: matched.runtimeType ?? project.blueprint.runtime.runtimeType,
    };
  } catch {
    return null;
  }
}

export async function syncBuilderProjectToAgent(project: BuilderProject): Promise<BuilderProject> {
  const deployedAgent = await resolveDeployedAgent(project);
  const agentId = normalizeAgentId(deployedAgent?.id);
  if (!deployedAgent || !agentId) {
    return project;
  }

  try {
    await getAgentModule().update(agentId, {
      name: project.blueprint.name,
      description: buildBuilderAgentDescription(project),
      model: project.blueprint.runtime.model || 'gpt-4o',
      runtimeType: 'hermes',
      metadata: buildBuilderAgentMetadata(project),
    });
    const syncedProject: BuilderProject = {
      ...project,
      deployedAgent: {
        ...deployedAgent,
        runtimeType: deployedAgent.runtimeType ?? 'hermes',
        syncedAt: new Date().toISOString(),
        lastSyncError: undefined,
      },
    };
    void recordBuilderAudit(syncedProject, 'agent_synced', '同步 Hermes agent profile', 'low');
    return syncedProject;
  } catch (error) {
    return {
      ...project,
      deployedAgent: {
        ...deployedAgent,
        lastSyncError: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
