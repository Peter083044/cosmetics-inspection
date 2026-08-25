import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/guide - 获取操作指南
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    if (!isAdmin(user)) {
      return NextResponse.json({ error: '无管理员权限' }, { status: 403 });
    }

    return NextResponse.json({
      guide: {
        title: '操作指南',
        sections: [
          {
            title: '检验流程',
            content: '创建记录 → 提交审核 → 线长审核 → 主管审核 → QC 审核 → 完成',
          },
          {
            title: '照片要求',
            content: '每个面需要上传标样照片和首件实物照片，最多 6 个面。',
          },
          {
            title: '审核权限',
            content: '管理员拥有所有权限，其他角色仅有执行权限。',
          },
        ],
      },
    });
  } catch (error) {
    console.error('Get guide error:', error);
    return NextResponse.json({ error: '获取操作指南失败' }, { status: 500 });
  }
}
