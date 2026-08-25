import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/archive - 获取归档信息
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = db.inspections.getAll();

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate + 'T23:59:59');
    }

    const { data: inspections, error } = await query
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    return NextResponse.json({
      records: inspections,
      count: inspections.length,
    });
  } catch (error) {
    console.error('Get archive error:', error);
    return NextResponse.json({ error: '获取归档信息失败' }, { status: 500 });
  }
}

// DELETE /api/archive - 删除归档记录
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const body = await request.json();
    const { inspectionIds } = body;

    if (!inspectionIds || !Array.isArray(inspectionIds)) {
      return NextResponse.json({ error: '请指定要删除的记录' }, { status: 400 });
    }

    // 删除检验记录
    for (const id of inspectionIds) {
      await db.inspections.delete(id);
    }

    return NextResponse.json({
      success: true,
      message: `已删除 ${inspectionIds.length} 条记录`,
    });
  } catch (error) {
    console.error('Delete archive error:', error);
    return NextResponse.json({ error: '删除归档记录失败' }, { status: 500 });
  }
}
