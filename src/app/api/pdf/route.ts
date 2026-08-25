import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/pdf - 生成 PDF 报告
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const inspectionId = parseInt(searchParams.get('id') || '0');

    if (!inspectionId) {
      return NextResponse.json({ error: '请指定检验记录 ID' }, { status: 400 });
    }

    // 获取检验记录
    const inspection = await db.inspections.findById(inspectionId);
    
    if (!inspection) {
      return NextResponse.json({ error: '检验记录不存在' }, { status: 404 });
    }

    // 获取审核日志
    const approvals = await db.approvals.findByInspection(inspectionId);

    // 返回数据供前端生成 PDF
    return NextResponse.json({
      inspection,
      approvals,
    });
  } catch (error) {
    console.error('Get PDF data error:', error);
    return NextResponse.json({ error: '获取 PDF 数据失败' }, { status: 500 });
  }
}
