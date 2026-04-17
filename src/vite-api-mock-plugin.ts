/**
 * Vite Plugin: API Mock + Rewrite Layer
 *
 * 桥接 SDK 的 /api/* 路径 和 bridge_server 的现有端点。
 * - knowledge 相关：rewrite 路径转发到 bridge_server
 * - 其他模块：返回合理的 mock 数据
 */
import type { Plugin } from 'vite';
import http from 'http';

const BRIDGE = 'http://127.0.0.1:21747';

// ── Knowledge 路径映射 ──────────────────────────
const KNOWLEDGE_REWRITE: Record<string, string> = {
  '/api/platform/knowledge/list': '/knowledge/list',
  '/api/platform/knowledge/upload': '/knowledge/upload',
  '/api/platform/knowledge/search': '/knowledge/search',
  '/api/platform/knowledge/stats': '/knowledge/stats',
  '/api/platform/knowledge/config': '/knowledge/stats', // fallback
  '/api/platform/knowledge/config/update': '/knowledge/stats',
};

// ── Mock 数据 ───────────────────────────────────
const MOCK_DATA: Record<string, unknown> = {
  // Billing (SDK expects snake_case fields)
  '/api/billing/wallet': {
    balance: 128.50,
    currency: 'CNY',
    total_spent: 1256.80,
    total_recharge: 2000.00,
    current_month_spent: 42.30,
    updated_time: new Date().toISOString(),
  },
  '/api/billing/records': {
    total: 0,
    page: 1,
    page_size: 50,
    items: [],
  },
  '/api/billing/summary': {
    total_spent: 1256.80,
    total_recharge: 2000.00,
  },

  // Agent
  '/api/agent/my-agents': [
    {
      id: 1,
      name: 'Spark (火花)',
      code: 'spark',
      description: '品牌设计专家',
      model: 'claude-opus-4-6',
      avatar: '🔥',
      status: 'running',
    },
    {
      id: 2,
      name: 'Scout (侦察兵)',
      code: 'scout',
      description: '市场情报分析',
      model: 'gemini-2.5-flash',
      avatar: '🔍',
      status: 'idle',
    },
  ],
  '/api/agent/create': { id: 99, success: true },
  '/api/agent/tools': [
    { name: 'web-search', category: 'research', description: '网页搜索' },
    { name: 'image-gen', category: 'creative', description: '图像生成' },
    { name: 'code-exec', category: 'development', description: '代码执行' },
  ],

  // Models
  '/api/platform/models': {
    models: [
      { id: 'claude-opus-4-6', provider: 'anthropic', name: 'Claude Opus 4' },
      { id: 'gemini-2.5-flash', provider: 'google', name: 'Gemini 2.5 Flash' },
      { id: 'gpt-4o', provider: 'openai', name: 'GPT-4o' },
    ],
  },
  '/api/platform/models/providers': {
    providers: ['anthropic', 'google', 'openai', 'openrouter'],
  },
  '/api/platform/models/runtimes': {
    runtimes: ['hermes', 'openclaw'],
  },
  '/api/platform/models/invoke': {
    text: '[Mock] 模型调用需要连接真实后端',
    model: 'mock',
    provider: 'mock',
  },
  '/api/platform/models/usage': {
    totalTokens: 125000,
    promptTokens: 80000,
    completionTokens: 45000,
    days: 7,
  },
  '/api/platform/models/cost': {
    totalCost: 12.50,
    days: 7,
    breakdown: [],
  },
  '/api/platform/models/quota': {
    used: 125000,
    limit: 1000000,
    resetDate: new Date(Date.now() + 30 * 86400000).toISOString(),
  },
  '/api/platform/models/resolve': { model: 'claude-opus-4-6', provider: 'anthropic' },
  '/api/platform/models/route': { model: 'claude-opus-4-6', provider: 'anthropic' },

  // IAM
  '/api/users/me': {
    id: 1,
    name: '管理员',
    email: 'admin@centaur.ai',
    role: 'admin',
    avatar: null,
  },
  '/api/users/me/preference': { theme: 'light', language: 'zh-CN' },
  '/api/users': [],
  '/api/users/products': [],

  // Tenant
  '/api/users/me/context': {
    tenantId: 1,
    tenantName: '半人马AI',
    plan: 'pro',
    features: ['agents', 'knowledge', 'billing'],
  },
  '/api/company/verification': { status: 'verified', companyName: '半人马AI' },

  // Devices
  '/api/platform/devices': [],
  '/api/platform/devices/bootstrap': {
    base_url: BRIDGE,
    ws_url: 'ws://127.0.0.1:21747/ws',
  },
  '/api/platform/devices/account-state': { state: 'active' },

  // Conversations
  '/api/platform/conversations': [],
  '/api/platform/conversations/stats': {
    totalConversations: 0,
    totalMessages: 0,
    activeToday: 0,
  },
  '/api/platform/conversations/groups': [],
  '/api/platform/conversations/history': [],
  '/api/platform/conversations/messages': [],

  // Channels
  '/api/platform/channels': [],
  '/api/platform/channels/overview': {
    total: 0,
    active: 0,
    channels: [],
  },

  // Audit
  '/api/platform/audit/summary': {
    totalEvents: 0,
    today: 0,
    alerts: 0,
  },
  '/api/platform/audit/events': {
    events: [],
    total: 0,
    page: 1,
  },

  // Approval
  '/api/platform/approval': {
    items: [],
    total: 0,
    pending: 0,
  },

  // API Key
  '/api/platform/apikeys': [
    { id: 1, name: 'Default Key', key: 'qk-****demo', createdAt: new Date().toISOString() },
  ],
  '/api/platform/apikeys/llm': [],

  // Workflow
  '/api/platform/workflows': [],

  // Policy
  '/api/platform/policy': { policies: [] },

  // File
  '/api/platform/files': [],

  // Voice
  '/api/platform/voice': { enabled: false },
};

function proxyToBridge(
  targetPath: string,
  req: http.IncomingMessage,
  res: http.ServerResponse,
) {
  const url = new URL(targetPath, BRIDGE);
  const options: http.RequestOptions = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: req.method,
    headers: { ...req.headers, host: `${url.hostname}:${url.port}` },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Bridge server unreachable' }));
  });

  req.pipe(proxyReq, { end: true });
}

export default function apiMockPlugin(): Plugin {
  return {
    name: 'vite-api-mock',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';

        if (!url.startsWith('/api/')) {
          return next();
        }

        // 去掉 query string
        const path = url.split('?')[0];

        // 1. Knowledge → rewrite 到 bridge_server
        for (const [sdkPath, bridgePath] of Object.entries(KNOWLEDGE_REWRITE)) {
          if (path === sdkPath) {
            return proxyToBridge(bridgePath, req, res);
          }
        }
        // knowledge/delete 带路径参数
        if (path.startsWith('/api/platform/knowledge/delete/')) {
          const docId = path.replace('/api/platform/knowledge/delete/', '');
          return proxyToBridge(`/knowledge/delete/${docId}`, req, res);
        }
        // knowledge/download
        if (path.startsWith('/api/platform/knowledge/download')) {
          return proxyToBridge('/knowledge/list', req, res);
        }

        // 2. 其他 → 返回 mock
        // 先精确匹配
        if (MOCK_DATA[path] !== undefined) {
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'X-Mock': 'true',
          });
          res.end(JSON.stringify(MOCK_DATA[path]));
          return;
        }

        // 模糊匹配：找最长前缀
        const sortedKeys = Object.keys(MOCK_DATA).sort((a, b) => b.length - a.length);
        for (const key of sortedKeys) {
          if (path.startsWith(key)) {
            res.writeHead(200, {
              'Content-Type': 'application/json',
              'X-Mock': 'true',
            });
            res.end(JSON.stringify(MOCK_DATA[key]));
            return;
          }
        }

        // 3. 完全未知的 /api/* → 返回空 200
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'X-Mock': 'true',
        });
        res.end(JSON.stringify({ _mock: true, path }));
      });
    },
  };
}
