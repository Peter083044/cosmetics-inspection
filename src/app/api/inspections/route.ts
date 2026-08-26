import { NextRequest, NextResponse } from 'next/server';
import { supabase, db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/inspections - 获取检验记录列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const id = searchParams.get('id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // 单条记录查询
    if (id) {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('id', parseInt(id))
        .single();
      
      if (error) {
        return NextResponse.json({ success: false, error: '记录不存在' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data });
    }

    let query = supabase
      .from('inspections')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    
    if (status) {
      query = query.eq('status', status);
    }

    // 非管理员只能看到自己的记录或待审核的记录
    if (!isAdmin(user)) {
      if (user.role === 'assistant') {
        query = query.eq('assistant_id', user.id);
      } else {
        query = query.eq('current_reviewer_id', user.id);
      }
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Get inspections error:', error);
    return NextResponse.json({ error: '获取检验记录失败' }, { status: 500 });
  }
}

// POST /api/inspections - 创建检验记录 或 删除（管理员）
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await request.json();

    // 删除操作
    if (body._action === 'delete' && body.ids) {
      if (!isAdmin(user)) {
        return NextResponse.json({ error: '无权限' }, { status: 403 });
      }
      const success = await db.inspections.deleteByIds(body.ids);
      if (!success) {
        return NextResponse.json({ error: '删除检验记录失败' }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: `已删除 ${body.ids.length} 条记录` });
    }

    // 创建操作
    const {
      inspection_date,
      product_name,
      product_code,
      color_number,
      batch_number,
      comparisons,
      label_comparisons,
    } = body;

    if (!product_name || !product_code || !color_number || !batch_number) {
      return NextResponse.json({ error: '请填写完整的基本信息' }, { status: 400 });
    }

    const newInspection = await db.inspections.create({
      inspection_date: inspection_date || new Date().toISOString().split('T')[0],
      product_name,
      product_code,
      color_number,
      batch_number,
      assistant_id: user.id,
      assistant_name: user.name,
      status: 'draft',
      comparisons: comparisons || [],
      label_comparisons: label_comparisons || [],
    } as any);

    if (!newInspection) {
      return NextResponse.json({ error: '创建检验记录失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      inspection: newInspection,
    });
  } catch (error) {
    console.error('Create inspection error:', error);
    return NextResponse.json({ error: '创建检验记录失败' }, { status: 500 });
  }
}

// DELETE /api/inspections - 删除检验记录（管理员）
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: '请指定要删除的记录 ID' }, { status: 400 });
    }

    const success = await db.inspections.deleteByIds(ids);
    if (!success) {
      return NextResponse.json({ error: '删除检验记录失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete inspections error:', error);
    return NextResponse.json({ error: '删除检验记录失败' }, { status: 500 });
  }
}
