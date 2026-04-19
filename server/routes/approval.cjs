/**
 * HubOS 产品后端 — 审批流路由
 */
const { Router } = require('express');
const { randomUUID } = require('crypto');
const db = require('../db.cjs');

const router = Router();

// GET /api/hubos/approvals — 审批列表
router.get('/', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size) || 20));
  const status = req.query.status; // 可选过滤
  const offset = (page - 1) * pageSize;

  let countSql = 'SELECT COUNT(*) as cnt FROM approvals';
  let listSql = 'SELECT * FROM approvals';
  const params = [];

  if (status) {
    countSql += ' WHERE status = ?';
    listSql += ' WHERE status = ?';
    params.push(status);
  }

  listSql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

  const total = db.prepare(countSql).get(...params).cnt;
  const items = db.prepare(listSql).all(...params, pageSize, offset).map(row => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
  }));

  res.json({
    code: 0,
    data: { total, page, page_size: pageSize, items },
    message: 'success',
  });
});

// POST /api/hubos/approvals — 创建审批
router.post('/', (req, res) => {
  const { title, approval_type, description, requester, metadata } = req.body;

  if (!title) {
    return res.status(400).json({ code: 400, message: 'title is required' });
  }

  const approvalId = `apr_${randomUUID().replace(/-/g, '').slice(0, 12)}`;

  db.prepare(`
    INSERT INTO approvals (approval_id, title, approval_type, description, requester, metadata)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    approvalId,
    title,
    approval_type || 'custom',
    description || null,
    requester || null,
    metadata ? JSON.stringify(metadata) : null,
  );

  const created = db.prepare('SELECT * FROM approvals WHERE approval_id = ?').get(approvalId);

  res.json({
    code: 0,
    data: { ...created, metadata: created.metadata ? JSON.parse(created.metadata) : null },
    message: 'success',
  });
});

// PUT /api/hubos/approvals/:id/resolve — 审批/拒绝
router.put('/:id/resolve', (req, res) => {
  const { id } = req.params;
  const { action, resolved_by } = req.body; // action: 'approve' | 'reject'

  if (!action || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ code: 400, message: "action must be 'approve' or 'reject'" });
  }

  const approval = db.prepare('SELECT * FROM approvals WHERE approval_id = ?').get(id);
  if (!approval) {
    return res.status(404).json({ code: 404, message: 'Approval not found' });
  }
  if (approval.status !== 'pending') {
    return res.status(409).json({ code: 409, message: `Approval already ${approval.status}` });
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE approvals SET status = ?, resolved_by = ?, resolved_at = ? WHERE approval_id = ?
  `).run(newStatus, resolved_by || null, now, id);

  const updated = db.prepare('SELECT * FROM approvals WHERE approval_id = ?').get(id);

  res.json({
    code: 0,
    data: { ...updated, metadata: updated.metadata ? JSON.parse(updated.metadata) : null },
    message: 'success',
  });
});

module.exports = router;
