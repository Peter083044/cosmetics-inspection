import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/faq - 获取常见问题
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
      faq: [
        {
          question: '如何创建检验记录？',
          answer: '在仪表盘点击"新建检验"按钮，填写产品信息并上传照片。',
        },
        {
          question: '如何提交审核？',
          answer: '在检验详情页点击"提交审核"，选择审核人后确认提交。',
        },
        {
          question: '如何导出数据？',
          answer: '在管理后台的"数据导出"标签页，选择日期范围后导出 CSV。',
        },
      ],
    });
  } catch (error) {
    console.error('Get FAQ error:', error);
    return NextResponse.json({ error: '获取常见问题失败' }, { status: 500 });
  }
}
