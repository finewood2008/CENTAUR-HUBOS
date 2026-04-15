// Hub OS - 员工管理（市场 + 档案 + 架构师面谈）
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, UserCircle, MessageSquarePlus, Search, Download, ChevronRight,
  Shield, Database, Wrench, Zap, Bot, ArrowLeft, Radio, Plus, Check, AlertCircle,
  Sparkles, Bell,
} from 'lucide-react';
import { getAgentModule } from '../../services/qeeclaw';
import type { Agent, Template } from '../../types';
import AgentBuilder from './AgentBuilder';

type SubView = 'builder' | 'market' | 'roster' | 'detail';

interface AgentManagementProps {
  agents: Agent[];
  templates: Template[];
  isConnected: boolean;
}

export default function AgentManagement({ agents, templates, isConnected }: AgentManagementProps) {
  const [subView, setSubView] = useState<SubView>('builder');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // 入职弹窗状态
  const [hireTarget, setHireTarget] = useState<Template | null>(null);
  const [hiring, setHiring] = useState(false);
  const [hireResult, setHireResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const openDetail = (agent: Agent) => {
    setSelectedAgent(agent);
    setSubView('detail');
  };

  const handleHire = async (tpl: Template) => {
    setHiring(true);
    setHireResult(null);
    try {
      if (!isConnected) throw new Error('SDK 离线，无法创建员工');
      await getAgentModule().create({
        name: tpl.name,
        description: tpl.desc,
        model: tpl.model,
        runtimeType: 'hermes',
      });
      setHireResult({ ok: true, msg: `${tpl.name} 入职成功！已加入花名册。` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '创建失败，请稍后重试';
      setHireResult({ ok: false, msg });
    } finally {
      setHiring(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 顶部 Tab */}
      <div className="px-6 pt-5 pb-3 flex items-center gap-1 border-b border-white/5">
        {subView === 'detail' && selectedAgent ? (
          <button
            onClick={() => setSubView('roster')}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors mr-3"
          >
            <ArrowLeft size={16} /> 返回
          </button>
        ) : (
          <>
            <TabBtn active={subView === 'builder'} onClick={() => setSubView('builder')} icon={<Sparkles size={14} />} label="打造员工" />
            <TabBtn active={subView === 'market'} onClick={() => setSubView('market')} icon={<Store size={14} />} label="AI 人力市场" />
            <TabBtn active={subView === 'roster'} onClick={() => setSubView('roster')} icon={<UserCircle size={14} />} label="花名册" count={agents.length} />
          </>
        )}
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {subView === 'market' && (
            <motion.div key="market" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Market templates={templates} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onHire={setHireTarget} />
            </motion.div>
          )}
          {subView === 'roster' && (
            <motion.div key="roster" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Roster agents={agents} onSelect={openDetail} />
            </motion.div>
          )}
          {subView === 'builder' && (
            <motion.div key="builder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AgentBuilder isConnected={isConnected} />
            </motion.div>
          )}
          {subView === 'detail' && selectedAgent && (
            <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AgentDetail agent={selectedAgent} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 入职确认弹窗 */}
      <AnimatePresence>
        {hireTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => { if (!hiring) { setHireTarget(null); setHireResult(null); } }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-[400px] shadow-2xl"
            >
              {hireResult ? (
                /* 结果反馈 */
                <div className="text-center">
                  <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4 ${hireResult.ok ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
                    {hireResult.ok ? <Check size={28} className="text-green-400" /> : <AlertCircle size={28} className="text-red-400" />}
                  </div>
                  <p className={`text-sm mb-5 ${hireResult.ok ? 'text-green-300' : 'text-red-300'}`}>{hireResult.msg}</p>
                  <button
                    onClick={() => {
                      setHireTarget(null);
                      setHireResult(null);
                      if (hireResult.ok) setSubView('roster');
                    }}
                    className="px-5 py-2 bg-white/10 text-white text-sm rounded-xl hover:bg-white/15 transition-colors"
                  >
                    {hireResult.ok ? '查看花名册' : '关闭'}
                  </button>
                </div>
              ) : (
                /* 确认界面 */
                <>
                  <div className="flex items-start gap-4 mb-5">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${hireTarget.color} flex items-center justify-center text-2xl shadow-lg shrink-0`}>
                      {hireTarget.avatar}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">{hireTarget.name}</h3>
                      <p className="text-xs text-gray-400 mt-1">{hireTarget.desc}</p>
                    </div>
                  </div>

                  <div className="bg-white/[0.03] rounded-xl p-3 mb-5 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">模型</span>
                      <span className="text-gray-300">{hireTarget.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">分类</span>
                      <span className="text-gray-300">{hireTarget.category}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-500 shrink-0">技能</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {hireTarget.skills.map((s) => (
                          <span key={s} className="px-1.5 py-0.5 bg-white/5 text-gray-400 rounded text-[10px]">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => { setHireTarget(null); setHireResult(null); }}
                      disabled={hiring}
                      className="flex-1 py-2.5 text-sm text-gray-400 bg-white/5 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleHire(hireTarget)}
                      disabled={hiring}
                      className="flex-1 py-2.5 text-sm text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {hiring ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          入职中...
                        </>
                      ) : (
                        <>
                          <Check size={14} /> 确认入职
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── 子视图：员工市场（分层展示） ───
function Market({
  templates, searchTerm, setSearchTerm, onHire,
}: {
  templates: Template[];
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  onHire: (tpl: Template) => void;
}) {
  const filtered = templates.filter(
    (t) => t.name.includes(searchTerm) || t.desc.includes(searchTerm) || t.category.includes(searchTerm),
  );

  const live = filtered.filter((t) => t.status === 'live');
  const coming = filtered.filter((t) => t.status === 'coming');
  const planned = filtered.filter((t) => t.status === 'planned');

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-white">AI 人力市场</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {templates.length} 个岗位 · {live.length} 个已上线 · {coming.length} 个即将上线
          </p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索岗位..."
            className="pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30 w-48"
          />
        </div>
      </div>

      {/* ── 已上线 ── */}
      {live.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-green-400 rounded-full shadow-sm shadow-green-400/50" />
            <span className="text-xs font-medium text-green-400">已上线</span>
            <span className="text-[10px] text-gray-600">一键入职，即刻上岗</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {live.map((tpl, i) => (
              <motion.div
                key={tpl.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/[0.03] rounded-xl border border-green-500/15 p-5 hover:border-green-500/30 transition-all group relative overflow-hidden"
              >
                {/* 已上线标签 */}
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] px-2 py-0.5 bg-green-500/15 text-green-400 rounded-full border border-green-500/20">
                    {tpl.statusLabel || '已上线'}
                  </span>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tpl.color} flex items-center justify-center text-2xl shadow-lg mb-3`}>
                  {tpl.avatar}
                </div>
                <h3 className="text-sm font-medium text-white mb-1">{tpl.name}</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-3">{tpl.desc}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {tpl.skills.map((s) => (
                    <span key={s} className="text-[10px] px-1.5 py-0.5 bg-white/5 text-gray-400 rounded">{s}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-600">{tpl.category} · {tpl.model.split('/').pop()?.split('-').slice(0, 2).join('-')}</span>
                  <button
                    onClick={() => onHire(tpl)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-orange-500/10 text-orange-400 text-xs rounded-lg hover:bg-orange-500/20 transition-colors border border-orange-500/20 opacity-0 group-hover:opacity-100"
                  >
                    <Download size={12} /> 入职
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── 即将上线 ── */}
      {coming.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-amber-400 rounded-full" />
            <span className="text-xs font-medium text-amber-400">即将上线</span>
            <span className="text-[10px] text-gray-600">内测中，敬请期待</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {coming.map((tpl, i) => (
              <motion.div
                key={tpl.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/[0.03] rounded-xl border border-white/5 p-5 hover:border-amber-500/20 transition-all relative"
              >
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/15">
                    {tpl.statusLabel || '即将上线'}
                  </span>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tpl.color} flex items-center justify-center text-2xl shadow-lg mb-3 opacity-80`}>
                  {tpl.avatar}
                </div>
                <h3 className="text-sm font-medium text-white mb-1">{tpl.name}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{tpl.desc}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {tpl.skills.slice(0, 3).map((s) => (
                    <span key={s} className="text-[10px] px-1.5 py-0.5 bg-white/5 text-gray-400 rounded">{s}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-600">{tpl.category}</span>
                  <button className="flex items-center gap-1 px-3 py-1.5 bg-white/5 text-gray-500 text-xs rounded-lg border border-white/5 cursor-default">
                    <Bell size={12} /> 关注上线
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── 规划中 ── */}
      {planned.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-gray-600 rounded-full" />
            <span className="text-xs font-medium text-gray-500">规划中</span>
            <span className="text-[10px] text-gray-700">更多 AI 员工正在路上</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {planned.map((tpl, i) => (
              <motion.div
                key={tpl.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white/[0.02] rounded-xl border border-white/5 p-4 opacity-60 hover:opacity-80 transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${tpl.color} flex items-center justify-center text-lg opacity-60`}>
                    {tpl.avatar}
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-gray-300">{tpl.name}</h3>
                    <span className="text-[10px] text-gray-600">{tpl.category}</span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-2">{tpl.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 子视图：花名册 ───
function Roster({ agents, onSelect }: { agents: Agent[]; onSelect: (a: Agent) => void }) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">员工花名册</h2>
        <p className="text-xs text-gray-500 mt-0.5">共 {agents.length} 名数字员工在册</p>
      </div>
      <div className="space-y-3">
        {agents.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => onSelect(agent)}
            className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-xl border border-white/5 hover:border-orange-500/20 transition-all cursor-pointer group"
          >
            <span className="text-2xl">{agent.avatar}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{agent.name}</span>
                <StatusBadge status={agent.status} />
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{agent.role} · {agent.model}</p>
            </div>
            <div className="text-right mr-2">
              <div className="text-xs text-gray-400">今日 {agent.todayTasks} 个任务</div>
              <div className="text-[10px] text-gray-600 mt-0.5">配额 {agent.budgetUsed}/{agent.budgetPercent}%</div>
            </div>
            <ChevronRight size={16} className="text-gray-700 group-hover:text-orange-400 transition-colors" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// 渠道类型元数据
const CHANNEL_TYPES: Record<string, { icon: string; label: string }> = {
  wecom: { icon: '💬', label: '企业微信' },
  feishu: { icon: '🐦', label: '飞书' },
  telegram: { icon: '✈️', label: 'Telegram' },
  dingtalk: { icon: '🔵', label: '钉钉' },
  email: { icon: '📧', label: '邮件' },
  whatsapp: { icon: '📱', label: 'WhatsApp' },
  slack: { icon: '🟣', label: 'Slack' },
  webhook: { icon: '🔗', label: 'Webhook' },
};

// ─── 子视图：员工详情档案卡 ───
function AgentDetail({ agent }: { agent: Agent }) {
  const quotaRatio = agent.budgetUsed / agent.budgetPercent;
  const quotaColor = quotaRatio > 0.9 ? 'bg-red-500' : quotaRatio > 0.7 ? 'bg-amber-500' : 'bg-green-500';
  const ch = agent.channel;
  const chMeta = ch ? CHANNEL_TYPES[ch.type] : null;

  return (
    <div className="max-w-2xl">
      {/* 头部 */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl border border-white/10">
          {agent.avatar}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-white">{agent.name}</h2>
            <StatusBadge status={agent.status} />
          </div>
          <p className="text-sm text-gray-400 mt-0.5">{agent.role}</p>
          <p className="text-xs text-gray-600 mt-1">模型：{agent.model} · 端口：{agent.port} · 入职日期：{agent.hireDate}</p>
        </div>
      </div>

      {/* 信息卡片网格 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* 通讯渠道 */}
        <InfoCard icon={<Radio size={16} />} title="通讯渠道" color="text-orange-400">
          {ch && chMeta ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">{chMeta.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white font-medium">{ch.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                      ch.status === 'active' ? 'bg-green-500/15 text-green-400' :
                      ch.status === 'error' ? 'bg-red-500/15 text-red-400' :
                      'bg-gray-500/15 text-gray-400'
                    }`}>
                      {ch.status === 'active' ? '在线' : ch.status === 'error' ? '异常' : '未启用'}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-600">{chMeta.label}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 text-[10px] py-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                  配置
                </button>
                <button className="flex-1 text-[10px] py-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                  测试连接
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[11px] text-gray-600">该员工尚未接入通讯渠道</p>
              <div className="grid grid-cols-4 gap-1.5">
                {Object.entries(CHANNEL_TYPES).slice(0, 4).map(([type, meta]) => (
                  <button
                    key={type}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg border border-dashed border-white/10 hover:border-orange-500/30 hover:bg-white/[0.03] transition-all"
                  >
                    <span className="text-base">{meta.icon}</span>
                    <span className="text-[9px] text-gray-500">{meta.label}</span>
                  </button>
                ))}
              </div>
              <button className="w-full flex items-center justify-center gap-1 text-[10px] py-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors border border-orange-500/20">
                <Plus size={10} /> 接入渠道
              </button>
            </div>
          )}
        </InfoCard>

        {/* 能力标签 */}
        <InfoCard icon={<Bot size={16} />} title="能力标签" color="text-blue-400">
          <div className="flex flex-wrap gap-1.5">
            {agent.skills.map((s) => (
              <span key={s} className="text-[11px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/10">{s}</span>
            ))}
          </div>
        </InfoCard>

        {/* 工具权限 */}
        <InfoCard icon={<Wrench size={16} />} title="工具权限" color="text-green-400">
          <div className="flex flex-wrap gap-1.5">
            {agent.tools.map((t) => (
              <span key={t} className="text-[11px] px-2 py-0.5 bg-green-500/10 text-green-400 rounded-md border border-green-500/10">{t}</span>
            ))}
          </div>
        </InfoCard>

        {/* 数据权限 */}
        <InfoCard icon={<Database size={16} />} title="数据权限" color="text-purple-400">
          <div className="flex flex-wrap gap-1.5">
            {agent.dataSources.map((d) => (
              <span key={d} className="text-[11px] px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-md border border-purple-500/10">{d}</span>
            ))}
          </div>
        </InfoCard>

        {/* 算力预算 */}
        <InfoCard icon={<Zap size={16} />} title="算力预算" color="text-amber-400">
          <div className="mt-1">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-400">已使用 {agent.budgetUsed}%</span>
              <span className="text-gray-500">总配额 {agent.budgetPercent}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(agent.budgetUsed / agent.budgetPercent) * 100}%` }}
                transition={{ duration: 0.6 }}
                className={`h-full rounded-full ${quotaColor}`}
              />
            </div>
          </div>
        </InfoCard>
      </div>

      {/* 今日工作 */}
      <div className="bg-white/[0.03] rounded-xl border border-white/5 p-4">
        <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
          <Shield size={14} className="text-orange-400" />
          今日工作汇报
        </h3>
        <p className="text-sm text-gray-400 leading-relaxed">{agent.todaySummary}</p>
        <p className="text-[10px] text-gray-600 mt-2">完成任务数：{agent.todayTasks}</p>
      </div>
    </div>
  );
}

// Builder 已提取到 AgentBuilder.tsx

// ─── 通用小组件 ───
function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string; label: string }> = {
    running: { bg: 'bg-green-500/15', text: 'text-green-400', label: '工作中' },
    idle: { bg: 'bg-gray-500/15', text: 'text-gray-400', label: '待命' },
    error: { bg: 'bg-red-500/15', text: 'text-red-400', label: '异常' },
  };
  const c = cfg[status] || cfg.idle;
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${c.bg} ${c.text}`}>{c.label}</span>
  );
}

function InfoCard({
  icon, title, color, children,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/[0.03] rounded-xl border border-white/5 p-4">
      <h3 className={`text-xs font-medium ${color} mb-3 flex items-center gap-1.5`}>
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function TabBtn({
  active, onClick, icon, label, count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-colors ${
        active ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
      }`}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span className={`text-[10px] px-1 rounded ${active ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-gray-600'}`}>
          {count}
        </span>
      )}
    </button>
  );
}
