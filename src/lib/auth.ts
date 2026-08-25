import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db, User } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-in-production';
const TOKEN_EXPIRY = '24h';

// 密码哈希（简单实现，生产环境建议使用 bcrypt）
export async function hashPassword(password: string): Promise<string> {
  // 使用简单的哈希，实际生产应使用 bcrypt
  const encoder = new TextEncoder();
  const data = encoder.encode(password + JWT_SECRET);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const hash = await hashPassword(password);
  return hash === hashedPassword;
}

// 生成 JWT Token
export async function generateToken(user: User): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  const token = await new SignJWT({
    userId: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secret);
  
  return token;
}

// 验证 JWT Token
export async function verifyToken(token: string): Promise<{ userId: number; username: string; role: string; name: string } | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as any;
  } catch {
    return null;
  }
}

// 获取当前用户（从 Cookie 或 Authorization header）
export async function getCurrentUser(request?: Request): Promise<User | null> {
  let token: string | undefined;
  
  if (request) {
    // 从 Authorization header 获取
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // 从 Cookie 获取
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get('token')?.value;
    }
  } else {
    // 服务端调用
    const cookieStore = await cookies();
    token = cookieStore.get('token')?.value;
  }
  
  if (!token) return null;
  
  const payload = await verifyToken(token);
  if (!payload) return null;
  
  const user = await db.users.findById(payload.userId);
  return user;
}

// 权限检查
export function hasPermission(user: User | null, requiredRole: string): boolean {
  if (!user) return false;
  
  const roleHierarchy = ['assistant', 'line_leader', 'supervisor', 'qc', 'admin'];
  const userLevel = roleHierarchy.indexOf(user.role);
  const requiredLevel = roleHierarchy.indexOf(requiredRole);
  
  return userLevel >= requiredLevel;
}

export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin';
}

export function isExecutor(user: User | null): boolean {
  if (!user) return false;
  return ['assistant', 'line_leader', 'supervisor', 'qc'].includes(user.role);
}

// 设置 Cookie
export async function setTokenCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 小时
    path: '/',
  });
}

// 清除 Cookie
export async function clearTokenCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
