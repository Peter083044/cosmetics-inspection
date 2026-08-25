import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/version - 获取系统版本
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
      version: '1.0.0',
      name: '化妆品首件核对系统',
      description: '基于 Next.js + Supabase 的首件核对管理系统',
    });
  } catch (error) {
    console.error('Get version error:', error);
    return NextResponse.json({ error: '获取系统版本失败' }, { status: 500 });
  }
}
