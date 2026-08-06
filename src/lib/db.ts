import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'inspection.db');

// 确保数据目录存在
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// 启用WAL模式以提高并发性能
db.pragma('journal_mode = WAL');

// 初始化数据库表
export function initDatabase() {
  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('assistant', 'line_leader', 'qc', 'supervisor', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 产品信息表
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      color_number TEXT NOT NULL,
      batch_number TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER REFERENCES users(id)
    )
  `);

  // 首件检验记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inspection_date TEXT,
      product_name TEXT NOT NULL,
      product_code TEXT NOT NULL,
      color_number TEXT NOT NULL,
      batch_number TEXT,
      work_order_image TEXT,
      assistant_id INTEGER NOT NULL REFERENCES users(id),
      assistant_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'line_leader_review',
      result TEXT,
      result_summary TEXT,
      comparisons TEXT,
      line_leader_id INTEGER REFERENCES users(id),
      line_leader_name TEXT,
      line_leader_approved BOOLEAN,
      line_leader_time DATETIME,
      line_leader_reject_reason TEXT,
      supervisor_id INTEGER REFERENCES users(id),
      supervisor_name TEXT,
      supervisor_approved BOOLEAN,
      supervisor_time DATETIME,
      supervisor_reject_reason TEXT,
      qc_id INTEGER REFERENCES users(id),
      qc_name TEXT,
      qc_approved BOOLEAN,
      qc_time DATETIME,
      qc_reject_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 审核记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inspection_id INTEGER NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
      reviewer_id INTEGER NOT NULL REFERENCES users(id),
      reviewer_role TEXT NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('approved', 'rejected')),
      comments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 插入默认用户（如果不存在）
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  if (userCount.count === 0) {
    // 使用同步bcrypt哈希
    const bcrypt = require('bcryptjs');
    const hashSync = (password: string) => bcrypt.hashSync(password, 10);
    
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)
    `);
  
    // 默认用户（使用加密密码）
    insertUser.run('admin', hashSync('admin123'), '管理员', 'admin');
    insertUser.run('assistant1', hashSync('pass123'), '张三', 'assistant');
    insertUser.run('leader1', hashSync('pass123'), '李四', 'line_leader');
    insertUser.run('supervisor1', hashSync('pass123'), '王五', 'supervisor');
    insertUser.run('qc1', hashSync('pass123'), '赵六', 'qc');
  }
}

export default db;
