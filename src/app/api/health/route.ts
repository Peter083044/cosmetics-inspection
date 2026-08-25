import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/health - 健康检查
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    if (!isAdmin(user)) {
      return NextResponse.json({ error: '无管理员权限' }, { status: 403 });
    }

    // 检查数据库连接
    const { error } = await db.from('inspections').select('id').limit(1);

    if (error) {
      console.error('Health check error:', error);
      return NextResponse.json(
        { status: 'error', message: '数据库连接失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      message: '系统运行正常',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { status: 'error', message: '健康检查失败' },
      { status: 500 }
    );
  }
}
