import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/dashboard - 获取仪表盘数据
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 获取统计数据
    const { data: inspections, error } = await db
      .from('inspections')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Get dashboard data error:', error);
      return NextResponse.json({ error: '获取仪表盘数据失败' }, { status: 500 });
    }

    // 统计各状态数量
    const statusCounts = inspections.reduce((acc: Record<string, number>, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      total: inspections.length,
      statusCounts,
      recentInspections: inspections.slice(0, 10),
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    return NextResponse.json({ error: '获取仪表盘数据失败' }, { status: 500 });
  }
}
