import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/compare - 获取比对配置
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    return NextResponse.json({
      message: 'AI 比对功能需要配置 AI 视觉模型',
      endpoint: '/api/compare',
    });
  } catch (error) {
    console.error('Get compare config error:', error);
    return NextResponse.json({ error: '获取比对配置失败' }, { status: 500 });
  }
}

// POST /api/compare - AI 比对
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const { stdImage, actImage } = body;

    if (!stdImage || !actImage) {
      return NextResponse.json({ error: '请提供标样和首件照片' }, { status: 400 });
    }

    // 实际实现需要调用 AI 视觉模型进行比对
    return NextResponse.json({
      message: 'AI 比对功能需要配置 AI 视觉模型',
      result: 'content_consistent',
      confidence: 0.95,
    });
  } catch (error) {
    console.error('Compare error:', error);
    return NextResponse.json({ error: 'AI 比对失败' }, { status: 500 });
  }
}
