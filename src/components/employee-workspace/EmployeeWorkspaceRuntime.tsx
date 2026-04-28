import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, CheckCircle2, Clock, RefreshCw, ShieldCheck } from 'lucide-react';
import type { ActivationStatus, DigitalEmployee } from '../../types';
import { ChatFlow } from '../chat-engine';
import type { ChatMsg, ChatFlowConfig } from '../chat-engine/types';
import { nextMsgId } from '../chat-engine/types';
import { BoardPanel, WorkspaceShell } from '../workspace';
import { continueInterview } from '../../features/builder/interviewRules';
import { blueprintToEmployee } from '../../features/builder/mappers/blueprintToEmployee';
import { loadBuilderProjects, saveBuilderProject } from '../../features/builder/persistence';
import { recordBuilderAudit, requestEmployeeActionApproval } from '../../features/builder/governance';
import { syncBuilderProjectToAgent } from '../../features/builder/agentSync';
import type { BuilderProject } from '../../features/builder/types';
import { getApprovalModule, getConversationsModule } from '../../services/qeeclaw';

interface Props {
  employee: DigitalEmployee;
  onBack: () => void;
  onEmployeeUpdate?: (employee: DigitalEmployee) => void;
}

type WorkspaceAction = {
  key: string;
  label: string;
  approvalRequired: boolean;
  riskLevel: string;
};

type ActionApprovalState = {
  actionKey: string;
  actionLabel: string;
  approvalId: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
};

type RuntimeTaskItem = {
  id: string;
  title: string;
  status: string;
};

function localReply(employee: DigitalEmployee, text: string): string {
  const approval = employee.harness.find((item) => item.title.includes('人工确认'))?.content;
  const boundary = approval ? `\n\n需要人工确认的动作我会先放入确认区：\n${approval}` : '';
  return `已收到：${text}\n\n我会按“${employee.workspace.label}”的业务蓝图处理，先整理输入、识别风险点，再给出可确认的下一步。${boundary}`;
}

function isOptimizationRequest(text: string): boolean {
  return /优化|调整|修改|改成|改为|增加|新增|去掉|删除|规则|话术|日报|确认|审批/.test(text);
}

async function optimizeEmployeeProject(employee: DigitalEmployee, text: string): Promise<DigitalEmployee | null> {
  if (!employee.builder?.projectId) return null;
  const projects = await loadBuilderProjects();
  const project = projects.find((item) => item.id === employee.builder?.projectId);
  if (!project) return null;

  const result = continueInterview(project, text);
  const optimized: BuilderProject = {
    ...result.project,
    status: 'deployed',
    stage: 'optimize',
    employeeId: String(employee.id),
    updatedAt: new Date().toISOString(),
  };
  const syncedProject = await syncBuilderProjectToAgent(optimized);
  await saveBuilderProject(syncedProject);
  await recordBuilderAudit(syncedProject, 'optimized', `持续优化：${text.slice(0, 60)}`, 'low');
  return {
    ...blueprintToEmployee(syncedProject),
    status: 'active' as ActivationStatus,
  };
}

export default function EmployeeWorkspaceRuntime({ employee, onBack, onEmployeeUpdate }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [working, setWorking] = useState(false);
  const [approvalStates, setApprovalStates] = useState<ActionApprovalState[]>([]);
  const [refreshingApprovals, setRefreshingApprovals] = useState(false);
  const [runtimeTasks, setRuntimeTasks] = useState<RuntimeTaskItem[]>([]);
  const viewConfig = employee.builder?.viewConfig;
  const actions: WorkspaceAction[] = useMemo(() => (
    viewConfig?.rightActions?.length ? viewConfig.rightActions : [
      { key: 'draft', label: '生成草稿', approvalRequired: false, riskLevel: 'low' },
      { key: 'confirm', label: '提交人工确认', approvalRequired: true, riskLevel: 'medium' },
    ]
  ), [viewConfig]);

  const config: ChatFlowConfig = useMemo(() => ({
    employeeId: String(employee.id),
    employeeName: employee.name,
    employeeAvatar: employee.avatar,
    employeeColor: employee.color,
    accentColor: employee.accentColor || 'text-terracotta',
    greeting: employee.tagline,
    quickActions: [
      { label: '查看今天待处理事项', action: 'today' },
      { label: '生成一份处理建议', action: 'suggestion' },
      { label: '列出需要人工确认的内容', action: 'approval' },
      { label: '优化岗位规则', action: 'optimize' },
    ],
    placeholder: `交给${employee.name}处理...`,
  }), [employee]);

  const handleSend = useCallback((text: string) => {
    const userMsg: ChatMsg = { id: nextMsgId(), role: 'user', content: text, timestamp: Date.now() };
    const assistantMsg: ChatMsg = { id: nextMsgId(), role: 'assistant', content: '', timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setWorking(true);

    const finish = (content: string) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsg.id ? { ...msg, content } : msg,
        ),
      );
      setWorking(false);
    };

    if (employee.builder && isOptimizationRequest(text)) {
      void optimizeEmployeeProject(employee, text)
        .then((updatedEmployee) => {
          if (!updatedEmployee) {
            finish('没有找到对应的 Builder 项目，已按普通任务处理。\n\n' + localReply(employee, text));
            return;
          }
          onEmployeeUpdate?.(updatedEmployee);
          finish(`已生成新的岗位版本并保存。\n\n本次优化：${text}\n\n新的规则会用于后续工作台和员工档案。`);
        })
        .catch((error) => {
          finish(`岗位优化保存失败：${error instanceof Error ? error.message : String(error)}`);
        });
      return;
    }

    window.setTimeout(() => {
      finish(localReply(employee, text));
    }, 450);
  }, [employee, onEmployeeUpdate]);

  const boardTabs = [
    { key: 'tasks', label: viewConfig?.leftList?.title || '任务池', icon: <Activity size={12} /> },
    { key: 'approval', label: '确认区', icon: <ShieldCheck size={12} /> },
    { key: 'logs', label: viewConfig?.bottomLogs?.title || '运行记录', icon: <Clock size={12} /> },
  ];

  const appendAssistantMessage = useCallback((content: string) => {
    const assistantMsg: ChatMsg = { id: nextMsgId(), role: 'assistant', content, timestamp: Date.now() };
    setMessages((prev) => [...prev, assistantMsg]);
  }, []);

  const refreshApprovalStates = useCallback(async () => {
    if (!employee.builder?.projectId) return;
    setRefreshingApprovals(true);
    try {
      const result = await getApprovalModule().list({ scope: 'all', pageSize: 50 });
      const states = result.items
        .filter((item: { payload?: Record<string, unknown> }) =>
          item.payload?.projectId === employee.builder?.projectId && item.payload?.employeeId === employee.id,
        )
        .map((item: {
          approvalId: string;
          status: 'pending' | 'approved' | 'rejected' | 'expired';
          title: string;
          payload?: Record<string, unknown>;
        }) => ({
          actionKey: String(item.payload?.actionKey ?? item.approvalId),
          actionLabel: String(item.payload?.actionLabel ?? item.title),
          approvalId: item.approvalId,
          status: item.status,
        }));
      setApprovalStates(states);
    } catch {
      /* local bridge may be offline */
    } finally {
      setRefreshingApprovals(false);
    }
  }, [employee.builder?.projectId, employee.id]);

  useEffect(() => {
    void refreshApprovalStates();
    const timer = window.setInterval(() => void refreshApprovalStates(), 8000);
    return () => window.clearInterval(timer);
  }, [refreshApprovalStates]);

  useEffect(() => {
    let cancelled = false;
    void getConversationsModule().listHistory({
      teamId: 1,
      limit: 10,
    })
      .then((history: { id?: string | number; content?: string; createdAt?: string; direction?: string }[]) => {
        if (cancelled) return;
        setRuntimeTasks(history.slice(0, 3).map((item, index) => ({
          id: String(item.id ?? index),
          title: item.content ? item.content.slice(0, 32) : `会话记录 ${index + 1}`,
          status: item.direction === 'agent_to_user' ? '已回复' : '待处理',
        })));
      })
      .catch(() => {
        if (!cancelled) setRuntimeTasks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [employee.id]);

  const handleActionClick = useCallback((action: WorkspaceAction) => {
    const current = approvalStates.find((item) => item.actionKey === action.key);
    if (current?.status === 'pending') {
      appendAssistantMessage(`动作正在等待人工确认：${action.label}\n\n审批编号：${current.approvalId}`);
      return;
    }
    if (current?.status === 'approved') {
      appendAssistantMessage(`已执行：${action.label}\n\n该动作已通过人工确认。`);
      return;
    }
    if (current?.status === 'rejected') {
      appendAssistantMessage(`动作已被拒绝：${action.label}\n\n请调整内容后重新提交。`);
      return;
    }

    if (!action.approvalRequired) {
      appendAssistantMessage(`已执行：${action.label}\n\n该动作不需要人工确认，结果会写入运行记录。`);
      return;
    }

    void requestEmployeeActionApproval(employee, action)
      .then((approvalId) => {
        if (approvalId) {
          setApprovalStates((prev) => [
            {
              actionKey: action.key,
              actionLabel: action.label,
              approvalId,
              status: 'pending',
            },
            ...prev.filter((item) => item.actionKey !== action.key),
          ]);
        }
        appendAssistantMessage(
          approvalId
            ? `已提交人工确认：${action.label}\n\n审批编号：${approvalId}`
            : `提交人工确认失败：${action.label}\n\n请确认本地 bridge 已启动。`,
        );
      });
  }, [appendAssistantMessage, approvalStates, employee]);

  function getActionState(actionKey: string): ActionApprovalState | undefined {
    return approvalStates.find((item) => item.actionKey === actionKey);
  }

  function actionStateLabel(state?: ActionApprovalState): string {
    if (!state) return '需确认';
    if (state.status === 'approved') return '已确认';
    if (state.status === 'rejected') return '已拒绝';
    if (state.status === 'expired') return '已过期';
    return '待审批';
  }

  const boardContent = (
    <BoardPanel>
      <div className="space-y-4">
        <div>
          <h2 className="font-serif text-base font-semibold text-near-black">{viewConfig?.title || employee.workspace.label}</h2>
          <p className="mt-1 text-xs text-stone-gray">{viewConfig?.subtitle || employee.workspace.description}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(viewConfig?.kpis?.length ? viewConfig.kpis : [
            { key: 'pending', label: '待处理', value: '0' },
            { key: 'approval', label: '待确认', value: '0' },
            { key: 'done', label: '已完成', value: '0' },
          ]).map((kpi) => (
            <div key={kpi.key} className="rounded-lg border border-border-cream bg-ivory/80 p-3">
              <p className="text-[11px] text-stone-gray">{kpi.label}</p>
              <p className="mt-1 text-lg font-semibold text-near-black">{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[1fr_1.2fr] gap-3">
          <section className="rounded-lg border border-border-cream bg-ivory/70 p-3">
            <h3 className="text-xs font-semibold text-near-black">{viewConfig?.leftList?.title || '待处理列表'}</h3>
            <div className="mt-3 space-y-2">
              {runtimeTasks.length > 0 ? runtimeTasks.map((item) => (
                <div key={item.id} className="rounded-md bg-warm-sand/40 p-2">
                  <p className="text-xs font-medium text-near-black">{item.title}</p>
                  <p className="mt-0.5 text-[11px] text-stone-gray">{item.status}</p>
                </div>
              )) : (
                <div className="rounded-md border border-dashed border-border-cream bg-parchment/50 p-3 text-[11px] text-stone-gray">
                  暂无来自会话 API 的待处理事项
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-border-cream bg-ivory/70 p-3">
            <h3 className="text-xs font-semibold text-near-black">业务详情</h3>
            <div className="mt-3 space-y-3">
              {(viewConfig?.mainPanel?.length ? viewConfig.mainPanel : employee.harness.slice(0, 3)).map((panel) => (
                <div key={'key' in panel ? panel.key : panel.title} className="rounded-md bg-parchment/70 p-2">
                  <p className="text-xs font-medium text-near-black">{panel.title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-stone-gray">
                    {'fields' in panel ? panel.fields.join('、') : panel.content}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-lg border border-border-cream bg-ivory/70 p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold text-near-black">可执行动作</h3>
            <button
              onClick={() => void refreshApprovalStates()}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-stone-gray hover:bg-warm-sand/50 hover:text-terracotta"
            >
              <RefreshCw size={12} className={refreshingApprovals ? 'animate-spin' : ''} />
              刷新审批
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.map((action) => {
              const state = getActionState(action.key);
              const isPending = state?.status === 'pending';
              const isApproved = state?.status === 'approved';
              const isRejected = state?.status === 'rejected';
              return (
                <button
                  key={action.key}
                  onClick={() => handleActionClick(action)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors ${
                    isApproved
                      ? 'border-success-green/30 bg-success-green/8 text-success-green'
                      : isRejected
                        ? 'border-red-400/30 bg-red-500/8 text-red-500'
                        : isPending
                          ? 'border-amber-400/40 bg-amber-500/8 text-amber-700'
                          : 'border-border-warm text-olive-gray hover:border-terracotta/30 hover:text-terracotta'
                  }`}
                >
                  <CheckCircle2 size={13} />
                  {action.label}
                  {action.approvalRequired && (
                    <span className="rounded bg-terracotta/10 px-1.5 py-0.5 text-[10px] text-terracotta">
                      {actionStateLabel(state)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {approvalStates.length > 0 && (
            <div className="mt-3 space-y-2">
              {approvalStates.slice(0, 4).map((item) => (
                <div key={item.approvalId} className="rounded-md bg-parchment/70 px-2.5 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-medium text-near-black">{item.actionLabel}</p>
                    <span className="text-[10px] text-stone-gray">{actionStateLabel(item)}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-stone-gray">审批编号：{item.approvalId}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </BoardPanel>
  );

  return (
    <WorkspaceShell
      employeeName={employee.name}
      employeeAvatar={employee.avatar}
      employeeColor={employee.color}
      onBack={onBack}
      chatPanel={(
        <ChatFlow
          config={config}
          messages={messages}
          onSend={handleSend}
          isStreaming={working}
        />
      )}
      boardPanel={boardContent}
      boardTabs={boardTabs}
      activeBoardTab="tasks"
    />
  );
}
