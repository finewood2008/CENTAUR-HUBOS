// Hub OS - Cockpit 数据加载与会话管理
import { useState, useEffect, useCallback, useRef } from 'react';
import { getClientAsync } from '../services/qeeclaw';
import type { ChatMessage, ReportItem, InputFile, Task, ScheduledTask, PartnerProfile } from '../data/partner';
import { DEFAULT_PARTNER, ONBOARDING_MESSAGES } from '../data/partner';

type QeeClawClient = Awaited<ReturnType<typeof getClientAsync>>;

interface CockpitData {
  partner: PartnerProfile;
  messages: ChatMessage[];
  tasks: Task[]; // To be mapped from approval module
  scheduledTasks: ScheduledTask[]; // Future: workflow module
  reports: ReportItem[];
  sessionId: string | null;
}

export function useCockpit(isConnected: boolean) {
  const [data, setData] = useState<CockpitData>({
    partner: { ...DEFAULT_PARTNER, name: '', isConfigured: false },
    messages: ONBOARDING_MESSAGES,
    tasks: [],
    scheduledTasks: [],
    reports: [],
    sessionId: null,
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const sessionInitialized = useRef(false);

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
      // TODO: 对接到具体的 workflow 接口
      // const client = await getClientAsync();
      // const res = await client.workflow.listScheduled();
      setData(prev => ({ ...prev, scheduledTasks: [] }));
    } catch (e) {
      console.error('[Cockpit] 加载调度任务失败:', e);
      setData(prev => ({ ...prev, scheduledTasks: [] }));
    }
  }, []);

  // 加载审批/汇报数据
  const loadApprovals = useCallback(async () => {
    if (!isConnected) return;
    try {
      // TODO: 从 approval 模块获取待审批项
      // const remoteApprovals = await client.approval.list({ status: 'pending' });
      
      updateData({ tasks: [] });
    } catch (err) {
      console.error('[Cockpit] 加载汇报/审批失败:', err);
      updateData({ tasks: [] });
    }
  }, [isConnected, updateData]);

  // 审批任务操作
  const approveTask = useCallback((taskId: string) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => (t.id === taskId ? { ...t, status: 'completed', progress: 100 } : t))
    }));
    const task = data.tasks.find(t => t.id === taskId);
    if (task) {
      appendSystemMessage(`已批准：${task.assigneeName}的「${task.title}」`);
    }
  }, [data.tasks]);

  const rejectTask = useCallback((taskId: string) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => (t.id === taskId ? { ...t, status: 'pending' } : t))
    }));
    const task = data.tasks.find(t => t.id === taskId);
    if (task) {
      appendSystemMessage(`已驳回：${task.assigneeName}的「${task.title}」，已退回修改`);
    }
  }, [data.tasks]);

  // 修改预设调度操作
  const toggleSchedule = useCallback((id: string, enabled: boolean) => {
    setData(prev => ({
      ...prev,
      scheduledTasks: prev.scheduledTasks.map(t => (t.id === id ? { ...t, enabled } : t))
    }));
  }, []);

  const deleteSchedule = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      scheduledTasks: prev.scheduledTasks.filter(t => t.id !== id)
    }));
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
          sessionId,
        }));
      }
      sessionInitialized.current = true;
    } catch (err) {
      console.error('[Cockpit] 初始化失败:', err);
      // Fallback
      setData(prev => ({
        ...prev,
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

    // (伪)文件附件渲染展示，未真实落盘
    if (files && files.length > 0) {
      userMsg.attachment = {
        type: 'action-buttons', 
        buttons: [{ label: `已包含 ${files.length} 个附件`, action: 'none' }]
      };
    }

    setData(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg],
    }));

    setSending(true);

    try {
      // TODO: 向 SDK 上传 files 和 voiceBlob
      // const fileIds = [];
      // for (const file of files) {
      //   const res = await client.file.upload(file.file);
      //   fileIds.push(res.id);
      // }

      // 调用流式 API
      const response = await fetch(`${window.location.origin}/invoke/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: displayContent, // Todo: 包含 fileIds
          session_id: data.sessionId,
          user_id: 'hubos-cockpit',
          agent_profile: 'default',
        }),
      });

      if (!response.ok) throw new Error('Stream failed');

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

      // 读取流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let receivedText = false;
      let streamError: string | null = null;
      let streamDone = false;
      let lastTextChunk = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const resData = line.slice(6);
              if (resData === '[DONE]') {
                streamDone = true;
                break;
              }

              try {
                const parsed = JSON.parse(resData) as {
                  type?: string;
                  delta?: string;
                  content?: string;
                  error?: string;
                  session_id?: string;
                };
                if (parsed.type === 'session' && parsed.session_id) {
                  setData(prev => ({ ...prev, sessionId: parsed.session_id ?? prev.sessionId }));
                  continue;
                }
                if (parsed.type === 'error') {
                  streamError = parsed.error ?? '模型服务暂时不可用';
                  streamDone = true;
                  break;
                }
                const textChunk = parsed.delta ?? parsed.content ?? '';
                if (textChunk && textChunk !== lastTextChunk) {
                  receivedText = true;
                  lastTextChunk = textChunk;
                  setData(prev => ({
                    ...prev,
                    messages: prev.messages.map(m =>
                      m.id === aiMsgId
                        ? { ...m, content: m.content + textChunk }
                        : m
                    ),
                  }));
                }
              } catch {
                // Ignore parse errors
              }
            }
          }

          if (streamDone) {
            break;
          }
        }

        if (!receivedText || streamError) {
          const fallbackMessage = streamError ?? '当前模型服务未返回内容，请检查 bridge 模型鉴权或上游配置。';
          setData(prev => ({
            ...prev,
            messages: prev.messages.map(m =>
              m.id === aiMsgId
                ? { ...m, content: fallbackMessage }
                : m
            ),
          }));
        }
      }
    } catch (err) {
      console.error('[Cockpit] 发送消息失败:', err);
      // 添加错误消息
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: { type: 'partner' },
        content: '抱歉，我暂时无法回复。请稍后再试。',
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
