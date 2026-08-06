import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import db from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'first-piece-inspection-secret-key-2024';
const TOKEN_EXPIRY = '24h';

// 用户角色定义
export const ROLES = {
  ASSISTANT: 'assistant',      // 辅助
  LINE_LEADER: 'line_leader',  // 线长
  SUPERVISOR: 'supervisor',    // 主管
  QC: 'qc',                    // QC
  ADMIN: 'admin',              // 管理员
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
}

export interface JWTPayload {
  userId: number;
  username: string;
  role: UserRole;
}

// 密码加密
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// 密码验证
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// 生成JWT token
export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

// 验证JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// 用户登录
export async function loginUser(username: string, password: string): Promise<{ user: User; token: string } | null> {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  const row = stmt.get(username) as any;
  
  if (!row) return null;
  
  const isValid = await verifyPassword(password, row.password);
  if (!isValid) return null;
  
  const user: User = {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role,
  };
  
  const token = generateToken(user);
  return { user, token };
}

// 从请求中获取当前用户
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  let token = cookieStore.get('auth_token')?.value;
  
  // 也支持从 Authorization header 获取 token
  if (!token) {
    const authHeader = (await import('next/headers')).headers().then(h => h.get('authorization'));
    const header = await authHeader;
    if (header && header.startsWith('Bearer ')) {
      token = header.substring(7);
    }
  }
  
  if (!token) return null;
  
  const payload = verifyToken(token);
  if (!payload) return null;
  
  const stmt = db.prepare('SELECT id, username, name, role FROM users WHERE id = ?');
  const row = stmt.get(payload.userId) as any;
  
  if (!row) return null;
  
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role,
  };
}

// 权限检查
export function hasPermission(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

// 审核流程定义
export const REVIEW_FLOW = {
  assistant: { next: 'line_leader', status: 'line_leader_review' },
  line_leader: { next: 'supervisor', status: 'supervisor_review' },
  supervisor: { next: 'qc', status: 'qc_review' },
  qc: { next: null, status: 'approved' },
} as const;

// 获取角色显示名称
export function getRoleDisplayName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    assistant: '辅助',
    line_leader: '线长',
    supervisor: '主管',
    qc: 'QC',
    admin: '管理员',
  };
  return names[role];
}
