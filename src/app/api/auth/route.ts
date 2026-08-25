import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword, generateToken, setTokenCookie, clearTokenCookie } from '@/lib/auth';

// POST /api/auth - 登录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
    }

    const user = await db.users.findByUsername(username);
    console.log('Login attempt:', username, 'User found:', !!user, user ? { id: user.id, username: user.username, hasPassword: !!user.password } : null);
    if (!user) {
      return NextResponse.json({ error: '用户名或密码错误 (用户不存在)' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password);
    console.log('Password verify:', { isValid, storedHash: user.password?.substring(0, 20) });
    if (!isValid) {
      return NextResponse.json({ error: '用户名或密码错误 (密码不匹配)' }, { status: 401 });
    }

    const token = await generateToken(user);
    await setTokenCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: '登录失败' }, { status: 500 });
  }
}

// DELETE /api/auth - 登出
export async function DELETE() {
  await clearTokenCookie();
  return NextResponse.json({ success: true });
}

// GET /api/auth - 获取当前用户
export async function GET(request: NextRequest) {
  try {
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 });
  }
}
