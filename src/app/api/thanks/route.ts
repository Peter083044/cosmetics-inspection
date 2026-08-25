import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/thanks - 获取感谢信息
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
      thanks: {
        title: '感谢',
        content: '感谢您的使用和支持！',
        message: '如有问题或建议，欢迎联系我们。',
      },
    });
  } catch (error) {
    console.error('Get thanks error:', error);
    return NextResponse.json({ error: '获取感谢信息失败' }, { status: 500 });
  }
}
