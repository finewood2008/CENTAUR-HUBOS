import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Plus, UserCircle, Zap, FileText, Database, Layers, CheckCircle2, Loader2, Workflow, FolderGit2 } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// Mock Data
const ROSTER = [
  { 
    id: 'spark', 
    name: '火花 (Spark)', 
    role: '首席品牌官 (CBO)', 
    avatar: '🔥', 
    status: 'active', 
    desc: '负责品牌视觉、海报生成与UI设计',
    prompt: '你是一个顶尖的品牌视觉专家...',
    tools: ['Figma 操控', 'Midjourney 绘图', '文案生成'],
    rag: ['BRAND.md (品牌规范)', '历史高转化海报库']
  },
  { 
    id: 'data', 
    name: '老李', 
    role: '数据分析总监', 
    avatar: '📊', 
    status: 'idle', 
    desc: '负责销售数据统计与业务报表',
    prompt: '你是一个严谨的数据分析师，精通 SQL 与 Python...',
    tools: ['Python 执行器', 'SQLite 直连', '图表生成库'],
    rag: ['Q1-Q3 销售数据.csv', '财务合规说明书']
  },
  { 
    id: 'hr', 
    name: '小红', 
    role: '人事助理', 
    avatar: '👋', 
    status: 'training', 
    desc: '负责员工请假、考勤与报销流转',
    prompt: '你是公司的人事大管家，态度温和...',
    tools: ['钉钉 API', '企业微信 API', '邮件发送'],
    rag: ['2026年员工手册.pdf', '最新劳动法解释']
  },
];

export default function App() {
  const [activeEmployee, setActiveEmployee] = useState(ROSTER[0]);
  const [middleTab, setMiddleTab] = useState<'chat' | 'profile'>('chat');
  
  const [messages, setMessages] = useState([
    { role: 'agent', type: 'text', content: '老板好！我是火花 (Spark)。底座算力运转正常。今天公司需要我输出什么设计资产？' },
  ]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [assets, setAssets] = useState([
    { id: 1, name: '企业中秋节礼盒包装设计.fig', type: 'design', date: '2026-04-10', by: '火花' },
    { id: 2, name: 'Q1华南区销售数据洞察.pdf', type: 'report', date: '2026-04-09', by: '老李' }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', type: 'text', content: inputText }]);
    setInputText('');
    setMiddleTab('chat');
    setIsGenerating(true);
    
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'agent', 
        type: 'text', 
        content: `收到任务。我已读取企业知识库中的【BRAND.md】，正在严格按照 #FF6B35 品牌色进行生成，请稍候...` 
      }]);
    }, 800);

    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'agent', 
        type: 'task', 
        content: `执行指令：生成交互式原型应用` 
      }]);
    }, 1500);

    setTimeout(() => {
      setAssets(prev => [{ id: 3, name: '门店扫码登记系统 (H5).zip', type: 'app', date: '2026-04-11', by: activeEmployee.name }, ...prev]);
      setIsGenerating(false);
      setMessages(prev => [...prev, { 
        role: 'agent', 
        type: 'text', 
        content: `资产已生成完毕并打包存入右侧【企业数字资产库】。你现在可以直接点击预览或一键分发到局域网。` 
      }]);
    }, 4000);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-screen w-full flex bg-[#f3f4f6] p-4 gap-4 overflow-hidden relative font-sans select-none">
      
      {/* Background Decorative Blob for V1 Glassmorphism */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-orange rounded-full mix-blend-multiply filter blur-[128px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-10 pointer-events-none" />

      {/* Pane 1: Employee Roster (数字人事部) */}
      <div className="w-80 h-full glass rounded-3xl flex flex-col overflow-hidden z-10 border border-white/60 shadow-xl shadow-gray-200/50 drag-region">
        <div className="p-6 border-b border-white/40 bg-white/30 no-drag">
          <div className="flex items-center justify-between mb-6 pt-4">
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-orange text-white rounded-lg flex items-center justify-center font-bold shadow-md shadow-brand-orange/30">C</div>
              半人马人事部
            </h1>
          </div>
          
          <button className="w-full bg-brand-orange hover:bg-brand-orange-dark text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-medium transition-colors shadow-md shadow-brand-orange/20">
            <Plus size={18} />
            招聘新数字员工
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-drag">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">在职员工 (Roster)</span>
            <span className="text-[10px] bg-white px-2 py-0.5 rounded-full text-gray-500 shadow-sm">3 运行中</span>
          </div>
          
          {ROSTER.map((emp) => (
            <div 
              key={emp.id}
              onClick={() => setActiveEmployee(emp)}
              className={clsx(
                "p-3 rounded-2xl cursor-pointer transition-all border",
                activeEmployee.id === emp.id 
                  ? "bg-white border-brand-orange/30 shadow-sm ring-1 ring-brand-orange/10" 
                  : "bg-white/40 border-transparent hover:bg-white/80"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-xl shrink-0 shadow-inner">
                  {emp.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 text-sm">{emp.name}</h3>
                    <div className={clsx(
                      "w-2 h-2 rounded-full",
                      emp.status === 'active' ? 'bg-brand-orange animate-pulse shadow-[0_0_8px_#FF6B35]' :
                      emp.status === 'idle' ? 'bg-green-500' : 'bg-gray-400'
                    )} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{emp.role}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="mt-6 px-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">基础设置</div>
            <div className="bg-white/40 rounded-xl p-2 space-y-1">
               <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-white/60 rounded-lg transition-colors text-left">
                 <Database size={16} className="text-blue-500" /> 企业共享知识库
               </button>
               <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-white/60 rounded-lg transition-colors text-left">
                 <Workflow size={16} className="text-purple-500" /> API 工作流编排
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pane 2: Interaction/Profile Area */}
      <div className="flex-1 h-full glass rounded-3xl flex flex-col overflow-hidden z-10 border border-white/60 shadow-xl shadow-gray-200/50 pt-6 no-drag">
        {/* Header Tabs */}
        <div className="px-6 pb-4 border-b border-white/40 flex items-center justify-between bg-white/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-2xl border border-gray-100">{activeEmployee.avatar}</div>
            <div>
              <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                {activeEmployee.name}
                <span className="text-[10px] font-normal bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded-full border border-brand-orange/20">Agent</span>
              </h2>
              <span className="text-xs text-gray-500">{activeEmployee.desc}</span>
            </div>
          </div>
          
          <div className="flex bg-gray-100/80 p-1 rounded-xl shadow-inner border border-white/50">
            <button 
              onClick={() => setMiddleTab('chat')}
              className={clsx("px-4 py-1.5 rounded-lg text-sm font-medium transition-all", middleTab === 'chat' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700")}
            >
              沟通协作
            </button>
            <button 
              onClick={() => setMiddleTab('profile')}
              className={clsx("px-4 py-1.5 rounded-lg text-sm font-medium transition-all", middleTab === 'profile' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700")}
            >
              能力档案
            </button>
          </div>
        </div>

        {/* Content Area */}
        {middleTab === 'chat' ? (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white/10">
              <AnimatePresence>
                {messages.map((msg, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={clsx(
                      "flex max-w-[85%]",
                      msg.role === 'user' ? "ml-auto justify-end" : "mr-auto justify-start"
                    )}
                  >
                    {msg.role === 'agent' && msg.type === 'text' && (
                      <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mr-3 mt-1 shrink-0 text-sm border border-gray-100">
                        {activeEmployee.avatar}
                      </div>
                    )}
                    
                    {msg.type === 'text' ? (
                      <div className={clsx(
                        "px-5 py-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm border",
                        msg.role === 'user' 
                          ? "bg-brand-orange text-white border-brand-orange/50 rounded-tr-none shadow-[0_4px_12px_rgba(255,107,53,0.15)]" 
                          : "bg-white text-gray-800 border-gray-100 rounded-tl-none"
                      )}>
                        {msg.content}
                      </div>
                    ) : (
                      // 任务卡片 V1 风格
                      <div className="ml-11 w-72 bg-white border border-gray-200 rounded-2xl p-5 shadow-md">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1">
                            <Layers size={10} /> 任务处理中
                          </span>
                          <Loader2 size={16} className="text-brand-orange animate-spin" />
                        </div>
                        <h4 className="font-bold text-gray-800 text-sm mb-3">{msg.content}</h4>
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden shadow-inner">
                          <div className="bg-gradient-to-r from-brand-orange to-brand-orange-light h-2 rounded-full w-3/4 animate-pulse"></div>
                        </div>
                        <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                           正在调度本地底层资源...
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white/30 backdrop-blur-md border-t border-white/40">
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input 
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`将任务下发给 ${activeEmployee.name} (自然语言描述需求)...`}
                  className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-4 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange/50 shadow-sm transition-all text-gray-800 placeholder-gray-400"
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim()}
                  className="absolute right-2 top-2 bottom-2 aspect-square bg-gray-900 hover:bg-black text-white rounded-xl flex items-center justify-center disabled:opacity-50 transition-colors shadow-md"
                >
                  <Zap size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Profile Tab (功能加厚：显示员工配置) */
          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white/10">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
               <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                 <UserCircle className="text-gray-400" size={18} /> 系统人设 (System Prompt)
               </h3>
               <div className="bg-gray-50 text-gray-600 p-4 rounded-xl text-sm font-mono leading-relaxed border border-gray-100 shadow-inner">
                 {activeEmployee.prompt} <br/><br/>
                 <span className="text-brand-orange opacity-80">// 你可以点击编辑来微调该员工的性格与执行策略</span>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                     <Workflow className="text-blue-500" size={18} /> 挂载的技能 (Tools)
                   </h3>
                   <button className="text-xs text-brand-orange hover:underline">管理</button>
                 </div>
                 <div className="space-y-2">
                   {activeEmployee.tools.map(tool => (
                     <div key={tool} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                       <CheckCircle2 size={14} className="text-green-500" /> {tool}
                     </div>
                   ))}
                 </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                     <Database className="text-emerald-500" size={18} /> 专属私有记忆 (RAG)
                   </h3>
                   <button className="text-xs text-brand-orange hover:underline">上传资料</button>
                 </div>
                 <div className="space-y-2">
                   {activeEmployee.rag.map(doc => (
                     <div key={doc} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-100">
                       <FileText size={14} className="text-gray-400" /> {doc}
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pane 3: Workspace & Assets Center (企业资产大盘) */}
      <div className="w-[380px] h-full flex flex-col gap-4 z-10 pt-6 no-drag">
        
        {/* Active Workspace / Preview */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col border border-gray-100 h-3/5">
          <div className="h-12 bg-gray-50/80 border-b border-gray-100 flex items-center px-4 gap-3">
            <Monitor size={16} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-600">工作台预览 (Workspace)</span>
          </div>
          <div className="flex-1 bg-gray-100 p-4 flex flex-col items-center justify-center relative overflow-hidden">
            {isGenerating ? (
              <div className="text-center">
                <Loader2 size={32} className="animate-spin text-brand-orange mx-auto mb-3" />
                <p className="text-sm text-gray-500">正在调用本地大模型生成应用...</p>
              </div>
            ) : (
              <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="w-full h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                 <div className="h-24 bg-gradient-to-r from-gray-900 to-gray-800 p-4 relative overflow-hidden flex items-center justify-center">
                   <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-brand-orange rounded-full opacity-20 blur-xl"></div>
                   <h3 className="text-white font-bold text-lg relative z-10">门店抽奖系统演示</h3>
                 </div>
                 <div className="flex-1 p-4 flex flex-col gap-3">
                    <div className="h-8 bg-gray-100 rounded-lg w-full"></div>
                    <div className="flex gap-2">
                      <div className="h-20 bg-gray-50 rounded-lg flex-1 border border-gray-100"></div>
                      <div className="h-20 bg-gray-50 rounded-lg flex-1 border border-gray-100"></div>
                    </div>
                    <div className="mt-auto h-10 bg-brand-orange text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md shadow-brand-orange/20 cursor-pointer">部署至本地服务器</div>
                 </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Corporate Asset Center */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
              <FolderGit2 className="text-brand-orange" size={16} /> 
              企业数字资产库
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {assets.map((asset) => (
              <div key={asset.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-gray-100">
                <div className={clsx(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  asset.type === 'design' ? "bg-pink-50 text-pink-500" :
                  asset.type === 'report' ? "bg-blue-50 text-blue-500" : "bg-brand-orange/10 text-brand-orange"
                )}>
                  {asset.type === 'design' ? <Layers size={18} /> : asset.type === 'report' ? <FileText size={18} /> : <Monitor size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800 truncate">{asset.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5 flex gap-2">
                    <span>{asset.date}</span>
                    <span>·</span>
                    <span>By: {asset.by}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}