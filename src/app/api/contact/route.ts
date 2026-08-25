import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/contact - 获取联系信息
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
      contact: {
        title: '联系我们',
        description: '如果您在使用过程中遇到任何问题，请通过以下方式联系我们。',
        email: 'support@example.com',
        phone: '400-123-4567',
        address: '北京市朝阳区',
      },
    });
  } catch (error) {
    console.error('Get contact error:', error);
    return NextResponse.json({ error: '获取联系信息失败' }, { status: 500 });
  }
}
