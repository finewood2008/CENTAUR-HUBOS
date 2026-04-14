// Hub OS - 通讯中心（渠道接入管理 + 监控大盘）
// 数据来源：SDK channels API → mock server fallback
import { Radio, CheckCircle, XCircle, AlertCircle, MinusCircle, RefreshCw, Wifi, WifiOff, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ChannelsData, ChannelItem } from '../../hooks/useQeeClaw';
import type { Agent } from '../../types';

// 渠道类型元数据
const CHANNEL_META: Record<string, { icon: string; label: string }> = {
  wechat_work: { icon: '💬', label: '企业微信' },
  feishu: { icon: '🐦', label: '飞书' },
  wechat_personal_plugin: { icon: '📱', label: '微信个人号' },
  wechat_personal_openclaw: { icon: '🔌', label: '微信 OpenClaw' },
  telegram: { icon: '✈️', label: 'Telegram' },
  dingtalk: { icon: '🔵', label: '钉钉' },
  email: { icon: '📧', label: '邮件' },
  whatsapp: { icon: '📱', label: 'WhatsApp' },
  slack: { icon: '🟣', label: 'Slack' },
  webhook: { icon: '🔗', label: 'Webhook' },
};

interface ChannelsProps {
  agents: Agent[];
  channelsData: ChannelsData | null;
  channelsLoading: boolean;
  onRefresh?: () => void;
}

export default function Channels({ agents, channelsData, channelsLoading, onRefresh }: ChannelsProps) {
  // 如果有 SDK 数据用 SDK 数据，否则从 agents 提取
  const hasApiData = channelsData !== null;

  // 从 agents 提取的渠道统计（fallback）
  const withChannel = agents.filter((a) => a.channel);
  const fallbackActive = withChannel.filter((a) => a.channel?.status === 'active').length;
  const fallbackError = withChannel.filter((a) => a.channel?.status === 'error').length;
  const fallbackUnlinked = agents.length - withChannel.length;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Radio size={20} className="text-orange-400" />
            通讯中心
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">渠道接入管理与状态监控</p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={channelsLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-gray-400 text-xs rounded-lg hover:bg-white/10 transition-colors border border-white/10 disabled:opacity-40"
          >
            <RefreshCw size={12} className={channelsLoading ? 'animate-spin' : ''} />
            刷新
          </button>
        )}
      </div>

      {/* 统计条 */}
      {hasApiData ? (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="支持渠道" value={channelsData.supportedCount} color="text-white" />
          <StatCard label="已配置" value={channelsData.configuredCount} color="text-blue-400" icon={<Settings size={14} />} />
          <StatCard label="已启用" value={channelsData.activeCount} color="text-green-400" icon={<Wifi size={14} />} />
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="员工总数" value={agents.length} color="text-white" />
          <StatCard label="渠道在线" value={fallbackActive} color="text-green-400" icon={<CheckCircle size={14} />} />
          <StatCard label="渠道异常" value={fallbackError} color="text-red-400" icon={<AlertCircle size={14} />} />
          <StatCard label="未接入" value={fallbackUnlinked} color="text-gray-500" icon={<MinusCircle size={14} />} />
        </div>
      )}

      {/* API 渠道列表（优先展示） */}
      {hasApiData && channelsData.items.length > 0 && (
        <div className="bg-white/[0.03] rounded-xl border border-white/5">
          <div className="px-5 py-3 border-b border-white/5">
            <h2 className="text-sm font-medium text-white">渠道列表</h2>
          </div>
          {/* 表头 */}
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] px-5 py-3 border-b border-white/5 text-[11px] text-gray-500 uppercase tracking-wider">
            <span>渠道</span>
            <span>分组</span>
            <span>配置</span>
            <span>状态</span>
            <span>风险</span>
          </div>

          {channelsData.items.map((ch: ChannelItem, i: number) => {
            const meta = CHANNEL_META[ch.channelKey] || { icon: '📡', label: ch.channelKey };

            return (
              <motion.div
                key={ch.channelKey}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] items-center px-5 py-3.5 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors"
              >
                {/* 渠道 */}
                <div className="flex items-center gap-3">
                  <span className="text-xl">{meta.icon}</span>
                  <div>
                    <span className="text-sm text-white font-medium">{ch.channelName}</span>
                    <span className="text-[10px] text-gray-600 ml-2">{ch.channelKey}</span>
                  </div>
                </div>

                {/* 分组 */}
                <div>
                  <span className="text-xs text-gray-400">
                    {ch.channelGroup === 'enterprise_collab' ? '企业协作' : '个人触达'}
                  </span>
                </div>

                {/* 配置状态 */}
                <div>
                  <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${
                    ch.configured ? 'bg-blue-500/15 text-blue-400' : 'bg-gray-500/15 text-gray-500'
                  }`}>
                    {ch.configured ? <CheckCircle size={10} /> : <MinusCircle size={10} />}
                    {ch.configured ? '已配置' : '未配置'}
                  </span>
                </div>

                {/* 启用状态 */}
                <div>
                  <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${
                    ch.enabled ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-500'
                  }`}>
                    {ch.enabled ? <Wifi size={10} /> : <WifiOff size={10} />}
                    {ch.enabled ? '已启用' : '未启用'}
                  </span>
                </div>

                {/* 风险等级 */}
                <div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                    ch.riskLevel === 'low' ? 'bg-green-500/10 text-green-500' :
                    ch.riskLevel === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                    'bg-red-500/10 text-red-500'
                  }`}>
                    {ch.riskLevel === 'low' ? '低风险' : ch.riskLevel === 'medium' ? '中风险' : '高风险'}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 员工渠道绑定表 */}
      <div className="bg-white/[0.03] rounded-xl border border-white/5">
        <div className="px-5 py-3 border-b border-white/5">
          <h2 className="text-sm font-medium text-white">员工渠道绑定</h2>
        </div>
        {/* 表头 */}
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr] px-5 py-3 border-b border-white/5 text-[11px] text-gray-500 uppercase tracking-wider">
          <span>员工</span>
          <span>渠道</span>
          <span>渠道状态</span>
          <span>员工状态</span>
        </div>

        {/* 行 */}
        {agents.map((agent, i) => {
          const ch = agent.channel;
          const meta = ch ? (CHANNEL_META[ch.type] || { icon: '📡', label: ch.type }) : null;

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="grid grid-cols-[2fr_1.5fr_1fr_1fr] items-center px-5 py-3.5 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors"
            >
              {/* 员工 */}
              <div className="flex items-center gap-3">
                <span className="text-xl">{agent.avatar}</span>
                <div>
                  <span className="text-sm text-white font-medium">{agent.name}</span>
                  <span className="text-[10px] text-gray-600 ml-2">{agent.role}</span>
                </div>
              </div>

              {/* 渠道 */}
              <div>
                {ch && meta ? (
                  <div className="flex items-center gap-2">
                    <span className="text-base">{meta.icon}</span>
                    <span className="text-xs text-gray-300">{ch.name}</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-700 italic">未接入</span>
                )}
              </div>

              {/* 渠道状态 */}
              <div>
                {ch ? (
                  <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${
                    ch.status === 'active' ? 'bg-green-500/15 text-green-400' :
                    ch.status === 'error' ? 'bg-red-500/15 text-red-400' :
                    'bg-gray-500/15 text-gray-400'
                  }`}>
                    {ch.status === 'active' ? <CheckCircle size={10} /> :
                     ch.status === 'error' ? <XCircle size={10} /> :
                     <MinusCircle size={10} />}
                    {ch.status === 'active' ? '在线' : ch.status === 'error' ? '异常' : '未启用'}
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-700">—</span>
                )}
              </div>

              {/* 员工状态 */}
              <div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                  agent.status === 'running' ? 'bg-green-500/15 text-green-400' :
                  agent.status === 'error' ? 'bg-red-500/15 text-red-400' :
                  'bg-gray-500/15 text-gray-400'
                }`}>
                  {agent.status === 'running' ? '工作中' : agent.status === 'error' ? '异常' : '待命'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 提示 */}
      <p className="text-[11px] text-gray-700 text-center">
        如需配置或修改渠道，请进入「员工管理 → 花名册 → 员工档案卡」操作
      </p>
    </div>
  );
}

// ─── 统计卡片 ───
function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-white/[0.03] rounded-xl border border-white/5 p-4">
      <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}
