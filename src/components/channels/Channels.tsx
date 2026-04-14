// Hub OS - 通讯中心（渠道接入管理）
import { useState } from 'react';
import { Radio, Plus, Settings, Check, X, ChevronRight, Globe, Plug, Shield, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Agent } from '../../types';

// 渠道类型定义
interface Channel {
  id: string;
  type: string;
  icon: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  config: Record<string, string>;
}

interface AgentChannelBinding {
  agentId: string;
  agentName: string;
  agentAvatar: string;
  channels: { channelId: string; channelName: string; channelIcon: string; direction: 'in' | 'out' | 'both' }[];
}

// Mock: 已接入的渠道
const CHANNELS: Channel[] = [
  { id: 'ch-wechat-1', type: 'wecom', icon: '💬', name: '企业微信 - 主体', status: 'active', config: { corpId: 'ww****89', agentId: '100****2' } },
  { id: 'ch-feishu-1', type: 'feishu', icon: '🐦', name: '飞书 - 半人马工作区', status: 'active', config: { appId: 'cli_****f3' } },
  { id: 'ch-email-1', type: 'email', icon: '📧', name: 'SMTP/IMAP - 公司邮箱', status: 'active', config: { smtp: 'smtp.company.com', imap: 'imap.company.com' } },
  { id: 'ch-telegram-1', type: 'telegram', icon: '✈️', name: 'Telegram Bot', status: 'inactive', config: { botToken: '****' } },
  { id: 'ch-dingtalk-1', type: 'dingtalk', icon: '🔵', name: '钉钉', status: 'inactive', config: {} },
];

// Mock: Agent 与渠道的绑定关系
const BINDINGS: AgentChannelBinding[] = [
  {
    agentId: 'spark', agentName: '火花 Spark', agentAvatar: '🔥',
    channels: [
      { channelId: 'ch-wechat-1', channelName: '企业微信', channelIcon: '💬', direction: 'both' },
      { channelId: 'ch-email-1', channelName: '公司邮箱', channelIcon: '📧', direction: 'out' },
    ],
  },
  {
    agentId: 'linda', agentName: 'Linda', agentAvatar: '👩‍💼',
    channels: [
      { channelId: 'ch-feishu-1', channelName: '飞书', channelIcon: '🐦', direction: 'both' },
      { channelId: 'ch-email-1', channelName: '公司邮箱', channelIcon: '📧', direction: 'both' },
    ],
  },
  {
    agentId: 'helen', agentName: 'Helen', agentAvatar: '📢',
    channels: [
      { channelId: 'ch-wechat-1', channelName: '企业微信', channelIcon: '💬', direction: 'out' },
    ],
  },
  {
    agentId: 'laozhang', agentName: '老张', agentAvatar: '📊',
    channels: [],
  },
];

// 可接入的渠道类型
const AVAILABLE_TYPES = [
  { type: 'wecom', icon: '💬', name: '企业微信', desc: 'WeCom / 企业微信应用消息' },
  { type: 'feishu', icon: '🐦', name: '飞书', desc: 'Feishu / Lark 机器人' },
  { type: 'email', icon: '📧', name: '邮件', desc: 'SMTP/IMAP 收发邮件' },
  { type: 'telegram', icon: '✈️', name: 'Telegram', desc: 'Telegram Bot API' },
  { type: 'dingtalk', icon: '🔵', name: '钉钉', desc: 'DingTalk 企业内部应用' },
  { type: 'whatsapp', icon: '📱', name: 'WhatsApp', desc: 'WhatsApp Business API' },
  { type: 'slack', icon: '🟣', name: 'Slack', desc: 'Slack Bot / Webhook' },
  { type: 'webhook', icon: '🔗', name: 'Webhook', desc: '自定义 HTTP Webhook' },
];

type SubView = 'overview' | 'bindings';

export default function Channels() {
  const [subView, setSubView] = useState<SubView>('overview');
  const activeCount = CHANNELS.filter((c) => c.status === 'active').length;
  const boundAgents = BINDINGS.filter((b) => b.channels.length > 0).length;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Radio size={20} className="text-orange-400" />
            通讯中心
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">统一管理通讯渠道接入，为每位员工配置独立的 Channel</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 text-orange-400 text-xs rounded-lg hover:bg-orange-500/20 transition-colors border border-orange-500/20">
          <Plus size={14} /> 接入新渠道
        </button>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1 border-b border-white/5 pb-px">
        <button
          onClick={() => setSubView('overview')}
          className={`px-3 py-2 text-xs rounded-t-lg transition-colors ${
            subView === 'overview' ? 'bg-white/[0.05] text-orange-400 border-b-2 border-orange-400' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Plug size={13} className="inline mr-1.5 -mt-0.5" />
          渠道管理
        </button>
        <button
          onClick={() => setSubView('bindings')}
          className={`px-3 py-2 text-xs rounded-t-lg transition-colors ${
            subView === 'bindings' ? 'bg-white/[0.05] text-orange-400 border-b-2 border-orange-400' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Shield size={13} className="inline mr-1.5 -mt-0.5" />
          员工绑定
        </button>
      </div>

      <AnimatePresence mode="wait">
        {subView === 'overview' ? (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* 统计 */}
            <div className="grid grid-cols-3 gap-4">
              <MiniStat label="已接入渠道" value={`${activeCount}/${CHANNELS.length}`} sub="个渠道在线" color="text-green-400" />
              <MiniStat label="已绑定员工" value={`${boundAgents}/${BINDINGS.length}`} sub="个员工有渠道" color="text-blue-400" />
              <MiniStat label="可接入类型" value={String(AVAILABLE_TYPES.length)} sub="种渠道可选" color="text-purple-400" />
            </div>

            {/* 已接入渠道 */}
            <div className="bg-white/[0.03] rounded-xl border border-white/5 p-5">
              <h2 className="text-sm font-medium text-white mb-4">已接入渠道</h2>
              <div className="space-y-2">
                {CHANNELS.map((ch, i) => (
                  <motion.div
                    key={ch.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/[0.03] transition-colors group"
                  >
                    <span className="text-xl">{ch.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white font-medium">{ch.name}</span>
                        <StatusDot status={ch.status} />
                      </div>
                      <div className="text-[10px] text-gray-600 mt-0.5">
                        {Object.entries(ch.config).map(([k, v]) => `${k}: ${v}`).join(' · ') || '未配置'}
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-600">
                      {BINDINGS.filter((b) => b.channels.some((c) => c.channelId === ch.id)).length} 个员工使用
                    </div>
                    <button className="p-1.5 rounded-lg hover:bg-white/5 text-gray-600 hover:text-gray-300 transition-colors opacity-0 group-hover:opacity-100">
                      <Settings size={14} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 可接入渠道 */}
            <div className="bg-white/[0.03] rounded-xl border border-white/5 p-5">
              <h2 className="text-sm font-medium text-white mb-4">可接入渠道类型</h2>
              <div className="grid grid-cols-4 gap-3">
                {AVAILABLE_TYPES.map((at) => {
                  const connected = CHANNELS.some((c) => c.type === at.type && c.status === 'active');
                  return (
                    <div
                      key={at.type}
                      className={`p-3 rounded-lg border transition-all cursor-pointer hover:border-orange-500/20 ${
                        connected ? 'bg-white/[0.03] border-white/5' : 'bg-transparent border-dashed border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-lg">{at.icon}</span>
                        {connected && <Check size={12} className="text-green-400" />}
                      </div>
                      <div className="text-xs text-white font-medium">{at.name}</div>
                      <div className="text-[10px] text-gray-600 mt-0.5">{at.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="bindings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* 员工绑定关系 */}
            <p className="text-xs text-gray-500">每个员工独立配置通讯渠道。入站(in)表示该渠道的消息会发给这位员工，出站(out)表示员工可以通过该渠道主动发送。</p>
            <div className="space-y-3">
              {BINDINGS.map((binding, i) => (
                <motion.div
                  key={binding.agentId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white/[0.03] rounded-xl border border-white/5 p-4 hover:border-white/10 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl">{binding.agentAvatar}</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-white">{binding.agentName}</span>
                      <span className="text-[10px] text-gray-600 ml-2">
                        {binding.channels.length > 0 ? `${binding.channels.length} 个渠道` : '未配置渠道'}
                      </span>
                    </div>
                    <button className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-500 hover:text-orange-400 rounded-md hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100">
                      <Plus size={12} /> 绑定渠道
                    </button>
                  </div>

                  {binding.channels.length > 0 ? (
                    <div className="flex flex-wrap gap-2 ml-9">
                      {binding.channels.map((ch) => (
                        <div
                          key={ch.channelId}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/[0.03] rounded-lg border border-white/5 text-xs"
                        >
                          <span>{ch.channelIcon}</span>
                          <span className="text-gray-300">{ch.channelName}</span>
                          <span className={`text-[9px] px-1 py-px rounded ${
                            ch.direction === 'both' ? 'bg-blue-500/15 text-blue-400' :
                            ch.direction === 'in' ? 'bg-green-500/15 text-green-400' :
                            'bg-amber-500/15 text-amber-400'
                          }`}>
                            {ch.direction === 'both' ? '↕ 双向' : ch.direction === 'in' ? '↓ 入站' : '↑ 出站'}
                          </span>
                          <button className="ml-1 text-gray-700 hover:text-red-400 transition-colors">
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="ml-9 text-xs text-gray-700 italic">
                      该员工暂未绑定任何通讯渠道
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── 小组件 ───
function StatusDot({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; label: string }> = {
    active: { bg: 'bg-green-500/15 text-green-400', label: '在线' },
    inactive: { bg: 'bg-gray-500/15 text-gray-400', label: '未启用' },
    error: { bg: 'bg-red-500/15 text-red-400', label: '异常' },
  };
  const c = cfg[status] || cfg.inactive;
  return <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${c.bg}`}>{c.label}</span>;
}

function MiniStat({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-white/[0.03] rounded-xl border border-white/5 p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-2xl font-semibold text-white`}>{value}</div>
      <div className={`text-[11px] mt-1 ${color}`}>{sub}</div>
    </div>
  );
}
