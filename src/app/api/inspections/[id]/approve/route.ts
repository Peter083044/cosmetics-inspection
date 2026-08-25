import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/inspections/[id]/approve - 获取审核详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const inspectionId = parseInt(params.id);
    if (isNaN(inspectionId)) {
      return NextResponse.json({ error: '无效的检验 ID' }, { status: 400 });
    }

    const { data: inspection, error } = await db.inspections.findById(inspectionId);
    if (error || !inspection) {
      return NextResponse.json({ error: '检验记录不存在' }, { status: 404 });
    }

    return NextResponse.json({ inspection });
  } catch (error) {
    console.error('Get approval error:', error);
    return NextResponse.json({ error: '获取审核详情失败' }, { status: 500 });
  }
}

// POST /api/inspections/[id]/approve - 审核操作
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const inspectionId = parseInt(params.id);
    if (isNaN(inspectionId)) {
      return NextResponse.json({ error: '无效的检验 ID' }, { status: 400 });
    }

    const body = await request.json();
    const { action, comment, nextReviewerId, nextReviewerName } = body;

    if (!action) {
      return NextResponse.json({ error: '请指定审核操作' }, { status: 400 });
    }

    const { data: inspection, error: fetchError } = await db.inspections.findById(inspectionId);
    if (fetchError || !inspection) {
      return NextResponse.json({ error: '检验记录不存在' }, { status: 404 });
    }

    // 检查权限
    if (inspection.current_reviewer_id !== user.id && !isAdmin(user)) {
      return NextResponse.json({ error: '无审核权限' }, { status: 403 });
    }

    // 创建审核记录
    await db.approvals.create({
      inspection_id: inspectionId,
      reviewer_id: user.id,
      reviewer_name: user.name,
      reviewer_role: user.role,
      action,
      comment: comment || '',
    });

    // 根据操作更新检验记录状态
    let newStatus = inspection.status;
    let updateData: any = {};

    if (action === 'approved') {
      // 审核通过，流转到下一级
      if (nextReviewerId) {
        updateData = {
          current_reviewer_id: nextReviewerId,
          current_reviewer_name: nextReviewerName,
        };
        // 根据审核人角色设置状态
        if (nextReviewerName?.includes('主管')) {
          newStatus = 'supervisor_review';
        } else if (nextReviewerName?.includes('QC')) {
          newStatus = 'qc_review';
        } else {
          newStatus = 'approved';
        }
      } else {
        newStatus = 'approved';
      }
    } else if (action === 'rejected') {
      // 驳回
      newStatus = 'rejected';
      updateData = { rejected_to: user.role };
    } else if (action === 'returned') {
      // 退回
      const returnTarget = getReturnTarget(user.role);
      newStatus = returnTarget.status;
      updateData = { rejected_to: returnTarget.role };
    }

    await db.inspections.update(inspectionId, {
      status: newStatus,
      ...updateData,
    });

    return NextResponse.json({
      success: true,
      inspection: { ...inspection, status: newStatus, ...updateData },
    });
  } catch (error) {
    console.error('Approval error:', error);
    return NextResponse.json({ error: '审核操作失败' }, { status: 500 });
  }
}

function getReturnTarget(currentRole: string): { status: string; role: string } {
  const returnFlow: Record<string, { status: string; role: string }> = {
    line_leader: { status: 'draft', role: 'assistant' },
    supervisor: { status: 'line_leader_review', role: 'line_leader' },
    qc: { status: 'supervisor_review', role: 'supervisor' },
  };
  return returnFlow[currentRole] || { status: 'draft', role: 'assistant' };
}
