/**
 * HubOS 产品后端 — SQLite 数据库初始化
 */
const path = require('path');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'hubos.db');

// 确保 data 目录存在
const fs = require('fs');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// 启用 WAL 模式提升并发性能
db.pragma('journal_mode = WAL');

// ── 表结构迁移 ────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS audit_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT UNIQUE NOT NULL,
    category TEXT DEFAULT 'operation',
    title TEXT NOT NULL,
    summary TEXT,
    actor_username TEXT,
    actor_role TEXT,
    risk_level TEXT DEFAULT 'low',
    metadata TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS approvals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    approval_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    approval_type TEXT DEFAULT 'custom',
    description TEXT,
    requester TEXT,
    status TEXT DEFAULT 'pending',
    resolved_by TEXT,
    resolved_at TEXT,
    metadata TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS org_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'member',
    department TEXT,
    avatar TEXT,
    status TEXT DEFAULT 'active',
    joined_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

// 插入默认管理员（如果组织表为空）
const memberCount = db.prepare('SELECT COUNT(*) as cnt FROM org_members').get();
if (memberCount.cnt === 0) {
  db.prepare(`
    INSERT INTO org_members (member_id, name, email, role, department, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('admin_001', '系统管理员', 'admin@hubos.local', 'admin', '管理层', 'active');
}

module.exports = db;
