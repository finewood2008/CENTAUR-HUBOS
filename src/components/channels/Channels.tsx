// Hub OS - 通讯中心（占位页面）
import { Radio, MessageSquare, Mail, Phone, Globe, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const channels = [
  { icon: MessageSquare, name: '企业微信', status: '已连接', connected: true, desc: '3 个群组 · 12 个联系人', color: 'text-green-400' },
  { icon: Mail, name: '邮件', status: '已连接', connected: true, desc: 'IMAP/SMTP · 2 个邮箱', color: 'text-blue-400' },
  { icon: Globe, name: '飞书', status: '未连接', connected: false, desc: '点击配置飞书集成', color: 'text-gray-500' },
  { icon: Phone, name: '钉钉', status: '未连接', connected: false, desc: '点击配置钉钉集成', color: 'text-gray-500' },
];

const recentMessages = [
  { from: '客户-张总', channel: '企业微信', content: '那个方案什么时候能出？急！', time: '5 分钟前', agent: '火花 Spark' },
  { from: 'HR 群', channel: '企业微信', content: '新员工入职材料已收齐', time: '20 分钟前', agent: 'Linda' },
  { from: 'support@client.com', channel: '邮件', content: '关于上周报价单的几个问题...', time: '1 小时前', agent: '未分配' },
  { from: '产品群', channel: '企业微信', content: '下周一产品评审会确认参加人数', time: '2 小时前', agent: 'Helen' },
];

export default function Channels() {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* 标题 */}
      <div>
        <h1 className="text-xl font-semibold text-white flex items-center gap-2">
          <Radio size={20} className="text-orange-400" />
          通讯中心
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">管理所有通讯渠道，查看员工的对外沟通记录</p>
      </div>

      {/* 渠道卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {channels.map((ch, i) => {
          const Icon = ch.icon;
          return (
            <motion.div
              key={ch.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-white/[0.03] rounded-xl border p-4 transition-all cursor-pointer hover:border-orange-500/20 ${
                ch.connected ? 'border-white/5' : 'border-dashed border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon size={20} className={ch.color} />
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  ch.connected ? 'bg-green-500/15 text-green-400' : 'bg-white/5 text-gray-600'
                }`}>
                  {ch.status}
                </span>
              </div>
              <h3 className="text-sm font-medium text-white">{ch.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{ch.desc}</p>
            </motion.div>
          );
        })}
      </div>

      {/* 最近消息 */}
      <div className="bg-white/[0.03] rounded-xl border border-white/5 p-5">
        <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
          <MessageSquare size={16} className="text-blue-400" />
          最近消息
        </h2>
        <div className="space-y-2">
          {recentMessages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-medium">{msg.from}</span>
                  <span className="text-[10px] text-gray-600">{msg.channel}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{msg.content}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] text-gray-600">{msg.time}</div>
                <div className="text-[10px] text-orange-400/60 mt-0.5">→ {msg.agent}</div>
              </div>
              <ArrowRight size={14} className="text-gray-700 group-hover:text-orange-400 transition-colors shrink-0" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* 提示 */}
      <div className="text-center py-8 text-gray-600 text-xs">
        🚧 通讯中心完整功能正在开发中 — 消息路由、自动分配、会话管理即将上线
      </div>
    </div>
  );
}
