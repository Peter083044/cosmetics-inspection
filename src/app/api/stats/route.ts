import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    // 总记录数
    const totalRecords = db.prepare('SELECT COUNT(*) as count FROM inspections').get() as { count: number };

    // 各状态记录数
    const statusStats = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM inspections 
      GROUP BY status
    `).all() as { status: string; count: number }[];

    // 通过率统计
    const passStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN result = 'pass' THEN 1 ELSE 0 END) as passed
      FROM inspections
    `).get() as { total: number; passed: number };

    // 最近30天每日记录数
    const dailyStats = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM inspections
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `).all() as { date: string; count: number }[];

    // 各审核人处理记录数
    const reviewerStats = db.prepare(`
      SELECT 
        current_reviewer_name,
        COUNT(*) as count
      FROM inspections
      WHERE current_reviewer_name IS NOT NULL AND current_reviewer_name != ''
      GROUP BY current_reviewer_name
      ORDER BY count DESC
      LIMIT 10
    `).all() as { current_reviewer_name: string; count: number }[];

    // 产品统计
    const productStats = db.prepare(`
      SELECT 
        product_name,
        COUNT(*) as count
      FROM inspections
      GROUP BY product_name
      ORDER BY count DESC
      LIMIT 10
    `).all() as { product_name: string; count: number }[];

    return NextResponse.json({
      success: true,
      data: {
        total: totalRecords.count,
        status: statusStats,
        passRate: {
          total: passStats.total,
          passed: passStats.passed,
          rate: passStats.total > 0 ? Math.round((passStats.passed / passStats.total) * 100) : 0
        },
        daily: dailyStats,
        reviewers: reviewerStats,
        products: productStats
      }
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ success: false, error: '获取统计数据失败' }, { status: 500 });
  }
}
