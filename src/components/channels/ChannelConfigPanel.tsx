import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  AlertCircle,
  CheckCircle,
  LoaderCircle,
  QrCode,
  RefreshCw,
  Save,
  ShieldAlert,
  X,
} from 'lucide-react';
import type {
  ChannelBindingRecord,
  ChannelKey,
  FeishuChannelConfig,
  WechatPersonalOpenClawChannelConfig,
  WechatPersonalOpenClawQrSession,
  WechatPersonalPluginChannelConfig,
  WechatWorkChannelConfig,
} from '@qeeclaw/core-sdk';
import { getChannelsBaseUrl, getChannelsClientAsync, globalRuntimeContext, isChannelsLocalBridgeAvailable } from '../../services/qeeclaw';
import type { ChannelItem } from '../../hooks/useQeeClaw';

type ChannelDraft =
  | {
      kind: 'wechat_work';
      channelName: string;
      enabled: boolean;
      configured: boolean;
      callbackUrl: string;
      riskLevel: string;
      corpId: string;
      agentId: string;
      secret: string;
      secretConfigured: boolean;
      verifyToken: string;
      aesKey: string;
    }
  | {
      kind: 'feishu';
      channelName: string;
      enabled: boolean;
      configured: boolean;
      callbackUrl: string;
      riskLevel: string;
      appId: string;
      appSecret: string;
      secretConfigured: boolean;
      verificationToken: string;
      encryptKey: string;
    }
  | {
      kind: 'wechat_personal_plugin';
      channelName: string;
      enabled: boolean;
      configured: boolean;
      callbackUrl: string;
      riskLevel: string;
      displayName: string;
      assistantName: string;
      welcomeMessage: string;
      kernelCorpId: string;
      kernelAgentId: string;
      kernelSecret: string;
      kernelSecretConfigured: boolean;
      kernelVerifyToken: string;
      kernelAesKey: string;
      bindingEnabled: boolean;
      setupStatus: string;
      capabilityStage: string;
    }
  | {
      kind: 'wechat_personal_openclaw';
      channelName: string;
      enabled: boolean;
      configured: boolean;
      callbackUrl: string;
      riskLevel: string;
      displayName: string;
      setupStatus: string;
      gatewayOnline: boolean;
      manualCliRequired: boolean;
      preinstallSupported: boolean;
      qrSupported: boolean;
      installHint: string;
      capabilityStage: string;
      officialPluginAvailable: boolean | null;
    };

interface ChannelConfigPanelProps {
  channel: ChannelItem;
  onClose: () => void;
  onSaved?: () => void;
}

interface BindingFormState {
  bindingType: 'assistant' | 'device' | 'workspace';
  bindingTargetId: string;
  bindingTargetName: string;
  expiresInHours: string;
  notes: string;
}

function formatTime(value?: string | null): string {
  if (!value) {
    return '未返回';
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }

  return new Date(timestamp).toLocaleString('zh-CN', {
    hour12: false,
  });
}

function toWechatWorkDraft(config: WechatWorkChannelConfig): ChannelDraft {
  return {
    kind: 'wechat_work',
    channelName: config.channelName,
    enabled: config.enabled,
    configured: config.configured,
    callbackUrl: config.callbackUrl,
    riskLevel: config.riskLevel,
    corpId: config.corpId,
    agentId: config.agentId,
    secret: '',
    secretConfigured: config.secretConfigured,
    verifyToken: config.verifyToken,
    aesKey: config.aesKey,
  };
}

function toFeishuDraft(config: FeishuChannelConfig): ChannelDraft {
  return {
    kind: 'feishu',
    channelName: config.channelName,
    enabled: config.enabled,
    configured: config.configured,
    callbackUrl: config.callbackUrl,
    riskLevel: config.riskLevel,
    appId: config.appId,
    appSecret: '',
    secretConfigured: config.secretConfigured,
    verificationToken: config.verificationToken,
    encryptKey: config.encryptKey,
  };
}

function toPluginDraft(config: WechatPersonalPluginChannelConfig): ChannelDraft {
  return {
    kind: 'wechat_personal_plugin',
    channelName: config.channelName,
    enabled: config.enabled,
    configured: config.configured,
    callbackUrl: config.callbackUrl,
    riskLevel: config.riskLevel,
    displayName: config.displayName,
    assistantName: config.assistantName,
    welcomeMessage: config.welcomeMessage,
    kernelCorpId: config.kernelCorpId,
    kernelAgentId: config.kernelAgentId,
    kernelSecret: '',
    kernelSecretConfigured: config.kernelSecretConfigured,
    kernelVerifyToken: config.kernelVerifyToken,
    kernelAesKey: config.kernelAesKey,
    bindingEnabled: config.bindingEnabled,
    setupStatus: config.setupStatus,
    capabilityStage: config.capabilityStage,
  };
}

function toOpenClawDraft(config: WechatPersonalOpenClawChannelConfig): ChannelDraft {
  return {
    kind: 'wechat_personal_openclaw',
    channelName: config.channelName,
    enabled: config.enabled,
    configured: config.configured,
    callbackUrl: config.callbackUrl,
    riskLevel: config.riskLevel,
    displayName: config.displayName,
    setupStatus: config.setupStatus,
    gatewayOnline: config.gatewayOnline,
    manualCliRequired: config.manualCliRequired,
    preinstallSupported: config.preinstallSupported,
    qrSupported: config.qrSupported,
    installHint: config.installHint,
    capabilityStage: config.capabilityStage,
    officialPluginAvailable: config.officialPluginAvailable ?? null,
  };
}

async function loadChannelDraft(channelKey: ChannelKey): Promise<ChannelDraft> {
  const client = await getChannelsClientAsync();
  const teamId = globalRuntimeContext.teamId;

  switch (channelKey) {
    case 'wechat_work':
      return toWechatWorkDraft(await client.channels.getWechatWorkConfig(teamId));
    case 'feishu':
      return toFeishuDraft(await client.channels.getFeishuConfig(teamId));
    case 'wechat_personal_plugin':
      return toPluginDraft(await client.channels.getWechatPersonalPluginConfig(teamId));
    case 'wechat_personal_openclaw':
      return toOpenClawDraft(await client.channels.getWechatPersonalOpenClawConfig(teamId));
    default:
      throw new Error(`Unsupported channel key: ${channelKey}`);
  }
}

export default function ChannelConfigPanel({ channel, onClose, onSaved }: ChannelConfigPanelProps) {
  const localBridgeAvailable = isChannelsLocalBridgeAvailable();
  const channelsBaseUrl = getChannelsBaseUrl();
  const [draft, setDraft] = useState<ChannelDraft | null>(null);
  const [bindings, setBindings] = useState<ChannelBindingRecord[]>([]);
  const [bindingForm, setBindingForm] = useState<BindingFormState>({
    bindingType: 'assistant',
    bindingTargetId: '',
    bindingTargetName: '',
    expiresInHours: '72',
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bindingBusyId, setBindingBusyId] = useState<number | 'create' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [qrSession, setQrSession] = useState<WechatPersonalOpenClawQrSession | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const loadPluginBindings = async (): Promise<ChannelBindingRecord[]> => {
    const client = await getChannelsClientAsync();
    const result = await client.channels.listChannelBindings(globalRuntimeContext.teamId, 'wechat_personal_plugin');
    return result.items;
  };

  const canCreatePluginBinding = draft?.kind === 'wechat_personal_plugin'
    && draft.configured
    && draft.enabled
    && draft.bindingEnabled;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setQrSession(null);

      try {
        const nextDraft = await loadChannelDraft(channel.channelKey as ChannelKey);
        const nextBindings = channel.channelKey === 'wechat_personal_plugin'
          ? await loadPluginBindings()
          : [];
        if (!cancelled) {
          setDraft(nextDraft);
          setBindings(nextBindings);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载渠道配置失败');
          setDraft(null);
          setBindings([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [channel]);

  const reloadPluginBindings = async () => {
    const nextBindings = await loadPluginBindings();
    setBindings(nextBindings);
  };

  const handleSave = async () => {
    if (!draft || draft.kind === 'wechat_personal_openclaw') {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const client = await getChannelsClientAsync();
      const teamId = globalRuntimeContext.teamId;

      switch (draft.kind) {
        case 'wechat_work': {
          await client.channels.updateWechatWorkConfig({
            teamId,
            corpId: draft.corpId.trim(),
            agentId: draft.agentId.trim(),
            secret: draft.secret.trim() || undefined,
          });
          break;
        }
        case 'feishu': {
          await client.channels.updateFeishuConfig({
            teamId,
            appId: draft.appId.trim(),
            appSecret: draft.appSecret.trim() || undefined,
            verificationToken: draft.verificationToken.trim() || undefined,
            encryptKey: draft.encryptKey.trim() || undefined,
          });
          break;
        }
        case 'wechat_personal_plugin': {
          await client.channels.updateWechatPersonalPluginConfig({
            teamId,
            displayName: draft.displayName.trim(),
            assistantName: draft.assistantName.trim() || undefined,
            welcomeMessage: draft.welcomeMessage.trim() || undefined,
            kernelCorpId: draft.kernelCorpId.trim() || undefined,
            kernelAgentId: draft.kernelAgentId.trim() || undefined,
            kernelSecret: draft.kernelSecret.trim() || undefined,
            kernelVerifyToken: draft.kernelVerifyToken.trim() || undefined,
            kernelAesKey: draft.kernelAesKey.trim() || undefined,
            bindingEnabled: draft.bindingEnabled,
            enabled: draft.enabled,
          });
          break;
        }
      }

      const freshDraft = await loadChannelDraft(channel.channelKey as ChannelKey);
      setDraft(freshDraft);
      if (channel.channelKey === 'wechat_personal_plugin') {
        await reloadPluginBindings();
      }
      setSuccess('渠道配置已保存');
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存渠道配置失败');
    } finally {
      setSaving(false);
    }
  };

  const handleStartQr = async () => {
    if (!draft || draft.kind !== 'wechat_personal_openclaw') {
      return;
    }

    setQrLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const client = await getChannelsClientAsync();
      const session = await client.channels.startWechatPersonalOpenClawQr({
        teamId: globalRuntimeContext.teamId,
        forceRefresh: true,
      });
      setQrSession(session);
      setSuccess('扫码会话已创建');
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建扫码会话失败');
    } finally {
      setQrLoading(false);
    }
  };

  const handleRefreshQrStatus = async () => {
    if (!qrSession?.sessionId) {
      return;
    }

    setQrLoading(true);
    setError(null);

    try {
      const client = await getChannelsClientAsync();
      const nextSession = await client.channels.getWechatPersonalOpenClawQrStatus({
        teamId: globalRuntimeContext.teamId,
        sessionId: qrSession.sessionId,
        accountId: qrSession.accountId || undefined,
      });
      setQrSession(nextSession);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '刷新扫码状态失败');
    } finally {
      setQrLoading(false);
    }
  };

  const handleCreateBinding = async () => {
    if (!draft || draft.kind !== 'wechat_personal_plugin') {
      return;
    }

    setBindingBusyId('create');
    setError(null);
    setSuccess(null);

    try {
      const bindingTargetId = bindingForm.bindingTargetId.trim();
      const expiresInHours = Number(bindingForm.expiresInHours || 72);
      if (!bindingTargetId) {
        throw new Error('请先填写绑定目标 ID');
      }
      if (!Number.isFinite(expiresInHours) || expiresInHours < 1) {
        throw new Error('绑定有效期必须大于 0');
      }

      const client = await getChannelsClientAsync();
      await client.channels.createChannelBinding({
        teamId: globalRuntimeContext.teamId,
        channelKey: 'wechat_personal_plugin',
        bindingType: bindingForm.bindingType,
        bindingTargetId,
        bindingTargetName: bindingForm.bindingTargetName.trim() || undefined,
        expiresInHours,
        notes: bindingForm.notes.trim() || undefined,
      });

      await reloadPluginBindings();
      setBindingForm((prev) => ({
        ...prev,
        bindingTargetId: '',
        bindingTargetName: '',
        notes: '',
      }));
      setSuccess('绑定码已生成，请让用户在个人微信中发送该绑定码完成接入');
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成绑定码失败');
    } finally {
      setBindingBusyId(null);
    }
  };

  const handleDisableBinding = async (bindingId: number) => {
    setBindingBusyId(bindingId);
    setError(null);
    setSuccess(null);

    try {
      const client = await getChannelsClientAsync();
      await client.channels.disableChannelBinding(bindingId);
      await reloadPluginBindings();
      setSuccess('绑定记录已停用');
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '停用绑定失败');
    } finally {
      setBindingBusyId(null);
    }
  };

  const handleRegenerateBinding = async (bindingId: number) => {
    setBindingBusyId(bindingId);
    setError(null);
    setSuccess(null);

    try {
      const expiresInHours = Number(bindingForm.expiresInHours || 72);
      if (!Number.isFinite(expiresInHours) || expiresInHours < 1) {
        throw new Error('绑定有效期必须大于 0');
      }

      const client = await getChannelsClientAsync();
      await client.channels.regenerateChannelBindingCode(bindingId, expiresInHours);
      await reloadPluginBindings();
      setSuccess('绑定码已重新生成');
    } catch (err) {
      setError(err instanceof Error ? err.message : '重置绑定码失败');
    } finally {
      setBindingBusyId(null);
    }
  };

  return (
    <div className="card-glass overflow-hidden border border-border-cream/70">
      <div className="flex items-center justify-between border-b border-border-cream px-5 py-4">
        <div>
          <h3 className="font-serif text-base text-near-black">渠道配置</h3>
          <p className="mt-1 text-xs text-stone-gray">
            {channel.channelKey === 'wechat_personal_plugin'
              ? '个人微信插件模式：先完成系统配置，再生成绑定码，让用户在微信里发送绑定码接入。'
              : channel.channelKey === 'wechat_personal_openclaw'
                ? 'Hermes 插件模式：通过二维码扫码完成连接。'
                : `${channel.channelName} 的系统级配置入口`}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
            <span className={`rounded-full px-2.5 py-1 ${localBridgeAvailable ? 'bg-sage-green/10 text-sage-green' : 'bg-terracotta/10 text-terracotta'}`}>
              {localBridgeAvailable ? '本地 hermes-bridge' : '未连接本地 bridge'}
            </span>
            <span className="rounded-full bg-warm-sand/40 px-2.5 py-1 text-stone-gray">
              {channelsBaseUrl ? channelsBaseUrl : '未解析到本地地址'}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg border border-border-warm px-2.5 py-2 text-stone-gray transition-colors hover:text-near-black"
          aria-label="关闭渠道配置"
        >
          <X size={14} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-stone-gray">
          <LoaderCircle size={16} className="animate-spin" />
          正在加载渠道配置...
        </div>
      ) : error && !draft ? (
        <div className="flex items-center gap-2 px-5 py-8 text-sm text-terracotta">
          <AlertCircle size={16} />
          {error}
        </div>
      ) : draft ? (
        <div className="space-y-5 px-5 py-5">
          <StatusBar draft={draft} />

          {error && (
            <div className="rounded-xl border border-terracotta/20 bg-terracotta/5 px-3 py-2 text-xs text-terracotta">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-sage-green/20 bg-sage-green/10 px-3 py-2 text-xs text-sage-green">
              {success}
            </div>
          )}

          {draft.kind === 'wechat_work' && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Corp ID" value={draft.corpId} onChange={(value) => setDraft({ ...draft, corpId: value })} />
              <Field label="Agent ID" value={draft.agentId} onChange={(value) => setDraft({ ...draft, agentId: value })} />
              <Field
                label="Secret"
                value={draft.secret}
                onChange={(value) => setDraft({ ...draft, secret: value })}
                placeholder={draft.secretConfigured ? '已配置，留空则不更新' : '请输入企业微信 Secret'}
              />
              <ReadonlyField label="回调地址" value={draft.callbackUrl || '未返回'} />
              <ReadonlyField label="Verify Token" value={draft.verifyToken || '未返回'} />
              <ReadonlyField label="AES Key" value={draft.aesKey || '未返回'} />
            </div>
          )}

          {draft.kind === 'feishu' && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="App ID" value={draft.appId} onChange={(value) => setDraft({ ...draft, appId: value })} />
              <Field
                label="App Secret"
                value={draft.appSecret}
                onChange={(value) => setDraft({ ...draft, appSecret: value })}
                placeholder={draft.secretConfigured ? '已配置，留空则不更新' : '请输入飞书 App Secret'}
              />
              <Field
                label="Verification Token"
                value={draft.verificationToken}
                onChange={(value) => setDraft({ ...draft, verificationToken: value })}
              />
              <Field label="Encrypt Key" value={draft.encryptKey} onChange={(value) => setDraft({ ...draft, encryptKey: value })} />
            </div>
          )}

          {draft.kind === 'wechat_personal_plugin' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-amber/25 bg-amber/8 px-4 py-3 text-sm text-charcoal-warm">
                这里不是二维码扫码通道。个人微信插件模式的真实流程是：管理员先保存通道配置，再生成绑定码，最后让真实用户在微信里发送绑定码完成接入。
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="显示名称" value={draft.displayName} onChange={(value) => setDraft({ ...draft, displayName: value })} />
                <Field label="助手名称" value={draft.assistantName} onChange={(value) => setDraft({ ...draft, assistantName: value })} />
                <Field label="Kernel Corp ID" value={draft.kernelCorpId} onChange={(value) => setDraft({ ...draft, kernelCorpId: value })} />
                <Field label="Kernel Agent ID" value={draft.kernelAgentId} onChange={(value) => setDraft({ ...draft, kernelAgentId: value })} />
                <Field
                  label="Kernel Secret"
                  value={draft.kernelSecret}
                  onChange={(value) => setDraft({ ...draft, kernelSecret: value })}
                  placeholder={draft.kernelSecretConfigured ? '已配置，留空则不更新' : '请输入 Kernel Secret'}
                />
                <Field
                  label="Kernel Verify Token"
                  value={draft.kernelVerifyToken}
                  onChange={(value) => setDraft({ ...draft, kernelVerifyToken: value })}
                />
                <Field label="Kernel AES Key" value={draft.kernelAesKey} onChange={(value) => setDraft({ ...draft, kernelAesKey: value })} />
                <ReadonlyField label="回调地址" value={draft.callbackUrl || '未返回'} />
              </div>

              <TextAreaField
                label="欢迎语"
                value={draft.welcomeMessage}
                onChange={(value) => setDraft({ ...draft, welcomeMessage: value })}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <BooleanField
                  label="允许绑定"
                  checked={draft.bindingEnabled}
                  onChange={(checked) => setDraft({ ...draft, bindingEnabled: checked })}
                />
                <BooleanField
                  label="启用渠道"
                  checked={draft.enabled}
                  onChange={(checked) => setDraft({ ...draft, enabled: checked })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <ReadonlyField label="接入阶段" value={draft.setupStatus} />
                <ReadonlyField label="能力阶段" value={draft.capabilityStage} />
              </div>

              <div className="rounded-2xl border border-border-cream bg-white/60 p-4">
                <div className="mb-3 text-sm font-medium text-near-black">绑定码管理</div>
                <p className="mb-4 text-xs leading-5 text-stone-gray">
                  保存并启用自建回调模式后，可以生成绑定码，把个人微信入口绑定到 assistant、device 或 workspace。
                </p>

                {(!draft.configured || !draft.enabled || !draft.bindingEnabled) && (
                  <div className="mb-4 rounded-xl border border-amber/25 bg-amber/8 px-3 py-2 text-xs text-charcoal-warm">
                    当前通道配置{draft.configured ? '已完成' : '未完成'}，通道{draft.enabled ? '已启用' : '未启用'}，允许绑定{draft.bindingEnabled ? '已开启' : '未开启'}。若要让新用户接入，请先补全 Kernel 回调配置，再打开“启用渠道”和“允许绑定”。
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <SelectField
                    label="绑定目标类型"
                    value={bindingForm.bindingType}
                    onChange={(value) => setBindingForm((prev) => ({
                      ...prev,
                      bindingType: value as BindingFormState['bindingType'],
                    }))}
                    options={[
                      { label: 'assistant', value: 'assistant' },
                      { label: 'device', value: 'device' },
                      { label: 'workspace', value: 'workspace' },
                    ]}
                  />
                  <Field
                    label="绑定有效期（小时）"
                    value={bindingForm.expiresInHours}
                    onChange={(value) => setBindingForm((prev) => ({ ...prev, expiresInHours: value }))}
                  />
                  <Field
                    label="绑定目标 ID"
                    value={bindingForm.bindingTargetId}
                    onChange={(value) => setBindingForm((prev) => ({ ...prev, bindingTargetId: value }))}
                    placeholder="如 assistant-001 / device-12"
                  />
                  <Field
                    label="绑定目标名称"
                    value={bindingForm.bindingTargetName}
                    onChange={(value) => setBindingForm((prev) => ({ ...prev, bindingTargetName: value }))}
                    placeholder="如 销售助手 / 办公室 Mac mini"
                  />
                </div>

                <div className="mt-4">
                  <Field
                    label="备注"
                    value={bindingForm.notes}
                    onChange={(value) => setBindingForm((prev) => ({ ...prev, notes: value }))}
                    placeholder="可选，例如：给试点用户使用"
                  />
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleCreateBinding}
                    disabled={bindingBusyId === 'create' || !canCreatePluginBinding}
                    className="inline-flex items-center gap-2 rounded-xl bg-terracotta px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {bindingBusyId === 'create' ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}
                    生成绑定码
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="text-sm font-medium text-near-black">已有绑定码</div>
                  {bindings.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border-cream bg-warm-sand/20 px-4 py-6 text-sm text-stone-gray">
                      当前还没有绑定记录。
                    </div>
                  ) : (
                    bindings.map((binding) => (
                      <div key={binding.id} className="rounded-xl border border-border-cream bg-parchment/40 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-near-black">{binding.bindingTargetName || binding.bindingTargetId}</span>
                              <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[11px] text-teal">{binding.bindingType}</span>
                              <span className={`rounded-full px-2 py-0.5 text-[11px] ${binding.status === 'pending' ? 'bg-amber/10 text-amber' : binding.status === 'disabled' ? 'bg-stone-gray/10 text-stone-gray' : 'bg-sage-green/10 text-sage-green'}`}>
                                {binding.status}
                              </span>
                            </div>
                            <div className="text-xs text-stone-gray">目标 ID：{binding.bindingTargetId}</div>
                            <div className="text-xs text-stone-gray">绑定码：{binding.bindingCode}</div>
                            <div className="text-xs text-stone-gray">
                              过期时间：{formatTime(binding.codeExpiresAt)} | 创建时间：{formatTime(binding.createdTime)}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleRegenerateBinding(binding.id)}
                              disabled={bindingBusyId === binding.id}
                              className="rounded-lg border border-border-warm px-3 py-1.5 text-xs font-medium text-olive-gray transition-colors hover:text-near-black disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              重置绑定码
                            </button>
                            <button
                              onClick={() => handleDisableBinding(binding.id)}
                              disabled={bindingBusyId === binding.id}
                              className="rounded-lg border border-terracotta/20 px-3 py-1.5 text-xs font-medium text-terracotta transition-colors hover:bg-terracotta/5 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              停用
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {draft.kind === 'wechat_personal_openclaw' && (
            <div className="space-y-4">
              <div className={`rounded-2xl border px-4 py-3 text-sm text-charcoal-warm ${draft.gatewayOnline ? 'border-sage-green/20 bg-sage-green/8' : 'border-amber/25 bg-amber/8'}`}>
                {draft.gatewayOnline
                  ? '本地 Hermes gateway 已在线，可以继续走二维码登录。'
                  : draft.qrSupported
                    ? '当前未检测到 Hermes gateway 守护进程，但本地二维码登录链路已可用。若扫码后状态异常，再检查 hermes-bridge 所在机器的微信 gateway。'
                    : '本地 Hermes gateway 当前未在线，且二维码链路不可用。请先检查 hermes-bridge 所在机器的微信 gateway。'}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <ReadonlyField label="显示名称" value={draft.displayName} />
                <ReadonlyField label="接入阶段" value={draft.setupStatus} />
                <ReadonlyField label="能力阶段" value={draft.capabilityStage} />
                <ReadonlyField label="回调地址" value={draft.callbackUrl || '未返回'} />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FlagCard label="Gateway 在线" value={draft.gatewayOnline ? '在线' : '离线'} tone={draft.gatewayOnline ? 'ok' : 'warn'} />
                <FlagCard label="预装支持" value={draft.preinstallSupported ? '支持' : '不支持'} tone={draft.preinstallSupported ? 'ok' : 'muted'} />
                <FlagCard label="二维码接入" value={draft.qrSupported ? '可用' : '不可用'} tone={draft.qrSupported ? 'ok' : 'muted'} />
              </div>

              <div className="rounded-2xl border border-border-cream bg-warm-sand/25 px-4 py-3 text-sm text-charcoal-warm">
                <div className="mb-1 flex items-center gap-2 font-medium text-near-black">
                  <ShieldAlert size={15} className="text-terracotta" />
                  安装提示
                </div>
                <p>{draft.installHint || (draft.manualCliRequired ? '需要通过 CLI 完成插件安装和连接。' : '当前未返回额外安装说明。')}</p>
                <p className="mt-2 text-xs text-stone-gray">
                  这条链路同样只依赖本地 hermes-bridge 和本机 gateway，不会自动切到云端后端代管二维码状态。
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleStartQr}
                  disabled={qrLoading || !draft.qrSupported}
                  className="inline-flex items-center gap-2 rounded-xl bg-terracotta px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <QrCode size={15} />
                  发起扫码
                </button>
                <button
                  onClick={handleRefreshQrStatus}
                  disabled={qrLoading || !qrSession?.sessionId}
                  className="inline-flex items-center gap-2 rounded-xl border border-border-warm px-4 py-2 text-sm font-medium text-olive-gray transition-colors hover:text-near-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RefreshCw size={15} className={qrLoading ? 'animate-spin' : ''} />
                  刷新状态
                </button>
              </div>

              {qrSession && (
                <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                  <div className="rounded-2xl border border-border-cream bg-white/70 p-4">
                    {qrSession.qrUrl ? (
                      qrSession.qrDataUrl?.startsWith('data:image/') ? (
                        <img
                          src={qrSession.qrDataUrl}
                          alt="微信登录二维码"
                          className="h-44 w-44 rounded-xl object-contain"
                        />
                      ) : (
                        <div className="flex h-44 w-44 items-center justify-center">
                          <QRCodeSVG
                            value={qrSession.qrUrl}
                            size={176}
                            level="M"
                            includeMargin={false}
                          />
                        </div>
                      )
                    ) : (
                      <div className="flex h-44 w-44 items-center justify-center rounded-xl bg-warm-sand/40 text-xs text-stone-gray">
                        暂无二维码
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 rounded-2xl border border-border-cream bg-white/60 p-4 text-sm text-charcoal-warm">
                    <ReadonlyField label="会话状态" value={qrSession.status || 'unknown'} />
                    <ReadonlyField label="会话 ID" value={qrSession.sessionId || '未返回'} />
                    <ReadonlyField label="账号 ID" value={qrSession.accountId || '未返回'} />
                    <ReadonlyField label="说明" value={qrSession.message || '未返回'} />
                    <ReadonlyField label="到期时间" value={qrSession.expiresAt || '未返回'} />
                  </div>
                </div>
              )}
            </div>
          )}

          {draft.kind !== 'wechat_personal_openclaw' && (
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-terracotta px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}
                保存配置
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function StatusBar({ draft }: { draft: ChannelDraft }) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <MiniStatus label="渠道" value={draft.channelName} tone="neutral" />
      <MiniStatus label="配置状态" value={draft.configured ? '已配置' : '未配置'} tone={draft.configured ? 'ok' : 'warn'} />
      <MiniStatus label="启用状态" value={draft.enabled ? '已启用' : '未启用'} tone={draft.enabled ? 'ok' : 'muted'} />
      <MiniStatus label="风险等级" value={draft.riskLevel || 'unknown'} tone={draft.riskLevel === 'low' ? 'ok' : draft.riskLevel === 'medium' ? 'warn' : 'neutral'} />
    </div>
  );
}

function MiniStatus({ label, value, tone }: { label: string; value: string; tone: 'ok' | 'warn' | 'muted' | 'neutral' }) {
  const toneClass =
    tone === 'ok'
      ? 'border-sage-green/20 bg-sage-green/8 text-sage-green'
      : tone === 'warn'
        ? 'border-amber/20 bg-amber/8 text-amber'
        : tone === 'muted'
          ? 'border-border-cream bg-warm-sand/30 text-stone-gray'
          : 'border-border-cream bg-white/60 text-near-black';

  return (
    <div className={`rounded-2xl border px-3 py-3 ${toneClass}`}>
      <div className="text-[11px] uppercase tracking-wider opacity-70">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

function FlagCard({ label, value, tone }: { label: string; value: string; tone: 'ok' | 'warn' | 'muted' }) {
  const icon = tone === 'ok' ? <CheckCircle size={14} /> : tone === 'warn' ? <AlertCircle size={14} /> : <ShieldAlert size={14} />;
  const toneClass = tone === 'ok' ? 'text-sage-green' : tone === 'warn' ? 'text-amber' : 'text-stone-gray';
  return (
    <div className="rounded-2xl border border-border-cream bg-white/60 px-4 py-3">
      <div className={`mb-1 flex items-center gap-2 text-xs ${toneClass}`}>{icon}{label}</div>
      <div className="text-sm font-medium text-near-black">{value}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-stone-gray">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[var(--radius-standard)] border border-border-warm bg-parchment px-3 py-2 text-sm text-near-black outline-none placeholder:text-stone-gray/50 focus:border-terracotta/40 focus:ring-1 focus:ring-terracotta/20"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-stone-gray">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[var(--radius-standard)] border border-border-warm bg-parchment px-3 py-2 text-sm text-near-black outline-none focus:border-terracotta/40 focus:ring-1 focus:ring-terracotta/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-stone-gray">{label}</span>
      <textarea
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-none rounded-[var(--radius-standard)] border border-border-warm bg-parchment px-3 py-2 text-sm text-near-black outline-none placeholder:text-stone-gray/50 focus:border-terracotta/40 focus:ring-1 focus:ring-terracotta/20"
      />
    </label>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium text-stone-gray">{label}</div>
      <div className="rounded-[var(--radius-standard)] border border-border-cream bg-warm-sand/30 px-3 py-2 text-sm text-charcoal-warm">
        {value}
      </div>
    </div>
  );
}

function BooleanField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-2xl border border-border-cream bg-white/60 px-4 py-3">
      <span className="text-sm font-medium text-near-black">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-border-warm text-terracotta focus:ring-terracotta/20"
      />
    </label>
  );
}