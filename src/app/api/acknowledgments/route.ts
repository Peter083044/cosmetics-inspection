import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/acknowledgments - 获取确认信息
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
      acknowledgments: {
        title: '确认',
        content: '本系统由团队共同开发和维护。',
        lastUpdated: new Date().toISOString().split('T')[0],
      },
    });
  } catch (error) {
    console.error('Get acknowledgments error:', error);
    return NextResponse.json({ error: '获取确认信息失败' }, { status: 500 });
  }
}
