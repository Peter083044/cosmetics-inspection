import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/appreciation - 获取赞赏信息
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
      appreciation: {
        title: '赞赏',
        content: '我们赞赏每一位用户的反馈和建议。',
        contact: '如有问题，请联系管理员。',
      },
    });
  } catch (error) {
    console.error('Get appreciation error:', error);
    return NextResponse.json({ error: '获取赞赏信息失败' }, { status: 500 });
  }
}
