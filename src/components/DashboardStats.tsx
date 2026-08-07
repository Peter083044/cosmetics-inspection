'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  line_leader_review: '线长审核中',
  supervisor_review: '主管审核中',
  qc_review: 'QC审核中',
  approved: '已通过',
  rejected: '已驳回'
};

const COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#ef4444'];

interface StatsData {
  total: number;
  status: { status: string; count: number }[];
  passRate: { total: number; passed: number; rate: number };
  daily: { date: string; count: number }[];
  reviewers: { current_reviewer_name: string; count: number }[];
  products: { product_name: string; count: number }[];
}

export default function DashboardStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px', margin: '12px' }}>
        暂无统计数据，创建检验记录后将显示统计图表
      </div>
    );
  }

  const statusData = stats.status.map(s => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: s.count
  }));

  const dailyData = stats.daily.map(d => ({
    date: d.date.slice(5), // MM-DD
    count: d.count
  }));

  return (
    <div className="space-y-6 mb-6">
      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-gray-500 text-sm">总记录数</div>
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-gray-500 text-sm">已通过</div>
          <div className="text-2xl font-bold text-green-600">{stats.passRate.passed}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-gray-500 text-sm">通过率</div>
          <div className="text-2xl font-bold text-purple-600">{stats.passRate.rate}%</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-gray-500 text-sm">审核中</div>
          <div className="text-2xl font-bold text-orange-600">
            {stats.status.filter(s => s.status.includes('review')).reduce((sum, s) => sum + s.count, 0)}
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 状态分布饼图 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">状态分布</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 每日记录趋势 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">近30天记录趋势</h3>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="记录数" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              暂无数据
            </div>
          )}
        </div>

        {/* 审核人工作量 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">审核人工作量</h3>
          {stats.reviewers.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.reviewers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="current_reviewer_name" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" name="记录数" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              暂无数据
            </div>
          )}
        </div>

        {/* 产品统计 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">产品检验次数</h3>
          {stats.products.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.products}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product_name" angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#06b6d4" name="检验次数" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              暂无数据
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
