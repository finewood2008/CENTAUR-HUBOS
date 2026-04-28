import type { DigitalEmployee } from '../../../types';
import type { BuilderProject, EmployeeRoleBlueprint } from '../types';

function roleAvatar(roleType: string): string {
  if (roleType === 'document_clerk') return '📁';
  if (roleType === 'collection_assistant') return '💬';
  if (roleType === 'daily_reporter') return '📊';
  return '🤖';
}

function roleColor(roleType: string): string {
  if (roleType === 'document_clerk') return 'from-teal-500 to-cyan-400';
  if (roleType === 'collection_assistant') return 'from-orange-500 to-amber-400';
  if (roleType === 'daily_reporter') return 'from-indigo-500 to-blue-400';
  return 'from-slate-400 to-gray-300';
}

function workspaceType(template?: string): DigitalEmployee['workspace']['type'] {
  if (template === 'report_analysis') return 'dashboard';
  return 'chat-board';
}

export function blueprintToEmployee(project: BuilderProject): DigitalEmployee {
  const blueprint: EmployeeRoleBlueprint = project.blueprint;
  const id = project.employeeId || `builder_${blueprint.roleType}_${Date.now().toString(36)}`;
  const viewConfig = project.viewConfig;

  return {
    id,
    name: blueprint.name || '新数字员工',
    englishName: String(blueprint.roleType || 'Builder').replace(/(^|_)([a-z])/g, (_, __, char) => char.toUpperCase()),
    role: blueprint.name || '自定义岗位',
    tagline: blueprint.goal,
    introduction: `你好，我是${blueprint.name}。${blueprint.goal}`,
    avatar: roleAvatar(String(blueprint.roleType)),
    color: roleColor(String(blueprint.roleType)),
    accentColor: 'text-terracotta',
    status: 'inactive',
    model: blueprint.runtime.model || 'gpt-4o',
    capabilities: blueprint.responsibilities.slice(0, 6),
    skills: blueprint.responsibilities.slice(0, 4).map((item) => ({
      name: item,
      icon: 'Zap',
      description: item,
    })),
    tools: blueprint.toolPermissions.map((tool) => ({
      name: tool.label,
      icon: 'Wrench',
      category: tool.category,
      description: tool.description,
    })),
    harness: [
      { title: '岗位目标', content: blueprint.goal },
      { title: '人工确认', content: blueprint.approvalPolicies.map((item) => `${item.action}：${item.reason}`).join('\n') },
      { title: '异常处理', content: blueprint.exceptionPolicies.map((item) => `${item.condition} -> ${item.handling}`).join('\n') },
    ],
    modelInfo: {
      base: blueprint.runtime.model || 'gpt-4o',
      reasoning: '业务流程推理 + 本地权限约束',
      context: '128K',
      specialization: blueprint.name,
    },
    memorySystem: {
      description: '岗位记忆体：沉淀客户偏好、人工纠偏和运行经验。',
      layers: blueprint.runtime.memoryScopes,
    },
    workspace: {
      type: workspaceType(viewConfig?.template),
      label: viewConfig?.title || `${blueprint.name}工作台`,
      description: viewConfig?.subtitle || blueprint.goal,
    },
    builder: {
      projectId: project.id,
      roleType: String(blueprint.roleType),
      agentId: project.deployedAgent?.id,
      agentCode: project.deployedAgent?.code,
      agentRuntimeType: project.deployedAgent?.runtimeType,
      lastSyncedAt: project.deployedAgent?.syncedAt,
      viewConfig,
    },
    onboardingPreferences: [],
    trainingDataSources: blueprint.inputSources.map((source) => source.label),
    stats: { monthlyTasks: 0, hoursSaved: 0, satisfaction: 0 },
  };
}
