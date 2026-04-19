/**
 * HubOS 产品后端 — 审计日志路由
 */
const { Router } = require('express');
const { randomUUID } = require('crypto');
const db = require('../db.cjs');

const router = Router();

// GET /api/hubos/audit/events — 审计事件列表
router.get('/events', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size) || 20));
  const offset = (page - 1) * pageSize;

  const total = db.prepare('SELECT COUNT(*) as cnt FROM audit_events').get().cnt;
  const items = db.prepare(
    'SELECT * FROM audit_events ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(pageSize, offset).map(row => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
    actor: { username: row.actor_username, role: row.actor_role },
  }));

  res.json({
    code: 0,
    data: { total, page, page_size: pageSize, items },
    message: 'success',
  });
});

// GET /api/hubos/audit/summary — 审计汇总
router.get('/summary', (_req, res) => {
  const total = db.prepare('SELECT COUNT(*) as cnt FROM audit_events').get().cnt;
  const today = db.prepare(
    "SELECT COUNT(*) as cnt FROM audit_events WHERE created_at >= date('now')"
  ).get().cnt;
  const highRisk = db.prepare(
    "SELECT COUNT(*) as cnt FROM audit_events WHERE risk_level IN ('high','critical')"
  ).get().cnt;

  res.json({
    code: 0,
    data: {
      totalEvents: total,
      today,
      alerts: highRisk,
    },
    message: 'success',
  });
});

// POST /api/hubos/audit/events — 记录审计事件
router.post('/events', (req, res) => {
  const { title, summary, category, actor_username, actor_role, risk_level, metadata } = req.body;

  if (!title) {
    return res.status(400).json({ code: 400, message: 'title is required' });
  }

  const eventId = `evt_${randomUUID().replace(/-/g, '').slice(0, 12)}`;

  db.prepare(`
    INSERT INTO audit_events (event_id, category, title, summary, actor_username, actor_role, risk_level, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    eventId,
    category || 'operation',
    title,
    summary || null,
    actor_username || null,
    actor_role || null,
    risk_level || 'low',
    metadata ? JSON.stringify(metadata) : null,
  );

  const created = db.prepare('SELECT * FROM audit_events WHERE event_id = ?').get(eventId);

  res.json({
    code: 0,
    data: {
      ...created,
      metadata: created.metadata ? JSON.parse(created.metadata) : null,
      actor: { username: created.actor_username, role: created.actor_role },
    },
    message: 'success',
  });
});

module.exports = router;
