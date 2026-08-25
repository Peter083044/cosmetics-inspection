import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/help - 获取帮助信息
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
      help: {
        title: '化妆品首件核对系统',
        description: '基于 Next.js + Supabase 的首件核对管理系统',
        version: '1.0.0',
        features: [
          '多级审核工作流（辅助→线长→主管→QC）',
          '照片对比标样与实物',
          '记录管理与导出',
          '管理员删除权限',
          '归档管理',
          '统计图表',
          'PDF 导出',
        ],
      },
    });
  } catch (error) {
    console.error('Get help error:', error);
    return NextResponse.json({ error: '获取帮助信息失败' }, { status: 500 });
  }
}
