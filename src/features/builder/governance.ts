import type { DigitalEmployee } from '../../types';
import { getApprovalModule, getAuditModule } from '../../services/qeeclaw';
import type { BuilderProject } from './types';

type BuilderAuditAction = 'draft_saved' | 'test_passed' | 'deployed' | 'optimized' | 'approval_requested' | 'rolled_back' | 'agent_synced';
type EmployeeActionApprovalInput = {
  key: string;
  label: string;
  approvalRequired: boolean;
  riskLevel: string;
};

function projectPath(projectId: string): string {
  return `/builder/projects/${projectId}`;
}

export async function recordBuilderAudit(
  project: BuilderProject,
  action: BuilderAuditAction,
  summary: string,
  riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low',
): Promise<void> {
  try {
    await getAuditModule().record({
      actionType: `builder.${action}`,
      title: `${project.blueprint.name} ${summary}`,
      module: 'Builder',
      path: projectPath(project.id),
      params: JSON.stringify({
        projectId: project.id,
        employeeId: project.employeeId,
        status: project.status,
        stage: project.stage,
        roleType: project.blueprint.roleType,
      }),
      summary,
      status: 'completed',
      riskLevel,
      metadata: {
        projectId: project.id,
        employeeId: project.employeeId,
        roleType: project.blueprint.roleType,
      },
    });
  } catch {
    /* audit is best-effort on local bridge */
  }
}

export async function createBuilderLaunchApprovals(project: BuilderProject): Promise<string[]> {
  const requiredPolicies = project.blueprint.approvalPolicies.filter((policy) => policy.required);
  const requiredTools = project.blueprint.toolPermissions.filter((tool) => tool.approvalRequired);
  const approvalIds: string[] = [];

  for (const policy of requiredPolicies) {
    try {
      const approval = await getApprovalModule().request({
        approvalType: 'exec_access',
        title: `${project.blueprint.name}：${policy.action}`,
        reason: policy.reason,
        riskLevel: 'medium',
        payload: {
          projectId: project.id,
          employeeId: project.employeeId,
          approverRole: policy.approverRole,
          action: policy.action,
        },
        expiresInSeconds: 7 * 24 * 3600,
      });
      approvalIds.push(approval.approvalId);
    } catch {
      /* approval is best-effort on local bridge */
    }
  }

  for (const tool of requiredTools) {
    try {
      const approval = await getApprovalModule().request({
        approvalType: 'tool_access',
        title: `${project.blueprint.name}：启用${tool.label}`,
        reason: tool.description,
        riskLevel: tool.riskLevel === 'high' ? 'high' : 'medium',
        payload: {
          projectId: project.id,
          employeeId: project.employeeId,
          toolId: tool.id,
          toolCategory: tool.category,
        },
        expiresInSeconds: 7 * 24 * 3600,
      });
      approvalIds.push(approval.approvalId);
    } catch {
      /* approval is best-effort on local bridge */
    }
  }

  if (approvalIds.length > 0) {
    await recordBuilderAudit(project, 'approval_requested', `创建 ${approvalIds.length} 个上线审批`, 'medium');
  }

  return approvalIds;
}

export async function requestEmployeeActionApproval(employee: DigitalEmployee, action: EmployeeActionApprovalInput): Promise<string | null> {
  if (!employee.builder?.projectId) return null;
  const normalizedRisk = action.riskLevel === 'high' ? 'high' : action.riskLevel === 'medium' ? 'medium' : 'low';

  try {
    const approval = await getApprovalModule().request({
      approvalType: normalizedRisk === 'high' ? 'exec_access' : 'custom',
      title: `${employee.name}：${action.label}`,
      reason: action.approvalRequired ? '该动作由 Builder 标记为需要人工确认' : '用户主动提交确认',
      riskLevel: normalizedRisk,
      payload: {
        projectId: employee.builder.projectId,
        employeeId: employee.id,
        actionKey: action.key,
        actionLabel: action.label,
      },
      expiresInSeconds: 24 * 3600,
    });

    try {
      await getAuditModule().record({
        actionType: 'builder.employee_action_approval_requested',
        title: `${employee.name} 提交动作确认：${action.label}`,
        module: 'Builder',
        path: `/employees/${employee.id}/workspace`,
        params: JSON.stringify({
          projectId: employee.builder.projectId,
          employeeId: employee.id,
          actionKey: action.key,
          approvalId: approval.approvalId,
        }),
        summary: `动作“${action.label}”已进入人工确认队列`,
        riskLevel: normalizedRisk,
        status: 'pending',
        metadata: {
          projectId: employee.builder.projectId,
          employeeId: employee.id,
          actionKey: action.key,
          approvalId: approval.approvalId,
        },
      });
    } catch {
      /* audit is best-effort */
    }

    return approval.approvalId;
  } catch {
    return null;
  }
}
