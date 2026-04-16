// Hub OS - 设置页面：平台 API Key 配置
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key, Plus, Trash2, Eye, EyeOff, Check, AlertCircle,
  Server, RefreshCw, ChevronDown, ChevronUp, Zap, Shield,
} from 'lucide-react';

// ─── 类型定义 ───────────────────────────────────
interface ProviderConfig {
  id: string;
  provider: string;        // anthropic | openai | google | deepseek | openrouter | custom
  name: string;            // 用户自定义显示名
  baseUrl: string;
  apiKey: string;
  models: string[];        // 该 provider 可用模型列表
  isDefault: boolean;      // 是否为默认 provider
  status: 'untested' | 'testing' | 'active' | 'error';
  lastTested?: string;
  error?: string;
}

interface SettingsProps {
  isConnected: boolean;
}

// ─── 预设平台模板 ──────────────────────────────────
const PROVIDER_PRESETS: Record<string, {
  name: string;
  baseUrl: string;
  models: string[];
  icon: string;
  color: string;
  description: string;
}> = {
  anthropic: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    models: ['claude-opus-4-20250514', 'claude-sonnet-4-20250514', 'claude-haiku-35-20241022'],
    icon: '🟤',
    color: 'from-amber-600 to-orange-700',
    description: 'Claude 系列模型',
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'o3-mini'],
    icon: '🟢',
    color: 'from-green-600 to-emerald-700',
    description: 'GPT / o 系列模型',
  },
  google: {
    name: 'Google AI',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro'],
    icon: '🔵',
    color: 'from-blue-500 to-indigo-600',
    description: 'Gemini 系列模型',
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    icon: '🐋',
    color: 'from-cyan-600 to-blue-700',
    description: 'DeepSeek 系列模型',
  },
  openrouter: {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: ['anthropic/claude-sonnet-4', 'openai/gpt-4o', 'google/gemini-2.5-flash'],
    icon: '🌐',
    color: 'from-purple-500 to-violet-600',
    description: '聚合多家模型的统一网关',
  },
  custom: {
    name: '自定义',
    baseUrl: '',
    models: [],
    icon: '⚙️',
    color: 'from-gray-500 to-gray-600',
    description: '兼容 OpenAI 格式的任意端点',
  },
};

const STORAGE_KEY = 'hubos-providers';

// ─── 主组件 ─────────────────────────────────────
export default function Settings({ isConnected }: SettingsProps) {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // 加载
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setProviders(JSON.parse(raw));
      }
    } catch { /* ignore */ }
  }, []);

  // 保存
  const save = useCallback((list: ProviderConfig[]) => {
    setProviders(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, []);

  // 添加 provider
  const addProvider = (providerKey: string) => {
    const preset = PROVIDER_PRESETS[providerKey];
    const newProvider: ProviderConfig = {
      id: `${providerKey}-${Date.now()}`,
      provider: providerKey,
      name: preset.name,
      baseUrl: preset.baseUrl,
      apiKey: '',
      models: [...preset.models],
      isDefault: providers.length === 0,
      status: 'untested',
    };
    const updated = [...providers, newProvider];
    save(updated);
    setExpandedId(newProvider.id);
    setShowAddPanel(false);
  };

  // 删除 provider
  const removeProvider = (id: string) => {
    const updated = providers.filter((p) => p.id !== id);
    // 如果删掉了默认的，第一个自动变默认
    if (updated.length > 0 && !updated.some((p) => p.isDefault)) {
      updated[0].isDefault = true;
    }
    save(updated);
  };

  // 更新 provider 字段
  const updateProvider = (id: string, patch: Partial<ProviderConfig>) => {
    const updated = providers.map((p) => {
      if (p.id !== id) return p;
      return { ...p, ...patch };
    });
    save(updated);
  };

  // 设为默认
  const setDefault = (id: string) => {
    const updated = providers.map((p) => ({
      ...p,
      isDefault: p.id === id,
    }));
    save(updated);
  };

  // 测试连接
  const testConnection = async (id: string) => {
    updateProvider(id, { status: 'testing', error: undefined });

    const provider = providers.find((p) => p.id === id);
    if (!provider) return;

    try {
      // 发送测试请求到 mock-server
      const res = await fetch('http://127.0.0.1:3456/api/platform/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: provider.provider,
          baseUrl: provider.baseUrl,
          apiKey: provider.apiKey,
        }),
      });
      const data = await res.json();
      if (data.code === 0) {
        updateProvider(id, {
          status: 'active',
          lastTested: new Date().toLocaleString('zh-CN'),
          error: undefined,
        });
      } else {
        updateProvider(id, {
          status: 'error',
          error: data.message || '连接失败',
          lastTested: new Date().toLocaleString('zh-CN'),
        });
      }
    } catch (err) {
      updateProvider(id, {
        status: 'error',
        error: err instanceof Error ? err.message : '网络错误',
        lastTested: new Date().toLocaleString('zh-CN'),
      });
    }
  };

  // 有几个平台还没加
  const configuredProviderKeys = new Set(providers.map((p) => p.provider));
  const availablePresets = Object.entries(PROVIDER_PRESETS).filter(
    ([key]) => !configuredProviderKeys.has(key) || key === 'custom'
  );

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        {/* 标题 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[#141413] flex items-center gap-2">
            <Key size={20} className="text-[#c96442]" />
            模型平台配置
          </h2>
          <p className="text-xs text-[#87867f] mt-0.5">
            配置 AI 模型平台的 API Key，Agent 将通过这些平台调用大模型
          </p>
        </div>

        {/* 连接总览 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#faf9f5] rounded-xl border border-[#f0eee6] p-4 mb-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server size={16} className="text-[#87867f]" />
              <div>
                <p className="text-xs text-[#5e5d59]">
                  已配置 <span className="text-[#141413] font-medium">{providers.length}</span> 个平台
                  {' · '}
                  <span className="text-green-400">
                    {providers.filter((p) => p.status === 'active').length} 个在线
                  </span>
                  {providers.some((p) => p.status === 'error') && (
                    <>
                      {' · '}
                      <span className="text-red-400">
                        {providers.filter((p) => p.status === 'error').length} 个异常
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'}`} />
              <span className="text-[#87867f]">
                {isConnected ? '控制面已连接' : '离线模式'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Provider 列表 */}
        <div className="space-y-3 mb-4">
          <AnimatePresence mode="popLayout">
            {providers.map((provider, index) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                index={index}
                isExpanded={expandedId === provider.id}
                onToggle={() => setExpandedId(expandedId === provider.id ? null : provider.id)}
                onUpdate={(patch) => updateProvider(provider.id, patch)}
                onRemove={() => removeProvider(provider.id)}
                onSetDefault={() => setDefault(provider.id)}
                onTest={() => testConnection(provider.id)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* 空状态 */}
        {providers.length === 0 && !showAddPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-3xl mb-3">🔑</div>
            <p className="text-sm text-[#5e5d59] mb-1">还没有配置任何平台</p>
            <p className="text-xs text-[#87867f] mb-4">添加一个 AI 平台的 API Key 来开始使用</p>
            <button
              onClick={() => setShowAddPanel(true)}
              className="px-4 py-2 bg-[#c96442]/10 text-[#c96442] text-sm rounded-lg hover:bg-[#c96442]/15 transition-colors"
            >
              <Plus size={14} className="inline mr-1.5" />
              添加平台
            </button>
          </motion.div>
        )}

        {/* 添加平台按钮 */}
        {providers.length > 0 && !showAddPanel && (
          <button
            onClick={() => setShowAddPanel(true)}
            className="w-full py-3 border border-dashed border-[#e8e6dc] rounded-xl text-sm text-[#87867f] hover:text-[#5e5d59] hover:border-[#e8e6dc] transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={14} />
            添加平台
          </button>
        )}

        {/* 添加面板 */}
        <AnimatePresence>
          {showAddPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[#faf9f5] rounded-xl border border-[#f0eee6] p-4 mt-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-[#141413]">选择平台</h3>
                  <button
                    onClick={() => setShowAddPanel(false)}
                    className="text-xs text-[#87867f] hover:text-[#5e5d59]"
                  >
                    取消
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {availablePresets.map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => addProvider(key)}
                      className="flex items-center gap-3 p-3 bg-[#f5f4ed] hover:bg-[#e8e6dc] border border-[#f0eee6] hover:border-[#e8e6dc] rounded-lg transition-all text-left group"
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${preset.color} flex items-center justify-center text-sm shrink-0`}>
                        {preset.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-[#141413] group-hover:text-[#d97757] transition-colors">{preset.name}</p>
                        <p className="text-[10px] text-[#87867f] truncate">{preset.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 保存提示 */}
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed bottom-6 right-6 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              <Check size={14} />
              已自动保存
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Provider 卡片组件 ────────────────────────────
function ProviderCard({
  provider,
  index,
  isExpanded,
  onToggle,
  onUpdate,
  onRemove,
  onSetDefault,
  onTest,
}: {
  provider: ProviderConfig;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<ProviderConfig>) => void;
  onRemove: () => void;
  onSetDefault: () => void;
  onTest: () => void;
}) {
  const [showKey, setShowKey] = useState(false);
  const preset = PROVIDER_PRESETS[provider.provider] || PROVIDER_PRESETS.custom;

  const statusConfig = {
    untested: { color: 'text-[#87867f]', bg: 'bg-gray-500/10', label: '未测试' },
    testing: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: '测试中...' },
    active: { color: 'text-green-400', bg: 'bg-green-500/10', label: '正常' },
    error: { color: 'text-red-400', bg: 'bg-red-500/10', label: '异常' },
  };

  const st = statusConfig[provider.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.03 }}
      className="bg-[#faf9f5] rounded-xl border border-[#f0eee6] overflow-hidden"
    >
      {/* 头部 - 始终可见 */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-[#f5f4ed] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${preset.color} flex items-center justify-center text-sm shrink-0`}>
            {preset.icon}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#141413]">{provider.name}</span>
              {provider.isDefault && (
                <span className="text-[10px] px-1.5 py-0.5 bg-[#c96442]/10 text-[#c96442] rounded">
                  默认
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#87867f]">
              {provider.apiKey ? maskKey(provider.apiKey) : '未填写 Key'}
              {provider.models.length > 0 && ` · ${provider.models.length} 个模型`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>
            {provider.status === 'testing' && (
              <RefreshCw size={10} className="inline mr-1 animate-spin" />
            )}
            {st.label}
          </span>
          {isExpanded ? (
            <ChevronUp size={14} className="text-[#87867f]" />
          ) : (
            <ChevronDown size={14} className="text-[#87867f]" />
          )}
        </div>
      </button>

      {/* 展开区域 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-[#f0eee6] pt-3">
              {/* 显示名称 */}
              <Field
                label="显示名称"
                value={provider.name}
                onChange={(v) => onUpdate({ name: v })}
                placeholder={preset.name}
              />

              {/* API Key */}
              <div>
                <label className="text-xs text-[#5e5d59] mb-1.5 block">API Key</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={provider.apiKey}
                    onChange={(e) => onUpdate({ apiKey: e.target.value, status: 'untested' })}
                    placeholder="sk-..."
                    className="w-full px-3 py-2 pr-20 bg-[#f5f4ed] border border-[#e8e6dc] rounded-lg text-sm text-[#141413] font-mono placeholder-[#87867f] focus:outline-none focus:border-[#c96442]/25"
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="p-1.5 text-[#87867f] hover:text-[#5e5d59] transition-colors"
                      title={showKey ? '隐藏' : '显示'}
                    >
                      {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Base URL */}
              <Field
                label="API 地址"
                value={provider.baseUrl}
                onChange={(v) => onUpdate({ baseUrl: v })}
                placeholder="https://api.example.com/v1"
              />

              {/* 可用模型 */}
              <div>
                <label className="text-xs text-[#5e5d59] mb-1.5 block">
                  可用模型
                  <span className="text-[#87867f] ml-1">（逗号分隔）</span>
                </label>
                <input
                  type="text"
                  value={provider.models.join(', ')}
                  onChange={(e) => {
                    const models = e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean);
                    onUpdate({ models });
                  }}
                  placeholder="model-name-1, model-name-2"
                  className="w-full px-3 py-2 bg-[#f5f4ed] border border-[#e8e6dc] rounded-lg text-sm text-[#141413] font-mono placeholder-[#87867f] focus:outline-none focus:border-[#c96442]/25"
                />
              </div>

              {/* 错误信息 */}
              {provider.status === 'error' && provider.error && (
                <div className="flex items-start gap-2 p-2.5 bg-red-500/5 border border-red-500/10 rounded-lg">
                  <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-400">{provider.error}</p>
                </div>
              )}

              {/* 上次测试时间 */}
              {provider.lastTested && (
                <p className="text-[10px] text-[#87867f]">
                  上次测试：{provider.lastTested}
                </p>
              )}

              {/* 操作按钮 */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={onTest}
                    disabled={!provider.apiKey || provider.status === 'testing'}
                    className="px-3 py-1.5 text-xs bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <Zap size={12} />
                    测试连接
                  </button>
                  {!provider.isDefault && (
                    <button
                      onClick={onSetDefault}
                      className="px-3 py-1.5 text-xs bg-[#c96442]/10 text-[#c96442] rounded-lg hover:bg-[#c96442]/15 transition-colors flex items-center gap-1.5"
                    >
                      <Shield size={12} />
                      设为默认
                    </button>
                  )}
                </div>
                <button
                  onClick={onRemove}
                  className="p-1.5 text-[#87867f] hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/5"
                  title="删除此平台"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── 通用输入框 ────────────────────────────────────
function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs text-[#5e5d59] mb-1.5 block">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-[#f5f4ed] border border-[#e8e6dc] rounded-lg text-sm text-[#141413] placeholder-[#87867f] focus:outline-none focus:border-[#c96442]/25"
      />
    </div>
  );
}

// ─── 工具函数 ──────────────────────────────────────
function maskKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  return key.slice(0, 4) + '••••' + key.slice(-4);
}
