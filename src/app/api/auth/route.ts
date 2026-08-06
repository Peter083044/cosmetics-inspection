import { NextRequest, NextResponse } from 'next/server';
import { loginUser, hashPassword } from '@/lib/auth';
import db, { initDatabase } from '@/lib/db';

// 初始化数据库
initDatabase();

// POST /api/auth/login - 用户登录
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    const result = await loginUser(username, password);
    if (!result) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: result.user,
    });

    // 设置cookie
    response.cookies.set('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24小时
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// POST /api/auth/register - 注册新用户（仅管理员）
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { verifyToken } = await import('@/lib/auth');
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { username, password, name, role } = await request.json();
    if (!username || !password || !name || !role) {
      return NextResponse.json(
        { error: '所有字段都是必填的' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const stmt = db.prepare(
      'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)'
    );

    try {
      const result = stmt.run(username, hashedPassword, name, role);
      return NextResponse.json({
        success: true,
        userId: result.lastInsertRowid,
      });
    } catch (e: any) {
      if (e.message?.includes('UNIQUE')) {
        return NextResponse.json(
          { error: '用户名已存在' },
          { status: 409 }
        );
      }
      throw e;
    }
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: '注册失败' },
      { status: 500 }
    );
  }
}

// DELETE /api/auth - 退出登录
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('auth_token', '', {
    maxAge: 0,
    path: '/',
  });
  return response;
}

// GET /api/auth - 获取当前用户信息
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { verifyToken } = await import('@/lib/auth');
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token无效' }, { status: 401 });
    }

    const stmt = db.prepare('SELECT id, username, name, role FROM users WHERE id = ?');
    const user = stmt.get(payload.userId);

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 500 }
    );
  }
}
