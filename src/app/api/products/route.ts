import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db, { initDatabase } from '@/lib/db';

initDatabase();

// GET /api/products - 获取产品列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    let query = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    if (keyword) {
      query += ' AND (name LIKE ? OR code LIKE ? OR color_number LIKE ?)';
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, (page - 1) * pageSize);

    const products = db.prepare(query).all(...params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
    const countParams: any[] = [];
    if (keyword) {
      countQuery += ' AND (name LIKE ? OR code LIKE ? OR color_number LIKE ?)';
      const kw = `%${keyword}%`;
      countParams.push(kw, kw, kw);
    }
    const { total } = db.prepare(countQuery).get(...countParams) as any;

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: '获取产品列表失败' },
      { status: 500 }
    );
  }
}

// POST /api/products - 创建产品
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { name, code, color_number, batch_number } = await request.json();

    if (!name || !code || !color_number) {
      return NextResponse.json(
        { error: '产品名称、代码和色号为必填项' },
        { status: 400 }
      );
    }

    const stmt = db.prepare(`
      INSERT INTO products (name, code, color_number, batch_number, created_by)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(name, code, color_number, batch_number || null, user.id);

    return NextResponse.json({
      success: true,
      productId: result.lastInsertRowid,
    });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: '创建产品失败' },
      { status: 500 }
    );
  }
}
