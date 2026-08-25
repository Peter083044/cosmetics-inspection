import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/bye - 获取再见信息
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
      bye: {
        title: '再见',
        content: '再见！祝您生活愉快。',
        time: new Date().toLocaleString('zh-CN'),
      },
    });
  } catch (error) {
    console.error('Get bye error:', error);
    return NextResponse.json({ error: '获取再见信息失败' }, { status: 500 });
  }
}
