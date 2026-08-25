import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/feedback - 获取反馈信息
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
      feedback: {
        title: '反馈与建议',
        description: '如果您在使用过程中遇到任何问题或有改进建议，请联系我们。',
        contact: {
          email: 'support@example.com',
          phone: '400-123-4567',
        },
      },
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    return NextResponse.json({ error: '获取反馈信息失败' }, { status: 500 });
  }
}
