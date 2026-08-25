import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/settings - 获取系统设置
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    return NextResponse.json({
      message: '系统设置功能',
      settings: {
        maxLabels: 4,
        maxPhotos: 6,
        requireExplanation: true,
      },
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: '获取系统设置失败' }, { status: 500 });
  }
}

// POST /api/settings - 更新系统设置
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    if (!isAdmin(user)) {
      return NextResponse.json({ error: '无管理员权限' }, { status: 403 });
    }

    const body = await request.json();

    return NextResponse.json({
      success: true,
      message: '系统设置已更新',
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: '更新系统设置失败' }, { status: 500 });
  }
}
