import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/analytics - 获取分析数据
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    if (!isAdmin(user)) {
      return NextResponse.json({ error: '无管理员权限' }, { status: 403 });
    }

    // 获取所有检验记录
    const { data: inspections, error } = await db
      .from('inspections')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get analytics error:', error);
      return NextResponse.json({ error: '获取分析数据失败' }, { status: 500 });
    }

    // 按日期统计
    const dailyStats: Record<string, number> = {};
    inspections.forEach((inspection) => {
      const date = new Date(inspection.created_at).toLocaleDateString('zh-CN');
      dailyStats[date] = (dailyStats[date] || 0) + 1;
    });

    // 按产品统计
    const productStats: Record<string, number> = {};
    inspections.forEach((inspection) => {
      const key = `${inspection.product_name} (${inspection.product_code})`;
      productStats[key] = (productStats[key] || 0) + 1;
    });

    // 按用户统计
    const userStats: Record<string, number> = {};
    inspections.forEach((inspection) => {
      if (inspection.assistant_name) {
        userStats[inspection.assistant_name] =
          (userStats[inspection.assistant_name] || 0) + 1;
      }
    });

    // 通过率趋势（最近 7 天）
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toLocaleDateString('zh-CN');
    }).reverse();

    const passRateTrend = last7Days.map((date) => {
      const dayInspections = inspections.filter(
        (i) =>
          new Date(i.created_at).toLocaleDateString('zh-CN') === date &&
          i.status !== 'draft'
      );
      const passed = dayInspections.filter(
        (i) => i.status === 'approved'
      ).length;
      const total = dayInspections.length;
      return {
        date,
        rate: total > 0 ? Math.round((passed / total) * 100) : 0,
        total,
      };
    });

    return NextResponse.json({
      dailyStats,
      productStats,
      userStats,
      passRateTrend,
      total: inspections.length,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json({ error: '获取分析数据失败' }, { status: 500 });
  }
}
