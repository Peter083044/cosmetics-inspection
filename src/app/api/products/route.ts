import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/products - 获取产品列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const products = await db.products.getAll();

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({ error: '获取产品列表失败' }, { status: 500 });
  }
}

// POST /api/products - 创建产品
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const { name, code, color_number, batch_number } = body;

    if (!name || !code || !color_number) {
      return NextResponse.json({ error: '请填写完整信息' }, { status: 400 });
    }

    const product = await db.products.create({
      name,
      code,
      color_number,
      batch_number,
      created_by: user.id,
    });

    if (!product) {
      return NextResponse.json({ error: '创建产品失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: '创建产品失败' }, { status: 500 });
  }
}
