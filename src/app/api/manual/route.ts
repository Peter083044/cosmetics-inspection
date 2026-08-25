import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/manual - 获取用户手册
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
      manual: {
        title: '用户手册',
        version: '1.0.0',
        lastUpdated: new Date().toISOString().split('T')[0],
        chapters: [
          {
            id: 1,
            title: '系统介绍',
            content: '化妆品首件核对系统用于管理生产过程中的首件检验流程。',
          },
          {
            id: 2,
            title: '快速开始',
            content: '登录系统后，在仪表盘创建检验记录，填写产品信息并上传照片。',
          },
          {
            id: 3,
            title: '审核流程',
            content: '提交审核后，记录会依次经过线长、主管、QC 审核。',
          },
          {
            id: 4,
            title: '数据管理',
            content: '在管理后台可以查看、导出、归档检验记录。',
          },
        ],
      },
    });
  } catch (error) {
    console.error('Get manual error:', error);
    return NextResponse.json({ error: '获取用户手册失败' }, { status: 500 });
  }
}
