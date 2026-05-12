/**
 * HubOS 产品后端 — Express 入口
 *
 * 监听端口 3456，提供审计日志、审批流、组织架构等产品功能 API。
 * 数据持久化于 SQLite (server/data/hubos.db)。
 */
const path = require('path');
const express = require('express');
const auditRouter = require('./routes/audit.cjs');
const approvalRouter = require('./routes/approval.cjs');
const orgRouter = require('./routes/org.cjs');

const PORT = parseInt(process.env.HUBOS_API_PORT || '3456', 10);
const SERVE_STATIC = process.env.HUBOS_SERVE_STATIC === '1' || process.env.HUBOS_FRONTEND_MODE === 'static';
const STATIC_BASE = process.env.HUBOS_STATIC_BASE || '/CENTAUR-HUBOS';
const STATIC_DIR = process.env.HUBOS_STATIC_DIR || path.resolve(__dirname, '..', 'dist');
const app = express();

// ── 中间件 ────────────────────────────
app.use(express.json({ limit: '10mb' }));

// CORS (允许前端 dev server 跨域)
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (_req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// 简单请求日志
app.use((req, _res, next) => {
  const ts = new Date().toTimeString().slice(0, 8);
  console.log(`${ts}  ${req.method.padEnd(6)} ${req.path}`);
  next();
});

// ── 路由挂载 ──────────────────────────
app.use('/api/hubos/audit', auditRouter);
app.use('/api/hubos/approvals', approvalRouter);
app.use('/api/hubos/org', orgRouter);

// ── 健康检查 ──────────────────────────
app.get('/api/hubos/health', (_req, res) => {
  res.json({ status: 'ok', service: 'hubos-api', port: PORT });
});

// ── 生产静态前端 ────────────────────────
if (SERVE_STATIC) {
  app.get('/', (_req, res) => {
    res.redirect(STATIC_BASE.endsWith('/') ? STATIC_BASE : `${STATIC_BASE}/`);
  });

  app.use(STATIC_BASE, express.static(STATIC_DIR, { index: 'index.html' }));

  app.use((req, res, next) => {
    if (req.method === 'GET' && req.path.startsWith(`${STATIC_BASE}/`)) {
      return res.sendFile(path.join(STATIC_DIR, 'index.html'));
    }
    next();
  });
}

// ── 404 ───────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ code: 404, message: 'HubOS API: Not Found' });
});

// ── 启动 ──────────────────────────────
app.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║  HubOS 产品后端 API                      ║');
  console.log(`  ║  http://127.0.0.1:${PORT}                  ║`);
  console.log('  ║                                          ║');
  console.log('  ║  审计日志  /api/hubos/audit               ║');
  console.log('  ║  审批流程  /api/hubos/approvals            ║');
  console.log('  ║  组织架构  /api/hubos/org                 ║');
  if (SERVE_STATIC) {
    console.log(`  ║  前端页面  http://127.0.0.1:${PORT}${STATIC_BASE}/`);
  }
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
});
