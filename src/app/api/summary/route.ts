import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/summary - 获取汇总数据
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
      console.error('Get summary error:', error);
      return NextResponse.json({ error: '获取汇总数据失败' }, { status: 500 });
    }

    // 统计
    const summary = {
      total: inspections.length,
      approved: inspections.filter((i) => i.status === 'approved').length,
      rejected: inspections.filter((i) => i.status === 'rejected').length,
      pending: inspections.filter(
        (i) =>
          i.status !== 'approved' &&
          i.status !== 'rejected' &&
          i.status !== 'draft'
      ).length,
      draft: inspections.filter((i) => i.status === 'draft').length,
      today: inspections.filter(
        (i) =>
          new Date(i.created_at).toLocaleDateString('zh-CN') ===
          new Date().toLocaleDateString('zh-CN')
      ).length,
      thisWeek: inspections.filter((i) => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return new Date(i.created_at) >= weekAgo;
      }).length,
      thisMonth: inspections.filter((i) => {
        const now = new Date();
        return (
          new Date(i.created_at).getMonth() === now.getMonth() &&
          new Date(i.created_at).getFullYear() === now.getFullYear()
        );
      }).length,
    };

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Get summary error:', error);
    return NextResponse.json({ error: '获取汇总数据失败' }, { status: 500 });
  }
}
