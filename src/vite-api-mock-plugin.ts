/**
 * Vite Plugin: API Proxy Layer
 *
 * 三路代理分发：
 * 1. /api/hubos/*         → HubOS 产品后端 (Node.js :3456)
 * 2. /api/billing/*, /api/platform/models/* (费用类) → 线上平台 paas.qeeshu.com
 * 3. 其余 /api/*          → Bridge Server (Python :21747)
 */
import type { Plugin } from 'vite';
import http from 'http';
import https from 'https';

const BRIDGE = process.env.VITE_BRIDGE_URL || 'http://127.0.0.1:21747';
const HUBOS_API = process.env.VITE_HUBOS_API_URL || 'http://127.0.0.1:3456';

// ── Knowledge 路径映射 ──────────────────────────
const KNOWLEDGE_REWRITE: Record<string, string> = {
  '/api/platform/knowledge/list': '/knowledge/list',
  '/api/platform/knowledge/upload': '/knowledge/upload',
  '/api/platform/knowledge/search': '/knowledge/search',
  '/api/platform/knowledge/stats': '/knowledge/stats',
  '/api/platform/knowledge/config': '/knowledge/stats', // fallback
  '/api/platform/knowledge/config/update': '/knowledge/stats',
};

// ── 代理工具 ──────────────────────────────────

function proxyToTarget(
  targetUrlStr: string,
  targetPath: string,
  req: http.IncomingMessage,
  res: http.ServerResponse,
) {
  const url = new URL(targetPath, targetUrlStr);
  const isHttps = url.protocol === 'https:';
  const transport = isHttps ? https : http;

  const options: http.RequestOptions = {
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: url.pathname + url.search,
    method: req.method,
    headers: {
      ...req.headers,
      host: url.host,
    },
  };

  const proxyReq = transport.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error(`[proxy error] ${targetUrlStr}${targetPath}: ${err.message}`);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Target server ${targetUrlStr} unreachable: ${err.message}` }));
  });

  req.pipe(proxyReq, { end: true });
}

function proxyToBridge(
  targetPath: string,
  req: http.IncomingMessage,
  res: http.ServerResponse,
) {
  proxyToTarget(BRIDGE, targetPath, req, res);
}

function proxyToHubos(
  targetPath: string,
  req: http.IncomingMessage,
  res: http.ServerResponse,
) {
  proxyToTarget(HUBOS_API, targetPath, req, res);
}

export default function apiMockPlugin(): Plugin {
  return {
    name: 'vite-api-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';

        if (!url.startsWith('/api/')) {
          return next();
        }

        // 去掉 query string 用于路径匹配
        const path = url.split('?')[0];

        // ─── 1. HubOS 产品后端 (审计/审批/组织) ───
        if (path.startsWith('/api/hubos/')) {
          return proxyToHubos(url, req, res);
        }

        // ─── 2. Knowledge → rewrite 到 bridge_server ───
        for (const [sdkPath, bridgePath] of Object.entries(KNOWLEDGE_REWRITE)) {
          if (path === sdkPath) {
            return proxyToBridge(bridgePath, req, res);
          }
        }
        if (path.startsWith('/api/platform/knowledge/delete/')) {
          const docId = path.replace('/api/platform/knowledge/delete/', '');
          return proxyToBridge(`/knowledge/delete/${docId}`, req, res);
        }
        if (path.startsWith('/api/platform/knowledge/download')) {
          return proxyToBridge('/knowledge/list', req, res);
        }

        // ─── 3. API Keys → bridge_server ───
        if (path.startsWith('/api/users/app-keys') || path.startsWith('/api/llm/keys')) {
          return proxyToBridge(url, req, res);
        }

        // ─── 4. Billing / Models 费用 → Bridge Server (本地优先) ───
        // 注: billing 走本地 bridge_server，bridge 内置了 wallet/records 端点
        // 如需对接线上平台，可改回 proxyToPlatform
        if (
          path.startsWith('/api/billing') ||
          path.startsWith('/api/platform/models/cost') ||
          path.startsWith('/api/platform/models/usage') ||
          path.startsWith('/api/platform/models/quota') ||
          path === '/api/platform/models' ||
          path.startsWith('/api/platform/models/list')
        ) {
          return proxyToBridge(url, req, res);
        }

        // ─── 5. 其余 /api/* → bridge_server ───
        return proxyToBridge(url, req, res);
      });
    },
  };
}
