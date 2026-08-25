import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/greeting - 获取问候信息
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
      greeting: {
        title: '问候',
        content: '您好！欢迎使用化妆品首件核对系统。',
        time: new Date().toLocaleString('zh-CN'),
      },
    });
  } catch (error) {
    console.error('Get greeting error:', error);
    return NextResponse.json({ error: '获取问候信息失败' }, { status: 500 });
  }
}
