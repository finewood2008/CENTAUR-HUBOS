// Hub OS - Cockpit 数据加载与会话管理
import { useState, useEffect, useCallback, useRef } from 'react';
import { getClientAsync } from '../services/qeeclaw';
import type { ChatMessage, ReportItem, InputFile, Task, ScheduledTask, PartnerProfile, MessageSender, TeamMember } from '../data/partner';
import { DEFAULT_PARTNER } from '../data/partner';

type QeeClawClient = Awaited<ReturnType<typeof getClientAsync>>;
type WorkflowLike = {
  id: string;
  name?: string;
  description?: string | null;
  enabled?: boolean;
  nodes?: unknown[];
  edges?: unknown[];
};

interface CockpitData {
  partner: PartnerProfile;
  messages: ChatMessage[];
  tasks: Task[]; // To be mapped from approval module
  scheduledTasks: ScheduledTask[]; // Future: workflow module
  reports: ReportItem[];
  sessionId: string | null;
}

function makeCockpitStatusMessages(isConnected: boolean): ChatMessage[] {
  const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  if (!isConnected) {
    return [{
      id: 'cockpit-offline',
      sender: { type: 'system' },
      content: '当前未连接到本地合伙人运行时，驾驶舱只显示本地状态。',
      time,
    }];
  }
  return [{
    id: 'cockpit-ready',
    sender: { type: 'system' },
    content: '本地合伙人会话已就绪。先输入你希望如何称呼你的数字合伙人，再开始对话。',
    time,
  }];
}

function emitToast(type: 'success' | 'error' | 'info', message: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('hubos:toast', { detail: { type, message } }));
}

function workflowToScheduledTask(workflow: WorkflowLike): ScheduledTask {
  return {
    id: workflow.id,
    title: workflow.name || workflow.id,
    description: workflow.description || undefined,
    schedule: {
      type: 'cron',
      time: '--:--',
      cronExpr: '由工作流后端管理',
    },
    action: workflow.description || workflow.name || workflow.id,
    enabled: workflow.enabled !== false,
    createdAt: '',
  };
}

export function useCockpit(isConnected: boolean) {
  const [data, setData] = useState<CockpitData>({
    partner: { ...DEFAULT_PARTNER, name: '', isConfigured: false },
    messages: makeCockpitStatusMessages(isConnected),
    tasks: [],
    scheduledTasks: [],
    reports: [],
    sessionId: null,
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const sessionInitialized = useRef(false);

  useEffect(() => {
    if (!sessionInitialized.current) {
      setData(prev => ({ ...prev, messages: makeCockpitStatusMessages(isConnected) }));
    }
  }, [isConnected]);

  const createCockpitSession = useCallback(async (agentProfile = 'default') => {
    const response = await fetch(`${window.location.origin}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'hubos-cockpit',
        agent_profile: agentProfile,
      }),
    });

    if (!response.ok) {
      throw new Error('Create cockpit session failed');
    }

    const session = await response.json() as { session_id?: string | null };
    if (!session.session_id) {
      throw new Error('Cockpit session id missing');
    }

    return session.session_id;
  }, []);

  // 辅助函数：修改内部数据
  const updateData = useCallback((updates: Partial<CockpitData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const handlePartnerNameChange = useCallback((name: string) => {
    updateData({ partner: { ...data.partner, name } });
  }, [data.partner, updateData]);

  // 加载调度任务
  const loadSchedule = useCallback(async () => {
    try {
      const client = await getClientAsync();
      const workflows = await client.workflow.list();
      setData(prev => ({
        ...prev,
        scheduledTasks: Array.isArray(workflows)
          ? (workflows as WorkflowLike[]).map(workflowToScheduledTask)
          : [],
      }));
    } catch (e) {
      console.error('[Cockpit] 加载调度任务失败:', e);
      setData(prev => ({ ...prev, scheduledTasks: [] }));
      emitToast('error', '加载工作流日程失败');
    }
  }, []);

  // 加载审批/汇报数据
  const loadApprovals = useCallback(async () => {
    if (!isConnected) return;
    try {
      const client = await getClientAsync();
      const remoteApprovals = await client.approval.list({ scope: 'all', status: 'pending', pageSize: 20 });
      updateData({
        tasks: remoteApprovals.items.map((approval: {
          approvalId: string;
          title: string;
          createdAt: string;
          reason?: string;
          payload?: Record<string, unknown>;
        }) => ({
          id: approval.approvalId,
          title: approval.title,
          assignee: 'leader',
          assigneeName: String(approval.payload?.employeeId ?? '待审批'),
          assigneeAvatar: '📋',
          status: 'review',
          progress: 0,
          createdAt: approval.createdAt,
          description: approval.reason,
        })),
      });
    } catch (err) {
      console.error('[Cockpit] 加载汇报/审批失败:', err);
      updateData({ tasks: [] });
    }
  }, [isConnected, updateData]);

  // 审批任务操作
  const approveTask = useCallback((taskId: string) => {
    const task = data.tasks.find(t => t.id === taskId);
    void getClientAsync()
      .then((client) => client.approval.resolve(taskId, { approved: true }))
      .then(() => {
        setData(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => (t.id === taskId ? { ...t, status: 'completed', progress: 100 } : t))
        }));
        if (task) appendSystemMessage(`已批准：${task.assigneeName}的「${task.title}」`);
        emitToast('success', '审批已通过');
      })
      .catch((err) => {
        console.error('[Cockpit] 审批通过失败:', err);
        emitToast('error', `审批通过失败：${err instanceof Error ? err.message : '未知错误'}`);
      });
  }, [data.tasks]);

  const rejectTask = useCallback((taskId: string) => {
    const task = data.tasks.find(t => t.id === taskId);
    void getClientAsync()
      .then((client) => client.approval.resolve(taskId, { approved: false }))
      .then(() => {
        setData(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => (t.id === taskId ? { ...t, status: 'pending' } : t))
        }));
        if (task) appendSystemMessage(`已驳回：${task.assigneeName}的「${task.title}」，已退回修改`);
        emitToast('success', '审批已驳回');
      })
      .catch((err) => {
        console.error('[Cockpit] 审批驳回失败:', err);
        emitToast('error', `审批驳回失败：${err instanceof Error ? err.message : '未知错误'}`);
      });
  }, [data.tasks]);

  // 修改预设调度操作
  const toggleSchedule = useCallback((id: string, enabled: boolean) => {
    void getClientAsync()
      .then(async (client) => {
        const workflows = await client.workflow.list();
        const workflow = (workflows as WorkflowLike[]).find((item) => item.id === id);
        if (!workflow) throw new Error('未找到对应工作流');
        await client.workflow.save({
          id: workflow.id,
          name: workflow.name || workflow.id,
          description: workflow.description || null,
          nodes: Array.isArray(workflow.nodes) ? workflow.nodes as any : [],
          edges: Array.isArray(workflow.edges) ? workflow.edges as any : [],
          enabled,
        });
        setData(prev => ({
          ...prev,
          scheduledTasks: prev.scheduledTasks.map(t => (t.id === id ? { ...t, enabled } : t))
        }));
        emitToast('success', enabled ? '日程已启用' : '日程已停用');
      })
      .catch((err) => {
        emitToast('error', `更新日程失败：${err instanceof Error ? err.message : '未知错误'}`);
      });
  }, []);

  const deleteSchedule = useCallback((id: string) => {
    void id;
    emitToast('info', '当前 SDK 尚未提供删除工作流接口，请在工作流管理端删除');
  }, []);

  const appendSystemMessage = (content: string) => {
    const sysMsg: ChatMessage = {
      id: `sys-${Date.now()}`,
      sender: { type: 'system' },
      content,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };
    setData(prev => ({ ...prev, messages: [...prev.messages, sysMsg] }));
  };

  // 初始化会话并生成早报
  const initializeSession = useCallback(async () => {
    if (!isConnected || sessionInitialized.current) return;
    setLoading(true);
    try {
      const client = await getClientAsync();
      const sessionId = await createCockpitSession();
      // 并行加载任务和调度
      await Promise.all([loadApprovals(), loadSchedule()]);

      // 仅在已配置合伙人名称时加载早报
      if (data.partner.isConfigured) {
        const morningBriefing = await generateMorningBriefing(client);
        setData(prev => ({
          ...prev,
          messages: morningBriefing,
          reports: [],
          sessionId,
        }));
      } else {
         setData(prev => ({
          ...prev,
          messages: prev.messages.length > 0 ? prev.messages : makeCockpitStatusMessages(true),
          sessionId,
        }));
      }
      sessionInitialized.current = true;
    } catch (err) {
      console.error('[Cockpit] 初始化失败:', err);
      // Fallback
      setData(prev => ({
        ...prev,
        messages: makeCockpitStatusMessages(false),
        reports: [],
        sessionId: null,
      }));
    } finally {
      setLoading(false);
    }
  }, [isConnected, loadApprovals, loadSchedule, data.partner.isConfigured, createCockpitSession]);

  // 发送消息
  const sendMessage = useCallback(async (text: string, files?: InputFile[], voiceBlob?: { blob: Blob; duration: number }) => {
    if (!isConnected || !data.sessionId || sending) return;

    // ── 处理入职态 (Onboarding) ──
    if (!data.partner.isConfigured) {
      const partnerName = text.trim() || '合伙人';
      const userMsg: ChatMessage = {
         id: `user-${Date.now()}`,
         sender: { type: 'user' },
         content: partnerName,
         time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      };
      setData(prev => ({
        ...prev,
        partner: { ...prev.partner, name: partnerName, isConfigured: true },
        messages: [...prev.messages, userMsg]
      }));

      appendSystemMessage(`好的，你的主管名字设为「${partnerName}」`);

      // 渲染早报
      setTimeout(async () => {
        const client = await getClientAsync();
        const briefing = await generateMorningBriefing(client);
        setData(prev => ({ ...prev, messages: [...prev.messages, ...briefing] }));
      }, 800);
      return;
    }

    if ((files && files.length > 0) || voiceBlob) {
      appendSystemMessage('当前 SDK 尚未提供驾驶舱附件/语音上传接口，请先发送纯文本消息。');
      emitToast('info', '附件和语音上传尚未接入 SDK');
      return;
    }

    // ── 普通消息态 ──

    // 1. 构建前台用户消息 UI
    let displayContent = text;
    if (voiceBlob) {
       displayContent = text + ` [语音消息 ${Math.floor(voiceBlob.duration / 60)}:${(voiceBlob.duration % 60).toString().padStart(2, '0')}]`;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: { type: 'user' },
      content: displayContent,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };

    setData(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg],
    }));

    setSending(true);

    try {
      // 创建 AI 消息占位符
      const aiMsgId = `ai-${Date.now()}`;
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        sender: { type: 'partner' },
        content: '',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      };

      setData(prev => ({
        ...prev,
        messages: [...prev.messages, aiMsg],
      }));

      try {
        const client = await getClientAsync();
        const now = new Date();
        const currentDateContext = `当前系统时间是 ${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月${String(now.getDate()).padStart(2, '0')}日 ${now.toLocaleDateString('zh-CN', { weekday: 'long' })}。回答涉及今天、当前日期、星期几、现在时间等问题时，必须以这个时间为准，不要使用训练数据中的过期日期。`;
        const prompt = `${currentDateContext}\n\n用户消息：${displayContent}`;
        const result = await client.models.invoke({ prompt });
        const replyText = result.text || '本地模型 API 未返回文本。';

        setData(prev => ({
          ...prev,
          messages: prev.messages.map(m =>
            m.id === aiMsgId
              ? { ...m, content: replyText }
              : m
          ),
        }));
      } catch (apiErr) {
        const errorMessage = apiErr instanceof Error ? apiErr.message : '未知错误';
        setData(prev => ({
          ...prev,
          messages: prev.messages.map(m =>
            m.id === aiMsgId
              ? { ...m, content: `抱歉，处理您的消息时出错了：${errorMessage}` }
              : m
          ),
        }));
      }
    } catch (err) {
      console.error('[Cockpit] 发送消息失败:', err);
      // 添加错误消息
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: { type: 'system' },
        content: isConnected ? '当前本地合伙人运行时未返回响应，请检查 bridge 与模型配置。' : '当前未连接到本地合伙人运行时。',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      };
      setData(prev => ({
        ...prev,
        messages: [...prev.messages, errorMsg],
      }));
    } finally {
      setSending(false);
    }
  }, [isConnected, data.sessionId, sending, data.partner.isConfigured]);

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  return {
    data,
    loading,
    sending,
    sendMessage,
    loadApprovals,
    loadSchedule,
    handlePartnerNameChange,
    approveTask,
    rejectTask,
    toggleSchedule,
    deleteSchedule
  };
}

// 生成早报消息
async function generateMorningBriefing(client: QeeClawClient): Promise<ChatMessage[]> {
  const messages: ChatMessage[] = [];
  const now = new Date();
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  // 问候消息
  const hour = now.getHours();
  let greeting = '早上好';
  if (hour >= 12 && hour < 14) greeting = '中午好';
  else if (hour >= 14 && hour < 18) greeting = '下午好';
  else if (hour >= 18) greeting = '晚上好';

  messages.push({
    id: `partner-greeting`,
    sender: { type: 'partner' },
    content: `${greeting}！我是阿拓，你的数字合伙人。`,
    time: timeStr,
  });

  try {
    // 获取 agents 数据
    const agents = await client.agent.listMyAgents().catch(() => []);

    if (agents.length > 0) {
      messages.push({
        id: `partner-team`,
        sender: { type: 'partner' },
        content: `目前团队有 ${agents.length} 位员工在线，随时可以为你服务。`,
        time: timeStr,
      });
    }

    // 获取钱包数据
    const wallet = await client.billing.getWallet().catch(() => null);

    if (wallet) {
      messages.push({
        id: `partner-wallet`,
        sender: { type: 'partner' },
        content: `账户余额 ${wallet.balance} ${wallet.currency}，本月已使用 ${wallet.currentMonthSpent} ${wallet.currency}。`,
        time: timeStr,
      });
    }
  } catch (err) {
    console.error('[Cockpit] 生成早报失败:', err);
  }

  messages.push({
    id: `partner-ready`,
    sender: { type: 'partner' },
    content: '有什么我可以帮你的吗？',
    time: timeStr,
  });

  return messages;
}
