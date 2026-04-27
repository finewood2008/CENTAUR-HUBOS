// Hub OS - 设置页面：设备信息 · 云端连接 · 企业配置 · 策略 · 通知 · 安全
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor, Cpu, HardDrive, Thermometer, Clock,
  Key, Eye, EyeOff, Check, ExternalLink, Zap,
  Building2, Upload, Image,
  Users, Timer, Layers, Gauge,
  Bell, BellRing, FileText, AlertTriangle, Mail,
  Palette, Globe, Sun, Moon,
  Shield, Lock, ScrollText, DatabaseBackup,
} from 'lucide-react';
import { useOrg, useTheme } from '../../stores/useAppStore';
import type { OrgInfo, BackgroundStyle } from '../../stores/useAppStore';
import { useFinanceData } from '../../hooks/useQeeClaw';

// ─── 类型 ────────────────────────────────────────
interface SettingsProps {
  isConnected: boolean;
}

interface SettingsState {
  deviceKey: string;
  companyName: string;
  industry: string;
  business: string;
  workHours: string;
  autoLevel: string;
  maxConcurrent: string;
  taskTimeout: string;
  notifyTaskDone: boolean;
  notifyAlert: boolean;
  notifyDailyReport: boolean;
  notifyQuotaWarn: boolean;
  notifyChannel: string;
  approvalRequired: boolean;
  dataLocal: boolean;
  accessLog: boolean;
  autoBackup: boolean;
  backupDays: string;
  bgStyle: string;
  language: string;
}

function formatFinanceAmount(amount: number, currency?: string | null) {
  const resolved = String(currency || 'CNY').toUpperCase();
  if (resolved === 'USD') return `$${amount.toFixed(2)}`;
  if (resolved === 'CNY') return `¥${amount.toFixed(2)}`;
  return `${resolved} ${amount.toFixed(2)}`;
}

// ─── 默认值 ──────────────────────────────────────
const STORAGE_KEY = 'hubos-settings';

const DEFAULTS: SettingsState = {
  deviceKey: '',
  companyName: '',
  industry: '',
  business: '',
  workHours: '24h',
  autoLevel: 'standard',
  maxConcurrent: '5',
  taskTimeout: '15',
  notifyTaskDone: true,
  notifyAlert: true,
  notifyDailyReport: true,
  notifyQuotaWarn: true,
  notifyChannel: 'system',
  approvalRequired: true,
  dataLocal: true,
  accessLog: true,
  autoBackup: true,
  backupDays: '30',
  bgStyle: 'grid',
  language: 'zh-CN',
};

// ─── 设备模拟数据 ────────────────────────────────
const DEVICE = {
  name: 'Centaur-HR Hub',
  model: 'CH-200 Pro',
  serial: 'CTR-2026-0417-PRO',
  firmware: 'v2.4.1',
  uptime: '12 天 7 小时',
  cpu: 34,
  memUsed: 6.2,
  memTotal: 16,
  diskUsed: 128,
  diskTotal: 512,
  temp: 42,
};

// ─── 动画 ────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

// ─── select 样式 ─────────────────────────────────
const selectCls =
  'text-xs text-near-black bg-parchment border border-border-warm rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-terracotta/25';
const inputCls =
  'w-full px-3 py-2 bg-parchment border border-border-warm rounded-lg text-sm text-near-black placeholder-stone-gray focus:outline-none focus:border-terracotta/25';

// ═══════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════
export default function Settings({ isConnected }: SettingsProps) {
  const [s, setS] = useState<SettingsState>(DEFAULTS);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const { org, updateOrg } = useOrg();
  const { theme, setTheme, bgStyle, setBgStyle } = useTheme();
  const { data: financeData } = useFinanceData(isConnected);

  // 加载
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setS({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, []);

  // 保存辅助
  const persist = useCallback((next: SettingsState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('hubos-settings-changed'));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, []);

  const set = useCallback(<K extends keyof SettingsState>(key: K, val: SettingsState[K]) => {
    setS(prev => {
      const next = { ...prev, [key]: val };
      persist(next);
      return next;
    });
  }, [persist]);

  const memPct = Math.round((DEVICE.memUsed / DEVICE.memTotal) * 100);
  const diskPct = Math.round((DEVICE.diskUsed / DEVICE.diskTotal) * 100);
  const hasKey = s.deviceKey.length > 0;

  return (
    <div className="flex-1 overflow-y-auto bg-parchment">
      {/* Header */}
      <div className="px-8 pt-8 pb-2">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="font-serif text-2xl text-near-black tracking-tight">设置</h1>
          <p className="text-sm text-stone-gray mt-1">设备管理 · 云端连接 · 系统配置</p>
        </motion.div>
      </div>

      <div className="px-8 pb-10 space-y-6 max-w-2xl">

        {/* ════════════════════════════════════════════
            1. 设备信息
           ════════════════════════════════════════════ */}
        <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Monitor size={16} className="text-terracotta" />
              <h3 className="text-sm font-medium text-near-black">设备信息</h3>
            </div>

          </div>
          <div className="card-glass-warm p-5 space-y-4">
            {/* 顶部：名称 + 型号 + 状态 */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg text-near-black font-medium">{DEVICE.name}</h3>
                <p className="text-xs text-stone-gray mt-0.5">{DEVICE.model} · {DEVICE.serial}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-success-green animate-pulse" />
                <span className="text-xs text-success-green font-medium">运行中</span>
              </div>
            </div>

            {/* 基础信息行 */}
            <div className="grid grid-cols-3 gap-3">
              <InfoChip icon={Layers} label="固件版本" value={DEVICE.firmware} />
              <InfoChip icon={Clock} label="运行时长" value={DEVICE.uptime} />
              <InfoChip icon={Thermometer} label="设备温度" value={`${DEVICE.temp}°C`} valueColor={DEVICE.temp > 70 ? 'text-error-crimson' : 'text-success-green'} />
            </div>

            {/* 资源使用 */}
            <div className="space-y-3 pt-1">
              <ResourceBar icon={Cpu} label="CPU" pct={DEVICE.cpu} detail={`${DEVICE.cpu}%`} />
              <ResourceBar icon={Monitor} label="内存" pct={memPct} detail={`${DEVICE.memUsed} GB / ${DEVICE.memTotal} GB`} />
              <ResourceBar icon={HardDrive} label="存储" pct={diskPct} detail={`${DEVICE.diskUsed} GB / ${DEVICE.diskTotal} GB`} />
            </div>
          </div>
        </motion.section>

        {/* ════════════════════════════════════════════
            2. QeeClaw 云端连接
           ════════════════════════════════════════════ */}
        <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={1}>
          <SectionTitle icon={Key} label="QeeClaw 云端连接" />
          <div className="card-glass p-5 space-y-4">
            <p className="text-xs text-olive-gray">通过 Device Key 连接 QeeClaw 算力网关，获取 AI 推理能力</p>

            {/* Key 输入 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-near-black">Device Key</span>
                {hasKey && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-success-green/10 text-success-green rounded">已配置</span>
                )}
                <a
                  href="https://qeeclaw.com/console/devices"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-[10px] text-stone-gray hover:text-terracotta transition-colors flex items-center gap-0.5"
                >
                  获取 Key <ExternalLink size={10} />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={s.deviceKey}
                  onChange={e => set('deviceKey', e.target.value)}
                  placeholder="qc-device-..."
                  className={`${inputCls} pr-10 font-mono`}
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stone-gray hover:text-olive-gray transition-colors"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* 连接状态 + 余额 */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${hasKey ? 'bg-success-green' : 'bg-yellow-500'}`} />
                <span className={`text-xs font-medium ${hasKey ? 'text-success-green' : 'text-yellow-600'}`}>
                  {hasKey ? '已连接' : '未连接'}
                </span>
              </div>
              {hasKey && (
                <div className="flex items-center gap-1.5 text-xs text-olive-gray">
                  <Zap size={12} className="text-terracotta" />
                  剩余算力：<span className="font-medium text-near-black">
                    {formatFinanceAmount(
                      financeData.wallet?.balance ?? 0,
                      financeData.wallet?.currency ?? financeData.costSummary?.primaryCurrency ?? financeData.quota?.currency,
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* ════════════════════════════════════════════
            3. 企业信息
           ════════════════════════════════════════════ */}
        <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={2}>
          <SectionTitle icon={Building2} label="企业信息" />
          <div className="card-glass p-5 space-y-4">
            {/* 企业名称 */}
            <div>
              <label className="text-xs text-olive-gray mb-1.5 block">企业名称</label>
              <input
                value={org.name}
                onChange={e => { updateOrg({ name: e.target.value }); persist(s); }}
                placeholder="请输入企业名称"
                className={inputCls}
              />
            </div>

            {/* 组织类型 */}
            <div>
              <label className="text-xs text-olive-gray mb-1.5 block">组织类型</label>
              <select value={org.type} onChange={e => { updateOrg({ type: e.target.value as OrgInfo['type'] }); persist(s); }} className={`w-full ${selectCls}`}>
                <option value="personal">个人</option>
                <option value="studio">工作室</option>
                <option value="company">企业</option>
              </select>
            </div>

            {/* 行业 */}
            <div>
              <label className="text-xs text-olive-gray mb-1.5 block">所属行业</label>
              <select value={org.industry || s.industry} onChange={e => { updateOrg({ industry: e.target.value }); set('industry', e.target.value); }} className={`w-full ${selectCls}`}>
                <option value="">请选择</option>
                <option value="trade">外贸 / 跨境电商</option>
                <option value="manufacturing">制造业</option>
                <option value="tech">科技 / 互联网</option>
                <option value="finance">金融</option>
                <option value="education">教育</option>
                <option value="medical">医疗</option>
                <option value="other">其他</option>
              </select>
            </div>

            {/* 一句话介绍 */}
            <div>
              <label className="text-xs text-olive-gray mb-1.5 block">一句话介绍</label>
              <textarea
                value={org.tagline || s.business}
                onChange={e => { updateOrg({ tagline: e.target.value }); set('business', e.target.value); }}
                placeholder="简要描述企业主营业务方向"
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* Logo 上传占位 */}
            <div>
              <label className="text-xs text-olive-gray mb-1.5 block">品牌 Logo</label>
              <div className="border-2 border-dashed border-border-warm rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:border-terracotta/30 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-warm-sand flex items-center justify-center">
                  <Image size={18} className="text-stone-gray" />
                </div>
                <p className="text-xs text-stone-gray">点击或拖拽上传 Logo</p>
                <p className="text-[10px] text-warm-silver">支持 PNG、JPG，建议 512×512</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ════════════════════════════════════════════
            4. 员工全局策略
           ════════════════════════════════════════════ */}
        <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={3}>
          <SectionTitle icon={Users} label="员工全局策略" />
          <div className="card-glass divide-y divide-border-cream">
            <SelectRow icon={Clock} label="默认工作时段" value={s.workHours} onChange={v => set('workHours', v)} options={[
              { value: '24h', label: '全天候 24h' },
              { value: '9-18', label: '工作日 9:00-18:00' },
              { value: '9-21', label: '工作日 9:00-21:00' },
              { value: 'custom', label: '自定义' },
            ]} />
            <SelectRow icon={Gauge} label="自动化级别" value={s.autoLevel} onChange={v => set('autoLevel', v)} options={[
              { value: 'conservative', label: '保守 · 需人工确认' },
              { value: 'standard', label: '标准 · 常规任务自动执行' },
              { value: 'aggressive', label: '激进 · 全自动' },
            ]} />
            <SelectRow icon={Layers} label="最大并发任务" value={s.maxConcurrent} onChange={v => set('maxConcurrent', v)} options={[
              { value: '3', label: '3 个' },
              { value: '5', label: '5 个' },
              { value: '10', label: '10 个' },
              { value: 'unlimited', label: '不限' },
            ]} />
            <SelectRow icon={Timer} label="任务超时时间" value={s.taskTimeout} onChange={v => set('taskTimeout', v)} options={[
              { value: '5', label: '5 分钟' },
              { value: '15', label: '15 分钟' },
              { value: '30', label: '30 分钟' },
              { value: '60', label: '1 小时' },
            ]} />
          </div>
        </motion.section>

        {/* ════════════════════════════════════════════
            5. 通知与提醒
           ════════════════════════════════════════════ */}
        <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={4}>
          <SectionTitle icon={Bell} label="通知与提醒" />
          <div className="card-glass divide-y divide-border-cream">
            <ToggleRow icon={Check} label="任务完成通知" desc="员工完成任务时推送提醒" checked={s.notifyTaskDone} onChange={v => set('notifyTaskDone', v)} />
            <ToggleRow icon={AlertTriangle} label="异常告警通知" desc="任务失败或系统异常时立即通知" checked={s.notifyAlert} onChange={v => set('notifyAlert', v)} />
            <ToggleRow icon={FileText} label="员工日报推送" desc="每日汇总各员工工作成果" checked={s.notifyDailyReport} onChange={v => set('notifyDailyReport', v)} />
            <ToggleRow icon={BellRing} label="算力用量预警" desc="当月用量超过 80% 时预警" checked={s.notifyQuotaWarn} onChange={v => set('notifyQuotaWarn', v)} />
            <SelectRow icon={Mail} label="通知渠道" value={s.notifyChannel} onChange={v => set('notifyChannel', v)} options={[
              { value: 'system', label: '系统通知' },
              { value: 'wecom', label: '企业微信' },
              { value: 'email', label: '邮件' },
              { value: 'all', label: '全部' },
            ]} />
          </div>
        </motion.section>

        {/* ════════════════════════════════════════════
            6. 安全与数据
           ════════════════════════════════════════════ */}
        <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={5}>
          <SectionTitle icon={Shield} label="安全与数据" />
          <div className="card-glass divide-y divide-border-cream">
            <ToggleRow icon={Shield} label="操作审批" desc="敏感操作需人工确认后执行" checked={s.approvalRequired} onChange={v => set('approvalRequired', v)} />
            <ToggleRow icon={Lock} label="数据本地化" desc="业务数据不出本地设备" checked={s.dataLocal} onChange={v => set('dataLocal', v)} />
            <ToggleRow icon={ScrollText} label="访问日志" desc="记录所有员工操作日志" checked={s.accessLog} onChange={v => set('accessLog', v)} />
            <ToggleRow icon={DatabaseBackup} label="自动备份" desc="每日自动备份知识库数据" checked={s.autoBackup} onChange={v => set('autoBackup', v)} />
            {s.autoBackup && (
              <SelectRow icon={Clock} label="备份保留天数" value={s.backupDays} onChange={v => set('backupDays', v)} options={[
                { value: '7', label: '7 天' },
                { value: '14', label: '14 天' },
                { value: '30', label: '30 天' },
                { value: '90', label: '90 天' },
              ]} />
            )}
          </div>
        </motion.section>

        {/* ════════════════════════════════════════════
            7. 外观与底部
           ════════════════════════════════════════════ */}
        <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={6}>
          <SectionTitle icon={Palette} label="外观" />
          <div className="card-glass divide-y divide-border-cream">
            {/* 主题切换 */}
            <div className="p-3.5">
              <div className="flex items-center gap-2.5 mb-3">
                <Sun size={15} className="text-stone-gray" />
                <span className="text-sm text-olive-gray">主题模式</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { key: 'warm' as const, label: '暖色', icon: Sun, preview: 'bg-[#f5f0e8]' },
                  { key: 'dark' as const, label: '暗色', icon: Moon, preview: 'bg-[#1a1a2e]' },
                  { key: 'system' as const, label: '跟随系统', icon: Monitor, preview: 'bg-gradient-to-r from-[#f5f0e8] to-[#1a1a2e]' },
                ]).map(({ key, label, icon: ThemeIcon, preview }) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className={`relative rounded-xl border-2 p-3 transition-all ${
                      theme === key
                        ? 'border-terracotta shadow-[0_0_0_1px_rgba(201,100,66,0.3)]'
                        : 'border-border-warm hover:border-stone-gray/30'
                    }`}
                  >
                    <div className={`h-12 rounded-lg mb-2 ${preview}`}>
                      <div className="m-2 h-3 w-10 rounded bg-white/40" />
                      <div className="mx-2 h-2 w-6 rounded bg-white/25" />
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <ThemeIcon size={12} className="text-stone-gray" />
                      <span className="text-xs text-olive-gray">{label}</span>
                    </div>
                    {theme === key && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-terracotta flex items-center justify-center">
                        <Check size={10} className="text-white" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 背景样式 */}
            <div className="p-3.5">
              <div className="flex items-center gap-2.5 mb-3">
                <Monitor size={15} className="text-stone-gray" />
                <span className="text-sm text-olive-gray">背景样式</span>
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {([
                  { key: 'grid' as BackgroundStyle, label: '网格', previewCls: 'bg-parchment', previewStyle: { backgroundImage: 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)', backgroundSize: '8px 8px' } },
                  { key: 'solid' as BackgroundStyle, label: '纯色', previewCls: 'bg-parchment', previewStyle: {} },
                  { key: 'paper' as BackgroundStyle, label: '纸纹', previewCls: 'bg-parchment', previewStyle: { backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\")" } },
                  { key: 'gradient' as BackgroundStyle, label: '渐变', previewCls: '', previewStyle: { background: 'linear-gradient(145deg, #f5f4ed 0%, #faf9f5 40%, #ede8dc 100%)' } },
                ]).map(({ key, label, previewCls, previewStyle }) => (
                  <button
                    key={key}
                    onClick={() => setBgStyle(key)}
                    className={`relative rounded-xl border-2 p-2.5 transition-all ${
                      bgStyle === key
                        ? 'border-terracotta shadow-[0_0_0_1px_rgba(201,100,66,0.3)]'
                        : 'border-border-warm hover:border-stone-gray/30'
                    }`}
                  >
                    <div className={`h-12 rounded-lg mb-1.5 overflow-hidden ${previewCls}`} style={previewStyle}>
                      <div className="m-1.5 h-3 w-10 rounded bg-white/60" />
                      <div className="mx-1.5 h-2 w-6 rounded bg-white/40" />
                    </div>
                    <span className="text-[11px] text-olive-gray">{label}</span>
                    {bgStyle === key && (
                      <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-terracotta flex items-center justify-center">
                        <Check size={8} className="text-white" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 语言 */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-2.5">
                <Globe size={15} className="text-stone-gray" />
                <span className="text-sm text-olive-gray">界面语言</span>
              </div>
              <select value={s.language} onChange={e => set('language', e.target.value)} className={selectCls}>
                <option value="zh-CN">简体中文</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <div className="text-center pt-4 pb-2 space-y-1.5">
            <p className="text-[10px] text-stone-gray">
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${isConnected ? 'bg-success-green' : 'bg-yellow-500'}`} />
              {isConnected ? '控制面已连接' : '离线模式 · 控制面断开连接'}
            </p>
            <p className="text-[10px] text-warm-silver">
              Hub OS {DEVICE.firmware} · QeeClaw Runtime
            </p>
          </div>
        </motion.section>

      </div>

      {/* 保存 toast */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed bottom-6 right-6 bg-success-green/10 border border-success-green/20 text-success-green px-4 py-2 rounded-lg text-sm flex items-center gap-2 z-50"
          >
            <Check size={14} />
            已保存
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 子组件
// ═══════════════════════════════════════════════════

function SectionTitle({ icon: Icon, label }: { icon: typeof Monitor; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={16} className="text-terracotta" />
      <h3 className="text-sm font-medium text-near-black">{label}</h3>
    </div>
  );
}

function InfoChip({ icon: Icon, label, value, valueColor = 'text-near-black' }: {
  icon: typeof Clock; label: string; value: string; valueColor?: string;
}) {
  return (
    <div className="bg-parchment/60 rounded-lg p-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} className="text-stone-gray" />
        <span className="text-[10px] text-stone-gray">{label}</span>
      </div>
      <p className={`text-sm font-medium ${valueColor}`}>{value}</p>
    </div>
  );
}

function ResourceBar({ icon: Icon, label, pct, detail }: {
  icon: typeof Cpu; label: string; pct: number; detail: string;
}) {
  const barColor = pct > 80 ? 'bg-error-crimson' : pct > 60 ? 'bg-terracotta' : 'bg-success-green';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Icon size={12} className="text-stone-gray" />
          <span className="text-xs text-olive-gray">{label}</span>
        </div>
        <span className="text-xs text-stone-gray">{detail}</span>
      </div>
      <div className="w-full h-2 rounded-full bg-warm-sand overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
        />
      </div>
    </div>
  );
}

function ToggleRow({ icon: Icon, label, desc, checked, onChange }: {
  icon: typeof Shield; label: string; desc: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3.5">
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <Icon size={15} className="text-stone-gray mt-0.5 shrink-0" />
        <div className="min-w-0">
          <span className="text-sm text-olive-gray block">{label}</span>
          <span className="text-[10px] text-stone-gray block mt-0.5">{desc}</span>
        </div>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

function SelectRow({ icon: Icon, label, value, onChange, options }: {
  icon: typeof Clock; label: string; value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center justify-between p-3.5">
      <div className="flex items-center gap-2.5">
        <Icon size={15} className="text-stone-gray" />
        <span className="text-sm text-olive-gray">{label}</span>
      </div>
      <select value={value} onChange={e => onChange(e.target.value)} className={selectCls}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${checked ? 'bg-terracotta' : 'bg-warm-sand'}`}
    >
      <motion.div
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
        animate={{ left: checked ? 18 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}
