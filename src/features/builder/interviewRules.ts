import type { BuilderProject, BuilderStage } from './types';
import { createBuilderProjectFromTemplate } from './blueprint-defaults';
import { detectTaxTemplate } from './templates/tax';

export interface InterviewTurnResult {
  project: BuilderProject;
  assistantText: string;
}

function uniqueAppend(values: string[], next: string): string[] {
  return values.includes(next) ? values : [...values, next];
}

function patchProject(project: BuilderProject, patch: Partial<BuilderProject>): BuilderProject {
  return {
    ...project,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}

function updateFromText(project: BuilderProject, text: string): BuilderProject {
  let next = project;
  const blueprint = { ...next.blueprint };
  const normalized = text.toLowerCase();

  if (/老板|管理层|总经理|负责人/.test(text)) {
    blueprint.serviceTarget = uniqueAppend(blueprint.serviceTarget, '老板');
  }
  if (/主管|经理/.test(text)) {
    blueprint.serviceTarget = uniqueAppend(blueprint.serviceTarget, '主管');
  }
  if (/会计|财务/.test(text)) {
    blueprint.serviceTarget = uniqueAppend(blueprint.serviceTarget, '会计');
  }
  if (/飞书/.test(text)) {
    blueprint.inputSources = blueprint.inputSources.map((source) =>
      source.id === 'im-channel' || source.id === 'im-files'
        ? { ...source, label: source.label.includes('飞书') ? source.label : `${source.label}（含飞书）` }
        : source,
    );
  }
  if (/企微|企业微信|微信/.test(text)) {
    blueprint.inputSources = blueprint.inputSources.map((source) =>
      source.id === 'im-channel' || source.id === 'im-files'
        ? { ...source, label: source.label.includes('企业微信') ? source.label : `${source.label}（含企业微信）` }
        : source,
    );
  }
  if (/确认|审批|人工/.test(text)) {
    blueprint.approvalPolicies = blueprint.approvalPolicies.map((policy) => ({ ...policy, required: true }));
  }
  if (/温和|客气|柔和/.test(text)) {
    blueprint.communicationStyle = {
      ...(blueprint.communicationStyle ?? { tone: '' }),
      tone: '专业、温和、客气',
    };
  }
  if (/强硬|强提醒|明确/.test(text)) {
    blueprint.communicationStyle = {
      ...(blueprint.communicationStyle ?? { tone: '' }),
      tone: '专业、明确、带有强提醒',
    };
  }
  if (/2天|两天/.test(text)) {
    blueprint.exceptionPolicies = blueprint.exceptionPolicies.map((item) =>
      item.id === 'no-reply'
        ? { ...item, condition: '客户 2 天未回复', escalation: item.escalation || '提醒主管' }
        : item,
    );
  }
  if (/3天|三天/.test(text)) {
    blueprint.exceptionPolicies = blueprint.exceptionPolicies.map((item) =>
      item.id === 'no-reply'
        ? { ...item, condition: '客户 3 天未回复', escalation: item.escalation || '提醒主管' }
        : item,
    );
  }
  if (normalized.includes('每天') || normalized.includes('日报')) {
    blueprint.workflow = blueprint.workflow.map((step) =>
      step.id === 'collect' || step.id === 'check'
        ? { ...step, trigger: '每天固定时间执行' }
        : step,
    );
  }

  next = patchProject(next, { blueprint });
  return next;
}

function nextQuestion(project: BuilderProject): string {
  const roleType = project.blueprint.roleType;
  if (project.stage === 'interview') {
    if (roleType === 'collection_assistant') {
      return '我先按“客户催收员”生成了岗位草案。请确认 3 件事：服务对象是会计还是主管？主要走企业微信还是飞书？客户消息发送前是否必须人工确认？';
    }
    if (roleType === 'document_clerk') {
      return '我先按“资料整理员”生成了岗位草案。请确认 3 件事：资料主要来自本地文件夹还是 IM？正式归档前谁确认？哪些资料类型必须人工确认？';
    }
    return '我先按“老板日报员”生成了岗位草案。请确认 3 件事：日报给谁看？每天几点生成？发送前是否需要主管确认？';
  }
  if (project.stage === 'blueprint') {
    return '蓝图已经形成。你可以继续补充规则，例如“重点客户语气温和一点”“2 天未回复提醒主管”。确认后可以运行样本测试。';
  }
  if (project.stage === 'test') {
    return '测试样本已准备好。请先运行测试，确认输出、风险和人工确认点符合预期后再上线。';
  }
  return '这个员工已经可以上线。上线后仍可以从员工详情页继续优化。';
}

export function startInterview(text: string): InterviewTurnResult {
  const template = detectTaxTemplate(text);
  const project = createBuilderProjectFromTemplate(template, text);
  return {
    project,
    assistantText: nextQuestion(project),
  };
}

export function continueInterview(project: BuilderProject, text: string): InterviewTurnResult {
  const updated = updateFromText(project, text);
  const doneTurns = updated.versions.length;
  const nextStage: BuilderStage = doneTurns >= 2 ? 'blueprint' : 'interview';
  const nextProject = patchProject(updated, {
    stage: nextStage,
    status: nextStage === 'blueprint' ? 'blueprint_ready' : 'interviewing',
    versions: [
      ...updated.versions,
      {
        id: `${updated.id}_v${updated.versions.length + 1}`,
        version: `v0.${updated.versions.length + 1}`,
        summary: `根据访谈补充规则：${text.slice(0, 40)}`,
        createdAt: new Date().toISOString(),
        snapshot: {
          blueprint: updated.blueprint,
          viewConfig: updated.viewConfig,
        },
      },
    ],
  });

  return {
    project: nextProject,
    assistantText: nextQuestion(nextProject),
  };
}
