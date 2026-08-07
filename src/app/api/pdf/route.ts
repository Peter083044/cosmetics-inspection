import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import path from 'path';
import fs from 'fs';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, error: '缺少记录ID' }, { status: 400 });
    }
    
    // 获取检验记录
    const inspection = db.prepare(`
      SELECT i.*, u.name as assistant_name
      FROM inspections i
      LEFT JOIN users u ON i.assistant_id = u.id
      WHERE i.id = ?
    `).get(id) as any;

    if (!inspection) {
      return NextResponse.json({ success: false, error: '记录不存在' }, { status: 404 });
    }

    // 获取审核记录
    const approvals = db.prepare(`
      SELECT a.*, u.name as reviewer_name
      FROM approvals a
      LEFT JOIN users u ON a.reviewer_id = u.id
      WHERE a.inspection_id = ?
      ORDER BY a.created_at ASC
    `).all(id) as any[];

    // 创建 PDF
    const doc = new jsPDF();
    
    // 标题
    doc.setFontSize(18);
    doc.text('化妆品生产过程首件核对记录', 105, 20, { align: 'center' });
    
    // 基本信息
    doc.setFontSize(11);
    let y = 40;
    
    const addInfo = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value || '-', 60, y);
      y += 8;
    };

    addInfo('检验日期', inspection.inspection_date);
    addInfo('产品名称', inspection.product_name);
    addInfo('产品编号', inspection.product_code);
    addInfo('色号', inspection.color_number);
    addInfo('批号', inspection.batch_number);
    addInfo('检验人', inspection.assistant_name);
    addInfo('状态', getStatusLabel(inspection.status));
    addInfo('结果', inspection.result === 'pass' ? '合格' : '不合格');
    
    if (inspection.submitted_at) {
      addInfo('提交时间', new Date(inspection.submitted_at).toLocaleString('zh-CN'));
    }

    // 比对详情表格
    y += 10;
    doc.setFontSize(14);
    doc.text('比对详情', 20, y);
    y += 5;

    const comparisons = JSON.parse(inspection.comparisons || '[]');
    const tableData = comparisons.map((c: any) => [
      c.side_name || '-',
      c.result === 'pass' ? '内容一致' : '内容不一致',
      c.difference || '-'
    ]);

    (doc as any).autoTable({
      startY: y,
      head: [['比对面', '结果', '说明']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 }
    });

    // 标签比对
    const labelComparisons = JSON.parse(inspection.label_comparisons || '[]');
    if (labelComparisons.length > 0) {
      y = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text('标签比对', 20, y);
      y += 5;

      const labelTableData = labelComparisons.map((lc: any) => [
        lc.name || '-',
        lc.result === 'pass' ? '内容一致' : '内容不一致',
        lc.difference || '-'
      ]);

      (doc as any).autoTable({
        startY: y,
        head: [['标签', '结果', '说明']],
        body: labelTableData,
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246] },
        styles: { fontSize: 10 }
      });
    }

    // 审核记录
    if (approvals.length > 0) {
      y = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text('审核记录', 20, y);
      y += 5;

      const approvalTableData = approvals.map((a: any) => [
        a.reviewer_name || '-',
        getActionLabel(a.action),
        a.comment || '-',
        new Date(a.created_at).toLocaleString('zh-CN')
      ]);

      (doc as any).autoTable({
        startY: y,
        head: [['审核人', '操作', '备注', '时间']],
        body: approvalTableData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 9 }
      });
    }

    // 提交说明
    if (inspection.submit_explanation) {
      y = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text('提交说明:', 20, y);
      y += 6;
      doc.setFontSize(10);
      const splitText = doc.splitTextToSize(inspection.submit_explanation, 170);
      doc.text(splitText, 20, y);
    }

    // 页脚
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`第 ${i} 页 / 共 ${pageCount} 页`, 105, 290, { align: 'center' });
      doc.text(`生成时间: ${new Date().toLocaleString('zh-CN')}`, 20, 290);
    }

    // 返回 PDF
    const pdfBuffer = doc.output('arraybuffer');
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="inspection-${id}.pdf"`
      }
    });

  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json({ success: false, error: '导出PDF失败' }, { status: 500 });
  }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: '草稿',
    line_leader_review: '线长审核中',
    supervisor_review: '主管审核中',
    qc_review: 'QC审核中',
    approved: '已通过',
    rejected: '已驳回'
  };
  return labels[status] || status;
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    approved: '通过',
    rejected: '驳回',
    returned: '退回',
    submitted: '提交审核'
  };
  return labels[action] || action;
}
