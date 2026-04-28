import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Loader2, Send, Sparkles } from 'lucide-react';
import type { BuilderProject } from '../../features/builder/types';
import { startInterview, continueInterview } from '../../features/builder/interviewRules';
import { getBuilderModule } from '../../services/qeeclaw';
import type { CanvasNode } from './BuilderCanvas';

export interface EmployeeSpecV2 extends BuilderProject {}

export interface BuilderChatProps {
  project: BuilderProject | null;
  nodes: CanvasNode[];
  onProjectChange: (project: BuilderProject) => void;
  onNodesChange: (nodes: CanvasNode[]) => void;
  onActiveLayerChange: (layer: number) => void;
}

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

export function buildNodesFromProject(project: BuilderProject): CanvasNode[] {
  const { blueprint } = project;
  return [
    {
      id: 'role-goal',
      layer: 1,
      type: 'role-goal',
      title: '岗位目标',
      subtitle: blueprint.name,
      icon: 'target',
      status: 'done',
      data: { 目标: blueprint.goal, 职责: blueprint.responsibilities.slice(0, 4) },
    },
    {
      id: 'service-target',
      layer: 1,
      type: 'service-target',
      title: '服务对象',
      subtitle: '这个员工为谁工作',
      icon: 'users',
      status: 'done',
      data: { 对象: blueprint.serviceTarget },
    },
    {
      id: 'data-sources',
      layer: 1,
      type: 'data-source',
      title: '数据来源',
      subtitle: '员工读取哪些业务资料',
      icon: 'database',
      status: 'done',
      data: { 来源: blueprint.inputSources.map((item) => item.label), 必填: blueprint.inputSources.filter((item) => item.required).map((item) => item.label) },
    },
    {
      id: 'workflow',
      layer: 2,
      type: 'workflow',
      title: '工作流程',
      subtitle: '从触发到输出的业务步骤',
      icon: 'workflow',
      status: 'done',
      data: { 步骤: blueprint.workflow.map((item) => item.label) },
    },
    {
      id: 'tool-permissions',
      layer: 2,
      type: 'tool-permission',
      title: '工具权限',
      subtitle: '只授予必要能力',
      icon: 'zap',
      status: 'done',
      data: { 工具: blueprint.toolPermissions.map((item) => item.label), 高风险: blueprint.toolPermissions.filter((item) => item.riskLevel === 'high').map((item) => item.label) },
    },
    {
      id: 'approval',
      layer: 2,
      type: 'approval',
      title: '人工确认',
      subtitle: '高风险动作默认人工确认',
      icon: 'shield',
      status: 'done',
      data: { 确认点: blueprint.approvalPolicies.map((item) => item.action) },
    },
    {
      id: 'exceptions',
      layer: 3,
      type: 'exception',
      title: '异常处理',
      subtitle: '无法判断时不自动脑补',
      icon: 'alert',
      status: 'done',
      data: { 异常: blueprint.exceptionPolicies.map((item) => item.condition) },
    },
    {
      id: 'acceptance',
      layer: 3,
      type: 'acceptance',
      title: '验收指标',
      subtitle: '上线前用样本验证',
      icon: 'check',
      status: 'done',
      data: { 指标: blueprint.acceptanceCriteria.map((item) => `${item.metric} ${item.target}`) },
    },
    {
      id: 'launch',
      layer: 3,
      type: 'launch',
      title: '上线清单',
      subtitle: '测试通过后确认入职',
      icon: 'flag',
      status: project.status === 'ready_to_deploy' || project.status === 'deployed' ? 'done' : 'configuring',
      data: { 清单: blueprint.launchChecklist.map((item) => `${item.status === 'passed' ? '已通过' : '待确认'} ${item.label}`) },
    },
  ];
}

function activeLayerFromStage(project: BuilderProject): number {
  if (project.stage === 'idea' || project.stage === 'interview') return 1;
  if (project.stage === 'blueprint') return 2;
  return 3;
}

export default function BuilderChat({
  project,
  onProjectChange,
  onNodesChange,
  onActiveLayerChange,
}: BuilderChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好，我是岗位共创 Builder。请直接描述你想创建的数字员工，例如：帮我每月催客户交资料，发送前需要会计确认。',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const applyProject = useCallback((nextProject: BuilderProject) => {
    onProjectChange(nextProject);
    onNodesChange(buildNodesFromProject(nextProject));
    onActiveLayerChange(activeLayerFromStage(nextProject));
  }, [onActiveLayerChange, onNodesChange, onProjectChange]);

  const handleSend = useCallback(async (presetText?: string) => {
    const text = (presetText ?? input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Call real LLM API via builder.chat
      const builderModule = getBuilderModule();
      const response = await builderModule.chat({
        projectId: project?.id,
        message: text,
        context: {
          project: project, // Pass current project state for context
          model: 'glm-4.6',
          temperature: 0.7,
        },
      });

      // Update project with LLM response
      applyProject(response.project);

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.assistant_message,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('[BuilderChat] LLM call failed:', error);

      // Fallback to local rules if API fails
      const result = project ? continueInterview(project, text) : startInterview(text);
      applyProject(result.project);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: result.assistantText + '\n\n（注：当前使用本地规则引擎，LLM 服务暂不可用）',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [applyProject, input, loading, project]);

  const quickStarts = ['创建客户催收员，帮会计每月催客户交资料', '创建资料整理员，自动识别和归档客户资料', '创建老板日报员，每天汇总异常和进度'];

  return (
    <div className="flex h-full w-[344px] flex-col border-r border-border-cream bg-ivory">
      <div className="border-b border-border-cream px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
            <Bot size={18} strokeWidth={1.8} />
          </span>
          <div>
            <p className="font-serif text-sm font-semibold text-near-black">岗位共创 Builder</p>
            <p className="text-[11px] text-stone-gray">用业务语言设计可上岗数字员工</p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
                  <Sparkles size={13} />
                </span>
              )}
              <div className={`max-w-[86%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-terracotta/10 text-near-black' : 'bg-warm-sand/50 text-charcoal-warm'}`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
                <Sparkles size={13} />
              </span>
              <div className="flex items-center gap-1.5 rounded-2xl bg-warm-sand/50 px-3 py-2 text-sm text-stone-gray">
                <Loader2 size={14} className="animate-spin" />
                正在整理岗位蓝图...
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!project && (
        <div className="space-y-2 border-t border-border-cream px-3 py-3">
          {quickStarts.map((item) => (
            <button
              key={item}
              onClick={() => handleSend(item)}
              className="w-full rounded-xl border border-border-warm bg-parchment px-3 py-2 text-left text-xs text-olive-gray transition-colors hover:border-terracotta/30 hover:text-terracotta"
            >
              {item}
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-border-cream px-3 py-3">
        <div className="flex items-center gap-2 rounded-2xl border border-border-warm bg-parchment px-3 py-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && !event.shiftKey && handleSend()}
            disabled={loading}
            placeholder={project ? '补充业务规则或确认默认方案...' : '描述你想创建的数字员工...'}
            className="min-w-0 flex-1 bg-transparent text-sm text-near-black outline-none placeholder:text-stone-gray/60 disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-terracotta text-white transition-opacity hover:opacity-90 disabled:opacity-30"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} strokeWidth={2} />}
          </button>
        </div>
      </div>
    </div>
  );
}
