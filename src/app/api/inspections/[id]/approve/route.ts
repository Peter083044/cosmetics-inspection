import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, REJECT_FLOW } from '@/lib/auth';
import db, { initDatabase } from '@/lib/db';

initDatabase();

// 获取检验记录的审核链路
function getReviewLevels(inspection: any): string[] {
  try {
    const levels = typeof inspection.review_levels === 'string'
      ? JSON.parse(inspection.review_levels)
      : inspection.review_levels;
    if (Array.isArray(levels) && levels.length > 0) {
      return levels;
    }
  } catch {
    // ignore
  }
  return ['line_leader', 'supervisor', 'qc'];
}

// 根据审核链路确定下一阶段状态
function getNextStatus(levels: string[], currentRole: string): string {
  const currentIndex = levels.indexOf(currentRole);
  if (currentIndex === -1 || currentIndex >= levels.length - 1) {
    return 'approved'; // 已是最后一级，审核通过
  }
  return `${levels[currentIndex + 1]}_review`;
}

// 根据审核链路确定退回目标
function getReturnTarget(levels: string[], currentRole: string): { status: string; back_to: string } | null {
  const currentIndex = levels.indexOf(currentRole);
  if (currentIndex <= 0) {
    return null; // 已是第一级，无法退回
  }
  const prevRole = levels[currentIndex - 1];
  if (prevRole === 'line_leader') {
    return { status: 'draft', back_to: 'assistant' };
  }
  // 退回到上一审核级别
  return { status: `${prevRole}_review`, back_to: prevRole };
}

// POST /api/inspections/[id]/approve - 审核检验记录
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id } = await params;
    const inspectionId = parseInt(id);

    if (isNaN(inspectionId)) {
      return NextResponse.json(
        { error: '无效的检验记录ID' },
        { status: 400 }
      );
    }

    const { action, comment, comments, submitReason, submit_explanation } = await request.json();
    const remark = comment || comments || null;

    if (!action || !['approved', 'rejected', 'returned', 'submitted'].includes(action)) {
      return NextResponse.json(
        { error: '操作类型无效' },
        { status: 400 }
      );
    }

    // 获取检验记录
    const inspection = db.prepare('SELECT * FROM inspections WHERE id = ?').get(inspectionId) as any;
    if (!inspection) {
      return NextResponse.json(
        { error: '检验记录不存在' },
        { status: 404 }
      );
    }

    const reviewLevels = getReviewLevels(inspection);
    const firstLevel = reviewLevels[0];

    // 处理"提交"操作（辅助人员从草稿提交到审核）
    if (action === 'submitted') {
      if (user.role !== 'assistant' && user.role !== 'admin') {
        return NextResponse.json(
          { error: '只有辅助角色可以提交检验记录' },
          { status: 403 }
        );
      }
      if (inspection.status !== 'draft' && inspection.status !== 'rejected') {
        return NextResponse.json(
          { error: '当前状态不允许提交' },
          { status: 400 }
        );
      }

      // 检查通过率
      const comparisons = JSON.parse(inspection.comparisons || '[]');
      const activeComparisons = comparisons.filter((c: any) => c.standard || c.actual);
      if (activeComparisons.length > 0) {
        const failCount = activeComparisons.filter((c: any) => c.result === 'fail').length;
        if (failCount > 0 && !submitReason && !submit_explanation) {
          return NextResponse.json(
            { error: '通过率不足100%时，必须填写提交说明原因' },
            { status: 400 }
          );
        }
      }

      // 记录审核日志
      const insertApproval = db.prepare(`
        INSERT INTO approvals (inspection_id, reviewer_id, reviewer_role, action, comments, submit_reason)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      insertApproval.run(
        inspectionId,
        user.id,
        user.role,
        'submitted',
        remark,
        submitReason || submit_explanation || null
      );

      // 更新状态到第一个审核级别，同时更新提交时间和审核人员
      const explanation = submitReason || submit_explanation || null;
      const initialStatus = `${firstLevel}_review`;
      
      // 查找第一级审核人员
      const firstReviewer = db.prepare(
        'SELECT id, name FROM users WHERE role = ? LIMIT 1'
      ).get(firstLevel) as { id: number; name: string } | undefined;
      const firstReviewerId = firstReviewer?.id || null;
      const firstReviewerName = firstReviewer?.name || null;
      
      db.prepare(`
        UPDATE inspections 
        SET status = ?, submit_explanation = ?, submitted_at = CURRENT_TIMESTAMP, 
            current_reviewer_id = ?, current_reviewer_name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(initialStatus, explanation, firstReviewerId, firstReviewerName, inspectionId);

      return NextResponse.json({
        success: true,
        newStatus: initialStatus,
        nextReviewer: firstReviewerName,
      });
    }

    // 验证审核权限 - 管理员可以审核任何阶段
    if (user.role !== 'admin') {
      const expectedStatus = `${user.role}_review`;
      if (inspection.status !== expectedStatus) {
        return NextResponse.json(
          { error: `当前记录不在审核阶段（当前：${inspection.status}，期望：${expectedStatus}）` },
          { status: 400 }
        );
      }
      // 检查当前角色是否在审核链路中
      if (!reviewLevels.includes(user.role)) {
        return NextResponse.json(
          { error: '当前角色不在该记录的审核链路中' },
          { status: 403 }
        );
      }
    }

    // 记录审核日志
    const insertApproval = db.prepare(`
      INSERT INTO approvals (inspection_id, reviewer_id, reviewer_role, action, comments, submit_reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertApproval.run(
      inspectionId,
      user.id,
      user.role,
      action,
      remark,
      submitReason || null
    );

    // 更新检验记录状态
    let newStatus: string;
    let rejectedTo: string | null = null;

    if (action === 'rejected') {
      // 驳回 - 直接变为已驳回状态
      newStatus = 'rejected';
    } else if (action === 'returned') {
      // 退回 - 根据审核链路返回上一级
      const returnTarget = getReturnTarget(reviewLevels, user.role);
      if (returnTarget) {
        newStatus = returnTarget.status;
        rejectedTo = returnTarget.back_to;
      } else {
        return NextResponse.json(
          { error: '无法退回，当前已是第一级审核' },
          { status: 400 }
        );
      }
    } else {
      // 通过 - 根据审核链路进入下一阶段
      newStatus = getNextStatus(reviewLevels, user.role);
    }

    // 查找下一级审核人员
    let nextReviewerId: number | null = null;
    let nextReviewerName: string | null = null;
    if (newStatus !== 'approved' && newStatus !== 'rejected') {
      const nextRole = newStatus.replace('_review', '');
      const nextReviewer = db.prepare(
        'SELECT id, name FROM users WHERE role = ? LIMIT 1'
      ).get(nextRole) as { id: number; name: string } | undefined;
      if (nextReviewer) {
        nextReviewerId = nextReviewer.id;
        nextReviewerName = nextReviewer.name;
      }
    }

    db.prepare(`
      UPDATE inspections 
      SET status = ?, rejected_to = ?, current_reviewer_id = ?, current_reviewer_name = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStatus, rejectedTo, nextReviewerId, nextReviewerName, inspectionId);

    return NextResponse.json({
      success: true,
      newStatus,
      nextReviewer: nextReviewerName,
    });
  } catch (error) {
    console.error('Approve inspection error:', error);
    return NextResponse.json(
      { error: '审核操作失败' },
      { status: 500 }
    );
  }
}
