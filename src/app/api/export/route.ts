import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/export - 导出 CSV
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
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
      query = query.lte('created_at', endDate + 'T23:59:59');
    }

    const { data: inspections, error } = await query;
    
    if (error) throw error;

    // 生成 CSV
    const headers = [
      '检验日期',
      '产品名称',
      '产品代码',
      '色号',
      '批号',
      '辅助人员',
      '状态',
      '结果',
      '提交说明',
      '创建时间',
    ];

    const rows = inspections.map((inspection) => [
      inspection.inspection_date || '',
      inspection.product_name || '',
      inspection.product_code || '',
      inspection.color_number || '',
      inspection.batch_number || '',
      inspection.assistant_name || '',
      inspection.status || '',
      inspection.result || '',
      inspection.submit_explanation || '',
      inspection.created_at || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // 添加 UTF-8 BOM
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;

    return new NextResponse(csvWithBOM, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=inspections_${Date.now()}.csv`,
      },
    });
  } catch (error) {
    console.error('Export CSV error:', error);
    return NextResponse.json({ error: '导出失败' }, { status: 500 });
  }
}
