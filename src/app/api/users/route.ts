import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db, { initDatabase } from '@/lib/db';

initDatabase();

// GET /api/users - 获取用户列表（仅管理员）
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const users = db.prepare(`
      SELECT id, username, name, role, created_at 
      FROM users 
      ORDER BY created_at DESC
    `).all();

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: '获取用户列表失败' },
      { status: 500 }
    );
  }
}

// POST /api/users - 创建新用户（仅管理员）
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { username, password, name, role } = await request.json();

    if (!username || !password || !name || !role) {
      return NextResponse.json(
        { error: '请填写完整信息' },
        { status: 400 }
      );
    }

    const validRoles = ['assistant', 'line_leader', 'supervisor', 'qc', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: '无效的角色' },
        { status: 400 }
      );
    }

    // Check if username exists
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return NextResponse.json(
        { error: '用户名已存在' },
        { status: 400 }
      );
    }

    const { hashPassword } = await import('@/lib/auth');
    const hashedPassword = await hashPassword(password);

    const result = db.prepare(`
      INSERT INTO users (username, password, name, role)
      VALUES (?, ?, ?, ?)
    `).run(username, hashedPassword, name, role);

    return NextResponse.json({
      success: true,
      data: { id: result.lastInsertRowid },
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: '创建用户失败' },
      { status: 500 }
    );
  }
}

// DELETE /api/users?id=xxx - 删除用户（仅管理员）
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '缺少用户ID' },
        { status: 400 }
      );
    }

    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: '无效的用户ID' },
        { status: 400 }
      );
    }

    // Prevent deleting admin user
    const targetUser = db.prepare('SELECT username FROM users WHERE id = ?').get(userId) as any;
    if (targetUser && targetUser.username === 'admin') {
      return NextResponse.json(
        { error: '不能删除管理员账号' },
        { status: 400 }
      );
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: '删除用户失败' },
      { status: 500 }
    );
  }
}
