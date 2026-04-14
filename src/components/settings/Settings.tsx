// Hub OS - 设置页面
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Cpu, Server, Save, Check } from 'lucide-react';

interface SettingsProps {
  isConnected: boolean;
}

interface UserConfig {
  companyName: string;
  adminName: string;
  email: string;
}

interface ModelConfig {
  defaultModel: string;
  apiEndpoint: string;
  maxTokens: number;
}

const MODEL_OPTIONS = [
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'deepseek-v3', label: 'DeepSeek V3' },
];

export default function Settings({ isConnected }: SettingsProps) {
  const [saved, setSaved] = useState(false);

  const [user, setUser] = useState<UserConfig>({
    companyName: '半人马 AI',
    adminName: '',
    email: '',
  });

  const [model, setModel] = useState<ModelConfig>({
    defaultModel: 'claude-sonnet-4-20250514',
    apiEndpoint: 'http://127.0.0.1:3456',
    maxTokens: 4096,
  });

  const handleSave = () => {
    // TODO: 持久化到 localStorage 或 SDK
    localStorage.setItem('hubos-settings-user', JSON.stringify(user));
    localStorage.setItem('hubos-settings-model', JSON.stringify(model));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // 初始化时从 localStorage 读取
  useEffect(() => {
    try {
      const u = localStorage.getItem('hubos-settings-user');
      const m = localStorage.getItem('hubos-settings-model');
      if (u) setUser(JSON.parse(u));
      if (m) setModel(JSON.parse(m));
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white">设置</h2>
          <p className="text-xs text-gray-500 mt-0.5">管理你的 Hub OS 配置</p>
        </div>

        {/* 用户信息 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] rounded-xl border border-white/5 p-5 mb-4"
        >
          <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <User size={16} className="text-orange-400" />
            用户信息
          </h3>
          <div className="space-y-3">
            <Field
              label="公司名称"
              value={user.companyName}
              onChange={(v) => setUser({ ...user, companyName: v })}
            />
            <Field
              label="管理员姓名"
              value={user.adminName}
              onChange={(v) => setUser({ ...user, adminName: v })}
              placeholder="你的名字"
            />
            <Field
              label="邮箱"
              value={user.email}
              onChange={(v) => setUser({ ...user, email: v })}
              placeholder="admin@example.com"
            />
          </div>
        </motion.div>

        {/* 模型偏好 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white/[0.03] rounded-xl border border-white/5 p-5 mb-4"
        >
          <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Cpu size={16} className="text-blue-400" />
            模型偏好
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">默认模型</label>
              <select
                value={model.defaultModel}
                onChange={(e) => setModel({ ...model, defaultModel: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500/30 appearance-none"
              >
                {MODEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-gray-900">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <Field
              label="最大 Token 数"
              value={String(model.maxTokens)}
              onChange={(v) => setModel({ ...model, maxTokens: Number(v) || 4096 })}
              type="number"
            />
          </div>
        </motion.div>

        {/* 连接状态 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/[0.03] rounded-xl border border-white/5 p-5 mb-6"
        >
          <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Server size={16} className="text-green-400" />
            连接状态
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">控制面地址</span>
              <span className="text-gray-300 font-mono">{model.apiEndpoint}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">SDK 状态</span>
              <span className={isConnected ? 'text-green-400' : 'text-yellow-400'}>
                {isConnected ? '● 已连接' : '● 离线（演示模式）'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* 保存按钮 */}
        <button
          onClick={handleSave}
          className="w-full py-2.5 bg-orange-500 text-white text-sm rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
        >
          {saved ? (
            <>
              <Check size={16} /> 已保存
            </>
          ) : (
            <>
              <Save size={16} /> 保存设置
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1.5 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30"
      />
    </div>
  );
}
