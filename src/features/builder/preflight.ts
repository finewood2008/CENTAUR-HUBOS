import { getChannelsClientAsync, getKnowledgeModule } from '../../services/qeeclaw';
import type { BuilderProject, LaunchChecklistItem } from './types';
import { loadBuilderProjects, saveBuilderProject } from './persistence';

interface PreflightCheck {
  id: string;
  label: string;
  status: LaunchChecklistItem['status'];
  required: boolean;
  reason: string;
}

function replaceChecklistItems(
  checklist: LaunchChecklistItem[],
  checks: PreflightCheck[],
): LaunchChecklistItem[] {
  const checkIds = new Set(checks.map((item) => item.id));
  return [
    ...checklist.filter((item) => !checkIds.has(item.id)),
    ...checks.map((item) => ({
      id: item.id,
      label: item.label,
      status: item.status,
      required: item.required,
      reason: item.reason,
    })),
  ];
}

function requiredImSources(project: BuilderProject) {
  return project.blueprint.inputSources.filter((source) => source.required && source.type === 'im');
}

function needsExplicitWechatWork(project: BuilderProject): boolean {
  return requiredImSources(project).some((source) => /企业微信|企微/.test(source.label));
}

function needsExplicitFeishu(project: BuilderProject): boolean {
  return requiredImSources(project).some((source) => /飞书/.test(source.label));
}

function allowsEitherEnterpriseChannel(project: BuilderProject): boolean {
  return requiredImSources(project).some((source) => /(企业微信|企微).*(飞书)|飞书.*(企业微信|企微)/.test(source.label));
}

function hasKnowledgeSource(project: BuilderProject): boolean {
  return project.blueprint.inputSources.some((source) => source.type === 'knowledge_base')
    || project.blueprint.runtime.knowledgeScopes.length > 0;
}

async function checkChannelReadiness(project: BuilderProject): Promise<PreflightCheck[]> {
  const checks: PreflightCheck[] = [];
  const needsWechatWork = needsExplicitWechatWork(project);
  const needsFeishu = needsExplicitFeishu(project);
  const needsEither = allowsEitherEnterpriseChannel(project);

  if (!needsWechatWork && !needsFeishu) {
    return [{
      id: 'preflight-channel',
      label: '通讯渠道预检',
      status: 'pending',
      required: false,
      reason: '当前岗位未指定企业微信或飞书，后续可在通讯中心绑定。',
    }];
  }

  try {
    const client = await getChannelsClientAsync();
    const overview = await client.channels.getOverview(1);
    const items = overview.items ?? [];

    if (needsEither) {
      const wechat = items.find((channel: { channelKey: string }) => channel.channelKey === 'wechat_work');
      const feishu = items.find((channel: { channelKey: string }) => channel.channelKey === 'feishu');
      const ready = Boolean((wechat?.configured && wechat?.enabled) || (feishu?.configured && feishu?.enabled));
      checks.push({
        id: 'preflight-channel-enterprise-im',
        label: '企业协作通道预检',
        status: ready ? 'passed' : 'blocked',
        required: true,
        reason: ready
          ? '已检测到企业微信或飞书通道已配置并启用。'
          : '岗位明确需要企业微信或飞书，至少配置并启用一个本地通道。',
      });
      return checks;
    }

    if (needsWechatWork) {
      const item = items.find((channel: { channelKey: string }) => channel.channelKey === 'wechat_work');
      checks.push({
        id: 'preflight-channel-wechat-work',
        label: '企业微信通道预检',
        status: item?.configured && item?.enabled ? 'passed' : 'blocked',
        required: true,
        reason: item?.configured && item?.enabled
          ? '企业微信通道已配置并启用。'
          : '岗位明确需要企业微信，但本地 bridge 未检测到已启用配置。',
      });
    }

    if (needsFeishu) {
      const item = items.find((channel: { channelKey: string }) => channel.channelKey === 'feishu');
      checks.push({
        id: 'preflight-channel-feishu',
        label: '飞书通道预检',
        status: item?.configured && item?.enabled ? 'passed' : 'blocked',
        required: true,
        reason: item?.configured && item?.enabled
          ? '飞书通道已配置并启用。'
          : '岗位明确需要飞书，但本地 bridge 未检测到已启用配置。',
      });
    }
  } catch {
    checks.push({
      id: 'preflight-channel',
      label: '通讯渠道预检',
      status: 'pending',
      required: true,
      reason: '暂时无法连接本地通讯 bridge，请在通讯中心确认企业微信/飞书配置。',
    });
  }

  return checks;
}

async function checkKnowledgeReadiness(project: BuilderProject): Promise<PreflightCheck> {
  if (!hasKnowledgeSource(project)) {
    return {
      id: 'preflight-knowledge',
      label: '资料来源预检',
      status: 'pending',
      required: false,
      reason: '当前岗位未指定知识库资料源。',
    };
  }

  try {
    const stats = await getKnowledgeModule().stats({
      teamId: 1,
      runtimeType: project.blueprint.runtime.runtimeType,
      agentId: project.employeeId,
    });
    const rawCount = stats.document_count ?? stats.count ?? stats.total ?? stats.total_count;
    const count = typeof rawCount === 'number' ? rawCount : Number(rawCount || 0);
    return {
      id: 'preflight-knowledge',
      label: '资料来源预检',
      status: count > 0 ? 'passed' : 'pending',
      required: true,
      reason: count > 0
        ? `已检测到 ${count} 个知识/资料条目。`
        : '未检测到已导入资料；可先上线，正式运行前建议在知识库导入客户档案或资料样本。',
    };
  } catch {
    return {
      id: 'preflight-knowledge',
      label: '资料来源预检',
      status: 'pending',
      required: true,
      reason: '暂时无法读取知识库状态，请在知识库中心确认资料已导入。',
    };
  }
}

export function hasBlockingPreflight(project: BuilderProject): boolean {
  return project.blueprint.launchChecklist.some((item) => item.required && item.status === 'blocked');
}

export async function runBuilderPreflight(project: BuilderProject): Promise<BuilderProject> {
  const [channelChecks, knowledgeCheck] = await Promise.all([
    checkChannelReadiness(project),
    checkKnowledgeReadiness(project),
  ]);
  const launchChecklist = replaceChecklistItems(project.blueprint.launchChecklist, [
    ...channelChecks,
    knowledgeCheck,
  ]);

  return {
    ...project,
    updatedAt: new Date().toISOString(),
    blueprint: {
      ...project.blueprint,
      launchChecklist,
    },
  };
}

function shouldRefreshProject(project: BuilderProject): boolean {
  return Boolean(project.blueprint)
    && ['blueprint_ready', 'testing', 'ready_to_deploy', 'deployed'].includes(project.status);
}

export async function refreshBuilderPreflightProjects(): Promise<BuilderProject[]> {
  const projects = await loadBuilderProjects();
  const refreshableProjects = projects.filter(shouldRefreshProject);
  const refreshedProjects = await Promise.all(refreshableProjects.map((project) => runBuilderPreflight(project)));
  const refreshedById = new Map(refreshedProjects.map((project) => [project.id, project]));

  await Promise.all(refreshedProjects.map((project) => saveBuilderProject(project)));

  return projects.map((project) => refreshedById.get(project.id) ?? project);
}
