import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/reports - 获取报表数据
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    if (!isAdmin(user)) {
      return NextResponse.json({ error: '无管理员权限' }, { status: 403 });
    }

    // 获取日期范围
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = supabase
      .from('inspections')
      .select('*')
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: inspections, error } = await query;

    if (error) {
      console.error('Get reports error:', error);
      return NextResponse.json({ error: '获取报表失败' }, { status: 500 });
    }

    // 统计
    const stats = {
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
    };

    return NextResponse.json({ inspections, stats });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json({ error: '获取报表失败' }, { status: 500 });
  }
}
