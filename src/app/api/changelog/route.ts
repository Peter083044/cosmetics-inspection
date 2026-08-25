import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/changelog - 获取更新日志
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
      changelog: [
        {
          version: '1.0.0',
          date: new Date().toISOString().split('T')[0],
          changes: [
            '初始版本发布',
            '支持多级审核工作流',
            '支持照片对比',
            '支持数据导出',
          ],
        },
      ],
    });
  } catch (error) {
    console.error('Get changelog error:', error);
    return NextResponse.json({ error: '获取更新日志失败' }, { status: 500 });
  }
}
