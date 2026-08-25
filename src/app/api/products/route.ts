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

    const { data, error } = await db.products.getAll()
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    return NextResponse.json({ products: data });
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

    const { data, error } = await db.products.create({
      name,
      code,
      color_number,
      batch_number,
      created_by: user.id,
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      product: data,
    });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: '创建产品失败' }, { status: 500 });
  }
}

// PUT /api/products - 更新产品
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, code, color_number, batch_number } = body;

    const { error } = await db.products.update(id, {
      name,
      code,
      color_number,
      batch_number,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: '更新产品失败' }, { status: 500 });
  }
}

// DELETE /api/products - 删除产品
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '请指定产品 ID' }, { status: 400 });
    }

    const { error } = await db.products.delete(parseInt(id));
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: '删除产品失败' }, { status: 500 });
  }
}
