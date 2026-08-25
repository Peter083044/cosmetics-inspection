import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/config - 获取系统配置
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
      config: {
        maxPhotosPerFace: 6,
        maxLabels: 4,
        supportedFormats: ['jpg', 'jpeg', 'png'],
        maxFileSize: 10 * 1024 * 1024, // 10MB
      },
    });
  } catch (error) {
    console.error('Get config error:', error);
    return NextResponse.json({ error: '获取系统配置失败' }, { status: 500 });
  }
}
