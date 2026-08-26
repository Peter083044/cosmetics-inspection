import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword, generateToken, setTokenCookie, clearTokenCookie, getCurrentUser } from '@/lib/auth';

// POST /api/auth - 登录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
    }

    const user = await db.users.findByUsername(username);
    if (!user) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
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

// PUT /api/auth - 修改密码
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: '请填写完整' }, { status: 400 });
    }

    const isValid = await verifyPassword(oldPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: '当前密码错误' }, { status: 400 });
    }

    const hashedNewPassword = await hashPassword(newPassword);
    const updated = await db.users.update(user.id, { password: hashedNewPassword });
    if (!updated) {
      return NextResponse.json({ error: '修改失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: '修改密码失败' }, { status: 500 });
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
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

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
    console.error('Get user error:', error);
    return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 });
  }
}
