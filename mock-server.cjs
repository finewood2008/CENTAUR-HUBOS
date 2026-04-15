// Hub OS — 控制面 Proxy + Mock Server
// 真实后端 (bridge_server :21747) 的 knowledge/gateway/wechat 走代理
// 其余 API (agent/billing/models/channels) 继续 mock
// 启动: node mock-server.cjs

const http = require('http');

const PORT = 3456;
const BRIDGE_URL = 'http://127.0.0.1:21747'; // qeeclaw-server 真实后端

// ── Mock 数据 ─────────────────────────────────────

const MOCK_AGENTS = [
  {
    id: 1,
    name: '火花 Spark',
    code: 'spark-brand',
    description: '品牌设计专家 — 负责 VI 系统、Logo 设计、物料制作',
    avatar: null,
    voice_id: null,
    runtime_type: 'hermes',
    runtime_label: 'Hermes Agent',
    model: 'claude-sonnet-4',
  },
  {
    id: 2,
    name: '小助理 Aria',
    code: 'aria-assistant',
    description: '日常运营助手 — 处理客户咨询、文档整理、会议纪要',
    avatar: null,
    voice_id: null,
    runtime_type: 'hermes',
    runtime_label: 'Hermes Agent',
    model: 'gpt-4o',
  },
  {
    id: 3,
    name: '猎手 Hunter',
    code: 'hunter-leads',
    description: '获客分析师 — 潜客挖掘、竞品监控、市场洞察',
    avatar: null,
    voice_id: null,
    runtime_type: 'openclaw',
    runtime_label: 'OpenClaw Runtime',
    model: 'gemini-2.5-flash',
  },
];

const MOCK_TEMPLATES = [
  {
    id: 1,
    code: 'brand-designer',
    name: '品牌设计师',
    description: '专业的品牌视觉设计，包含 Logo、VI 系统、物料模板',
    avatar: null,
    allowed_tools: ['midjourney', 'dall-e', 'figma-export', 'ffmpeg'],
  },
  {
    id: 2,
    code: 'sales-assistant',
    name: '销售助理',
    description: '客户跟进、CRM 管理、报价单生成',
    avatar: null,
    allowed_tools: ['crm', 'email', 'document-gen'],
  },
  {
    id: 3,
    code: 'content-creator',
    name: '内容创作者',
    description: '小红书、抖音、公众号多平台内容创作与排期',
    avatar: null,
    allowed_tools: ['image-gen', 'video-edit', 'social-publish'],
  },
];

const MOCK_WALLET = {
  balance: 128.50,
  currency: 'CNY',
  total_spent: 371.50,
  total_recharge: 500.00,
  current_month_spent: 42.80,
  updated_time: new Date().toISOString(),
};

const MOCK_BILLING_RECORDS = [
  {
    id: 101, product_name: 'claude-sonnet-4', record_type: 'consumption',
    duration_seconds: 0, text_input_length: 2400, text_output_length: 1800,
    unit_price: 0.003, output_unit_price: 0.015, amount: 0.034,
    currency: 'CNY', remark: '品牌设计对话', balance_snapshot: 128.50,
    created_time: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 100, product_name: 'gpt-4o', record_type: 'consumption',
    duration_seconds: 0, text_input_length: 1200, text_output_length: 800,
    unit_price: 0.005, output_unit_price: 0.015, amount: 0.018,
    currency: 'CNY', remark: '客户咨询处理', balance_snapshot: 128.53,
    created_time: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 99, product_name: '充值', record_type: 'recharge',
    duration_seconds: 0, text_input_length: 0, text_output_length: 0,
    unit_price: 0, output_unit_price: 0, amount: 100.00,
    currency: 'CNY', remark: '手动充值', balance_snapshot: 128.55,
    created_time: new Date(Date.now() - 86400000).toISOString(),
  },
];

const MOCK_BILLING_SUMMARY = {
  total_spent: 371.50,
  total_recharge: 500.00,
};

const MOCK_MODELS = [
  {
    id: 1, provider_name: 'anthropic', model_name: 'claude-sonnet-4',
    provider_model_id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4',
    is_preferred: true, availability_status: 'available',
    unit_price: 0.003, output_unit_price: 0.015, currency: 'CNY',
    billing_mode: 'per_token', text_unit_chars: 1000, text_min_amount: 0.001,
  },
  {
    id: 2, provider_name: 'openai', model_name: 'gpt-4o',
    provider_model_id: 'gpt-4o-2024-08-06', label: 'GPT-4o',
    is_preferred: false, availability_status: 'available',
    unit_price: 0.005, output_unit_price: 0.015, currency: 'CNY',
    billing_mode: 'per_token', text_unit_chars: 1000, text_min_amount: 0.001,
  },
  {
    id: 3, provider_name: 'google', model_name: 'gemini-2.5-flash',
    provider_model_id: 'gemini-2.5-flash-preview-05-20', label: 'Gemini 2.5 Flash',
    is_preferred: false, availability_status: 'available',
    unit_price: 0.001, output_unit_price: 0.004, currency: 'CNY',
    billing_mode: 'per_token', text_unit_chars: 1000, text_min_amount: 0.001,
  },
];

const MOCK_CHANNELS_OVERVIEW = {
  supported_count: 4,
  configured_count: 2,
  active_count: 1,
  items: [
    {
      channel_key: 'wechat_work', channel_name: '企业微信',
      channel_group: 'enterprise_collab', channel_kernel: 'wechat_work',
      configured: true, enabled: true, binding_enabled: true,
      callback_url: 'https://api.qeeclaw.com/webhook/wechat-work/xxx',
      risk_level: 'low', updated_time: new Date().toISOString(),
    },
    {
      channel_key: 'feishu', channel_name: '飞书',
      channel_group: 'enterprise_collab', channel_kernel: 'feishu',
      configured: true, enabled: false, binding_enabled: false,
      callback_url: 'https://api.qeeclaw.com/webhook/feishu/xxx',
      risk_level: 'low', updated_time: null,
    },
  ],
};

const MOCK_USER = {
  id: 1,
  username: 'centaur-admin',
  full_name: '半人马管理员',
  email: 'admin@centaur-ai.com',
  phone: null,
  role: 'ADMIN',
  is_active: true,
  last_login_time: new Date().toISOString(),
  created_time: '2025-01-01T00:00:00Z',
  wallet_balance: 128.50,
  is_enterprise_verified: true,
  teams: [{ id: 1, name: '半人马AI', is_personal: false, owner_id: 1 }],
};

// ── Models 扩展 mock 数据 ────────────────────────
const MOCK_MODEL_ROUTE = {
  preferred_model: 'claude-sonnet-4',
  preferred_model_available: true,
  resolved_model: 'claude-sonnet-4',
  resolved_provider_name: 'anthropic',
  resolved_provider_model_id: 'claude-sonnet-4-20250514',
  candidate_count: 3,
  configured_provider_count: 3,
  available_model_count: 3,
  resolution_reason: 'preferred_model_match',
  selected: MOCK_MODELS[0],
};

const MOCK_MODEL_RUNTIMES = [
  {
    runtime_type: 'hermes', runtime_label: 'Hermes Agent',
    runtime_status: 'active', runtime_stage: 'production',
    is_default: true, adapter_registered: true, bridge_registered: true,
    online_team_count: 1, supports_im_relay: true,
    supports_device_bridge: false, supports_managed_download: false, notes: null,
  },
  {
    runtime_type: 'openclaw', runtime_label: 'OpenClaw Runtime',
    runtime_status: 'active', runtime_stage: 'beta',
    is_default: false, adapter_registered: true, bridge_registered: false,
    online_team_count: 0, supports_im_relay: true,
    supports_device_bridge: true, supports_managed_download: true, notes: null,
  },
];

function generateUsageMock(days) {
  const now = Date.now();
  const breakdown = [];
  const models = ['claude-sonnet-4', 'gpt-4o', 'gemini-2.5-flash'];
  const providers = ['anthropic', 'openai', 'google'];
  models.forEach((m, i) => {
    const calls = Math.floor(Math.random() * 50) + 10;
    breakdown.push({
      product_name: m, label: m, group_type: 'model', model_name: m,
      provider_names: [providers[i]], call_count: calls,
      text_input_chars: calls * 1500, text_output_chars: calls * 1200,
      duration_seconds: calls * 3, last_used_at: new Date(now - Math.random() * 86400000 * days).toISOString(),
    });
  });
  const totalCalls = breakdown.reduce((s, b) => s + b.call_count, 0);
  return {
    window_days: days,
    period_start: new Date(now - days * 86400000).toISOString(),
    period_end: new Date(now).toISOString(),
    attribution_mode: 'team',
    record_count: totalCalls,
    total_calls: totalCalls,
    total_input_chars: breakdown.reduce((s, b) => s + b.text_input_chars, 0),
    total_output_chars: breakdown.reduce((s, b) => s + b.text_output_chars, 0),
    total_duration_seconds: breakdown.reduce((s, b) => s + b.duration_seconds, 0),
    last_used_at: new Date(now - 3600000).toISOString(),
    breakdown,
  };
}

function generateCostMock(days) {
  const now = Date.now();
  const breakdown = [
    { product_name: 'claude-sonnet-4', label: 'Claude Sonnet 4', group_type: 'model', model_name: 'claude-sonnet-4', provider_names: ['anthropic'], call_count: 45, amount: 18.50, average_amount: 0.41, currency: 'CNY', currency_breakdown: [{ currency: 'CNY', amount: 18.50 }], last_billed_at: new Date(now - 3600000).toISOString() },
    { product_name: 'gpt-4o', label: 'GPT-4o', group_type: 'model', model_name: 'gpt-4o', provider_names: ['openai'], call_count: 28, amount: 12.30, average_amount: 0.44, currency: 'CNY', currency_breakdown: [{ currency: 'CNY', amount: 12.30 }], last_billed_at: new Date(now - 7200000).toISOString() },
    { product_name: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', group_type: 'model', model_name: 'gemini-2.5-flash', provider_names: ['google'], call_count: 62, amount: 5.80, average_amount: 0.09, currency: 'CNY', currency_breakdown: [{ currency: 'CNY', amount: 5.80 }], last_billed_at: new Date(now - 14400000).toISOString() },
  ];
  return {
    window_days: days,
    period_start: new Date(now - days * 86400000).toISOString(),
    period_end: new Date(now).toISOString(),
    attribution_mode: 'team',
    record_count: 135,
    total_amount: 36.60,
    primary_currency: 'CNY',
    currency_breakdown: [{ currency: 'CNY', amount: 36.60 }],
    last_billed_at: new Date(now - 3600000).toISOString(),
    breakdown,
  };
}

const MOCK_MODEL_QUOTA = {
  wallet_balance: 128.50,
  currency: 'CNY',
  daily_limit: null,
  daily_spent: 4.20,
  daily_remaining: null,
  daily_unlimited: true,
  monthly_limit: 200.00,
  monthly_spent: 42.80,
  monthly_remaining: 157.20,
  monthly_unlimited: false,
  updated_time: new Date().toISOString(),
};

// ── Conversations mock 数据 ─────────────────────
const MOCK_CONVERSATION_GROUPS = [
  { room_id: 'room-wecom-001', room_name: '企业微信-客户群', last_active: new Date(Date.now() - 1800000).toISOString(), msg_count: 128, member_count: 5 },
  { room_id: 'room-feishu-001', room_name: '飞书-内部协作', last_active: new Date(Date.now() - 7200000).toISOString(), msg_count: 56, member_count: 3 },
];

const MOCK_CONVERSATION_HISTORY = [
  { id: 1, sender_id: null, agent_id: 1, channel_id: 'wechat_work', direction: 'agent_to_user', content: '您好，我是火花，请问有什么可以帮您的？', created_time: new Date(Date.now() - 1800000).toISOString() },
  { id: 2, sender_id: 1, agent_id: 1, channel_id: 'wechat_work', direction: 'user_to_agent', content: '帮我设计一个Logo', created_time: new Date(Date.now() - 1700000).toISOString() },
  { id: 3, sender_id: null, agent_id: 1, channel_id: 'wechat_work', direction: 'agent_to_user', content: '好的，我来为您设计Logo。请告诉我您的品牌名称和风格偏好。', created_time: new Date(Date.now() - 1600000).toISOString() },
];

// ── 代理 + 路由 ────────────────────────────────────

function envelope(data) {
  return JSON.stringify({ code: 0, data, message: 'success' });
}

function errorResponse(code, message) {
  return JSON.stringify({ code, message });
}

function parseBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch { resolve({}); }
    });
  });
}

// 代理请求到真实后端 bridge_server :21747
// sdkPath: SDK 侧路径 (如 /api/platform/knowledge/list)
// bridgePath: 后端路径 (如 /knowledge/list)
// wrapEnvelope: 是否用 {code:0, data:...} 包裹返回
function proxyToBridge(method, bridgePath, body, wrapEnvelope = true) {
  return new Promise((resolve) => {
    const url = new URL(bridgePath, BRIDGE_URL);
    const payload = (method !== 'GET' && body && Object.keys(body).length)
      ? JSON.stringify(body) : null;

    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (payload) opts.headers['Content-Length'] = Buffer.byteLength(payload);

    const req = http.request(opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        let parsed;
        try { parsed = JSON.parse(raw); } catch { parsed = raw; }

        if (wrapEnvelope) {
          resolve({ status: 200, body: envelope(parsed) });
        } else {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });

    req.on('error', (err) => {
      console.log(`  [proxy error] ${bridgePath}: ${err.message}`);
      resolve({ status: 502, body: errorResponse(502, `Bridge unreachable: ${err.message}`) });
    });

    if (payload) req.write(payload);
    req.end();
  });
}

async function route(method, pathname, query, body) {
  // ── Agent ───────────────────────────────────
  if (method === 'GET' && pathname === '/api/agent/my-agents') {
    return { status: 200, body: envelope(MOCK_AGENTS) };
  }
  if (method === 'GET' && pathname === '/api/agent/tools') {
    return { status: 200, body: envelope([]) };
  }
  if (method === 'POST' && pathname === '/api/agent/create') {
    const newAgent = {
      id: MOCK_AGENTS.length + 1,
      name: body.name || 'New Agent',
      code: `agent-${Date.now()}`,
      description: body.description || '',
      avatar: null,
      voice_id: null,
      runtime_type: body.runtime_type || 'hermes',
      runtime_label: 'Hermes Agent',
      model: body.model || 'gpt-4o',
    };
    MOCK_AGENTS.push(newAgent);
    return { status: 200, body: envelope({ id: newAgent.id, code: newAgent.code, runtime_type: newAgent.runtime_type }) };
  }
  if (method === 'GET' && pathname === '/agent_config/default') {
    return { status: 200, body: envelope(MOCK_TEMPLATES) };
  }
  if (method === 'GET' && pathname.startsWith('/agent_config/')) {
    const code = pathname.split('/').pop();
    const tpl = MOCK_TEMPLATES.find(t => t.code === code);
    if (tpl) return { status: 200, body: envelope(tpl) };
    return { status: 404, body: errorResponse(404, 'Template not found') };
  }

  // ── Billing ─────────────────────────────────
  if (method === 'GET' && pathname === '/api/billing/wallet') {
    return { status: 200, body: envelope(MOCK_WALLET) };
  }
  if (method === 'GET' && pathname === '/api/billing/records') {
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.page_size) || 20;
    return {
      status: 200,
      body: envelope({
        total: MOCK_BILLING_RECORDS.length,
        page, page_size: pageSize,
        items: MOCK_BILLING_RECORDS.slice((page - 1) * pageSize, page * pageSize),
      }),
    };
  }
  if (method === 'GET' && pathname === '/api/billing/summary') {
    return { status: 200, body: envelope(MOCK_BILLING_SUMMARY) };
  }

  // ── Models ──────────────────────────────────
  if (method === 'GET' && pathname === '/api/platform/models') {
    return { status: 200, body: envelope(MOCK_MODELS) };
  }
  if (method === 'GET' && pathname === '/api/platform/models/providers') {
    return {
      status: 200,
      body: envelope([
        { provider_name: 'anthropic', configured: true, provider_status: 'active', visible_count: 1, hidden_count: 0, disabled_count: 0, models: ['claude-sonnet-4'], preferred_model_supported: true, is_default_route_provider: true, default_route_model: 'claude-sonnet-4', default_route_provider_model_id: 'claude-sonnet-4-20250514' },
        { provider_name: 'openai', configured: true, provider_status: 'active', visible_count: 1, hidden_count: 0, disabled_count: 0, models: ['gpt-4o'], preferred_model_supported: false },
        { provider_name: 'google', configured: true, provider_status: 'active', visible_count: 1, hidden_count: 0, disabled_count: 0, models: ['gemini-2.5-flash'], preferred_model_supported: false },
      ]),
    };
  }
  if (method === 'GET' && pathname === '/api/platform/models/runtimes') {
    return { status: 200, body: envelope(MOCK_MODEL_RUNTIMES) };
  }
  if (method === 'GET' && pathname === '/api/platform/models/resolve') {
    const modelName = query.model_name || 'claude-sonnet-4';
    const found = MOCK_MODELS.find(m => m.model_name === modelName) || MOCK_MODELS[0];
    return { status: 200, body: envelope({
      requested_model: modelName, resolved_model: found.model_name,
      provider_name: found.provider_name, provider_model_id: found.provider_model_id,
      candidate_count: MOCK_MODELS.length, selected: found,
    })};
  }
  if (method === 'GET' && pathname === '/api/platform/models/route') {
    return { status: 200, body: envelope(MOCK_MODEL_ROUTE) };
  }
  if (method === 'PUT' && pathname === '/api/platform/models/route') {
    const newModel = body.preferred_model || 'claude-sonnet-4';
    const found = MOCK_MODELS.find(m => m.model_name === newModel);
    MOCK_MODEL_ROUTE.preferred_model = newModel;
    MOCK_MODEL_ROUTE.resolved_model = newModel;
    if (found) {
      MOCK_MODEL_ROUTE.resolved_provider_name = found.provider_name;
      MOCK_MODEL_ROUTE.resolved_provider_model_id = found.provider_model_id;
      MOCK_MODEL_ROUTE.selected = found;
    }
    return { status: 200, body: envelope(MOCK_MODEL_ROUTE) };
  }
  if (method === 'GET' && pathname === '/api/platform/models/usage') {
    const days = parseInt(query.days) || 7;
    return { status: 200, body: envelope(generateUsageMock(days)) };
  }
  if (method === 'GET' && pathname === '/api/platform/models/cost') {
    const days = parseInt(query.days) || 7;
    return { status: 200, body: envelope(generateCostMock(days)) };
  }
  if (method === 'GET' && pathname === '/api/platform/models/quota') {
    return { status: 200, body: envelope(MOCK_MODEL_QUOTA) };
  }

  // ── Channels ────────────────────────────────
  if (method === 'GET' && pathname === '/api/platform/channels') {
    return { status: 200, body: envelope(MOCK_CHANNELS_OVERVIEW) };
  }
  if (method === 'GET' && pathname === '/api/platform/channels/wechat_work') {
    const item = MOCK_CHANNELS_OVERVIEW.items.find(i => i.channel_key === 'wechat_work');
    return { status: 200, body: envelope({ ...item, corp_id: 'ww_demo_corp', agent_id: '1000001', secret: '***', secret_configured: true, verify_token: 'vt_demo', aes_key: 'ak_demo' }) };
  }
  if (method === 'GET' && pathname === '/api/platform/channels/feishu') {
    const item = MOCK_CHANNELS_OVERVIEW.items.find(i => i.channel_key === 'feishu');
    return { status: 200, body: envelope({ ...item, app_id: 'cli_demo_feishu', app_secret: '***', verification_token: 'vt_feishu', encrypt_key: 'ek_feishu', secret_configured: true }) };
  }
  if (method === 'GET' && pathname === '/api/platform/channels/bindings') {
    return { status: 200, body: envelope({ items: [], total: 0 }) };
  }
  if (method === 'POST' && pathname === '/api/platform/channels/bindings') {
    return { status: 200, body: envelope({ id: Date.now(), binding_code: `BIND-${Date.now()}`, status: 'pending', created_time: new Date().toISOString() }) };
  }

  // ── IAM / User ──────────────────────────────
  if (method === 'GET' && pathname === '/api/users/me') {
    return { status: 200, body: envelope(MOCK_USER) };
  }
  if (method === 'PUT' && pathname === '/api/users/me') {
    if (body.full_name) MOCK_USER.full_name = body.full_name;
    if (body.email) MOCK_USER.email = body.email;
    if (body.phone) MOCK_USER.phone = body.phone;
    return { status: 200, body: envelope(MOCK_USER) };
  }
  if (method === 'PUT' && pathname === '/api/users/me/preference') {
    return { status: 200, body: envelope({ preferred_model: body.preferred_model || 'claude-sonnet-4' }) };
  }
  if (method === 'GET' && pathname === '/api/users') {
    return { status: 200, body: envelope({ total: 1, page: 1, page_size: 20, items: [MOCK_USER] }) };
  }
  if (method === 'GET' && pathname === '/api/users/products') {
    return { status: 200, body: envelope(MOCK_MODELS.map((m, i) => ({
      id: m.id, name: m.model_name, description: m.label, unit_price: m.unit_price,
      output_unit_price: m.output_unit_price, currency: m.currency, billing_mode: m.billing_mode,
      duration_unit_sec: 0, duration_min_amount: 0, text_unit_chars: m.text_unit_chars,
      text_min_amount: m.text_min_amount, is_active: true,
      create_time: '2025-01-01T00:00:00Z', update_time: new Date().toISOString(),
    }))) };
  }

  // ── Conversations ──────────────────────────
  if (method === 'GET' && pathname === '/api/platform/conversations') {
    const groupLimit = parseInt(query.group_limit) || 10;
    const historyLimit = parseInt(query.history_limit) || 20;
    return { status: 200, body: envelope({
      stats: { group_count: MOCK_CONVERSATION_GROUPS.length, msg_count: 184, entity_count: 12, history_count: MOCK_CONVERSATION_HISTORY.length },
      groups: MOCK_CONVERSATION_GROUPS.slice(0, groupLimit),
      history: MOCK_CONVERSATION_HISTORY.slice(0, historyLimit),
    })};
  }
  if (method === 'GET' && pathname === '/api/platform/conversations/stats') {
    return { status: 200, body: envelope({ group_count: MOCK_CONVERSATION_GROUPS.length, msg_count: 184, entity_count: 12, history_count: MOCK_CONVERSATION_HISTORY.length }) };
  }
  if (method === 'GET' && pathname === '/api/platform/conversations/groups') {
    return { status: 200, body: envelope(MOCK_CONVERSATION_GROUPS) };
  }
  if (method === 'GET' && pathname.match(/^\/api\/platform\/conversations\/groups\/[^/]+\/messages$/)) {
    const roomId = pathname.split('/')[5];
    return { status: 200, body: envelope([
      { id: 1, sender_name: '用户', sender_role: 'user', msg_type: 'text', content: '你好', created_time: new Date(Date.now() - 3600000).toISOString(), entities: [] },
      { id: 2, sender_name: '火花 Spark', sender_role: 'agent', msg_type: 'text', content: '您好！有什么可以帮您的？', created_time: new Date(Date.now() - 3500000).toISOString(), entities: [] },
    ])};
  }
  if (method === 'GET' && pathname === '/api/platform/conversations/history') {
    return { status: 200, body: envelope(MOCK_CONVERSATION_HISTORY) };
  }
  if (method === 'POST' && pathname === '/api/platform/conversations/messages') {
    const newMsg = {
      id: MOCK_CONVERSATION_HISTORY.length + 1,
      sender_id: body.direction === 'user_to_agent' ? 1 : null,
      agent_id: body.agent_id || 1,
      channel_id: body.channel_id || 'wechat_work',
      direction: body.direction || 'user_to_agent',
      content: body.content || '',
      created_time: new Date().toISOString(),
    };
    MOCK_CONVERSATION_HISTORY.push(newMsg);
    return { status: 200, body: envelope(newMsg) };
  }

  // ── Memory ──────────────────────────────────
  if (method === 'POST' && pathname === '/api/platform/memory/store') {
    return { status: 200, body: envelope({ id: `mem-${Date.now()}`, stored: true }) };
  }
  if (method === 'POST' && pathname === '/api/platform/memory/search') {
    return { status: 200, body: envelope([]) };
  }
  if (method === 'GET' && pathname === '/api/platform/memory/stats') {
    return { status: 200, body: envelope({ total_entries: 0, total_agents: 0 }) };
  }

  // ══════════════════════════════════════════════
  // 以下走真实后端代理 (bridge_server :21747)
  // ══════════════════════════════════════════════

  // ── Knowledge (代理) ────────────────────────
  if (pathname === '/api/platform/knowledge/list') {
    return proxyToBridge('GET', '/knowledge/list', null);
  }
  if (pathname === '/api/platform/knowledge/stats') {
    return proxyToBridge('GET', '/knowledge/stats', null);
  }
  if (method === 'POST' && pathname === '/api/platform/knowledge/upload') {
    return proxyToBridge('POST', '/knowledge/upload', body);
  }
  if (method === 'POST' && pathname === '/api/platform/knowledge/search') {
    return proxyToBridge('POST', '/knowledge/search', body);
  }
  if (method === 'POST' && pathname === '/api/platform/knowledge/delete') {
    return proxyToBridge('POST', `/knowledge/delete/${body.id || ''}`, body);
  }

  // ── Gateway (代理) ─────────────────────────
  if (pathname === '/api/platform/gateway/status') {
    return proxyToBridge('GET', '/gateway/status', null);
  }
  if (pathname === '/api/platform/gateway/platforms') {
    return proxyToBridge('GET', '/gateway/platforms', null);
  }
  if (method === 'POST' && pathname === '/api/platform/gateway/start') {
    return proxyToBridge('POST', '/gateway/start', body);
  }
  if (method === 'POST' && pathname === '/api/platform/gateway/stop') {
    return proxyToBridge('POST', '/gateway/stop', body);
  }
  if (method === 'POST' && pathname === '/api/platform/gateway/configure') {
    return proxyToBridge('POST', '/gateway/configure', body);
  }

  // ── WeChat (代理) ──────────────────────────
  if (pathname === '/api/platform/wechat/status') {
    return proxyToBridge('GET', '/wechat/status', null);
  }
  if (method === 'POST' && pathname === '/api/platform/wechat/qr-login') {
    return proxyToBridge('POST', '/wechat/qr-login', body);
  }
  if (method === 'POST' && pathname === '/api/platform/wechat/configure') {
    return proxyToBridge('POST', '/wechat/configure', body);
  }
  if (method === 'POST' && pathname === '/api/platform/wechat/send') {
    return proxyToBridge('POST', '/wechat/send', body);
  }

  // ── Model Invoke (代理) ────────────────────
  if (method === 'POST' && pathname === '/api/platform/models/invoke') {
    return proxyToBridge('POST', '/invoke', body);
  }

  // ── Health (代理) ──────────────────────────
  if (pathname === '/api/health' || pathname === '/health') {
    return proxyToBridge('GET', '/health', null, false);
  }

  // ── Provider 管理 (Mock) ─────────────────────
  if (method === 'POST' && pathname === '/api/platform/providers/test') {
    // 模拟测试连接：有 key 就返回成功
    const { apiKey, provider: providerName } = body || {};
    if (!apiKey) {
      return { status: 200, body: errorResponse(400, 'API Key 不能为空') };
    }
    // 模拟延迟 + 成功
    return {
      status: 200,
      body: envelope({
        provider: providerName,
        status: 'active',
        latency_ms: Math.floor(Math.random() * 200) + 50,
        models_available: true,
      }),
    };
  }

  if (method === 'GET' && pathname === '/api/platform/providers') {
    // 返回存储的 provider 列表（实际存在前端 localStorage，这里返回空）
    return { status: 200, body: envelope([]) };
  }

  // ── Fallback ────────────────────────────────
  return { status: 404, body: errorResponse(404, `Not found: ${method} ${pathname}`) };
}

// ── Server ────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const method = req.method || 'GET';
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const pathname = url.pathname;
  const query = Object.fromEntries(url.searchParams);

  // CORS — 让前端 localhost:5174 能跨域请求
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-QeeClaw-SDK');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const body = await parseBody(req);
  const result = await route(method, pathname, query, body);

  res.writeHead(result.status, { 'Content-Type': 'application/json' });
  res.end(result.body);

  // 请求日志
  const ts = new Date().toTimeString().slice(0, 8);
  const status = result.status === 200 ? '\x1b[32m200\x1b[0m' : `\x1b[31m${result.status}\x1b[0m`;
  console.log(`${ts}  ${status}  ${method.padEnd(6)} ${pathname}`);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║  QeeClaw 控制面 Proxy + Mock Server       ║');
  console.log(`  ║  http://127.0.0.1:${PORT}                  ║`);
  console.log(`  ║  Bridge: ${BRIDGE_URL}            ║`);
  console.log('  ║                                          ║');
  console.log('  ║  Mock: agent/billing/models/channels      ║');
  console.log('  ║  Proxy: knowledge/gateway/wechat/invoke   ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
});
