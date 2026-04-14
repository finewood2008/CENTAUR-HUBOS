// Hub OS - 通讯中心（只读监控大盘）
import { Radio, CheckCircle, XCircle, AlertCircle, MinusCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Agent } from '../../types';

// 渠道类型元数据
const CHANNEL_META: Record<string, { icon: string; label: string }> = {
  wecom: { icon: '💬', label: '企业微信' },
  feishu: { icon: '🐦', label: '飞书' },
  telegram: { icon: '✈️', label: 'Telegram' },
  dingtalk: { icon: '🔵', label: '钉钉' },
  email: { icon: '📧', label: '邮件' },
  whatsapp: { icon: '📱', label: 'WhatsApp' },
  slack: { icon: '🟣', label: 'Slack' },
  webhook: { icon: '🔗', label: 'Webhook' },
};

interface ChannelsProps {
  agents: Agent[];
}

export default function Channels({ agents }: ChannelsProps) {
  const withChannel = agents.filter((a) => a.channel);
  const activeCount = withChannel.filter((a) => a.channel?.status === 'active').length;
  const errorCount = withChannel.filter((a) => a.channel?.status === 'error').length;
  const unlinkedCount = agents.length - withChannel.length;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* 标题 */}
      <div>
        <h1 className="text-xl font-semibold text-white flex items-center gap-2">
          <Radio size={20} className="text-orange-400" />
          通讯中心
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">各员工通讯渠道接入状态总览（渠道配置请前往员工档案卡）</p>
      </div>

      {/* 统计条 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="员工总数" value={agents.length} color="text-white" />
        <StatCard label="渠道在线" value={activeCount} color="text-green-400" icon={<CheckCircle size={14} />} />
        <StatCard label="渠道异常" value={errorCount} color="text-red-400" icon={<AlertCircle size={14} />} />
        <StatCard label="未接入" value={unlinkedCount} color="text-gray-500" icon={<MinusCircle size={14} />} />
      </div>

      {/* 员工渠道状态表 */}
      <div className="bg-white/[0.03] rounded-xl border border-white/5">
        {/* 表头 */}
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr] px-5 py-3 border-b border-white/5 text-[11px] text-gray-500 uppercase tracking-wider">
          <span>员工</span>
          <span>渠道</span>
          <span>状态</span>
          <span>员工状态</span>
        </div>

        {/* 行 */}
        {agents.map((agent, i) => {
          const ch = agent.channel;
          const meta = ch ? CHANNEL_META[ch.type] : null;

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
