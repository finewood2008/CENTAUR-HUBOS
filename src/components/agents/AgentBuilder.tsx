// Agent Builder - 自然语言 -> Mini App 生成器
// 从纯聊天改造为：对话 -> 生成 MiniAppSchema -> 预览/导出
import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Eye, Code2, Download, RotateCcw, Sparkles,
  Copy, Check, Layers, MessageSquare,
} from 'lucide-react';
import { getModelsModule } from '../../services/qeeclaw';
import type { ChatMessage } from '../../types';
import type { MiniAppSchema } from '../../types/mini-app';
import MiniAppRuntime from '../mini-app/MiniAppRuntime';

// ─── 架构师 System Prompt ───
const ARCHITECT_SYSTEM = `你是半人马架构师，负责帮助用户通过自然语言创建 Mini App。

Mini App 是一个由 JSON Schema 驱动的轻应用，包含：
- meta: 应用名称、描述、图标(emoji)、颜色(tailwind gradient如"from-blue-500 to-cyan-500")、version
- agent: model(字符串)、systemPrompt、temperature、maxTokens
- layout: type(chat-workspace|workspace-only|chat-only|dashboard)、chatWidth
- panels: 数组，每项含 id/title/position(left|right|center)/children(widget数组)
- dataSources: 数组，每项含 id/type(static|api|agent-output)/initialData
- workflow: triggers + actions

可用 Widget 类型：
- chat: 聊天面板 (placeholder, welcomeMessage)
- card: 卡片 (title, subtitle, content, footer)
- table: 数据表格 (columns:[{key,label,width,render}], data, searchable, pageSize)
- list: 列表 (template:simple|card|timeline|feed, titleKey, subtitleKey)
- form: 动态表单 (fields:[{key,label,type,placeholder,required,options}], submitLabel, layout)
- stat: 统计卡片 (items:[{label,value,change,trend,icon}], columns)
- tabs: 标签页 (items:[{key,label,children}])
- button-group: 按钮组 (buttons:[{label,action,variant}])
- markdown: Markdown渲染 (content)
- progress: 进度条 (value, label, color)
- tag-cloud: 标签云 (tags:[{label,color}])
- timeline: 时间线 (items:[{time,title,description,status}])
- empty: 空状态 (message, icon)

每个 widget 都有 id(string) 和 type 字段，可选 bindDataSource 绑定数据源。

工作流程：
1. 了解用户想要什么应用（用途、功能、数据）
2. 最多 2-3 轮对话后生成完整 MiniAppSchema JSON
3. 用 <!--MINI_APP_SCHEMA:{...}--> 标记包裹完整 JSON
4. 标记外面写简短设计说明
5. 根据用户反馈迭代，每次输出完整新 schema

规则：
- 每次只聚焦一个问题
- schema 的 id 用 "app_" + 随机4位
- dataSources 至少有一个
- panels 的 children 里每个 widget 必须有唯一 id
- 回复简洁，用人话

输出格式示例：
我帮你设计了一个客户管理工具，左侧聊天右侧表格。

<!--MINI_APP_SCHEMA:
{"id":"app_cx01","meta":{"name":"客户管理","description":"...","icon":"👥","color":"from-blue-500 to-cyan-500","version":"1.0"},...}
-->

你可以预览看看效果，有什么要调整的随时说。`;

// ─── 类型 ───
interface Props {
  isConnected: boolean;
}

interface BuilderMessage extends ChatMessage {
  schema?: MiniAppSchema;
}

// ─── 主组件 ───
export default function AgentBuilder({ isConnected }: Props) {
  const [messages, setMessages] = useState<BuilderMessage[]>([
    {
      role: 'ai',
      content: '你好！我是半人马架构师。\n\n告诉我你想创建什么样的应用？比如：\n• 客户管理工具\n• 数据分析仪表盘\n• 智能问答助手\n• 表单收集系统\n\n随便描述，我来帮你生成。',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [latestSchema, setLatestSchema] = useState<MiniAppSchema | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  // 发送消息
  const send = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      if (!isConnected) throw new Error('offline');

      const history = [...messages, { role: 'user' as const, content: userMsg }]
        .map((m) => `${m.role === 'user' ? '用户' : '架构师'}：${m.content}`)
        .join('\n\n');

      const prompt = `${ARCHITECT_SYSTEM}\n\n--- 对话历史 ---\n${history}\n\n架构师：`;

      const result = await getModelsModule().invoke({ prompt });
      const reply =
        typeof result === 'string'
          ? result
          : (result as unknown as Record<string, unknown>)?.content ||
            (result as unknown as Record<string, unknown>)?.text ||
            JSON.stringify(result);

      const { displayText, schema } = extractSchema(String(reply));
      if (schema) setLatestSchema(schema);
      setMessages((prev) => [...prev, { role: 'ai', content: displayText, schema }]);
    } catch {
      const fallbacks = [
        '明白了！让我想想怎么设计...\n\n你希望这个应用主要用什么布局？\n1. 左聊天 + 右工作区\n2. 纯工作区（表格/表单为主）\n3. 仪表盘（数据卡片网格）\n4. 纯聊天机器人',
        '好的，最后确认一下：这个应用需要哪些核心模块？比如数据表格、表单、统计卡片、聊天面板等。',
        '完美！让我来生成 Mini App Schema...',
      ];
      const idx = Math.min(Math.floor((messages.length - 1) / 2), fallbacks.length - 1);
      setMessages((prev) => [...prev, { role: 'ai', content: fallbacks[Math.max(0, idx)] }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, isConnected]);

  const reset = useCallback(() => {
    setMessages([
      { role: 'ai', content: '好的，重新开始。\n\n告诉我你想创建什么样的应用？' },
    ]);
    setLatestSchema(null);
    setShowCode(false);
    setShowPreview(false);
  }, []);

  const copySchema = useCallback(() => {
    if (!latestSchema) return;
    navigator.clipboard.writeText(JSON.stringify(latestSchema, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [latestSchema]);

  const exportSchema = useCallback(() => {
    if (!latestSchema) return;
    const blob = new Blob([JSON.stringify(latestSchema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${latestSchema.meta?.name || 'mini-app'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [latestSchema]);

  const saveToLocal = useCallback(() => {
    if (!latestSchema) return;
    const saved = JSON.parse(localStorage.getItem('hubos_mini_apps') || '[]');
    const existing = saved.findIndex((s: MiniAppSchema) => s.id === latestSchema.id);
    if (existing >= 0) saved[existing] = latestSchema;
    else saved.push(latestSchema);
    localStorage.setItem('hubos_mini_apps', JSON.stringify(saved));
    alert(`"${latestSchema.meta.name}" 已保存到本地`);
  }, [latestSchema]);

  return (
    <div className="flex flex-col h-full max-w-full">
      {/* 顶栏 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-near-black flex items-center gap-2">
            <Sparkles size={18} className="text-terracotta" />
            打造员工
            <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/15 font-normal ml-1">
              概念演示 · 未来功能
            </span>
          </h2>
          <p className="text-xs text-stone-gray mt-0.5">
            用自然语言描述需求，AI 架构师帮你打造专属员工工作台
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {latestSchema && (
            <>
              <ActionBtn
                icon={<Code2 size={13} />}
                label={showCode ? '隐藏' : 'Schema'}
                onClick={() => setShowCode((s) => !s)}
                active={showCode}
              />
              <ActionBtn icon={<Download size={13} />} label="导出" onClick={exportSchema} />
            </>
          )}
          {messages.length > 1 && (
            <ActionBtn icon={<RotateCcw size={13} />} label="重置" onClick={reset} danger />
          )}
        </div>
      </div>

      {/* 主区域：左对话 + 右实时预览 */}
      <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
        {/* 左侧：对话区 */}
        <div className={`flex flex-col min-h-0 ${latestSchema && !showCode ? 'w-[45%] shrink-0' : showCode ? 'flex-1' : 'flex-1 max-w-2xl mx-auto'}`}>
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                msg={msg}
                onPreview={() => {
                  if (msg.schema) {
                    setLatestSchema(msg.schema);
                  }
                }}
                onCopy={copySchema}
                onSave={saveToLocal}
              />
            ))}
            {loading && <TypingIndicator />}
          </div>

          {/* 输入框 */}
          <div className="flex gap-2 shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && !loading && send()}
              placeholder={loading ? '架构师思考中...' : '描述你想要的 AI 员工...'}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-parchment border border-border-warm rounded-xl text-sm text-near-black placeholder-stone-gray focus:outline-none focus:border-terracotta/25 disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 bg-terracotta text-near-black rounded-xl hover:bg-coral transition-colors disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* 右侧：实时预览区（有 schema 时常驻显示） */}
        <AnimatePresence>
          {latestSchema && !showCode && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col min-h-0 border-l border-border-cream pl-4"
            >
              {/* 预览头部 */}
              <div className="flex items-center justify-between mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${latestSchema.meta.color || 'from-terracotta to-coral'} flex items-center justify-center text-sm shadow-lg`}>
                    {latestSchema.meta.icon || '✨'}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-near-black">{latestSchema.meta.name}</h3>
                    <p className="text-[10px] text-stone-gray">{latestSchema.layout.type} · {latestSchema.panels.reduce((s, p) => s + p.children.length, 0)} 组件</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] rounded-lg bg-terracotta/10 text-terracotta border border-terracotta/20 hover:bg-terracotta/20 transition-colors"
                >
                  <Eye size={12} /> 全屏预览
                </button>
              </div>
              {/* 内嵌预览 */}
              <div className="flex-1 card-glass overflow-hidden relative">
                <div className="absolute inset-0 overflow-auto">
                  <MiniAppRuntime
                    schema={latestSchema}
                    onClose={() => {}}
                    isConnected={isConnected}
                    embedded
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Schema 代码面板 */}
        <AnimatePresence>
          {showCode && latestSchema && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 flex flex-col min-h-0 border-l border-border-cream pl-4 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-olive-gray font-medium">Mini App Schema</span>
                <button
                  onClick={copySchema}
                  className="flex items-center gap-1 text-[10px] text-stone-gray hover:text-near-black transition-colors"
                >
                  {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
              <pre className="flex-1 overflow-auto card-glass p-4 text-[11px] text-olive-gray font-mono leading-relaxed select-all">
                {JSON.stringify(latestSchema, null, 2)}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 全屏预览弹窗 */}
      {showPreview && latestSchema && (
        <MiniAppRuntime
          schema={latestSchema}
          onClose={() => setShowPreview(false)}
          isConnected={isConnected}
        />
      )}
    </div>
  );
}

// ─── Schema 提取 ───
function extractSchema(text: string): { displayText: string; schema?: MiniAppSchema } {
  // 方式1: <!--MINI_APP_SCHEMA:{...}-->
  const markerMatch = text.match(/<!--MINI_APP_SCHEMA:([\s\S]*?)-->/);
  if (markerMatch) {
    try {
      const schema = JSON.parse(markerMatch[1].trim()) as MiniAppSchema;
      const displayText = text.replace(/<!--MINI_APP_SCHEMA:[\s\S]*?-->/, '').trim();
      return { displayText: displayText || '✨ Mini App 已生成！点击预览查看效果。', schema };
    } catch {
      /* fall through */
    }
  }

  // 方式2: ```json 代码块（含 MiniAppSchema 特征字段）
  const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeMatch) {
    try {
      const parsed = JSON.parse(codeMatch[1].trim());
      if (parsed.meta && parsed.agent && parsed.panels) {
        const displayText = text.replace(/```(?:json)?[\s\S]*?```/, '').trim();
        return {
          displayText: displayText || '✨ Mini App 已生成！点击预览查看效果。',
          schema: parsed as MiniAppSchema,
        };
      }
    } catch {
      /* not a valid schema */
    }
  }

  return { displayText: text };
}

// ─── 消息气泡 ───
function MessageBubble({
  msg,
  onPreview,
  onCopy,
  onSave,
}: {
  msg: BuilderMessage;
  onPreview: () => void;
  onCopy: () => void;
  onSave: () => void;
}) {
  const isUser = msg.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className="max-w-[85%] space-y-2">
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-terracotta/10 text-terracotta rounded-br-md'
              : 'bg-warm-sand text-olive-gray rounded-bl-md'
          }`}
        >
          {msg.content}
        </div>

        {msg.schema && <SchemaCard schema={msg.schema} onPreview={onPreview} onCopy={onCopy} onSave={onSave} />}
      </div>
    </motion.div>
  );
}

// ─── Schema 卡片 ───
function SchemaCard({
  schema,
  onPreview,
  onCopy,
  onSave,
}: {
  schema: MiniAppSchema;
  onPreview: () => void;
  onCopy: () => void;
  onSave: () => void;
}) {
  const widgetCount = schema.panels.reduce((sum, p) => sum + p.children.length, 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-terracotta/10 to-coral/5 border border-terracotta/20 rounded-xl p-4"
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
            schema.meta.color || 'from-terracotta to-coral'
          } flex items-center justify-center text-lg shadow-lg`}
        >
          {schema.meta.icon || '✨'}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-near-black">{schema.meta.name}</h4>
          <p className="text-[11px] text-olive-gray mt-0.5 line-clamp-2">{schema.meta.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3 text-[10px]">
        <span className="px-2 py-0.5 bg-parchment text-olive-gray rounded-full flex items-center gap-1">
          <Layers size={9} /> {schema.layout.type}
        </span>
        <span className="px-2 py-0.5 bg-parchment text-olive-gray rounded-full">
          {schema.panels.length} 面板
        </span>
        <span className="px-2 py-0.5 bg-parchment text-olive-gray rounded-full">{widgetCount} 组件</span>
        <span className="px-2 py-0.5 bg-parchment text-olive-gray rounded-full flex items-center gap-1">
          <MessageSquare size={9} /> {schema.agent.model}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onPreview}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-terracotta/15 text-coral text-xs rounded-lg hover:bg-terracotta/25 transition-colors border border-terracotta/20"
        >
          <Eye size={12} /> 预览应用
        </button>
        <button
          onClick={onSave}
          className="px-3 py-2 bg-green-500/10 text-green-400 text-xs rounded-lg hover:bg-green-500/20 transition-colors border border-green-500/20"
          title="保存到本地"
        >
          <Download size={12} />
        </button>
        <button
          onClick={onCopy}
          className="px-3 py-2 bg-parchment text-olive-gray text-xs rounded-lg hover:bg-warm-sand transition-colors"
          title="复制 Schema"
        >
          <Copy size={12} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── 打字指示器 ───
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-warm-sand text-olive-gray text-sm flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-terracotta rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-terracotta rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-terracotta rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

// ─── 操作按钮 ───
function ActionBtn({
  icon,
  label,
  onClick,
  primary,
  active,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
  active?: boolean;
  danger?: boolean;
}) {
  const variant = primary
    ? 'bg-terracotta/10 text-terracotta border-terracotta/20 hover:bg-terracotta/20'
    : danger
      ? 'bg-parchment text-olive-gray border-border-cream hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
      : active
        ? 'bg-blue-500/15 text-blue-400 border-blue-500/20'
        : 'bg-parchment text-olive-gray border-border-cream hover:bg-warm-sand hover:text-olive-gray';

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] rounded-lg transition-colors border ${variant}`}
    >
      {icon}
      {label}
    </button>
  );
}
