/**
 * HubOS 产品后端 — 组织架构/员工管理路由
 */
const { Router } = require('express');
const { randomUUID } = require('crypto');
const db = require('../db.cjs');

const router = Router();

// GET /api/hubos/org/members — 成员列表
router.get('/members', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size) || 50));
  const offset = (page - 1) * pageSize;

  const total = db.prepare('SELECT COUNT(*) as cnt FROM org_members').get().cnt;
  const items = db.prepare(
    'SELECT * FROM org_members ORDER BY joined_at DESC LIMIT ? OFFSET ?'
  ).all(pageSize, offset);

  // 统计
  const activeCount = db.prepare("SELECT COUNT(*) as cnt FROM org_members WHERE status = 'active'").get().cnt;
  const departments = db.prepare('SELECT DISTINCT department FROM org_members WHERE department IS NOT NULL').all().map(r => r.department);

  res.json({
    code: 0,
    data: {
      total,
      page,
      page_size: pageSize,
      active_count: activeCount,
      departments,
      items,
    },
    message: 'success',
  });
});

// POST /api/hubos/org/members — 添加成员
router.post('/members', (req, res) => {
  const { name, email, role, department, avatar } = req.body;

  if (!name) {
    return res.status(400).json({ code: 400, message: 'name is required' });
  }

  const memberId = `mbr_${randomUUID().replace(/-/g, '').slice(0, 12)}`;

  db.prepare(`
    INSERT INTO org_members (member_id, name, email, role, department, avatar, status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')
  `).run(memberId, name, email || null, role || 'member', department || null, avatar || null);

  const created = db.prepare('SELECT * FROM org_members WHERE member_id = ?').get(memberId);

  res.json({ code: 0, data: created, message: 'success' });
});

// PUT /api/hubos/org/members/:id — 更新成员
router.put('/members/:id', (req, res) => {
  const { id } = req.params;
  const member = db.prepare('SELECT * FROM org_members WHERE member_id = ?').get(id);
  if (!member) {
    return res.status(404).json({ code: 404, message: 'Member not found' });
  }

  const { name, email, role, department, avatar, status } = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE org_members SET
      name = COALESCE(?, name),
      email = COALESCE(?, email),
      role = COALESCE(?, role),
      department = COALESCE(?, department),
      avatar = COALESCE(?, avatar),
      status = COALESCE(?, status),
      updated_at = ?
    WHERE member_id = ?
  `).run(
    name || null, email || null, role || null,
    department || null, avatar || null, status || null,
    now, id,
  );

  const updated = db.prepare('SELECT * FROM org_members WHERE member_id = ?').get(id);
  res.json({ code: 0, data: updated, message: 'success' });
});

// DELETE /api/hubos/org/members/:id — 移除成员
router.delete('/members/:id', (req, res) => {
  const { id } = req.params;
  const member = db.prepare('SELECT * FROM org_members WHERE member_id = ?').get(id);
  if (!member) {
    return res.status(404).json({ code: 404, message: 'Member not found' });
  }

  db.prepare('DELETE FROM org_members WHERE member_id = ?').run(id);

  res.json({ code: 0, data: null, message: 'success' });
});

module.exports = router;
