import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/notifications - 获取通知列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 获取待审核的检验记录
    const { data: pendingReviews, error } = await db
      .from('inspections')
      .select('*')
      .eq('current_reviewer_id', user.id)
      .neq('status', 'approved')
      .neq('status', 'rejected')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get notifications error:', error);
      return NextResponse.json({ error: '获取通知失败' }, { status: 500 });
    }

    return NextResponse.json({
      notifications: pendingReviews.map((item) => ({
        id: item.id,
        type: 'review_request',
        title: `检验记录待审核：${item.product_name}`,
        message: `${item.assistant_name} 提交了检验记录，等待您的审核`,
        created_at: item.created_at,
      })),
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: '获取通知失败' }, { status: 500 });
  }
}
