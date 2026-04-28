// Hub OS - 通讯中心（渠道接入管理 + 监控大盘）
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Radio, CheckCircle, XCircle, AlertCircle, MinusCircle, RefreshCw, Wifi, WifiOff, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ChannelsData, ChannelItem } from '../../hooks/useQeeClaw';
import type { Agent } from '../../types';
import { getChannelsBaseUrl, isChannelsLocalBridgeAvailable } from '../../services/qeeclaw';
import ChannelConfigPanel from './ChannelConfigPanel';

// 渠道类型元数据
const CHANNEL_META: Record<string, { icon: string; label: string; availability: 'supported' | 'planned' }> = {
  wechat_work: { icon: '💬', label: '企业微信', availability: 'supported' },
  feishu: { icon: '🐦', label: '飞书', availability: 'supported' },
  wechat_personal_openclaw: { icon: '📱', label: '微信个人号', availability: 'supported' },
  telegram: { icon: '✈️', label: 'Telegram', availability: 'planned' },
  dingtalk: { icon: '🔵', label: '钉钉', availability: 'planned' },
  email: { icon: '📧', label: '邮件', availability: 'planned' },
  whatsapp: { icon: '📱', label: 'WhatsApp', availability: 'planned' },
  slack: { icon: '🟣', label: 'Slack', availability: 'planned' },
  webhook: { icon: '🔗', label: 'Webhook', availability: 'planned' },
};

interface ChannelsProps {
  agents: Agent[];
  channelsData: ChannelsData | null;
  channelsLoading: boolean;
  channelsError?: string | null;
  onRefresh?: () => void;
  focusChannelKey?: string;
}

export default function Channels({ agents, channelsData, channelsLoading, channelsError, onRefresh, focusChannelKey }: ChannelsProps) {
  const [selectedChannelKey, setSelectedChannelKey] = useState<string | null>(null);
  const localBridgeAvailable = isChannelsLocalBridgeAvailable();
  const channelsBaseUrl = getChannelsBaseUrl();

  // 如果有 SDK 数据用 SDK 数据，否则从 agents 提取
  const hasApiData = channelsData !== null;
  const selectedChannel = channelsData?.items.find((item) => item.channelKey === selectedChannelKey) ?? null;

  useEffect(() => {
    if (!focusChannelKey || !channelsData?.items.length) return;
    const matched = channelsData.items.find((item) => item.channelKey === focusChannelKey);
    if (matched) {
      setSelectedChannelKey(matched.channelKey);
    }
  }, [channelsData?.items, focusChannelKey]);

  const plannedChannels = useMemo(
    () => Object.entries(CHANNEL_META)
      .filter(([, meta]) => meta.availability === 'planned')
      .map(([key, meta]) => ({ key, ...meta })),
    [],
  );

  // 渠道 API 暂不可用时，仅使用真实 agents 字段计算概览
  const withChannel = agents.filter((a) => a.channel);
  const agentChannelActive = withChannel.filter((a) => a.channel?.status === 'active').length;
  const agentChannelError = withChannel.filter((a) => a.channel?.status === 'error').length;
  const agentChannelUnlinked = agents.length - withChannel.length;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2 text-near-black font-serif">
            <Radio size={20} className="text-terracotta" />
            通讯中心
          </h1>
          <p className="text-sm mt-0.5 text-stone-gray">4 个 SDK 渠道可直接配置，其他渠道仅展示规划状态</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
            <span className={`rounded-full px-2.5 py-1 ${localBridgeAvailable ? 'bg-sage-green/10 text-sage-green' : 'bg-terracotta/10 text-terracotta'}`}>
              {localBridgeAvailable ? '本地隐私模式' : '未连接本地 bridge'}
            </span>
            <span className="rounded-full bg-warm-sand/40 px-2.5 py-1 text-stone-gray">
              {channelsBaseUrl ? `hermes-bridge: ${channelsBaseUrl}` : 'hermes-bridge: 未解析到本地地址'}
            </span>
          </div>
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
          <StatCard label="渠道在线" value={agentChannelActive} colorClass="text-sage-green" icon={<CheckCircle size={14} />} />
          <StatCard label="渠道异常" value={agentChannelError} colorClass="text-terracotta" icon={<AlertCircle size={14} />} />
          <StatCard label="未接入" value={agentChannelUnlinked} colorClass="text-stone-gray" icon={<MinusCircle size={14} />} />
        </div>
      )}

      {channelsError && (
        <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 px-4 py-3 text-sm text-charcoal-warm">
          {channelsError}
        </div>
      )}

      {localBridgeAvailable && (
        <div className="rounded-2xl border border-sage-green/20 bg-sage-green/8 px-4 py-3 text-sm text-charcoal-warm">
          当前通讯渠道运行在本地 hermes-bridge，配置、绑定码和扫码状态不会自动回落到云端后端。
        </div>
      )}

      {/* API 渠道列表（优先展示） */}
      {hasApiData && channelsData.items.length > 0 && (
        <div className="card-glass overflow-hidden">
          <div className="px-5 py-3 border-b border-border-cream">
            <h2 className="text-sm font-medium text-near-black font-serif">SDK 渠道列表</h2>
            <p className="mt-1 text-xs text-stone-gray">点击“配置”即可直接写入系统级渠道参数。</p>
          </div>
          {/* 表头 */}
          <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_0.9fr] px-5 py-3 text-[11px] uppercase tracking-wider border-b border-border-cream text-stone-gray">
            <span>渠道</span>
            <span>分组</span>
            <span>配置</span>
            <span>状态</span>
            <span>风险</span>
            <span>操作</span>
          </div>

          {channelsData.items.map((ch: ChannelItem, i: number) => {
            const meta = CHANNEL_META[ch.channelKey] || { icon: '📡', label: ch.channelKey };

            return (
              <motion.div
                key={ch.channelKey}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_0.9fr] items-center px-5 py-3.5 last:border-0 transition-colors border-b border-border-cream hover:bg-parchment-hover"
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

                <div>
                  <button
                    onClick={() => setSelectedChannelKey(ch.channelKey)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border-warm px-2.5 py-1.5 text-[11px] font-medium text-olive-gray transition-colors hover:text-near-black"
                  >
                    <Settings size={12} />
                    配置
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {selectedChannel && (
        <ChannelConfigPanel
          channel={selectedChannel}
          onClose={() => setSelectedChannelKey(null)}
          onSaved={onRefresh}
        />
      )}

      <div className="card-glass overflow-hidden">
        <div className="border-b border-border-cream px-5 py-3">
          <h2 className="text-sm font-medium text-near-black font-serif">规划中渠道</h2>
          <p className="mt-1 text-xs text-stone-gray">这些渠道目前没有对应 SDK 配置接口，先明确标注为规划中。</p>
        </div>
        <div className="grid gap-4 px-5 py-5 md:grid-cols-2 xl:grid-cols-3">
          {plannedChannels.map((channel) => (
            <div key={channel.key} className="rounded-2xl border border-border-cream bg-white/60 p-4">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{channel.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-near-black">{channel.label}</div>
                    <div className="text-[11px] text-stone-gray">{channel.key}</div>
                  </div>
                </div>
                <span className="rounded-full bg-stone-gray/10 px-2 py-0.5 text-[11px] text-stone-gray">规划中</span>
              </div>
              <p className="text-xs leading-5 text-charcoal-warm">
                当前前端只保留渠道占位，不提供保存入口，也不会伪装成已接入系统。
              </p>
            </div>
          ))}
        </div>
      </div>

      {!hasApiData && (
        <div className="rounded-2xl border border-amber/25 bg-amber/8 px-4 py-3 text-sm text-charcoal-warm">
          当前未拿到本地 hermes-bridge 的渠道数据。只有本地 bridge 可用于通讯渠道配置和绑定码管理，不会自动回落到云端后端。
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
        渠道配置入口已在本页开放；员工档案仅保留员工与渠道的绑定展示，不再承担系统级渠道配置。
      </p>
    </div>
  );
}

// ─── 统计卡片 ───
function StatCard({ label, value, colorClass, icon }: { label: string; value: number; colorClass: string; icon?: ReactNode }) {
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
