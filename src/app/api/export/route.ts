import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db, { initDatabase } from '@/lib/db';

initDatabase();

// GET /api/export - 导出检验记录
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    let query = `
      SELECT 
        i.id,
        i.status,
        i.result,
        i.created_at,
        i.updated_at,
        i.product_name,
        i.product_code,
        i.color_number,
        i.batch_number,
        u.name as assistant_name
      FROM inspections i
      JOIN users u ON i.assistant_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (startDate) {
      query += ' AND i.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND i.created_at <= ?';
      params.push(endDate + ' 23:59:59');
    }

    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }

    query += ' ORDER BY i.created_at DESC';

    const inspections = db.prepare(query).all(...params) as any[];

    // 组装导出数据
    const exportData = inspections.map((inspection) => {
      return {
        ...inspection,
        approvals: [],
        exceptions: [],
        photos: [],
      };
    });

    // 生成CSV格式
    const csv = generateCSV(exportData);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=inspections-${Date.now()}.csv`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: '导出失败' },
      { status: 500 }
    );
  }
}

function generateCSV(data: any[]): string {
  const headers = [
    '检验ID',
    '产品名称',
    '产品代码',
    '色号',
    '批号',
    '辅助人员',
    '检验结果',
    '状态',
    '创建时间',
    '更新时间',
    '审核历史',
    '异常记录',
  ];

  const rows = data.map((item) => {
    const statusMap: Record<string, string> = {
      pending: '待提交',
      line_leader_review: '线长审核中',
      supervisor_review: '主管审核中',
      qc_review: 'QC审核中',
      approved: '已通过',
      rejected: '已驳回',
    };

    const resultMap: Record<string, string> = {
      pass: '通过',
      fail: '不通过',
    };

    const approvals = item.approvals
      .map((a: any) => `${a.reviewer_name}(${a.reviewer_role}): ${a.action} - ${a.comments || ''}`)
      .join('; ');

    const exceptions = item.exceptions
      .map((e: any) => `[${e.severity}] ${e.description}${e.resolved ? '(已解决)' : '(未解决)'}`)
      .join('; ');

    return [
      item.id,
      item.product_name,
      item.product_code,
      item.color_number,
      item.batch_number || '',
      item.assistant_name,
      resultMap[item.result] || item.result || '',
      statusMap[item.status] || item.status,
      item.created_at,
      item.updated_at,
      approvals,
      exceptions,
    ];
  });

  // 添加BOM以支持中文
  const bom = '\uFEFF';
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return bom + csvContent;
}
