import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/stats - 获取统计数据
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 获取所有检验记录
    const inspections = await db.inspections.getAll();

    // 统计总数
    const totalRecords = inspections.length;

    // 统计各状态数量
    const statusCounts: Record<string, number> = {};
    for (const inspection of inspections) {
      const status = inspection.status || 'draft';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    }

    // 统计通过率
    let passedCount = 0;
    let totalCount = 0;
    for (const inspection of inspections) {
      const comparisons = inspection.comparisons as any;
      if (comparisons) {
        for (const key of Object.keys(comparisons)) {
          const comp = comparisons[key];
          if (comp && comp.status) {
            totalCount++;
            if (comp.status === 'passed') {
              passedCount++;
            }
          }
        }
      }
    }
    const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

    // 统计最近 7 天的趋势
    const last7Days: Record<string, number> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days[dateStr] = 0;
    }

    for (const inspection of inspections) {
      const dateStr = inspection.created_at?.split('T')[0];
      if (dateStr && last7Days.hasOwnProperty(dateStr)) {
        last7Days[dateStr]++;
      }
    }

    return NextResponse.json({
      totalRecords,
      statusCounts,
      passRate,
      last7Days,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ error: '获取统计数据失败' }, { status: 500 });
  }
}
