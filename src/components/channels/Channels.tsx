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
          <h1 className="text-xl font-semibold flex items-center gap-2 text-near-black font-serif">
            <Radio size={20} className="text-terracotta" />
            通讯中心
          </h1>
          <p className="text-sm mt-0.5 text-stone-gray">渠道接入管理与状态监控</p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={channelsLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-40 bg-border-cream text-olive-gray border border-border-warm"
          >
            <RefreshCw size={12} className={channelsLoading ? 'animate-spin' : ''} />
            刷新
          </button>
        )}
      </div>

      {/* 统计条 */}
      {hasApiData ? (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="支持渠道" value={channelsData.supportedCount} colorClass="text-near-black" />
          <StatCard label="已配置" value={channelsData.configuredCount} colorClass="text-teal" icon={<Settings size={14} />} />
          <StatCard label="已启用" value={channelsData.activeCount} colorClass="text-sage-green" icon={<Wifi size={14} />} />
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="员工总数" value={agents.length} colorClass="text-near-black" />
          <StatCard label="渠道在线" value={fallbackActive} colorClass="text-sage-green" icon={<CheckCircle size={14} />} />
          <StatCard label="渠道异常" value={fallbackError} colorClass="text-terracotta" icon={<AlertCircle size={14} />} />
          <StatCard label="未接入" value={fallbackUnlinked} colorClass="text-stone-gray" icon={<MinusCircle size={14} />} />
        </div>
      )}

      {/* API 渠道列表（优先展示） */}
      {hasApiData && channelsData.items.length > 0 && (
        <div className="card-glass">
          <div className="px-5 py-3 border-b border-border-cream">
            <h2 className="text-sm font-medium text-near-black font-serif">渠道列表</h2>
          </div>
          {/* 表头 */}
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] px-5 py-3 text-[11px] uppercase tracking-wider border-b border-border-cream text-stone-gray">
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
                className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] items-center px-5 py-3.5 last:border-0 transition-colors border-b border-border-cream hover:bg-parchment-hover"
              >
                {/* 渠道 */}
                <div className="flex items-center gap-3">
                  <span className="text-xl">{meta.icon}</span>
                  <div>
                    <span className="text-sm font-medium text-near-black">{ch.channelName}</span>
                    <span className="text-[10px] ml-2 text-stone-gray">{ch.channelKey}</span>
                  </div>
                </div>

                {/* 分组 */}
                <div>
                  <span className="text-xs text-olive-gray">
                    {ch.channelGroup === 'enterprise_collab' ? '企业协作' : '个人触达'}
                  </span>
                </div>

                {/* 配置状态 */}
                <div>
                  <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${ch.configured ? 'bg-teal/12 text-teal' : 'bg-stone-gray/12 text-stone-gray'}`}>
                    {ch.configured ? <CheckCircle size={10} /> : <MinusCircle size={10} />}
                    {ch.configured ? '已配置' : '未配置'}
                  </span>
                </div>

                {/* 启用状态 */}
                <div>
                  <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${ch.enabled ? 'bg-sage-green/12 text-sage-green' : 'bg-stone-gray/12 text-stone-gray'}`}>
                    {ch.enabled ? <Wifi size={10} /> : <WifiOff size={10} />}
                    {ch.enabled ? '已启用' : '未启用'}
                  </span>
                </div>

                {/* 风险等级 */}
                <div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                    ch.riskLevel === 'low' ? 'bg-sage-green/10 text-sage-green' :
                    ch.riskLevel === 'medium' ? 'bg-amber/10 text-amber' : 'bg-terracotta/10 text-terracotta'
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
      <div className="card-glass">
        <div className="px-5 py-3 border-b border-border-cream">
          <h2 className="text-sm font-medium text-near-black font-serif">员工渠道绑定</h2>
        </div>
        {/* 表头 */}
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr] px-5 py-3 text-[11px] uppercase tracking-wider border-b border-border-cream text-stone-gray">
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
              className="grid grid-cols-[2fr_1.5fr_1fr_1fr] items-center px-5 py-3.5 last:border-0 transition-colors border-b border-border-cream hover:bg-parchment-hover"
            >
              {/* 员工 */}
              <div className="flex items-center gap-3">
                <span className="text-xl">{agent.avatar}</span>
                <div>
                  <span className="text-sm font-medium text-near-black">{agent.name}</span>
                  <span className="text-[10px] ml-2 text-stone-gray">{agent.role}</span>
                </div>
              </div>

              {/* 渠道 */}
              <div>
                {ch && meta ? (
                  <div className="flex items-center gap-2">
                    <span className="text-base">{meta.icon}</span>
                    <span className="text-xs text-olive-gray">{ch.name}</span>
                  </div>
                ) : (
                  <span className="text-xs italic text-stone-gray">未接入</span>
                )}
              </div>

              {/* 渠道状态 */}
              <div>
                {ch ? (
                  <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${
                    ch.status === 'active' ? 'bg-sage-green/12 text-sage-green' :
                    ch.status === 'error' ? 'bg-terracotta/12 text-terracotta' : 'bg-stone-gray/12 text-stone-gray'
                  }`}>
                    {ch.status === 'active' ? <CheckCircle size={10} /> :
                     ch.status === 'error' ? <XCircle size={10} /> :
                     <MinusCircle size={10} />}
                    {ch.status === 'active' ? '在线' : ch.status === 'error' ? '异常' : '未启用'}
                  </span>
                ) : (
                  <span className="text-[11px] text-stone-gray">—</span>
                )}
              </div>

              {/* 员工状态 */}
              <div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                  agent.status === 'running' ? 'bg-sage-green/12 text-sage-green' :
                  agent.status === 'error' ? 'bg-terracotta/12 text-terracotta' : 'bg-stone-gray/12 text-stone-gray'
                }`}>
                  {agent.status === 'running' ? '工作中' : agent.status === 'error' ? '异常' : '待命'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 提示 */}
      <p className="text-[11px] text-center text-stone-gray">
        如需配置或修改渠道，请进入「员工管理 → 花名册 → 员工档案卡」操作
      </p>
    </div>
  );
}

// ─── 统计卡片 ───
function StatCard({ label, value, colorClass, icon }: { label: string; value: number; colorClass: string; icon?: React.ReactNode }) {
  return (
    <div className="card-glass p-4">
      <div className="text-xs mb-1 flex items-center gap-1 text-stone-gray">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-semibold ${colorClass}`}>{value}</div>
    </div>
  );
}
