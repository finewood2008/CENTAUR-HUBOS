// Mini App Runtime - 根据 Schema 渲染完整的 Mini App
import { useState, useCallback } from 'react';
import { X, Maximize2, Minimize2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MiniAppSchema, PanelConfig } from '../../types/mini-app';
import WidgetRenderer from './WidgetRenderer';
import { getModelsModule } from '../../services/qeeclaw';

interface Props {
  schema: MiniAppSchema;
  onClose: () => void;
  isConnected: boolean;
  embedded?: boolean;
}

export default function MiniAppRuntime({ schema, onClose, isConnected, embedded }: Props) {
  const [dataStore, setDataStore] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    schema.dataSources.forEach((ds) => {
      init[ds.id] = ds.initialData ?? [];
    });
    return init;
  });
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Agent 对话
  const handleSend = useCallback(async (message: string) => {
    setChatMessages((prev) => [...prev, { role: 'user', content: message }]);
    setIsLoading(true);

    try {
      if (!isConnected) throw new Error('offline');

      // 构建 context，包含当前数据状态
      const dataContext = Object.entries(dataStore)
        .map(([k, v]) => `[数据源 ${k}]: ${JSON.stringify(v)}`)
        .join('\n');

      const history = [...chatMessages, { role: 'user' as const, content: message }]
        .map((m) => `${m.role === 'user' ? '用户' : '助手'}：${m.content}`)
        .join('\n\n');

      const prompt = `${schema.agent.systemPrompt}

--- 当前数据 ---
${dataContext}

--- 对话历史 ---
${history}

助手：`;

      const result = await getModelsModule().invoke({
        prompt,
        model: schema.agent.model,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const reply = typeof result === 'string' ? result
        : (result as unknown as Record<string, unknown>)?.content
        || (result as unknown as Record<string, unknown>)?.text
        || JSON.stringify(result);

      // 尝试从回复中提取数据更新指令
      const parsed = tryParseDataUpdate(String(reply));
      if (parsed.dataUpdates) {
        setDataStore((prev) => ({ ...prev, ...parsed.dataUpdates }));
      }

      setChatMessages((prev) => [...prev, { role: 'ai', content: parsed.displayText }]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'ai', content: '抱歉，连接暂时中断。请稍后再试。' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [chatMessages, dataStore, isConnected, schema.agent]);

  // Workflow action 处理
  const handleAction = useCallback((actionId: string, payload?: unknown) => {
    const action = schema.workflow?.actions.find((a) => a.id === actionId);
    if (!action) {
      // 表单提交等默认行为：发给 agent
      if (payload) {
        handleSend(`[表单提交] ${JSON.stringify(payload)}`);
      }
      return;
    }

    switch (action.type) {
      case 'update_data': {
        const { dataSourceId, data } = action.params as { dataSourceId: string; data: unknown };
        setDataStore((prev) => ({ ...prev, [dataSourceId]: data }));
        break;
      }
      case 'show_toast':
        window.dispatchEvent(new CustomEvent('hubos:toast', {
          detail: { type: 'info', message: String(action.params.message || '') },
        }));
        break;
      case 'agent_invoke':
        handleSend(String(action.params.prompt || ''));
        break;
      default:
        console.log('未处理的 action:', action);
    }
  }, [schema.workflow, handleSend]);

  const chatProps = {
    messages: chatMessages,
    onSend: handleSend,
    isLoading,
  };

  // ─── 内嵌模式：只渲染内容区，不带弹窗外壳 ───
  if (embedded) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex-1 overflow-hidden">
          {renderLayout(schema, dataStore, handleAction, chatProps)}
        </div>
      </div>
    );
  }

  // ─── 弹窗模式 ───
  const containerClass = isMaximized
    ? 'fixed inset-0 z-50'
    : 'fixed inset-4 z-50';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={containerClass}
      >
        {/* 背景遮罩 */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm -z-10" onClick={onClose} />

        {/* App 容器 */}
        <div className="w-full h-full bg-gray-950 border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
          {/* 标题栏 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${schema.meta.color} flex items-center justify-center text-lg`}>
                {schema.meta.icon}
              </div>
              <div>
                <h2 className="text-sm font-medium text-white">{schema.meta.name}</h2>
                <p className="text-[10px] text-gray-500">{schema.meta.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMaximized((m) => !m)}
                className="p-1.5 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* 内容区 - 根据 layout 渲染 */}
          <div className="flex-1 overflow-hidden">
            {renderLayout(schema, dataStore, handleAction, chatProps)}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// 根据 layout type 渲染不同布局
function renderLayout(
  schema: MiniAppSchema,
  dataStore: Record<string, unknown>,
  onAction: (id: string, payload?: unknown) => void,
  chatProps: {
    messages: { role: 'user' | 'ai'; content: string }[];
    onSend: (msg: string) => void;
    isLoading: boolean;
  },
) {
  const { layout, panels } = schema;

  switch (layout.type) {
    case 'chat-workspace': {
      const chatWidth = layout.chatWidth || '40%';
      const leftPanels = panels.filter((p) => p.position === 'left');
      const rightPanels = panels.filter((p) => p.position === 'right' || p.position === 'center');

      return (
        <div className="flex h-full">
          {/* 左侧聊天 */}
          <div className="border-r border-white/5 flex flex-col" style={{ width: chatWidth }}>
            {leftPanels.length > 0 ? (
              leftPanels.map((panel) => (
                <PanelRenderer
                  key={panel.id}
                  panel={panel}
                  dataStore={dataStore}
                  onAction={onAction}
                  chatProps={chatProps}
                />
              ))
            ) : (
              <div className="flex-1 flex flex-col">
                <WidgetRenderer
                  widget={{
                    id: '__default_chat',
                    type: 'chat',
                    welcomeMessage: `你好！我是${schema.meta.name}，有什么我能帮你的？`,
                    placeholder: '输入消息...',
                  }}
                  dataStore={dataStore}
                  onAction={onAction}
                  chatProps={chatProps}
                />
              </div>
            )}
          </div>

          {/* 右侧工作区 */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {rightPanels.map((panel) => (
              <PanelRenderer
                key={panel.id}
                panel={panel}
                dataStore={dataStore}
                onAction={onAction}
                chatProps={chatProps}
              />
            ))}
          </div>
        </div>
      );
    }

    case 'workspace-only':
      return (
        <div className="h-full overflow-y-auto p-5 space-y-4">
          {panels.map((panel) => (
            <PanelRenderer
              key={panel.id}
              panel={panel}
              dataStore={dataStore}
              onAction={onAction}
              chatProps={chatProps}
            />
          ))}
        </div>
      );

    case 'chat-only':
      return (
        <div className="h-full flex flex-col">
          <WidgetRenderer
            widget={{
              id: '__default_chat',
              type: 'chat',
              welcomeMessage: `你好！我是${schema.meta.name}，有什么我能帮你的？`,
            }}
            dataStore={dataStore}
            onAction={onAction}
            chatProps={chatProps}
          />
        </div>
      );

    case 'dashboard':
      return (
        <div className="h-full overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-4">
            {panels.map((panel) => (
              <PanelRenderer
                key={panel.id}
                panel={panel}
                dataStore={dataStore}
                onAction={onAction}
                chatProps={chatProps}
              />
            ))}
          </div>
        </div>
      );

    default:
      return (
        <div className="h-full overflow-y-auto p-5 space-y-4">
          {panels.map((panel) => (
            <PanelRenderer
              key={panel.id}
              panel={panel}
              dataStore={dataStore}
              onAction={onAction}
              chatProps={chatProps}
            />
          ))}
        </div>
      );
  }
}

// Panel 渲染器
function PanelRenderer({
  panel,
  dataStore,
  onAction,
  chatProps,
}: {
  panel: PanelConfig;
  dataStore: Record<string, unknown>;
  onAction: (id: string, payload?: unknown) => void;
  chatProps: {
    messages: { role: 'user' | 'ai'; content: string }[];
    onSend: (msg: string) => void;
    isLoading: boolean;
  };
}) {
  // 判断是否包含 chat widget，如果是则让它填满
  const hasChat = panel.children.some((w) => w.type === 'chat');

  return (
    <div className={hasChat ? 'h-full flex flex-col' : ''}>
      {panel.title && !hasChat && (
        <h3 className="text-sm font-medium text-white mb-3">{panel.title}</h3>
      )}
      <div className={`space-y-3 ${hasChat ? 'flex-1 flex flex-col' : ''}`}>
        {panel.children.map((widget) => (
          <div key={widget.id} className={widget.type === 'chat' ? 'flex-1 flex flex-col' : ''}>
            <WidgetRenderer
              widget={widget}
              dataStore={dataStore}
              onAction={onAction}
              chatProps={chatProps}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// 从 AI 回复中提取数据更新指令
// 格式约定: <!--DATA_UPDATE:{"sourceId": {...data}}-->
function tryParseDataUpdate(reply: string): {
  displayText: string;
  dataUpdates?: Record<string, unknown>;
} {
  const match = reply.match(/<!--DATA_UPDATE:(.*?)-->/s);
  if (!match) return { displayText: reply };

  try {
    const updates = JSON.parse(match[1]);
    const displayText = reply.replace(/<!--DATA_UPDATE:.*?-->/s, '').trim();
    return { displayText: displayText || '已更新。', dataUpdates: updates };
  } catch {
    return { displayText: reply };
  }
}
