import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/tutorial - 获取教程信息
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
      tutorial: {
        title: '使用教程',
        steps: [
          {
            step: 1,
            title: '创建检验记录',
            description: '在仪表盘点击"新建检验"按钮，填写产品信息并上传照片。',
          },
          {
            step: 2,
            title: '提交审核',
            description: '在检验详情页点击"提交审核"，选择审核人后确认提交。',
          },
          {
            step: 3,
            title: '审核流程',
            description: '审核人依次审核：线长→主管→QC，全部通过后记录完成。',
          },
          {
            step: 4,
            title: '数据导出',
            description: '在管理后台的"数据导出"标签页，选择日期范围后导出 CSV。',
          },
        ],
      },
    });
  } catch (error) {
    console.error('Get tutorial error:', error);
    return NextResponse.json({ error: '获取教程信息失败' }, { status: 500 });
  }
}
