import { NextRequest, NextResponse } from 'next/server';
import { supabase, db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/users - 获取用户列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;
    if (error) throw error;

    // 移除密码字段
    const safeData = (data || []).map(({ password, ...rest }) => rest);
    return NextResponse.json({ success: true, data: safeData });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: '获取用户列表失败' }, { status: 500 });
  }
}

// POST /api/users - 创建用户
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const body = await request.json();
    const { username, password, name, role } = body;

    if (!username || !password || !name || !role) {
      return NextResponse.json({ error: '请填写完整信息' }, { status: 400 });
    }

    const { hashPassword } = await import('@/lib/auth');
    const hashedPassword = await hashPassword(password);

    const newUser = await db.users.create({
      username,
      password: hashedPassword,
      name,
      role,
    });

    if (!newUser) {
      return NextResponse.json({ error: '用户名已存在' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: { id: newUser.id, username, name, role },
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: '创建用户失败' }, { status: 500 });
  }
}

// PUT /api/users - 更新用户
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, role, password } = body;

    const updateData: any = { name, role };
    
    if (password) {
      const { hashPassword } = await import('@/lib/auth');
      updateData.password = await hashPassword(password);
    }

    const updated = await db.users.update(id, updateData);
    if (!updated) {
      return NextResponse.json({ error: '更新用户失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: '更新用户失败' }, { status: 500 });
  }
}

// DELETE /api/users - 删除用户
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '请指定用户 ID' }, { status: 400 });
    }

    const success = await db.users.delete(parseInt(id));
    if (!success) {
      return NextResponse.json({ error: '删除用户失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: '删除用户失败' }, { status: 500 });
  }
}
