// useHarnessChat.ts — 将 Harness 引擎与 ChatFlow 对话组件桥接的 React Hook
// 管理对话消息、LLM 流式调用、Harness 流程推进
import { useState, useCallback, useRef } from 'react';
import type { ChatMsg, CardMessage } from '../components/chat-engine/types';
import type { HarnessFlow, HarnessStep, FlowState } from '../engine/types';
import { HarnessRunner } from '../engine/HarnessRunner';
import { matchSparkFlow } from '../engine/flows/spark-flows';
import { mapOutlineData, mapArticleData, mapSocialPostData } from '../engine/flows/data-mappers';
import { streamChat, type ChatMessage } from '../lib/spark-ai';
import { nextMsgId } from '../components/chat-engine/types';

// 数据映射函数注册表
const DATA_MAPPERS: Record<string, (ai: string) => any> = {
  mapOutlineData,
  mapArticleData,
  mapSocialPostData,
};

export interface UseHarnessChatReturn {
  messages: ChatMsg[];
  isStreaming: boolean;
  flowStatus: string | null;  // null = 自由对话, 'running' | 'waiting_confirm' 等
  currentStepLabel: string | null;
  handleSend: (text: string) => void;
  handleCardAction: (msgId: string, action: string, payload?: any) => void;
  handleCardEdit: (msgId: string, field: string, value: any) => void;
}

export function useHarnessChat(employeeId: string): UseHarnessChatReturn {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [flowStatus, setFlowStatus] = useState<string | null>(null);
  const [currentStepLabel, setCurrentStepLabel] = useState<string | null>(null);

  const runnerRef = useRef<HarnessRunner | null>(null);
  const pendingStepRef = useRef<HarnessStep | null>(null);
  const messagesRef = useRef<ChatMsg[]>([]);

  // 保持 ref 与 state 同步
  const updateMessages = useCallback((updater: (prev: ChatMsg[]) => ChatMsg[]) => {
    setMessages(prev => {
      const next = updater(prev);
      messagesRef.current = next;
      return next;
    });
  }, []);

  // 添加助手消息（初始为空，流式填充）
  const addAssistantMessage = useCallback((): string => {
    const id = nextMsgId();
    const msg: ChatMsg = { id, role: 'assistant', content: '', timestamp: Date.now() };
    updateMessages(prev => [...prev, msg]);
    return id;
  }, [updateMessages]);

  // 添加卡片消息
  const addCardMessage = useCallback((card: CardMessage): string => {
    const id = nextMsgId();
    const msg: ChatMsg = { id, role: 'assistant', content: '', timestamp: Date.now(), card };
    updateMessages(prev => [...prev, msg]);
    return id;
  }, [updateMessages]);

  // 流式调用 LLM
  const callLLM = useCallback(async (
    systemPromptAddition: string,
    onComplete: (fullText: string) => void,
  ) => {
    const assistantId = addAssistantMessage();
    setIsStreaming(true);
    let fullContent = '';

    // 构建消息历史（最近 20 条）
    const historyMsgs: ChatMessage[] = messagesRef.current
      .filter(m => m.role !== 'system' && !m.card)
      .slice(-20)
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const systemPrompt =
      '你是火花，一个温暖专业的品牌创意总监，服务中小企业。\n' +
      '用中文回复，保持简洁、有人情味的沟通风格。\n' +
      (systemPromptAddition ? '\n---\n当前任务指引：\n' + systemPromptAddition : '');

    await new Promise<void>((resolve) => {
      streamChat({
        messages: historyMsgs,
        systemPrompt,
        onDelta: (delta) => {
          fullContent += delta;
          updateMessages(prev =>
            prev.map(m => m.id === assistantId ? { ...m, content: fullContent } : m),
          );
        },
        onDone: () => {
          setIsStreaming(false);
          onComplete(fullContent);
          resolve();
        },
        onError: (err) => {
          setIsStreaming(false);
          updateMessages(prev =>
            prev.map(m => m.id === assistantId ? { ...m, content: `⚠️ 请求失败: ${err.message}` } : m),
          );
          resolve();
        },
      });
    });
  }, [addAssistantMessage, updateMessages]);

  // 启动 Harness 流程
  const startFlow = useCallback((flow: HarnessFlow, userText: string) => {
    const runner = new HarnessRunner(flow, {
      onStepStart: (step, state) => {
        setFlowStatus(state.status);
        setCurrentStepLabel(step.label);
      },
      onStepComplete: (_step, _result, state) => {
        setFlowStatus(state.status);
      },
      onCardRender: (template, dataMapper, previousData, step) => {
        setFlowStatus('waiting_confirm');
        setCurrentStepLabel(step.label);

        // 从上一步的 AI 回复中提取数据
        const prevStepIds = Object.keys(previousData);
        const lastAiResult = prevStepIds.length > 0
          ? previousData[prevStepIds[prevStepIds.length - 1]]
          : '';

        const mapper = DATA_MAPPERS[dataMapper];
        const cardData = mapper ? mapper(String(lastAiResult)) : lastAiResult;

        const card: CardMessage = {
          type: 'card',
          template,
          data: cardData,
          editable: true,
        };
        addCardMessage(card);
      },
      onMessage: (prompt, step) => {
        // AI 步骤：调用 LLM
        pendingStepRef.current = step;

        // 将前面步骤的结果注入 prompt，让 LLM 有上下文
        const state = runner.getState();
        const contextParts: string[] = [];
        for (const [key, val] of Object.entries(state.stepResults)) {
          if (key === step.id) continue; // 跳过当前步骤
          if (key.endsWith('_user')) continue; // 跳过用户输入（已在聊天历史中）
          if (typeof val === 'string' && val.length > 0) {
            contextParts.push(`[${key} 步骤结果]:\n${val}`);
          }
        }
        const enrichedPrompt = contextParts.length > 0
          ? prompt + '\n\n--- 前序步骤上下文 ---\n' + contextParts.join('\n\n')
          : prompt;

        callLLM(enrichedPrompt, (fullText) => {
          // AI 完成后，将结果提供给 runner
          runner.provideStepResult(step.id, fullText);
        });
      },
      onWaitForUser: (step, state) => {
        // AI 已回复，现在等待用户输入
        setFlowStatus('waiting_user');
        setCurrentStepLabel(step.label + ' · 等待你的回复');
      },
      onFlowComplete: (state) => {
        setFlowStatus(null);
        setCurrentStepLabel(null);
      },
      onError: (err, step, state) => {
        setFlowStatus(null);
        setCurrentStepLabel(null);
        const errId = nextMsgId();
        updateMessages(prev => [...prev, {
          id: errId, role: 'assistant', content: `⚠️ 流程出错: ${err.message}`, timestamp: Date.now(),
        }]);
      },
    });

    runnerRef.current = runner;
    runner.start();
  }, [addCardMessage, callLLM, updateMessages]);

  // 处理用户发送消息
  const handleSend = useCallback((text: string) => {
    // 添加用户消息
    const userMsg: ChatMsg = {
      id: nextMsgId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    updateMessages(prev => [...prev, userMsg]);

    // 如果当前在流程中且等待用户输入（waitForUser 步骤）
    if (runnerRef.current && flowStatus === 'waiting_user') {
      // 用户回复了，推进流程
      runnerRef.current.provideUserInput(text);
      return;
    }

    // 如果当前在流程中且等待确认（用户输入相当于对话式反馈）
    if (runnerRef.current && flowStatus === 'waiting_confirm') {
      // 用户在确认步骤中发了文字，当做补充反馈
      // 暂不处理，等用户点击卡片按钮
      return;
    }

    // 如果当前在流程中（AI 步骤），用户输入被加入历史供下次 LLM 调用使用
    if (runnerRef.current && flowStatus === 'running') {
      return;
    }

    // 自由对话模式：检查是否触发流程
    if (employeeId === 'spark') {
      const flow = matchSparkFlow(text);
      if (flow) {
        startFlow(flow, text);
        return;
      }
    }

    // 普通对话
    callLLM('', () => {});
  }, [employeeId, flowStatus, startFlow, callLLM, updateMessages]);

  // 处理卡片操作
  const handleCardAction = useCallback((msgId: string, action: string, payload?: any) => {
    if (action === 'confirm' || action === 'publish') {
      // 用户确认了卡片
      const cardMsg = messagesRef.current.find(m => m.id === msgId);
      const cardData = cardMsg?.card?.data;

      if (runnerRef.current && flowStatus === 'waiting_confirm') {
        runnerRef.current.confirmCard(cardData);
      }
    } else if (action === 'regenerate') {
      // 重新生成：回退到上一个 AI 步骤
      // MVP 简单处理：重新 start
      if (runnerRef.current) {
        const flow = runnerRef.current.getState();
        // 简单回退暂不支持，后续迭代
      }
    }
  }, [flowStatus]);

  // 处理卡片编辑
  const handleCardEdit = useCallback((msgId: string, field: string, value: any) => {
    updateMessages(prev =>
      prev.map(m => {
        if (m.id === msgId && m.card) {
          return {
            ...m,
            card: {
              ...m.card,
              data: { ...m.card.data, [field]: value },
            },
          };
        }
        return m;
      }),
    );
  }, [updateMessages]);

  return {
    messages,
    isStreaming,
    flowStatus,
    currentStepLabel,
    handleSend,
    handleCardAction,
    handleCardEdit,
  };
}
