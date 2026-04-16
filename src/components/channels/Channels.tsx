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
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-ivory">
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
          <StatCard label="支持渠道" value={channelsData.supportedCount} color="#141413" />
          <StatCard label="已配置" value={channelsData.configuredCount} color="#4a7c94" icon={<Settings size={14} />} />
          <StatCard label="已启用" value={channelsData.activeCount} color="#5a8a5e" icon={<Wifi size={14} />} />
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="员工总数" value={agents.length} color="#141413" />
          <StatCard label="渠道在线" value={fallbackActive} color="#5a8a5e" icon={<CheckCircle size={14} />} />
          <StatCard label="渠道异常" value={fallbackError} color="#c96442" icon={<AlertCircle size={14} />} />
          <StatCard label="未接入" value={fallbackUnlinked} color="#87867f" icon={<MinusCircle size={14} />} />
        </div>
      )}

      {/* API 渠道列表（优先展示） */}
      {hasApiData && channelsData.items.length > 0 && (
        <div className="rounded-xl bg-ivory border border-border-cream">
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
                className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] items-center px-5 py-3.5 last:border-0 transition-colors border-b border-border-cream"
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f3eb')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
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
                  <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full`}
                    style={{
                      backgroundColor: ch.configured ? 'rgba(74, 124, 148, 0.12)' : 'rgba(135, 134, 127, 0.12)',
                      color: ch.configured ? '#4a7c94' : '#87867f'
                    }}>
                    {ch.configured ? <CheckCircle size={10} /> : <MinusCircle size={10} />}
                    {ch.configured ? '已配置' : '未配置'}
                  </span>
                </div>

                {/* 启用状态 */}
                <div>
                  <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full`}
                    style={{
                      backgroundColor: ch.enabled ? 'rgba(90, 138, 94, 0.12)' : 'rgba(135, 134, 127, 0.12)',
                      color: ch.enabled ? '#5a8a5e' : '#87867f'
                    }}>
                    {ch.enabled ? <Wifi size={10} /> : <WifiOff size={10} />}
                    {ch.enabled ? '已启用' : '未启用'}
                  </span>
                </div>

                {/* 风险等级 */}
                <div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full`}
                    style={{
                      backgroundColor: ch.riskLevel === 'low' ? 'rgba(90, 138, 94, 0.1)' :
                        ch.riskLevel === 'medium' ? 'rgba(180, 140, 60, 0.1)' : 'rgba(201, 100, 66, 0.1)',
                      color: ch.riskLevel === 'low' ? '#5a8a5e' :
                        ch.riskLevel === 'medium' ? '#b48c3c' : '#c96442'
                    }}>
                    {ch.riskLevel === 'low' ? '低风险' : ch.riskLevel === 'medium' ? '中风险' : '高风险'}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 员工渠道绑定表 */}
      <div className="rounded-xl bg-ivory border border-border-cream">
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
              className="grid grid-cols-[2fr_1.5fr_1fr_1fr] items-center px-5 py-3.5 last:border-0 transition-colors border-b border-border-cream"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f3eb')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
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
                  <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full`}
                    style={{
                      backgroundColor: ch.status === 'active' ? 'rgba(90, 138, 94, 0.12)' :
                        ch.status === 'error' ? 'rgba(201, 100, 66, 0.12)' : 'rgba(135, 134, 127, 0.12)',
                      color: ch.status === 'active' ? '#5a8a5e' :
                        ch.status === 'error' ? '#c96442' : '#87867f'
                    }}>
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
                <span className={`text-[11px] px-2 py-0.5 rounded-full`}
                  style={{
                    backgroundColor: agent.status === 'running' ? 'rgba(90, 138, 94, 0.12)' :
                      agent.status === 'error' ? 'rgba(201, 100, 66, 0.12)' : 'rgba(135, 134, 127, 0.12)',
                    color: agent.status === 'running' ? '#5a8a5e' :
                      agent.status === 'error' ? '#c96442' : '#87867f'
                  }}>
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
function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4 bg-ivory border border-border-cream">
      <div className="text-xs mb-1 flex items-center gap-1 text-stone-gray">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold" style={{ color }}>{value}</div>
    </div>
  );
}
