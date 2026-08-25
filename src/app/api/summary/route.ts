import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
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
    const { data: inspections, error } = await supabase
      .from('inspections')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get summary error:', error);
      return NextResponse.json({ error: '获取汇总数据失败' }, { status: 500 });
    }

    const list = inspections || [];

    // 统计
    const summary = {
      total: list.length,
      approved: list.filter((i: any) => i.status === 'approved').length,
      rejected: list.filter((i: any) => i.status === 'rejected').length,
      pending: list.filter(
        (i: any) =>
          i.status !== 'approved' &&
          i.status !== 'rejected' &&
          i.status !== 'draft'
      ).length,
      draft: list.filter((i: any) => i.status === 'draft').length,
      today: list.filter(
        (i: any) =>
          new Date(i.created_at).toLocaleDateString('zh-CN') ===
          new Date().toLocaleDateString('zh-CN')
      ).length,
      thisWeek: list.filter((i: any) => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return new Date(i.created_at) >= weekAgo;
      }).length,
      thisMonth: list.filter((i: any) => {
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
