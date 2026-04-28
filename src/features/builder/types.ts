import type { DigitalEmployee } from '../../types';

export type BuilderStage = 'idea' | 'interview' | 'blueprint' | 'test' | 'launch' | 'optimize';

export type BuilderProjectStatus =
  | 'draft'
  | 'interviewing'
  | 'blueprint_ready'
  | 'testing'
  | 'ready_to_deploy'
  | 'deployed';

export type BuilderRoleType =
  | 'document_clerk'
  | 'collection_assistant'
  | 'daily_reporter'
  | 'invoice_reviewer'
  | string;

export interface EmployeeInputSource {
  id: string;
  label: string;
  type: 'im' | 'local_folder' | 'knowledge_base' | 'spreadsheet' | 'manual' | 'system';
  required: boolean;
  description: string;
}

export interface EmployeeWorkflowStep {
  id: string;
  label: string;
  description: string;
  trigger?: string;
  requiresApproval?: boolean;
}

export interface EmployeeToolPermission {
  id: string;
  label: string;
  category: 'data' | 'communication' | 'analysis' | 'finance' | 'generation';
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
  approvalRequired: boolean;
}

export interface HumanApprovalPolicy {
  id: string;
  action: string;
  approverRole: string;
  reason: string;
  required: boolean;
}

export interface CommunicationStyle {
  tone: string;
  forbiddenWords?: string[];
  notes?: string;
}

export interface ExceptionPolicy {
  id: string;
  condition: string;
  handling: string;
  escalation?: string;
}

export interface AcceptanceCriterion {
  id: string;
  metric: string;
  target: string;
  description: string;
}

export interface LaunchChecklistItem {
  id: string;
  label: string;
  status: 'pending' | 'passed' | 'blocked';
  required: boolean;
  reason?: string;
}

export interface EmployeeRoleBlueprint {
  name: string;
  roleType: BuilderRoleType;
  goal: string;
  serviceTarget: string[];
  responsibilities: string[];
  inputSources: EmployeeInputSource[];
  workflow: EmployeeWorkflowStep[];
  toolPermissions: EmployeeToolPermission[];
  approvalPolicies: HumanApprovalPolicy[];
  communicationStyle?: CommunicationStyle;
  exceptionPolicies: ExceptionPolicy[];
  acceptanceCriteria: AcceptanceCriterion[];
  launchChecklist: LaunchChecklistItem[];
  runtime: {
    model: string;
    runtimeType: 'hermes' | 'openclaw';
    knowledgeScopes: string[];
    memoryScopes: string[];
  };
}

export interface ViewKpiConfig {
  key: string;
  label: string;
  value: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}

export interface ViewListConfig {
  title: string;
  filters: string[];
  primaryField: string;
  secondaryField: string;
}

export interface ViewPanelConfig {
  key: string;
  title: string;
  fields: string[];
}

export interface ViewActionConfig {
  key: string;
  label: string;
  approvalRequired: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ViewLogConfig {
  title: string;
  fields: string[];
}

export interface ViewHighlightRule {
  key: string;
  condition: string;
  tone: 'warning' | 'danger' | 'success';
}

export interface EmployeeViewConfig {
  template: 'document_processing' | 'task_followup' | 'report_analysis' | string;
  title: string;
  subtitle: string;
  kpis: ViewKpiConfig[];
  leftList: ViewListConfig;
  mainPanel: ViewPanelConfig[];
  rightActions: ViewActionConfig[];
  bottomLogs: ViewLogConfig;
  highlightRules: ViewHighlightRule[];
}

export interface BuilderSample {
  id: string;
  label: string;
  description: string;
}

export interface AcceptanceResult {
  criterionId: string;
  passed: boolean;
  note: string;
}

export interface BuilderTestRun {
  id: string;
  projectId: string;
  status: 'queued' | 'running' | 'passed' | 'failed' | 'needs_review';
  sampleSet: BuilderSample[];
  inputSummary: string;
  outputPreview: {
    title: string;
    lines: string[];
  };
  approvalPoints: string[];
  risks: string[];
  acceptanceResults: AcceptanceResult[];
  createdAt: string;
}

export interface BuilderDeployedAgent {
  id: number;
  code: string;
  runtimeType?: string | null;
  syncedAt?: string;
  lastSyncError?: string;
}

export interface EmployeeVersion {
  id: string;
  version: string;
  summary: string;
  createdAt: string;
  snapshot?: {
    blueprint: EmployeeRoleBlueprint;
    viewConfig?: EmployeeViewConfig;
  };
}

export interface BuilderProject {
  id: string;
  status: BuilderProjectStatus;
  stage: BuilderStage;
  industry: 'tax' | 'generic';
  createdAt: string;
  updatedAt: string;
  source: 'from_template' | 'from_prompt' | 'optimize_existing';
  employeeId?: string;
  deployedAgent?: BuilderDeployedAgent;
  blueprint: EmployeeRoleBlueprint;
  viewConfig?: EmployeeViewConfig;
  versions: EmployeeVersion[];
  testRuns: BuilderTestRun[];
}

export interface EmployeeTemplate {
  id: BuilderRoleType;
  name: string;
  shortName: string;
  description: string;
  promptHints: string[];
  blueprint: EmployeeRoleBlueprint;
  viewConfig: EmployeeViewConfig;
}

export interface BuilderCompletion {
  employee: DigitalEmployee;
  project: BuilderProject;
}
