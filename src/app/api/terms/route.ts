import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/terms - 获取服务条款
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
      terms: {
        title: '服务条款',
        content: '使用本系统即表示您同意遵守本服务条款。',
        lastUpdated: new Date().toISOString().split('T')[0],
      },
    });
  } catch (error) {
    console.error('Get terms error:', error);
    return NextResponse.json({ error: '获取服务条款失败' }, { status: 500 });
  }
}
