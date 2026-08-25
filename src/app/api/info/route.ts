import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/info - 获取系统信息
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
      console.error('Get info error:', error);
      return NextResponse.json({ error: '获取系统信息失败' }, { status: 500 });
    }

    const list = inspections || [];

    // 统计
    const info = {
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
    };

    return NextResponse.json({ info });
  } catch (error) {
    console.error('Get info error:', error);
    return NextResponse.json({ error: '获取系统信息失败' }, { status: 500 });
  }
}
