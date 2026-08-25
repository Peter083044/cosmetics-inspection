import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/welcome - 获取欢迎信息
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
      welcome: {
        title: '欢迎',
        content: '欢迎使用化妆品首件核对系统！',
        version: '1.0.0',
        lastUpdated: new Date().toISOString().split('T')[0],
      },
    });
  } catch (error) {
    console.error('Get welcome error:', error);
    return NextResponse.json({ error: '获取欢迎信息失败' }, { status: 500 });
  }
}
