import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
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
    const { data: inspections, error } = await db
      .from('inspections')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get info error:', error);
      return NextResponse.json({ error: '获取系统信息失败' }, { status: 500 });
    }

    // 统计
    const info = {
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

    return NextResponse.json({ info });
  } catch (error) {
    console.error('Get info error:', error);
    return NextResponse.json({ error: '获取系统信息失败' }, { status: 500 });
  }
}
