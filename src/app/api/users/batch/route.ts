import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/users/batch - 批量创建用户
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const count = parseInt(searchParams.get('count') || '1');
    const password = searchParams.get('password') || 'pass123';

    if (!role) {
      return NextResponse.json({ error: '请指定角色' }, { status: 400 });
    }

    // 批量创建用户
    const rolePrefix: Record<string, string> = {
      assistant: 'assistant',
      line_leader: 'leader',
      supervisor: 'supervisor',
      qc: 'qc',
    };

    const prefix = rolePrefix[role] || 'user';
    const createdUsers = [];

    for (let i = 1; i <= count; i++) {
      const username = `${prefix}${i}`;
      const name = `${prefix}${i}`;
      const hashedPassword = await hashPassword(password);

      const { data, error } = await db.users.create({
        username,
        password: hashedPassword,
        name,
        role,
      });

      if (error) {
        console.error(`Failed to create user ${username}:`, error);
        continue;
      }

      createdUsers.push(data);
    }

    return NextResponse.json({
      success: true,
      created: createdUsers.length,
      users: createdUsers,
    });
  } catch (error) {
    console.error('Batch create users error:', error);
    return NextResponse.json({ error: '批量创建用户失败' }, { status: 500 });
  }
}

// POST /api/users/batch - 批量创建用户
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const body = await request.json();
    const { role, count = 1, password = 'pass123' } = body;

    if (!role) {
      return NextResponse.json({ error: '请指定角色' }, { status: 400 });
    }

    // 批量创建用户
    const rolePrefix: Record<string, string> = {
      assistant: 'assistant',
      line_leader: 'leader',
      supervisor: 'supervisor',
      qc: 'qc',
    };

    const prefix = rolePrefix[role] || 'user';
    const createdUsers = [];

    for (let i = 1; i <= count; i++) {
      const username = `${prefix}${i}`;
      const name = `${prefix}${i}`;
      const hashedPassword = await hashPassword(password);

      const { data, error } = await db.users.create({
        username,
        password: hashedPassword,
        name,
        role,
      });

      if (error) {
        console.error(`Failed to create user ${username}:`, error);
        continue;
      }

      createdUsers.push(data);
    }

    return NextResponse.json({
      success: true,
      created: createdUsers.length,
      users: createdUsers,
    });
  } catch (error) {
    console.error('Batch create users error:', error);
    return NextResponse.json({ error: '批量创建用户失败' }, { status: 500 });
  }
}

async function hashPassword(password: string): Promise<string> {
  // 使用简单的哈希（生产环境应使用 bcrypt）
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
