import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Briefcase, Activity, Settings, 
  AppWindow, CheckCircle2, BrainCircuit, Database, 
  ChevronRight, Cpu, FolderTree, FileCode2, Workflow, 
  HardDrive, X, ChevronDown, Plus, Wand2, 
  Code2, PenTool, Calculator, MessageSquare, Bot, UserPlus,
  ExternalLink, Play, Server, Save, Zap, Wifi, Clock, Send, Sparkles, AlertCircle, Fingerprint, ListTodo, Key, CreditCard, ChevronUp, History, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const COLORS = {
  bg: '#0F111A',
  panel: '#1A1D27',
  border: '#2E3245',
  accent: '#FF5E00',
  textPrimary: '#E2E8F0',
  textSecondary: '#8B949E',
  success: '#00E676',
};

// ==========================================
// HARNESS 数据与模板定义
// ==========================================
type FileNode = { name: string; type: 'file' | 'dir'; desc?: string; tag?: string; status?: 'pending' | 'generating' | 'done'; children?: FileNode[]; };

const SPARK_HARNESS_TREE: FileNode[] = [
  { name: 'SOUL.md', type: 'file', desc: '核心人设与工作流边界', tag: 'IDENTITY' },
  { name: 'context-map.md', type: 'file', desc: '意图路由与上下文挂载策略', tag: 'ROUTER' },
  { name: 'self-check.md', type: 'file', desc: '全局交付前自检清单', tag: 'CHECKLIST' },
  { name: 'workflows', type: 'dir', desc: '标准作业程序 (SOP)', tag: 'DIR', children: [{ name: 'design-logo.md', type: 'file' }, { name: 'naming.md', type: 'file' }, { name: 'poster.md', type: 'file' }] },
  { name: 'standards', type: 'dir', desc: '强制执行规范', tag: 'DIR', children: [{ name: 'visual.md', type: 'file' }, { name: 'tone.md', type: 'file' }, { name: 'social.md', type: 'file' }] },
  { name: 'errors', type: 'dir', desc: '自循环进化系统', tag: 'DIR', children: [{ name: 'log.md', type: 'file' }] }
];

const STANDARD_HARNESS_TEMPLATE: FileNode[] = [
  { name: 'SOUL.md', type: 'file', desc: '核心人设与边界', tag: 'IDENTITY' },
  { name: 'context-map.md', type: 'file', desc: '意图路由与上下文', tag: 'ROUTER' },
  { name: 'self-check.md', type: 'file', desc: '全局交付前自检清单', tag: 'CHECKLIST' },
  { name: 'workflows', type: 'dir', desc: 'SOP', tag: 'DIR', children: [{ name: 'task-1.md', type: 'file' }] },
  { name: 'standards', type: 'dir', desc: '规范', tag: 'DIR', children: [{ name: 'output.md', type: 'file' }] },
  { name: 'errors', type: 'dir', desc: '自循环进化', tag: 'DIR', children: [{ name: 'log.md', type: 'file' }] }
];

const INITIAL_MOCK_FILE_CONTENT: Record<string, string> = {
  'spark/SOUL.md': `# SOUL.md - 火花的灵魂\n\n你是**火花 (Spark)**，一个专业的品牌设计专家。`,
  'spark/context-map.md': `# 核心路由与上下文挂载地图\n\n根据用户的首次输入，决定挂载哪个工作流。`,
};

const INITIAL_ROSTER = [
  { id: 'spark', name: '火花 (Spark)', role: '首席品牌官', avatar: '🔥', status: 'running', port: 3001, model: 'DeepSeek-R1-671B', harnessDir: '~/centaur/harness/spark', files: SPARK_HARNESS_TREE },
  { id: 'data', name: '老李 (Data)', role: '数据分析总监', avatar: '📊', status: 'idle', port: 3002, model: 'Centaur-Data-Pro', harnessDir: '~/centaur/harness/data_lead', files: STANDARD_HARNESS_TEMPLATE }
];

type Template = { id: string, name: string, icon: React.ReactNode, avatar: string, desc: string, params: string, color: string };
const TEMPLATES: Template[] = [
  { id: 'dev', name: '全栈开发工程师', avatar: '👨‍💻', icon: <Code2 size={24}/>, desc: '预装 React/Node.js/Python 技能栈。', params: '模型推荐: Claude-3.5-Sonnet', color: '#3B82F6' },
  { id: 'copy', name: '资深爆款文案', avatar: '✍️', icon: <PenTool size={24}/>, desc: '内置小红书/抖音爆款 SOP。', params: '模型推荐: DeepSeek-V3', color: '#EC4899' },
  { id: 'finance', name: '财务数据管家', avatar: '🧾', icon: <Calculator size={24}/>, desc: '包含发票 OCR、自动对账流。', params: '模型推荐: Centaur-Data-Pro', color: '#10B981' },
];

export default function App() {
  const [activeNav, setActiveNav] = useState<'roster' | 'market' | 'builder' | 'metrics' | 'billing'>('builder'); 
  const [roster, setRoster] = useState(INITIAL_ROSTER);
  const [selectedAgent, setSelectedAgent] = useState(INITIAL_ROSTER[0]);
  
  // Custom Builder (岗位生成) 状态
  const [messages, setMessages] = useState<{role: 'user'|'ai', content: string}[]>([
    { role: 'ai', content: '老板好！我是岗位需求架构师。请告诉我你想要招聘一个什么样的人？\n例如：“我需要一个能处理售后退换货的客服人员，脾气要好，严格遵守退款不超24小时的规定。”' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [buildTree, setBuildTree] = useState<FileNode[]>([
    { name: 'SOUL.md', type: 'file', desc: '核心人设与边界', tag: 'IDENTITY', status: 'pending' },
    { name: 'workflows', type: 'dir', desc: '标准作业程序', tag: 'DIR', status: 'pending', children: [] },
    { name: 'standards', type: 'dir', desc: '强制执行规范', tag: 'DIR', status: 'pending', children: [] },
    { name: 'self-check.md', type: 'file', desc: '全局交付前自检', tag: 'CHECKLIST', status: 'pending' },
  ]);
  const [buildStep, setBuildStep] = useState(0); 
  const [previewAgent, setPreviewAgent] = useState<any>(null);

  // Editor 状态
  const [fileContents, setFileContents] = useState<Record<string, string>>(INITIAL_MOCK_FILE_CONTENT);
  const [editingFile, setEditingFile] = useState<{name: string, content: string, path: string, fullKey: string} | null>(null);

  // Metrics
  const [cpuUsage, setCpuUsage] = useState(12);
  const [ramUsage, setRamUsage] = useState(45);
  
  // Billing
  const [apiKey, setApiKey] = useState('sk-centaur-xxxxxxxxxxxxxxxxxxxxxxxx');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, buildTree]);

  useEffect(() => {
    if (activeNav !== 'metrics') return;
    const timer = setInterval(() => {
      setCpuUsage(prev => Math.max(5, Math.min(95, prev + (Math.random() * 20 - 10))));
      setRamUsage(prev => Math.max(30, Math.min(90, prev + (Math.random() * 5 - 2))));
    }, 2000);
    return () => clearInterval(timer);
  }, [activeNav]);

  const openEditor = (filePath: string, fileName: string) => {
    const fullKey = `${selectedAgent.id}/${filePath}`;
    const content = fileContents[fullKey] || `# ${fileName}\n\n// 当前模块内容尚未初始化。`;
    setEditingFile({ name: fileName, path: filePath, content, fullKey });
  };
  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!editingFile) return;
    setEditingFile({ ...editingFile, content: e.target.value });
  };
  const saveFile = () => {
    if (!editingFile) return;
    setFileContents(prev => ({ ...prev, [editingFile.fullKey]: editingFile.content }));
  };
  const handleToggleStatus = (agentId: string) => {
    setRoster(prev => prev.map(a => a.id === agentId ? { ...a, status: a.status === 'running' ? 'idle' : 'running' } : a));
    if (selectedAgent.id === agentId) { setSelectedAgent(prev => ({ ...prev, status: prev.status === 'running' ? 'idle' : 'running' })); }
  };

  const updateTreeStatus = (nodeName: string, status: 'pending'|'generating'|'done', newChildren?: FileNode[]) => {
      setBuildTree(prev => prev.map(n => {
          if (n.name === nodeName) {
             return { ...n, status, children: newChildren || n.children };
          }
          return n;
      }));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping || buildStep >= 4) return;
    
    const newMsg = chatInput;
    setMessages(prev => [...prev, { role: 'user', content: newMsg }]);
    setChatInput('');
    setIsTyping(true);

    if (buildStep === 0) {
        updateTreeStatus('SOUL.md', 'generating');
        setTimeout(() => {
            updateTreeStatus('SOUL.md', 'done');
            setMessages(prev => [...prev, { role: 'ai', content: '收到！我已经为你生成了核心人设 (SOUL.md)。\n\n接下来，我们需要明确他的**日常工作任务**。他每天具体需要处理哪几类事情？（例如：1. 撰写产品说明书 2. 回复客户退款请求）' }]);
            setIsTyping(false);
            setBuildStep(1);
        }, 2000);
    } else if (buildStep === 1) {
        updateTreeStatus('workflows', 'generating');
        setTimeout(() => {
            updateTreeStatus('workflows', 'done', [
                { name: 'task-1.md', type: 'file', status: 'done' },
                { name: 'task-2.md', type: 'file', status: 'done' }
            ]);
            setMessages(prev => [...prev, { role: 'ai', content: '好的，工作流规则 (workflows) 已经编织完成。\n\n最后，为了防止他犯错，他有什么**绝对不能触碰的底线**或必须遵守的死板格式？（例如：决不能承诺赔偿、必须用JSON格式输出、语气必须极度谦卑等）' }]);
            setIsTyping(false);
            setBuildStep(2);
        }, 2500);
    } else if (buildStep === 2) {
        updateTreeStatus('standards', 'generating');
        setTimeout(() => {
            updateTreeStatus('standards', 'done', [
                { name: 'constraints.md', type: 'file', status: 'done' }
            ]);
            updateTreeStatus('self-check.md', 'generating');
            setTimeout(() => {
                 updateTreeStatus('self-check.md', 'done');
                 setMessages(prev => [...prev, { role: 'ai', content: '太棒了！防错清单和强制规范已全部挂载完毕。\n\n该数字员工的底层架构已**完整生成**。你可以在右侧检视最终结构，然后点击“确认并入职”将他部署到系统中。' }]);
                 setIsTyping(false);
                 setBuildStep(4); 
                 setPreviewAgent({
                    id: 'custom_' + Date.now(),
                    name: '新晋数字员工',
                    role: '定制岗位',
                    avatar: '🤖',
                    model: 'DeepSeek-V3',
                    port: 3000 + roster.length + 1,
                    summary: '架构生成完毕，随时可以入职。',
                 });
            }, 1500);
        }, 2000);
    }
  };

  const handleDeployCustom = () => {
    if (!previewAgent) return;
    const newAgent = {
      ...previewAgent,
      status: 'running',
      harnessDir: `~/centaur/harness/${previewAgent.id}`,
      files: buildTree.map(n => {
          const { status, ...rest } = n;
          if (rest.children) rest.children = rest.children.map((c: any) => { const {status: cs, ...crest} = c; return crest; });
          return rest;
      })
    };
    setRoster(prev => [...prev, newAgent as any]);
    setSelectedAgent(newAgent as any);
    setActiveNav('roster'); 
    
    setMessages([{ role: 'ai', content: '老板好！我是岗位需求架构师。请告诉我你想要招聘一个什么样的人？' }]);
    setBuildStep(0);
    setBuildTree([
        { name: 'SOUL.md', type: 'file', desc: '核心人设与边界', tag: 'IDENTITY', status: 'pending' },
        { name: 'workflows', type: 'dir', desc: '标准作业程序', tag: 'DIR', status: 'pending', children: [] },
        { name: 'standards', type: 'dir', desc: '强制执行规范', tag: 'DIR', status: 'pending', children: [] },
        { name: 'self-check.md', type: 'file', desc: '全局交付前自检', tag: 'CHECKLIST', status: 'pending' },
    ]);
    setPreviewAgent(null);
  };

  const [hiringTemplate, setHiringTemplate] = useState<{template: Template, step: number} | null>(null);
  const handleTemplateHire = (template: Template) => {
    setHiringTemplate({ template, step: 0 }); 
    setTimeout(() => setHiringTemplate({ template, step: 1 }), 800); 
    setTimeout(() => setHiringTemplate({ template, step: 2 }), 1800); 
    setTimeout(() => {
      const newAgent = {
        id: template.id + Date.now(),
        name: `${template.name}`,
        role: '标准节点',
        avatar: template.avatar,
        status: 'running',
        port: 3000 + roster.length + 1,
        model: template.params.replace('模型推荐: ', ''),
        harnessDir: `~/centaur/harness/std_${template.id}`,
        files: STANDARD_HARNESS_TEMPLATE
      };
      setRoster(prev => [...prev, newAgent as any]);
      setSelectedAgent(newAgent as any);
      setHiringTemplate(null);
      setActiveNav('roster');
    }, 2600);
  };


  return (
    <div className="h-screen w-full flex font-sans overflow-hidden select-none" style={{ backgroundColor: COLORS.bg, color: COLORS.textPrimary }}>
      
      {/* --- Sidebar Navigation --- */}
      <div className="w-[88px] h-full flex flex-col items-center py-6 flex-shrink-0 z-20 border-r" style={{ backgroundColor: COLORS.panel, borderColor: COLORS.border }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-3xl mb-12 shadow-lg cursor-pointer transition-transform hover:scale-105 active:scale-95" 
             style={{ backgroundColor: COLORS.accent, color: '#fff', boxShadow: `0 0 24px ${COLORS.accent}66` }} onClick={() => setActiveNav('roster')}>
          C
        </div>
        <div className="flex flex-col gap-8 flex-1 w-full items-center">
          <NavIcon icon={<UserPlus size={24} />} label="岗位生成" active={activeNav === 'builder'} onClick={() => {setActiveNav('builder'); setEditingFile(null);}} highlight />
          <NavIcon icon={<Users size={24} />} label="系统节点" active={activeNav === 'roster'} onClick={() => {setActiveNav('roster'); setEditingFile(null);}} />
          <NavIcon icon={<Briefcase size={24} />} label="官方市场" active={activeNav === 'market'} onClick={() => {setActiveNav('market'); setEditingFile(null);}} />
          <NavIcon icon={<Activity size={24} />} label="硬件监控" active={activeNav === 'metrics'} onClick={() => {setActiveNav('metrics'); setEditingFile(null);}} />
        </div>
        
        <div className="mt-auto w-full flex justify-center pt-8">
           <NavIcon icon={<CreditCard size={24} />} label="财务账单" active={activeNav === 'billing'} onClick={() => {setActiveNav('billing'); setEditingFile(null);}} />
        </div>
      </div>

      {/* --- Main Content --- */}
      <main className="flex-1 h-full relative overflow-hidden" style={{ backgroundColor: COLORS.bg }}>
        <div className="absolute inset-0 pointer-events-none opacity-5" style={{ backgroundImage: `linear-gradient(${COLORS.border} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.border} 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

        <AnimatePresence mode="wait">
          
          {/* ========================================================= */}
          {/* VIEW: BUILDER (岗位生成) */}
          {/* ========================================================= */}
          {activeNav === 'builder' && (
             <motion.div key="builder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex p-6 gap-6 relative z-10">
               
               {/* 左侧：AI 多轮对话区 */}
               <div className="w-2/3 h-full flex flex-col border rounded-2xl overflow-hidden shadow-2xl relative" style={{ backgroundColor: COLORS.panel, borderColor: COLORS.border }}>
                  <div className="h-20 border-b flex items-center px-8 justify-between flex-shrink-0 bg-black/20" style={{ borderColor: COLORS.border }}>
                     <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl bg-[#FF5E0020] text-[#FF5E00] flex items-center justify-center border border-[#FF5E0040]">
                          <BrainCircuit size={24}/>
                       </div>
                       <div>
                         <h2 className="font-black tracking-widest text-white text-lg">架构师面谈区</h2>
                         <p className="text-xs font-mono text-gray-400 mt-1">通过渐进式对话，逐步完善数字员工的底层架构与约束边界</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-2 text-sm font-mono text-[#00E676] bg-[#00E67610] px-3 py-1.5 rounded-full border border-[#00E67630]">
                        <div className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse"/> 引导中
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gradient-to-b from-transparent to-black/10">
                     {messages.map((msg, i) => (
                        <div key={i} className={clsx("flex gap-5 max-w-[80%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
                           <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border shadow-lg" style={{ backgroundColor: msg.role === 'user' ? '#2E3245' : '#FF5E0010', borderColor: msg.role === 'user' ? '#4A5069' : '#FF5E0050', color: msg.role === 'user' ? '#fff' : '#FF5E00' }}>
                              {msg.role === 'user' ? <Fingerprint size={20}/> : <Bot size={20}/>}
                           </div>
                           <div className={clsx("p-5 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap shadow-xl", msg.role === 'user' ? "bg-[#2E3245] text-white rounded-tr-sm" : "bg-[#0F111A] text-gray-200 rounded-tl-sm border border-[#2E3245]")}>
                              {msg.content}
                           </div>
                        </div>
                     ))}
                     {isTyping && (
                        <div className="flex gap-5 max-w-[80%]">
                           <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border bg-[#FF5E0010] border-[#FF5E0050] text-[#FF5E00] shadow-lg"><Bot size={20}/></div>
                           <div className="p-5 rounded-2xl bg-[#0F111A] border border-[#2E3245] rounded-tl-sm flex items-center gap-2">
                              <span className="w-2 h-2 bg-[#FF5E00] rounded-full animate-bounce"/>
                              <span className="w-2 h-2 bg-[#FF5E00] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}/>
                              <span className="w-2 h-2 bg-[#FF5E00] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}/>
                           </div>
                        </div>
                     )}
                     <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="p-6 border-t flex-shrink-0 bg-[#0F111A]" style={{ borderColor: COLORS.border }}>
                     <div className="relative flex items-center">
                        <textarea 
                           value={chatInput} onChange={e => setChatInput(e.target.value)}
                           onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                           placeholder={buildStep >= 4 ? "架构已完成，请在右侧确认入职。" : "回复架构师的提问，按回车发送..."}
                           disabled={isTyping || buildStep >= 4}
                           className="w-full bg-[#1A1D27] border border-[#2E3245] rounded-2xl py-5 pl-6 pr-16 text-base text-white resize-none focus:outline-none focus:border-[#FF5E00] transition-colors shadow-inner disabled:opacity-50"
                           rows={3}
                        />
                        <button type="submit" disabled={!chatInput.trim() || isTyping || buildStep >= 4} className="absolute right-4 bottom-4 p-3 rounded-xl bg-[#FF5E00] text-black disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_#FF5E0060]">
                           <Send size={20} className="ml-0.5" />
                        </button>
                     </div>
                  </form>
               </div>

               {/* 右侧：渐进式架构预览 */}
               <div className="w-1/3 h-full flex flex-col relative gap-4">
                  <div className="flex-1 border rounded-2xl flex flex-col overflow-hidden shadow-2xl bg-[#1A1D27]" style={{ borderColor: COLORS.border }}>
                     <div className="p-5 border-b bg-[#0F111A] flex items-center gap-3" style={{ borderColor: COLORS.border }}>
                        <ListTodo size={20} className="text-[#FF5E00]"/>
                        <div>
                           <h3 className="font-black text-white tracking-widest text-sm">岗位架构补全进度</h3>
                           <p className="text-[10px] font-mono text-gray-500">Auto-generating Harness files...</p>
                        </div>
                     </div>
                     <div className="flex-1 p-5 bg-[#0F111A] overflow-y-auto">
                        <LiveBuildTree nodes={buildTree} />
                     </div>
                     
                     <div className="p-5 border-t bg-[#1A1D27]" style={{ borderColor: COLORS.border }}>
                        <button 
                           onClick={handleDeployCustom} 
                           disabled={buildStep < 4}
                           className="w-full py-4 rounded-xl font-black tracking-widest text-black text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 hover:shadow-[0_0_20px_#FF5E0050] disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed disabled:hover:shadow-none" 
                           style={{ backgroundColor: COLORS.accent }}>
                           <UserPlus size={18} className="fill-black"/> 确认并入职
                        </button>
                     </div>
                  </div>
               </div>
             </motion.div>
          )}

          {/* ========================================================= */}
          {/* VIEW: ROSTER (系统节点 / 编辑器恢复) */}
          {/* ========================================================= */}
          {activeNav === 'roster' && (
             <motion.div key="roster" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex">
               <div className="w-[340px] h-full border-r flex flex-col relative z-10 shadow-2xl" style={{ backgroundColor: COLORS.panel, borderColor: COLORS.border }}>
                 <div className="p-6 pb-2">
                    <h1 className="text-xl font-black tracking-widest mb-1 flex items-center gap-2"><Server size={20} className="text-orange-500"/> CENTAUR HUB</h1>
                    <p className="text-xs text-gray-500 font-mono mb-6">本地算力总线 & 节点治理</p>
                    <div className="space-y-3">
                      {roster.map(emp => (
                        <div key={emp.id} onClick={() => { setSelectedAgent(emp as any); setEditingFile(null); }}
                             className={clsx("p-4 rounded-xl cursor-pointer flex items-center gap-4 border transition-all", selectedAgent.id === emp.id ? "bg-[#FF5E001A] border-[#FF5E00]" : "border-transparent hover:bg-white/5")}>
                          <div className="text-2xl w-10 h-10 flex items-center justify-center bg-black/20 rounded-lg">{emp.avatar}</div>
                          <div className="flex-1 min-w-0">
                             <h3 className="font-bold text-[15px] truncate">{emp.name}</h3>
                             <p className="text-[10px] font-mono mt-1 text-gray-500 truncate">PORT: {emp.port}</p>
                          </div>
                          <div className={clsx("w-2 h-2 rounded-full", emp.status === 'running' ? "bg-[#00E676] shadow-[0_0_8px_#00E676]" : "bg-gray-600")} />
                        </div>
                      ))}
                    </div>
                 </div>
               </div>
               
               <div className="flex-1 flex flex-col relative z-0 overflow-hidden" style={{ backgroundColor: COLORS.bg }}>
                  {editingFile ? (
                      <div className="flex flex-col h-full z-10 bg-[#0F111A]">
                         <div className="h-14 border-b flex items-center justify-between px-6 flex-shrink-0" style={{ borderColor: COLORS.border, backgroundColor: COLORS.panel }}>
                            <div className="flex items-center gap-3 font-mono text-sm text-gray-300">
                               <FileCode2 size={16} style={{ color: COLORS.accent }} />
                               <span className="text-gray-500">{selectedAgent.harnessDir}/</span>{editingFile.path}
                            </div>
                            <div className="flex items-center gap-4">
                               <button onClick={saveFile} className="flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold text-black transition-transform active:scale-95" style={{ backgroundColor: COLORS.accent }}>
                                  <Save size={14}/> 保存配置
                               </button>
                               <button onClick={() => setEditingFile(null)} className="text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
                            </div>
                         </div>
                         <div className="flex-1 p-0 relative">
                            <div className="absolute left-0 top-0 bottom-0 w-12 border-r bg-[#1A1D27] flex flex-col items-end py-6 pr-3 font-mono text-xs text-gray-600 select-none" style={{ borderColor: COLORS.border }}>
                               {Array.from({length: 40}).map((_, i) => <div key={i}>{i+1}</div>)}
                            </div>
                            <textarea 
                              value={editingFile.content} 
                              onChange={handleEditorChange}
                              spellCheck="false"
                              className="w-full h-full bg-transparent resize-none font-mono text-[14px] leading-relaxed focus:outline-none text-[#A6ACCD] py-6 pl-16 pr-8" 
                            />
                         </div>
                      </div>
                  ) : (
                      <div className="p-10 w-full mx-auto space-y-6 overflow-y-auto h-full pb-20">
                         <div className="flex items-stretch gap-6 mb-8 p-6 border rounded-2xl relative overflow-hidden" style={{ backgroundColor: COLORS.panel, borderColor: COLORS.border }}>
                           <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Server size={120} /></div>
                           <div className="text-6xl border rounded-2xl w-28 h-28 flex-shrink-0 flex items-center justify-center shadow-lg bg-[#0F111A] z-10" style={{ borderColor: COLORS.border }}>{selectedAgent.avatar}</div>
                           <div className="flex-1 flex flex-col justify-center z-10">
                             <div className="flex items-center gap-3 mb-2">
                               <h2 className="text-3xl font-black text-white tracking-wider">{selectedAgent.name}</h2>
                               <span className={clsx("text-[10px] font-mono px-2 py-1 border rounded uppercase tracking-widest flex items-center gap-2", selectedAgent.status === 'running' ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-gray-500/10 text-gray-400 border-gray-500/30")}>
                                 <div className={clsx("w-1.5 h-1.5 rounded-full", selectedAgent.status === 'running' ? "bg-[#00E676] animate-pulse" : "bg-gray-500")}></div>
                                 {selectedAgent.status === 'running' ? 'PROCESS_ALIVE' : 'STOPPED'}
                               </span>
                             </div>
                             <div className="text-xs font-bold text-[#FF5E00] uppercase tracking-wider mb-3">{selectedAgent.role}</div>
                             <div className="text-xs font-mono text-gray-400 flex items-center gap-4">
                                <span className="flex items-center gap-1"><HardDrive size={12}/> {selectedAgent.harnessDir}</span>
                                <span className="flex items-center gap-1"><AppWindow size={12}/> http://localhost:{selectedAgent.port}</span>
                             </div>
                           </div>
                         </div>

                         <div className="flex gap-4">
                            <button 
                               onClick={() => alert(`[系统模拟] 正在浏览器中打开 http://localhost:${selectedAgent.port}`)}
                               disabled={selectedAgent.status !== 'running'}
                               className="flex-1 py-4 rounded-xl font-black tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                               style={{ backgroundColor: COLORS.accent, color: '#000', boxShadow: selectedAgent.status === 'running' ? `0 0 20px ${COLORS.accent}40` : 'none' }}>
                               <ExternalLink size={20} className="group-hover:scale-110 transition-transform"/> 打开 {selectedAgent.name} 的独立工作台
                            </button>
                            <button 
                               onClick={() => handleToggleStatus(selectedAgent.id)}
                               className="px-8 py-4 rounded-xl font-bold tracking-wider flex items-center gap-2 border transition-colors hover:bg-white/5"
                               style={{ borderColor: COLORS.border, color: COLORS.textPrimary }}>
                               {selectedAgent.status === 'running' ? '挂起进程 (Suspend)' : <><Play size={16}/> 启动进程</>}
                            </button>
                         </div>

                         <div className="border rounded-2xl p-0 overflow-hidden shadow-2xl mt-4" style={{ backgroundColor: COLORS.panel, borderColor: COLORS.border }}>
                            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: COLORS.border }}>
                               <div className="flex items-center gap-3"><Cpu style={{ color: COLORS.accent }} size={18} /><h4 className="font-bold tracking-widest text-sm">本地 Harness 架构治理</h4></div>
                               <span className="text-xs text-orange-500/80 font-mono flex items-center gap-1">点击文件直接编辑配置</span>
                            </div>
                            <div className="p-4 bg-black/10"><FileTree nodes={selectedAgent.files} onFileClick={openEditor} /></div>
                         </div>
                      </div>
                  )}
               </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* VIEW: MARKET (官方市场恢复) */}
          {/* ========================================================= */}
          {activeNav === 'market' && (
             <motion.div key="market" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col p-8 overflow-y-auto relative z-10" style={{ backgroundColor: COLORS.bg }}>
               {hiringTemplate && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-xl bg-[#0F111A]/80">
                    <div className="flex flex-col items-center">
                       <div className="w-24 h-24 rounded-3xl bg-[#1A1D27] border border-[#2E3245] flex items-center justify-center shadow-[0_0_50px_#FF5E0033] mb-8 relative">
                          <div className="text-5xl absolute z-10">{hiringTemplate.template.avatar}</div>
                          <svg className="absolute inset-0 w-full h-full animate-spin text-[#FF5E00] opacity-50" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="100 200" /></svg>
                       </div>
                       <h2 className="text-2xl font-black tracking-widest text-white mb-4">装载部署中 - {hiringTemplate.template.name}</h2>
                       <div className="flex flex-col gap-2 w-72 text-sm font-mono text-gray-400">
                         <div className={clsx("transition-colors", hiringTemplate.step >= 0 ? "text-[#00E676]" : "")}>[✓] 读取标准 SOP 与约束...</div>
                         <div className={clsx("transition-colors", hiringTemplate.step >= 1 ? "text-[#00E676]" : "")}>{hiringTemplate.step >= 1 ? "[✓] 标准 Harness 架构写入本地" : "[ ] 挂载预设 Harness 架构..."}</div>
                         <div className={clsx("transition-colors", hiringTemplate.step >= 2 ? "text-[#00E676]" : "")}>{hiringTemplate.step >= 2 ? "[✓] 分配独立本地通信端口" : "[ ] 暴露本地通信端口..."}</div>
                       </div>
                    </div>
                  </motion.div>
                )}
               <div className="max-w-[1400px] mx-auto w-full flex-1 flex flex-col">
                  <div className="mb-10 flex justify-between items-end">
                    <div>
                      <h1 className="text-4xl font-black text-white tracking-widest mb-2 flex items-center gap-4"><Briefcase size={20} style={{ color: COLORS.accent }}/> 官方市场</h1>
                      <p className="text-sm tracking-wider opacity-50 mt-2">一键部署预配置的标准数字员工。</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-6">
                    {TEMPLATES.map(tpl => (
                        <div key={tpl.id} className="border rounded-2xl p-6 flex flex-col relative group hover:border-[#FF5E00] transition-all duration-300 bg-[#1A1D27] cursor-pointer" style={{ borderColor: COLORS.border }} onClick={() => handleTemplateHire(tpl)}>
                          <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-6 shadow-lg bg-[#0F111A]" style={{ color: tpl.color, border: `1px solid ${tpl.color}40` }}>{tpl.icon}</div>
                          <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#FF5E00] transition-colors flex items-center gap-2">{tpl.name}</h3>
                          <p className="text-sm text-gray-400 mb-8 leading-relaxed flex-1">{tpl.desc}</p>
                          <div className="mt-auto pt-6 border-t flex items-center justify-between" style={{ borderColor: COLORS.border }}>
                              <span className="text-[10px] font-mono text-gray-500">{tpl.params}</span>
                              <div className="px-3 py-1.5 rounded bg-[#FF5E001A] text-[#FF5E00] text-xs font-bold opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">一键部署</div>
                          </div>
                        </div>
                    ))}
                  </div>
               </div>
             </motion.div>
          )}

          {/* ========================================================= */}
          {/* VIEW: METRICS (系统监控恢复) */}
          {/* ========================================================= */}
          {activeNav === 'metrics' && (
             <motion.div key="metrics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col p-10 overflow-y-auto relative z-10" style={{ backgroundColor: COLORS.bg }}>
                <div className="max-w-[1400px] mx-auto w-full">
                  <div className="mb-10">
                    <h1 className="text-4xl font-black text-white tracking-widest mb-2 flex items-center gap-4"><Activity size={20} style={{ color: COLORS.accent }}/> 系统监控大屏</h1>
                    <p className="text-sm tracking-wider opacity-50 mt-2">Centaur 硬件算力节点资源大盘。</p>
                  </div>

                  <div className="grid grid-cols-3 gap-6 mb-8">
                     <div className="border rounded-2xl p-6 relative overflow-hidden" style={{ backgroundColor: COLORS.panel, borderColor: COLORS.border }}>
                        <div className="flex items-center justify-between mb-4"><span className="text-sm font-mono text-gray-400">CPU 算力占用</span><Cpu size={16} className="text-orange-500"/></div>
                        <div className="text-4xl font-black text-white">{cpuUsage.toFixed(1)}%</div>
                        <div className="absolute bottom-0 left-0 h-1 bg-orange-500 transition-all duration-1000" style={{ width: `${cpuUsage}%` }} />
                     </div>
                     <div className="border rounded-2xl p-6 relative overflow-hidden" style={{ backgroundColor: COLORS.panel, borderColor: COLORS.border }}>
                        <div className="flex items-center justify-between mb-4"><span className="text-sm font-mono text-gray-400">内存池消耗</span><HardDrive size={16} className="text-blue-500"/></div>
                        <div className="text-4xl font-black text-white">{ramUsage.toFixed(1)}%</div>
                        <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-1000" style={{ width: `${ramUsage}%` }} />
                     </div>
                     <div className="border rounded-2xl p-6 relative overflow-hidden" style={{ backgroundColor: COLORS.panel, borderColor: COLORS.border }}>
                        <div className="flex items-center justify-between mb-4"><span className="text-sm font-mono text-gray-400">活跃节点通信</span><Wifi size={16} className="text-green-500"/></div>
                        <div className="text-4xl font-black text-white">{roster.filter(r => r.status === 'running').length} / {roster.length}</div>
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500" />
                     </div>
                  </div>

                  <div className="border rounded-2xl h-[400px] flex flex-col items-center justify-center border-dashed" style={{ backgroundColor: 'rgba(26, 29, 39, 0.5)', borderColor: COLORS.border }}>
                     <Zap size={48} className="text-gray-600 mb-4" />
                     <h3 className="text-lg font-bold text-gray-400">性能图表区域 (待接入)</h3>
                     <p className="text-sm font-mono text-gray-600 mt-2">Awaiting actual Telemetry data from backend SDK...</p>
                  </div>
                </div>
             </motion.div>
          )}

          {/* ========================================================= */}
          {/* VIEW: BILLING (财务账单与 API Key) */}
          {/* ========================================================= */}
          {activeNav === 'billing' && (
             <motion.div key="billing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col p-10 overflow-y-auto relative z-10" style={{ backgroundColor: COLORS.bg }}>
                <div className="max-w-[1000px] mx-auto w-full">
                  <div className="mb-10">
                    <h1 className="text-4xl font-black text-white tracking-widest mb-2 flex items-center gap-4"><CreditCard size={20} style={{ color: COLORS.accent }}/> 财务与算力凭证</h1>
                    <p className="text-sm tracking-wider opacity-50 mt-2">管理您的 Centaur 算力密钥与云端消费明细。</p>
                  </div>

                  {/* API Key 设置区 */}
                  <div className="border rounded-2xl p-8 mb-8" style={{ backgroundColor: COLORS.panel, borderColor: COLORS.border }}>
                     <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Key size={18} className="text-orange-500"/> 算力通道密钥 (API Key)</h2>
                     <div className="flex gap-4">
                        <div className="relative flex-1">
                           <input 
                             type={showApiKey ? "text" : "password"} 
                             value={apiKey}
                             onChange={(e) => setApiKey(e.target.value)}
                             className="w-full bg-[#0F111A] border border-[#2E3245] rounded-xl py-4 px-6 text-white font-mono text-sm focus:outline-none focus:border-[#FF5E00] transition-colors"
                             placeholder="输入您的 Centaur Cloud API Key..."
                           />
                           <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white font-mono text-xs">
                             {showApiKey ? "HIDE" : "SHOW"}
                           </button>
                        </div>
                        <button className="px-8 py-4 rounded-xl font-bold text-black transition-transform active:scale-95 whitespace-nowrap" style={{ backgroundColor: COLORS.accent }}>
                           保存密钥
                        </button>
                     </div>
                     <div className="mt-4 flex items-center justify-between text-sm">
                        <p className="text-gray-500 flex items-center gap-2"><AlertCircle size={14}/> 密钥仅保存在本地设备中，用于验证数字员工的云端算力调用。</p>
                        <a href="#" className="text-orange-500 hover:underline flex items-center gap-1 font-bold">前往官网申请/充值 <ExternalLink size={14}/></a>
                     </div>
                  </div>

                  {/* 消费明细区 */}
                  <div className="border rounded-2xl overflow-hidden" style={{ backgroundColor: COLORS.panel, borderColor: COLORS.border }}>
                     <div className="p-6 border-b flex items-center justify-between bg-black/20" style={{ borderColor: COLORS.border }}>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2"><History size={18} className="text-blue-500"/> 近期消费明细</h2>
                        <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white border border-gray-600 px-3 py-1.5 rounded-lg transition-colors">
                           <Download size={14}/> 导出账单
                        </button>
                     </div>
                     
                     <div className="p-0">
                        <table className="w-full text-left text-sm">
                           <thead className="bg-[#0F111A] border-b text-gray-400 font-mono" style={{ borderColor: COLORS.border }}>
                              <tr>
                                 <th className="py-4 px-6 font-normal">发生时间</th>
                                 <th className="py-4 px-6 font-normal">调用节点 (数字员工)</th>
                                 <th className="py-4 px-6 font-normal">算力模型</th>
                                 <th className="py-4 px-6 font-normal">Token 消耗</th>
                                 <th className="py-4 px-6 font-normal text-right">费用 (CNY)</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-[#2E3245] text-gray-300">
                              <tr className="hover:bg-white/5 transition-colors">
                                 <td className="py-4 px-6 font-mono text-xs">2026-04-12 10:23:45</td>
                                 <td className="py-4 px-6 flex items-center gap-2">🔥 火花 (Spark)</td>
                                 <td className="py-4 px-6"><span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-xs font-mono">DeepSeek-R1</span></td>
                                 <td className="py-4 px-6 font-mono text-xs text-gray-400">↑1,432 ↓455</td>
                                 <td className="py-4 px-6 text-right font-mono text-orange-400">¥ 0.04</td>
                              </tr>
                              <tr className="hover:bg-white/5 transition-colors">
                                 <td className="py-4 px-6 font-mono text-xs">2026-04-12 09:15:12</td>
                                 <td className="py-4 px-6 flex items-center gap-2">👨‍💻 全栈开发工程师</td>
                                 <td className="py-4 px-6"><span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-xs font-mono">Claude-3.5-Sonnet</span></td>
                                 <td className="py-4 px-6 font-mono text-xs text-gray-400">↑8,920 ↓2,104</td>
                                 <td className="py-4 px-6 text-right font-mono text-orange-400">¥ 0.35</td>
                              </tr>
                              <tr className="hover:bg-white/5 transition-colors">
                                 <td className="py-4 px-6 font-mono text-xs">2026-04-11 16:44:02</td>
                                 <td className="py-4 px-6 flex items-center gap-2">🔥 火花 (Spark)</td>
                                 <td className="py-4 px-6"><span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-xs font-mono">DeepSeek-R1</span></td>
                                 <td className="py-4 px-6 font-mono text-xs text-gray-400">↑3,211 ↓890</td>
                                 <td className="py-4 px-6 text-right font-mono text-orange-400">¥ 0.08</td>
                              </tr>
                              <tr className="hover:bg-white/5 transition-colors">
                                 <td className="py-4 px-6 font-mono text-xs">2026-04-11 14:20:10</td>
                                 <td className="py-4 px-6 flex items-center gap-2">📊 老李 (Data)</td>
                                 <td className="py-4 px-6"><span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded text-xs font-mono">Centaur-Data-Pro</span></td>
                                 <td className="py-4 px-6 font-mono text-xs text-gray-400">↑12,500 ↓4,500</td>
                                 <td className="py-4 px-6 text-right font-mono text-orange-400">¥ 0.65</td>
                              </tr>
                           </tbody>
                        </table>
                     </div>
                     <div className="p-4 border-t bg-[#0F111A] flex justify-between items-center" style={{ borderColor: COLORS.border }}>
                        <span className="text-sm text-gray-500">显示最近 4 条记录</span>
                        <div className="flex gap-2">
                           <button className="px-3 py-1 text-xs border rounded hover:bg-white/10 transition-colors" style={{ borderColor: COLORS.border }}>上一页</button>
                           <button className="px-3 py-1 text-xs border rounded hover:bg-white/10 transition-colors" style={{ borderColor: COLORS.border }}>下一页</button>
                        </div>
                     </div>
                  </div>
                </div>
             </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}

// Subcomponents
function LiveBuildTree({ nodes, depth = 0 }: { nodes: FileNode[], depth?: number }) {
  return <div className="flex flex-col gap-2">{nodes.map(n => {
    return (
      <div key={n.name} className="flex flex-col">
         <div className={clsx("flex items-center justify-between p-3 rounded-xl border transition-all", 
             n.status === 'done' ? "bg-green-500/5 border-green-500/20" : 
             n.status === 'generating' ? "bg-orange-500/5 border-orange-500/30 shadow-[0_0_15px_rgba(255,94,0,0.1)]" : "bg-white/5 border-transparent opacity-40"
         )}>
             <div className="flex items-center gap-3">
                 {n.type === 'dir' ? <FolderTree size={16} className={n.status === 'done' ? "text-yellow-500" : "text-gray-500"}/> : <FileCode2 size={16} className={n.status === 'done' ? "text-blue-400" : "text-gray-500"}/>}
                 <div>
                    <span className={clsx("font-mono text-sm font-bold", n.status === 'done' ? "text-white" : n.status === 'generating' ? "text-orange-400" : "text-gray-500")}>{n.name}</span>
                    <span className="ml-3 text-[10px] text-gray-500">{n.desc}</span>
                 </div>
             </div>
             <div>
                 {n.status === 'done' && <CheckCircle2 size={16} className="text-green-500"/>}
                 {n.status === 'generating' && <svg className="w-4 h-4 animate-spin text-orange-500" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="100 200" /></svg>}
                 {n.status === 'pending' && <div className="w-1.5 h-1.5 rounded-full bg-gray-600"/>}
             </div>
         </div>
         {n.children && n.children.length > 0 && (
             <div className="ml-4 pl-4 border-l border-gray-700/50 mt-2">
                 <LiveBuildTree nodes={n.children} depth={depth + 1}/>
             </div>
         )}
      </div>
    );
  })}</div>;
}

function FileTree({ nodes, pathPrefix = '', onFileClick, readOnly=false }: { nodes: FileNode[], pathPrefix?: string, onFileClick: (p: string, n: string) => void, readOnly?: boolean }) {
  return <div className="flex flex-col gap-1">{nodes.map(n => {
    const fP = pathPrefix ? `${pathPrefix}/${n.name}` : n.name;
    if (n.type === 'dir') return <div key={fP} className="mb-2"><div className="flex items-center gap-3 p-2.5 rounded-lg bg-black/20"><ChevronDown size={14} className="text-gray-500" /><FolderTree size={16} className="text-yellow-500" /><span className="font-mono text-sm font-bold text-white">{n.name}/</span>{n.tag && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border ml-2 text-gray-400 border-gray-600">{n.tag}</span>}</div><div className="ml-6 pl-4 border-l border-gray-700 mt-1">{n.children && <FileTree nodes={n.children} pathPrefix={fP} onFileClick={onFileClick} readOnly={readOnly}/>}</div></div>;
    return <div key={fP} onClick={() => !readOnly && onFileClick(fP, n.name)} className={clsx("flex items-center justify-between p-2.5 rounded-lg group transition-all", readOnly ? "cursor-default" : "cursor-pointer hover:bg-black/40 border border-transparent hover:border-orange-500/30")}><div className="flex items-center gap-3"><FileCode2 size={16} className="text-gray-400 group-hover:text-orange-400" /><span className="font-mono text-sm text-gray-300 group-hover:text-orange-400">{n.name}</span>{n.tag && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border ml-2 text-orange-500 border-orange-500/40 bg-orange-500/10">{n.tag}</span>}</div>{!readOnly && <div className="opacity-0 group-hover:opacity-100 text-[10px] text-gray-500 flex items-center gap-1 font-mono"><PenTool size={10}/> Edit</div>}</div>;
  })}</div>;
}

function NavIcon({ icon, label, active, onClick, highlight=false }: { icon: React.ReactNode, label: string, active: boolean, onClick?: () => void, highlight?: boolean }) {
  return (
    <div onClick={onClick} className={clsx("group flex flex-col items-center gap-2 cursor-pointer relative w-full", active ? "" : "opacity-50 hover:opacity-100 transition-opacity")}>
      <div className={clsx("w-14 h-14 flex items-center justify-center rounded-xl transition-all border", active ? "shadow-lg bg-[#1A1D27]" : "border-transparent", highlight && !active ? "border-[#FF5E0030] text-[#FF5E00]" : "")} style={{ borderColor: active ? COLORS.border : (highlight ? '#FF5E0030' : 'transparent'), color: active ? COLORS.accent : (highlight ? '#FF5E00' : COLORS.textPrimary) }}>
         {highlight && !active && <div className="absolute inset-0 rounded-xl bg-[#FF5E00] opacity-10" />}
         {icon}
      </div>
      <span className={clsx("text-[10px] tracking-[0.1em] font-bold", highlight && !active ? "text-[#FF5E00]" : "")} style={{ color: active ? COLORS.textPrimary : (highlight ? '#FF5E00' : COLORS.textSecondary) }}>{label}</span>
      {active && <motion.div layoutId="nav-indicator" className="absolute left-0 w-1 h-14 rounded-r-md top-0" style={{ backgroundColor: COLORS.accent, boxShadow: `0 0 12px ${COLORS.accent}` }} />}
    </div>
  )
}
