import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

// GET /api/storage - 获取存储信息
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    // 获取检验记录数量
    const { count: inspectionCount, error: inspectionError } = await supabase
      .from('inspections')
      .select('id', { count: 'exact', head: true });
    
    if (inspectionError) throw inspectionError;

    // 获取用户数量
    const { count: userCount, error: userError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });
    
    if (userError) throw userError;

    // 获取产品数量
    const { count: productCount, error: productError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true });
    
    if (productError) throw productError;

    return NextResponse.json({
      inspectionCount: inspectionCount || 0,
      userCount: userCount || 0,
      productCount: productCount || 0,
      // 照片存储信息需要从腾讯云获取，这里暂时返回估算值
      photoStorage: {
        used: '0 MB',
        total: '10 GB',
      },
    });
  } catch (error) {
    console.error('Get storage error:', error);
    return NextResponse.json({ error: '获取存储信息失败' }, { status: 500 });
  }
}
