import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/farewell - 获取告别信息
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
      farewell: {
        title: '告别',
        content: '再见！感谢您的使用。',
        time: new Date().toLocaleString('zh-CN'),
      },
    });
  } catch (error) {
    console.error('Get farewell error:', error);
    return NextResponse.json({ error: '获取告别信息失败' }, { status: 500 });
  }
}
