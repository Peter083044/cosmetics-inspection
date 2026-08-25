import { createClient } from '@supabase/supabase-js';

// Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase 环境变量未配置，部分功能可能不可用');
}

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

// 数据库表类型定义
export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  role: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  code: string;
  color_number: string;
  batch_number?: string;
  created_at: string;
  created_by?: number;
}

export interface Inspection {
  id: number;
  inspection_date: string;
  product_name: string;
  product_code: string;
  color_number: string;
  batch_number: string;
  assistant_id: number;
  assistant_name: string;
  status: string;
  result?: string;
  result_summary?: string;
  submit_explanation?: string;
  rejected_to?: string;
  current_reviewer_id?: number;
  current_reviewer_name?: string;
  review_levels?: string[];
  comparisons?: any;
  label_comparisons?: any;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Approval {
  id: number;
  inspection_id: number;
  reviewer_id: number;
  reviewer_name: string;
  reviewer_role: string;
  action: string;
  comment?: string;
  created_at: string;
}

// 用户相关操作
export const db = {
  users: {
    async findByUsername(username: string): Promise<User | null> {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error) return null;
      return data as User;
    },

    async findById(id: number): Promise<User | null> {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) return null;
      return data as User;
    },

    async findByRole(role: string): Promise<User[]> {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', role)
        .order('name');
      
      if (error) return [];
      return data as User[];
    },

    async create(user: Omit<User, 'id' | 'created_at'>): Promise<User | null> {
      const { data, error } = await supabase
        .from('users')
        .insert([user])
        .select()
        .single();
      
      if (error) return null;
      return data as User;
    },

    async update(id: number, updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<User | null> {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) return null;
      return data as User;
    },

    async delete(id: number): Promise<boolean> {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      return !error;
    },

    async getAll(): Promise<User[]> {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) return [];
      return data as User[];
    },
  },

  products: {
    async getAll(): Promise<Product[]> {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) return [];
      return data as Product[];
    },

    async create(product: Omit<Product, 'id' | 'created_at'>): Promise<Product | null> {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();
      
      if (error) return null;
      return data as Product;
    },

    async delete(id: number): Promise<boolean> {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      return !error;
    },
  },

  inspections: {
    async getAll(): Promise<Inspection[]> {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) return [];
      return data as Inspection[];
    },

    async findById(id: number): Promise<Inspection | null> {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) return null;
      return data as Inspection;
    },

    async findByAssistant(assistantId: number): Promise<Inspection[]> {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('assistant_id', assistantId)
        .order('created_at', { ascending: false });
      
      if (error) return [];
      return data as Inspection[];
    },

    async findByReviewer(reviewerId: number): Promise<Inspection[]> {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('current_reviewer_id', reviewerId)
        .order('created_at', { ascending: false });
      
      if (error) return [];
      return data as Inspection[];
    },

    async create(inspection: Omit<Inspection, 'id' | 'created_at' | 'updated_at'>): Promise<Inspection | null> {
      const { data, error } = await supabase
        .from('inspections')
        .insert([inspection])
        .select()
        .single();
      
      if (error) return null;
      return data as Inspection;
    },

    async update(id: number, updates: Partial<Omit<Inspection, 'id' | 'created_at'>>): Promise<Inspection | null> {
      const { data, error } = await supabase
        .from('inspections')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) return null;
      return data as Inspection;
    },

    async delete(id: number): Promise<boolean> {
      const { error } = await supabase
        .from('inspections')
        .delete()
        .eq('id', id);
      
      return !error;
    },

    async deleteByIds(ids: number[]): Promise<boolean> {
      const { error } = await supabase
        .from('inspections')
        .delete()
        .in('id', ids);
      
      return !error;
    },

    async getStats() {
      const { data: total, error: totalError } = await supabase
        .from('inspections')
        .select('id', { count: 'exact', head: true });
      
      const { data: approved, error: approvedError } = await supabase
        .from('inspections')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved');
      
      const { data: rejected, error: rejectedError } = await supabase
        .from('inspections')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'rejected');
      
      const { data: pending, error: pendingError } = await supabase
        .from('inspections')
        .select('id', { count: 'exact', head: true })
        .in('status', ['line_leader_review', 'supervisor_review', 'qc_review']);
      
      return {
        total: totalError ? 0 : total,
        approved: approvedError ? 0 : approved,
        rejected: rejectedError ? 0 : rejected,
        pending: pendingError ? 0 : pending,
      };
    },
  },

  approvals: {
    async findByInspection(inspectionId: number): Promise<Approval[]> {
      const { data, error } = await supabase
        .from('approvals')
        .select('*')
        .eq('inspection_id', inspectionId)
        .order('created_at', { ascending: true });
      
      if (error) return [];
      return data as Approval[];
    },

    async create(approval: Omit<Approval, 'id' | 'created_at'>): Promise<Approval | null> {
      const { data, error } = await supabase
        .from('approvals')
        .insert([approval])
        .select()
        .single();
      
      if (error) return null;
      return data as Approval;
    },
  },
};
