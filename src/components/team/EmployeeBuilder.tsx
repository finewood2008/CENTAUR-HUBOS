// EmployeeBuilder — 对话式创建数字员工（chat → generating → trial → complete）
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MessageSquare, Send, Sparkles, RotateCcw } from 'lucide-react';
import type { DigitalEmployee, EmployeeSpec } from '../../types';
import GenerationAnimation from './GenerationAnimation';
import TrialChat from './TrialChat';

interface Props {
  onBack: () => void;
  onComplete: (employee: DigitalEmployee) => void;
}

type Phase = 'chat' | 'generating' | 'trial';

interface ChatMsg {
  role: 'user' | 'ai';
  content: string;
  options?: string[]; // quick-reply options
}

// ── Conversation engine (mock, no LLM needed) ──

interface ConvoState {
  step: number;
  spec: Partial<EmployeeSpec>;
}

const ROLE_PRESETS: Record<string, Partial<EmployeeSpec>> = {
  '品牌设计师': {
    role: '品牌设计师',
    capabilities: ['品牌设计', 'VI系统', '海报设计', '社媒内容'],
    avatar: '🎨',
    color: 'from-rose-400 to-orange-300',
    accentColor: '#f97316',
    workspaceType: 'three-panel',
  },
  '数据分析师': {
    role: '数据分析师',
    capabilities: ['数据可视化', '报表分析', '趋势预测', 'SQL查询'],
    avatar: '📊',
    color: 'from-blue-400 to-cyan-300',
    accentColor: '#3b82f6',
    workspaceType: 'dashboard',
  },
  '客户经理': {
    role: '客户经理',
    capabilities: ['客户跟进', '商务沟通', 'CRM管理', '合同处理'],
    avatar: '🤝',
    color: 'from-emerald-400 to-teal-300',
    accentColor: '#10b981',
    workspaceType: 'chat',
  },
  '内容运营': {
    role: '内容运营',
    capabilities: ['文案撰写', '社媒运营', '内容策划', 'SEO优化'],
    avatar: '✍️',
    color: 'from-violet-400 to-purple-300',
    accentColor: '#8b5cf6',
    workspaceType: 'document',
  },
  '财务助理': {
    role: '财务助理',
    capabilities: ['账务处理', '发票管理', '报销审批', '财务报表'],
    avatar: '💰',
    color: 'from-amber-400 to-yellow-300',
    accentColor: '#f59e0b',
    workspaceType: 'dashboard',
  },
};

// Each step: AI asks a question, user answers, we extract spec fields
function getNextQuestion(state: ConvoState): { content: string; options?: string[] } | null {
  const { step, spec } = state;

  switch (step) {
    case 0:
      return {
        content: '你好！我来帮你打造一位专属数字员工 ✨\n\n你希望这位员工主要负责什么方向？可以选一个，也可以直接描述。',
        options: Object.keys(ROLE_PRESETS),
      };
    case 1:
      return {
        content: `好的，${spec.role}方向！给这位员工取个名字吧？\n\n中文名就行，比如"小智"、"星辰"之类的。`,
      };
    case 2:
      return {
        content: `${spec.name}，好名字！再来一个英文名？用于系统标识，比如 "Zhi"、"Nova" 这样的。`,
      };
    case 3:
      return {
        content: `差不多了！用一句话描述 ${spec.name} 的定位？\n\n比如："你的私人数据分析专家"、"24小时在线的品牌管家"`,
      };
    case 4:
      return {
        content: `最后一步 — ${spec.name} 的性格是？`,
        options: ['专业严谨', '温暖亲切', '幽默风趣', '简洁高效'],
      };
    default:
      return null;
  }
}

function processAnswer(state: ConvoState, answer: string): { spec: Partial<EmployeeSpec>; reply?: string } {
  const { step, spec } = state;

  switch (step) {
    case 0: {
      // Role selection
      const preset = ROLE_PRESETS[answer];
      if (preset) {
        return { spec: { ...spec, ...preset } };
      }
      // Free text — try matching or create custom
      const matched = Object.entries(ROLE_PRESETS).find(([k]) =>
        answer.includes(k) || k.includes(answer)
      );
      if (matched) {
        return { spec: { ...spec, ...matched[1] } };
      }
      // Custom role
      return {
        spec: {
          ...spec,
          role: answer,
          capabilities: [answer],
          avatar: '🤖',
          color: 'from-slate-400 to-gray-300',
          accentColor: '#64748b',
          workspaceType: 'chat',
        },
      };
    }
    case 1:
      return { spec: { ...spec, name: answer.trim() } };
    case 2:
      return { spec: { ...spec, englishName: answer.trim() } };
    case 3:
      return { spec: { ...spec, tagline: answer.trim() } };
    case 4: {
      const personalityMap: Record<string, string> = {
        '专业严谨': '专业、精确、注重细节，用数据说话',
        '温暖亲切': '友善、耐心、善于倾听，像朋友一样沟通',
        '幽默风趣': '轻松、有趣、善用比喻，让工作变得愉快',
        '简洁高效': '直接、高效、不废话，直奔主题',
      };
      const personality = personalityMap[answer] || answer;
      const introduction = `你好！我是${spec.name}，你的专属${spec.role}。${spec.tagline}。我的风格是${personality}，期待和你一起工作！`;
      return {
        spec: {
          ...spec,
          personality,
          introduction,
          confirmed: true,
        },
      };
    }
    default:
      return { spec };
  }
}

// ── Convert EmployeeSpec → DigitalEmployee ──

function specToEmployee(spec: EmployeeSpec): DigitalEmployee {
  const id = `custom_${Date.now().toString(36)}`;
  return {
    id,
    name: spec.name || '新员工',
    englishName: spec.englishName || 'New',
    role: spec.role || '通用助手',
    tagline: spec.tagline || '',
    introduction: spec.introduction || '',
    avatar: spec.avatar || '🤖',
    color: spec.color || 'from-slate-400 to-gray-300',
    accentColor: spec.accentColor || '#64748b',
    status: 'inactive',
    model: spec.model || 'gemini-2.5-flash',
    capabilities: spec.capabilities || [],
    skills: (spec.skills || []).map((s) => ({ ...s, icon: 'Zap' })),
    tools: (spec.tools || []).map((t) => ({
      ...t,
      icon: 'Wrench',
      category: (t.category as 'generation' | 'analysis' | 'communication' | 'data' | 'legal' | 'finance') || 'data',
    })),
    harness: [],
    modelInfo: {
      base: spec.model || 'gemini-2.5-flash',
      reasoning: 'standard',
      context: '128k',
      specialization: spec.role || '通用',
    },
    memorySystem: {
      description: '五层记忆架构',
      layers: spec.memorylayers || ['工作记忆', '短期记忆', '长期记忆'],
    },
    workspace: {
      type: spec.workspaceType || 'chat',
      label: spec.workspaceLabel || '工作台',
    },
    onboardingPreferences: [],
    trainingDataSources: [],
    stats: { monthlyTasks: 0, hoursSaved: 0, satisfaction: 0 },
  };
}

// ── Main Component ──

export default function EmployeeBuilder({ onBack, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('chat');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [convo, setConvo] = useState<ConvoState>({ step: 0, spec: {} });
  const [generatedEmployee, setGeneratedEmployee] = useState<DigitalEmployee | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial greeting
  useEffect(() => {
    const first = getNextQuestion({ step: 0, spec: {} });
    if (first) {
      setMessages([{ role: 'ai', content: first.content, options: first.options }]);
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const send = useCallback((text?: string) => {
    const answer = (text || input).trim();
    if (!answer) return;
    setInput('');

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: answer }]);

    // Process answer
    const { spec: newSpec } = processAnswer(convo, answer);
    const nextStep = convo.step + 1;
    const nextState: ConvoState = { step: nextStep, spec: newSpec };
    setConvo(nextState);

    // Simulate thinking delay, then ask next question
    setTimeout(() => {
      const next = getNextQuestion(nextState);
      if (next) {
        setMessages((prev) => [...prev, { role: 'ai', content: next.content, options: next.options }]);
      } else {
        // All questions answered — show summary then start generating
        const s = newSpec as EmployeeSpec;
        const summary = `完美！让我确认一下：\n\n` +
          `👤 ${s.name}（${s.englishName}）\n` +
          `💼 ${s.role}\n` +
          `💬 ${s.tagline}\n` +
          `🎯 ${(s.capabilities || []).join('、')}\n` +
          `🧠 ${s.personality}\n\n` +
          `开始打造这位员工！`;
        setMessages((prev) => [...prev, { role: 'ai', content: summary }]);

        // Transition to generation phase after a brief pause
        setTimeout(() => {
          setPhase('generating');
        }, 1500);
      }
    }, 500 + Math.random() * 400);
  }, [input, convo]);

  const reset = useCallback(() => {
    setPhase('chat');
    setConvo({ step: 0, spec: {} });
    setGeneratedEmployee(null);
    const first = getNextQuestion({ step: 0, spec: {} });
    if (first) {
      setMessages([{ role: 'ai', content: first.content, options: first.options }]);
    }
  }, []);

  // ── Phase: Generating ──
  if (phase === 'generating') {
    return (
      <GenerationAnimation
        spec={convo.spec as EmployeeSpec}
        onComplete={() => {
          const emp = specToEmployee(convo.spec as EmployeeSpec);
          setGeneratedEmployee(emp);
          setPhase('trial');
        }}
      />
    );
  }

  // ── Phase: Trial ──
  if (phase === 'trial' && generatedEmployee) {
    return (
      <TrialChat
        employee={generatedEmployee}
        onBack={() => setPhase('generating')}
        onConfirm={() => onComplete(generatedEmployee)}
      />
    );
  }

  // ── Phase: Chat ──
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-parchment">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-border-cream bg-parchment/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-olive-gray hover:text-terracotta transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="w-9 h-9 rounded-xl bg-terracotta/10 flex items-center justify-center">
              <Sparkles size={18} className="text-terracotta" />
            </div>
            <div>
              <h1 className="font-serif text-lg text-near-black tracking-tight">打造员工</h1>
              <p className="text-[11px] text-stone-gray">
                通过对话描述需求，AI 为你创建专属数字员工
              </p>
            </div>
          </div>
          {convo.step > 0 && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-xs text-stone-gray hover:text-terracotta transition-colors"
            >
              <RotateCcw size={12} /> 重来
            </button>
          )}
        </div>
        {/* Progress indicator */}
        <div className="mt-3 flex gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i < convo.step
                  ? 'bg-terracotta'
                  : i === convo.step
                    ? 'bg-terracotta/40'
                    : 'bg-warm-sand'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-2.5 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-terracotta to-coral flex items-center justify-center text-sm shrink-0 shadow-sm">
                    <Sparkles size={14} className="text-white" />
                  </div>
                )}
                <div className="space-y-2">
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-terracotta/10 text-near-black rounded-br-md'
                        : 'card-glass-warm text-olive-gray rounded-bl-md'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {/* Quick-reply options */}
                  {msg.role === 'ai' && msg.options && i === messages.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex flex-wrap gap-1.5"
                    >
                      {msg.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => send(opt)}
                          className="px-3 py-1.5 rounded-lg text-xs bg-terracotta/8 text-terracotta border border-terracotta/15 hover:bg-terracotta/15 transition-colors"
                        >
                          {opt}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="shrink-0 px-6 py-4 border-t border-border-cream">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && send()}
            placeholder="输入你的回答..."
            className="flex-1 px-4 py-2.5 bg-parchment border border-border-cream rounded-xl text-sm text-near-black placeholder-stone-gray focus:outline-none focus:border-terracotta/25 transition-colors"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim()}
            className="px-4 py-2.5 bg-terracotta text-white rounded-xl hover:bg-coral transition-colors disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
