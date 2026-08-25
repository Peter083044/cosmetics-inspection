import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/credits - 获取致谢信息
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
      credits: {
        title: '致谢',
        content: '感谢所有为这个项目做出贡献的开发者和用户。',
        contributors: ['Peter', 'Development Team'],
      },
    });
  } catch (error) {
    console.error('Get credits error:', error);
    return NextResponse.json({ error: '获取致谢信息失败' }, { status: 500 });
  }
}
