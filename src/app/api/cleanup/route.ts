import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/cleanup - 获取清理信息
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const beforeDate = searchParams.get('beforeDate');

    let query = db.inspections.getAll();

    if (beforeDate) {
      query = query.lt('created_at', beforeDate);
    }

    const { data: inspections, error } = await query;
    
    if (error) throw error;

    return NextResponse.json({
      records: inspections,
      count: inspections.length,
    });
  } catch (error) {
    console.error('Get cleanup error:', error);
    return NextResponse.json({ error: '获取清理信息失败' }, { status: 500 });
  }
}

// DELETE /api/cleanup - 清理记录
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const body = await request.json();
    const { inspectionIds } = body;

    if (!inspectionIds || !Array.isArray(inspectionIds)) {
      return NextResponse.json({ error: '请指定要清理的记录' }, { status: 400 });
    }

    // 删除检验记录
    for (const id of inspectionIds) {
      await db.inspections.delete(id);
    }

    return NextResponse.json({
      success: true,
      message: `已清理 ${inspectionIds.length} 条记录`,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: '清理记录失败' }, { status: 500 });
  }
}
