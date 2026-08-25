import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/about - 获取关于信息
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
      about: {
        name: '化妆品首件核对系统',
        version: '1.0.0',
        description: '基于 Next.js + Supabase 的首件核对管理系统',
        techStack: [
          'Next.js 16',
          'React 19',
          'TypeScript 5',
          'Supabase',
          'Tailwind CSS 4',
          'shadcn/ui',
        ],
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
    console.error('Get about error:', error);
    return NextResponse.json({ error: '获取关于信息失败' }, { status: 500 });
  }
}
