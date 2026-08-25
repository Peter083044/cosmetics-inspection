import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/labels - 获取标签配置
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    return NextResponse.json({
      message: '标签核对功能',
      maxLabels: 4,
    });
  } catch (error) {
    console.error('Get labels config error:', error);
    return NextResponse.json({ error: '获取标签配置失败' }, { status: 500 });
  }
}

// POST /api/labels - 保存标签配置
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const { labelCount = 4 } = body;

    return NextResponse.json({
      success: true,
      labelCount,
    });
  } catch (error) {
    console.error('Save labels config error:', error);
    return NextResponse.json({ error: '保存标签配置失败' }, { status: 500 });
  }
}
