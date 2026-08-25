import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/privacy - 获取隐私政策
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    if (!isAdmin(user)) {
      return NextResponse.json({ error: '无管理员权限' }, { status: 403 });
    }

    return NextResponse.json({
      privacy: {
        title: '隐私政策',
        content: '本系统严格遵守数据保护法规，所有用户数据均存储在安全的云端数据库中。',
        lastUpdated: new Date().toISOString().split('T')[0],
      },
    });
  } catch (error) {
    console.error('Get privacy error:', error);
    return NextResponse.json({ error: '获取隐私政策失败' }, { status: 500 });
  }
}
