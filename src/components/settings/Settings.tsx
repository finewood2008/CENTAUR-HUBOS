// Hub OS - 设置页面：简洁的 API Key + 基本偏好
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key, Eye, EyeOff, Check, ExternalLink,
  Globe, Palette, Bell, Shield,
} from 'lucide-react';

// ─── 类型定义 ───────────────────────────────────
interface ApiKeyConfig {
  provider: string;
  label: string;
  apiKey: string;
  helpUrl: string;
  placeholder: string;
  icon: string;
}

interface Preferences {
  language: string;
  theme: string;
  notifications: boolean;
  autoSave: boolean;
}

interface SettingsProps {
  isConnected: boolean;
}

// ─── 支持的平台（仅 QeeClaw 官方）───────────────────
const API_KEY_CONFIGS: Omit<ApiKeyConfig, 'apiKey'>[] = [
  {
    provider: 'qeeclaw',
    label: 'QeeClaw AI',
    helpUrl: 'https://qeeclaw.com/console/keys',
    placeholder: 'qc-...',
    icon: '🐾',
  },
];

const STORAGE_KEYS = 'hubos-api-keys';
const STORAGE_PREFS = 'hubos-preferences';

const DEFAULT_PREFS: Preferences = {
  language: 'zh-CN',
  theme: 'warm',
  notifications: true,
  autoSave: true,
};

// ─── 主组件 ─────────────────────────────────────
export default function Settings({ isConnected }: SettingsProps) {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);

  // 加载
  useEffect(() => {
    try {
      const rawKeys = localStorage.getItem(STORAGE_KEYS);
      if (rawKeys) setKeys(JSON.parse(rawKeys));
      const rawPrefs = localStorage.getItem(STORAGE_PREFS);
      if (rawPrefs) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(rawPrefs) });
    } catch { /* ignore */ }
  }, []);

  // 保存
  const showSaved = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, []);

  const saveKey = useCallback((provider: string, value: string) => {
    setKeys(prev => {
      const next = { ...prev, [provider]: value };
      localStorage.setItem(STORAGE_KEYS, JSON.stringify(next));
      return next;
    });
    showSaved();
  }, [showSaved]);

  const savePref = useCallback(<K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPrefs(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(STORAGE_PREFS, JSON.stringify(next));
      return next;
    });
    showSaved();
  }, [showSaved]);

  const configuredCount = Object.values(keys).filter(v => v.length > 0).length;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-xl mx-auto space-y-6">

        {/* 标题 */}
        <div>
          <h2 className="text-lg font-semibold text-near-black flex items-center gap-2">
            设置
          </h2>
          <p className="text-xs text-stone-gray mt-0.5">
            连接 QeeClaw 与偏好设置
          </p>
        </div>

        {/* ── API Keys 区域 ─────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Key size={16} className="text-terracotta" />
            <h3 className="text-sm font-medium text-near-black">AI 引擎连接</h3>
            <span className="text-[10px] text-stone-gray ml-auto">
              {configuredCount > 0 ? '已连接' : '未连接'}
            </span>
          </div>

          <div className="space-y-2">
            {API_KEY_CONFIGS.map(config => (
              <KeyRow
                key={config.provider}
                config={config}
                value={keys[config.provider] || ''}
                onChange={(v) => saveKey(config.provider, v)}
              />
            ))}
          </div>
        </section>

        {/* ── 偏好设置区域 ─────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Palette size={16} className="text-terracotta" />
            <h3 className="text-sm font-medium text-near-black">偏好</h3>
          </div>

          <div className="card-glass divide-y divide-border-cream">
            {/* 语言 */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-2.5">
                <Globe size={15} className="text-stone-gray" />
                <span className="text-sm text-olive-gray">界面语言</span>
              </div>
              <select
                value={prefs.language}
                onChange={(e) => savePref('language', e.target.value)}
                className="text-xs text-near-black bg-parchment border border-border-warm rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-terracotta/25"
              >
                <option value="zh-CN">简体中文</option>
                <option value="en">English</option>
              </select>
            </div>

            {/* 通知 */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-2.5">
                <Bell size={15} className="text-stone-gray" />
                <span className="text-sm text-olive-gray">任务通知</span>
              </div>
              <ToggleSwitch
                checked={prefs.notifications}
                onChange={(v) => savePref('notifications', v)}
              />
            </div>

            {/* 自动保存 */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-2.5">
                <Shield size={15} className="text-stone-gray" />
                <span className="text-sm text-olive-gray">自动保存</span>
              </div>
              <ToggleSwitch
                checked={prefs.autoSave}
                onChange={(v) => savePref('autoSave', v)}
              />
            </div>
          </div>
        </section>

        {/* 连接状态 */}
        <div className="text-center pt-2">
          <p className="text-[10px] text-stone-gray">
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${isConnected ? 'bg-green-400' : 'bg-yellow-400'}`} />
            {isConnected ? '控制面已连接' : '离线模式 · 使用演示数据'}
          </p>
        </div>

        {/* 保存提示 */}
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed bottom-6 right-6 bg-green-500/10 border border-green-500/20 text-green-600 px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              <Check size={14} />
              已保存
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── API Key 行组件 ──────────────────────────────
function KeyRow({
  config,
  value,
  onChange,
}: {
  config: Omit<ApiKeyConfig, 'apiKey'>;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  const hasKey = value.length > 0;

  return (
    <div className="card-glass p-3.5">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="text-base">{config.icon}</span>
        <span className="text-sm font-medium text-near-black">{config.label}</span>
        {hasKey && (
          <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-600 rounded">
            已配置
          </span>
        )}
        <a
          href={config.helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-[10px] text-stone-gray hover:text-terracotta transition-colors flex items-center gap-0.5"
        >
          获取 Key <ExternalLink size={10} />
        </a>
      </div>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config.placeholder}
          className="w-full px-3 py-2 pr-10 bg-parchment border border-border-warm rounded-lg text-sm text-near-black font-mono placeholder-stone-gray focus:outline-none focus:border-terracotta/25"
        />
        <button
          onClick={() => setShow(!show)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stone-gray hover:text-olive-gray transition-colors"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}

// ─── 开关组件 ────────────────────────────────────
function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors ${
        checked ? 'bg-terracotta' : 'bg-warm-sand'
      }`}
    >
      <motion.div
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
        animate={{ left: checked ? 18 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}
