import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/backup - 获取备份数据
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    if (!isAdmin(user)) {
      return NextResponse.json({ error: '无管理员权限' }, { status: 403 });
    }

    // 获取所有数据
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');

    const { data: inspections, error: inspectionsError } = await supabase
      .from('inspections')
      .select('*');

    const { data: approvals, error: approvalsError } = await supabase
      .from('approvals')
      .select('*');

    if (usersError || productsError || inspectionsError || approvalsError) {
      console.error('Get backup data error:', {
        usersError,
        productsError,
        inspectionsError,
        approvalsError,
      });
      return NextResponse.json({ error: '获取备份数据失败' }, { status: 500 });
    }

    return NextResponse.json({
      users: users || [],
      products: products || [],
      inspections: inspections || [],
      approvals: approvals || [],
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get backup error:', error);
    return NextResponse.json({ error: '获取备份数据失败' }, { status: 500 });
  }
}
