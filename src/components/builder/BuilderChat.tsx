// BuilderChat — 数字员工构建器 V2 左侧对话面板
// Left panel: AI-guided conversation that drives canvas node configuration.
// Uses Gemini via CF Worker proxy for intelligent responses.

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  Sparkles,
  Loader2,
} from 'lucide-react';
import type { CanvasNode } from './BuilderCanvas';

/* ═══════════════════════════════════════════
   Types
   ═══════════════════════════════════════════ */

export interface EmployeeSpecV2 {
  name: string;
  role: string;
  description: string;
  layers: {
    identity: Record<string, unknown>;
    capability: Record<string, unknown>;
    workflow: Record<string, unknown>;
  };
  nodes: CanvasNode[];
  createdAt: string;
}

export interface BuilderChatProps {
  activeLayer: number;
  nodes: CanvasNode[];
  onLayerChange: (layer: number) => void;
  onNodeUpdate: (updatedNode: CanvasNode) => void;
  onComplete: (spec: EmployeeSpecV2) => void;
}

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

/* ═══════════════════════════════════════════
   Gemini API helper
   ═══════════════════════════════════════════ */

const GEMINI_PROXY = 'https://spark-gemini-proxy.finewood2008.workers.dev/v1/chat/completions';

const SYSTEM_PROMPT = `你是"数字员工构建助手"，正在帮用户通过自然语言对话构建一个 AI 数字员工。

你需要引导用户逐层完成三层配置：
- Layer 1 身份层：角色卡（名称、性格、说话方式）、知识库（领域知识）、记忆体系（长短期记忆策略）、行为准则（边界和限制）
- Layer 2 能力层：能力套件（核心技能）、工具集成（可调用的外部工具/API）
- Layer 3 工作流层：触发器（启动条件）、处理步骤（执行流程）、审核节点（人工审核点）、输出（最终产出形式）

对话规则：
1. 每次只聚焦当前层的一个节点，问具体问题
2. 用户回答后，提取关键信息，确认理解无误
3. 一个节点配置完毕后，输出 JSON 指令块来更新节点状态
4. 所有节点配完后，生成最终的 EmployeeSpec

当你确认一个节点配置完毕时，在回复末尾附上如下 JSON 块（用三个反引号包裹）：
\`\`\`json
{"action":"update_node","node_id":"xxx","status":"done","data":{"key":"value"}}
\`\`\`

当所有节点都完成后，输出：
\`\`\`json
{"action":"complete","spec":{...完整配置...}}
\`\`\`

当需要切换到下一层时：
\`\`\`json
{"action":"switch_layer","layer":2}
\`\`\`

保持简洁友好，每条回复不超过 150 字。不要在对话中显示 JSON 块的存在，让用户感觉是自然对话。`;

async function callGemini(messages: { role: string; content: string }[]): Promise<string> {
  try {
    const resp = await fetch(GEMINI_PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!resp.ok) {
      console.error('Gemini API error:', resp.status);
      return '抱歉，AI 暂时无法响应，请稍后重试。';
    }

    const data = await resp.json();
    return data.choices?.[0]?.message?.content ?? '未收到有效回复。';
  } catch (err) {
    console.error('Gemini call failed:', err);
    return '网络异常，请检查连接后重试。';
  }
}

/* ═══════════════════════════════════════════
   Parse AI response for JSON commands
   ═══════════════════════════════════════════ */

interface AICommand {
  action: 'update_node' | 'switch_layer' | 'complete';
  node_id?: string;
  status?: CanvasNode['status'];
  data?: Record<string, unknown>;
  layer?: number;
  spec?: EmployeeSpecV2;
}

function parseCommands(text: string): { displayText: string; commands: AICommand[] } {
  const commands: AICommand[] = [];
  // Extract JSON blocks wrapped in ```json ... ```
  const jsonBlockRegex = /```json\s*\n?([\s\S]*?)\n?\s*```/g;
  let displayText = text;
  let match;

  while ((match = jsonBlockRegex.exec(text)) !== null) {
    try {
      const cmd = JSON.parse(match[1]) as AICommand;
      if (cmd.action) {
        commands.push(cmd);
      }
    } catch {
      // Not valid JSON, ignore
    }
    displayText = displayText.replace(match[0], '');
  }

  return { displayText: displayText.trim(), commands };
}

/* ═══════════════════════════════════════════
   Layer prompts
   ═══════════════════════════════════════════ */

const LAYER_PROMPTS: Record<number, string> = {
  1: '让我们从身份层开始！请告诉我，你想创建一个什么样的数字员工？TA 叫什么名字，负责什么工作？',
  2: '身份层配置完成！现在来配置能力层——这位数字员工需要哪些核心技能和外部工具？',
  3: '能力层就绪！最后一步：定义工作流——什么情况下触发 TA 工作？处理流程是怎样的？',
};

/* ═══════════════════════════════════════════
   BuilderChat (exported)
   ═══════════════════════════════════════════ */

export default function BuilderChat({
  activeLayer,
  nodes,
  onLayerChange,
  onNodeUpdate,
  onComplete,
}: BuilderChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '欢迎来到数字员工构建工作台！我将引导你一步步完成三层配置。\n\n' + LAYER_PROMPTS[1],
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Process AI commands
  const processCommands = useCallback(
    (commands: AICommand[]) => {
      for (const cmd of commands) {
        switch (cmd.action) {
          case 'update_node': {
            if (cmd.node_id) {
              const existingNode = nodes.find((n) => n.id === cmd.node_id);
              if (existingNode) {
                onNodeUpdate({
                  ...existingNode,
                  status: (cmd.status as CanvasNode['status']) ?? 'done',
                  data: { ...(existingNode.data ?? {}), ...(cmd.data ?? {}) },
                });
              }
            }
            break;
          }
          case 'switch_layer': {
            if (cmd.layer && cmd.layer >= 1 && cmd.layer <= 3) {
              onLayerChange(cmd.layer);
            }
            break;
          }
          case 'complete': {
            if (cmd.spec) {
              onComplete(cmd.spec);
            }
            break;
          }
        }
      }
    },
    [nodes, onNodeUpdate, onLayerChange, onComplete],
  );

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Build message history for context
    const history = [...messages, userMsg].map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    // Add context about current state
    const layerNames = { 1: '身份层', 2: '能力层', 3: '工作流层' };
    const stateContext = `[系统上下文] 当前激活层: Layer ${activeLayer} (${layerNames[activeLayer as 1|2|3]})。节点状态: ${nodes
      .map((n) => `${n.id}(${n.status})`)
      .join(', ')}`;
    history.push({ role: 'user', content: stateContext });

    try {
      const response = await callGemini(history);
      const { displayText, commands } = parseCommands(response);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: displayText || response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);

      // Process any commands from AI
      if (commands.length > 0) {
        processCommands(commands);
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: '抱歉，出了点问题。请再试一次。',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, activeLayer, nodes, processCommands]);

  return (
    <div className="flex h-full w-80 flex-col border-r border-border-cream bg-ivory">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border-cream px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
          <Bot size={18} strokeWidth={1.8} />
        </span>
        <div>
          <p className="font-serif text-sm font-semibold text-near-black">构建助手</p>
          <p className="text-[11px] text-stone-gray">Builder Assistant</p>
        </div>
        <span className="ml-auto flex h-2 w-2 rounded-full bg-success-green animate-pulse" />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
                  <Sparkles size={13} />
                </span>
              )}
              <div
                className={`max-w-[85%] rounded-[var(--radius-generous)] px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-terracotta/10 text-near-black'
                    : 'bg-warm-sand/50 text-charcoal-warm'
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 justify-start"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
                <Sparkles size={13} />
              </span>
              <div className="flex items-center gap-1.5 rounded-[var(--radius-generous)] bg-warm-sand/50 px-3 py-2 text-sm text-stone-gray">
                <Loader2 size={14} className="animate-spin" />
                思考中...
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="border-t border-border-cream px-3 py-3">
        <div className="flex items-center gap-2 rounded-[var(--radius-generous)] border border-border-warm bg-parchment px-3 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={isLoading ? '等待回复...' : '描述你的需求...'}
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm text-near-black outline-none placeholder:text-stone-gray/60 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-terracotta text-white transition-opacity hover:opacity-90 disabled:opacity-30"
          >
            {isLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} strokeWidth={2} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
