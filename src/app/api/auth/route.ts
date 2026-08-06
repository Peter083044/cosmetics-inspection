import { NextRequest, NextResponse } from 'next/server';
import { loginUser, hashPassword, verifyPassword } from '@/lib/auth';
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
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    const { verifyToken } = await import('@/lib/auth');
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Token无效' }, { status: 401 });
    }

    const stmt = db.prepare('SELECT id, username, name, role FROM users WHERE id = ?');
    const user = stmt.get(payload.userId);

    if (!user) {
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { success: false, error: '获取用户信息失败' },
      { status: 500 }
    );
  }
}

// PUT /api/auth - 修改密码
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: '请提供旧密码和新密码' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: '新密码至少6个字符' },
        { status: 400 }
      );
    }

    // 从 cookie 获取当前用户
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      );
    }

    const { verifyToken } = await import('@/lib/auth');
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: '登录已过期' },
        { status: 401 }
      );
    }

    const dbUser = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId) as any;

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    // 验证旧密码
    const isValid = await verifyPassword(oldPassword, dbUser.password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: '旧密码错误' },
        { status: 400 }
      );
    }

    // 更新密码
    const hashedNewPassword = await hashPassword(newPassword);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedNewPassword, payload.userId);

    return NextResponse.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, error: '密码修改失败' },
      { status: 500 }
    );
  }
}
