import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/stats - 获取统计数据
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const inspections = await db.inspections.getAll();

    // 统计总数
    const total = inspections.length;

    // 统计各状态数量
    const statusMap: Record<string, number> = {};
    for (const inspection of inspections) {
      const status = inspection.status || 'draft';
      statusMap[status] = (statusMap[status] || 0) + 1;
    }
    const status = Object.entries(statusMap).map(([s, count]) => ({ status: s, count }));

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
    const rate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
    const passRate = { total: totalCount, passed: passedCount, rate };

    // 统计最近 30 天的趋势
    const dailyMap: Record<string, number> = {};
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyMap[dateStr] = 0;
    }
    for (const inspection of inspections) {
      const dateStr = inspection.created_at?.split('T')[0];
      if (dateStr && dailyMap.hasOwnProperty(dateStr)) {
        dailyMap[dateStr]++;
      }
    }
    const daily = Object.entries(dailyMap)
      .filter(([, count]) => count > 0)
      .map(([date, count]) => ({ date, count }));

    // 审核人工作量
    const reviewerMap: Record<string, number> = {};
    for (const inspection of inspections) {
      const name = inspection.current_reviewer_name;
      if (name) {
        reviewerMap[name] = (reviewerMap[name] || 0) + 1;
      }
    }
    const reviewers = Object.entries(reviewerMap)
      .map(([current_reviewer_name, count]) => ({ current_reviewer_name, count }))
      .sort((a, b) => b.count - a.count);

    // 产品统计
    const productMap: Record<string, number> = {};
    for (const inspection of inspections) {
      const name = inspection.product_name;
      if (name) {
        productMap[name] = (productMap[name] || 0) + 1;
      }
    }
    const products = Object.entries(productMap)
      .map(([product_name, count]) => ({ product_name, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      success: true,
      data: { total, status, passRate, daily, reviewers, products },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ success: false, error: '获取统计数据失败' }, { status: 500 });
  }
}
