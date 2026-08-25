import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/support - 获取支持信息
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
      support: {
        title: '技术支持',
        description: '如果您在使用过程中遇到任何技术问题，请通过以下方式联系我们。',
        email: 'tech@example.com',
        phone: '400-123-4567',
        hours: '周一至周五 9:00-18:00',
      },
    });
  } catch (error) {
    console.error('Get support error:', error);
    return NextResponse.json({ error: '获取支持信息失败' }, { status: 500 });
  }
}
