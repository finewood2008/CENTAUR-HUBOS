import type { BuilderProject, EmployeeTemplate } from './types';

export function createBuilderProjectFromTemplate(template: EmployeeTemplate, sourceText = ''): BuilderProject {
  const now = new Date().toISOString();
  const projectId = `builder_${Date.now().toString(36)}`;
  const blueprint = {
    ...template.blueprint,
    goal: sourceText.trim() || template.blueprint.goal,
  };
  return {
    id: projectId,
    status: 'interviewing',
    stage: 'interview',
    industry: 'tax',
    createdAt: now,
    updatedAt: now,
    source: sourceText ? 'from_prompt' : 'from_template',
    blueprint,
    viewConfig: template.viewConfig,
    versions: [
      {
        id: `${projectId}_v1`,
        version: 'v0.1',
        summary: `基于${template.name}模板生成初始岗位蓝图`,
        createdAt: now,
        snapshot: {
          blueprint,
          viewConfig: template.viewConfig,
        },
      },
    ],
    testRuns: [],
  };
}
