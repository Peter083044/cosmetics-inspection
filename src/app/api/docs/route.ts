import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/docs - 获取文档
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
      docs: {
        title: '系统文档',
        sections: [
          {
            title: 'API 文档',
            description: '系统提供 RESTful API 接口，支持 JSON 格式数据交换。',
          },
          {
            title: '数据库文档',
            description: '使用 Supabase PostgreSQL 数据库，包含 users、products、inspections、approvals 表。',
          },
          {
            title: '部署文档',
            description: '系统部署在 Vercel 平台，支持自动构建和部署。',
          },
        ],
      },
    });
  } catch (error) {
    console.error('Get docs error:', error);
    return NextResponse.json({ error: '获取文档失败' }, { status: 500 });
  }
}
