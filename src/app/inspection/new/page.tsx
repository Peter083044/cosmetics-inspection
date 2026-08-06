'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

interface Comparison {
  side: number;
  side_name: string;
  standard: string;
  actual: string;
  result: string;
  difference: string;
}

const SIDES = [
  { id: 1, name: '正面' },
  { id: 2, name: '背面' },
  { id: 3, name: '左侧' },
  { id: 4, name: '右侧' },
  { id: 5, name: '顶部' },
  { id: 6, name: '底部' },
];

export default function NewInspectionPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [inspectionDate, setInspectionDate] = useState('');
  const [productName, setProductName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [colorNumber, setColorNumber] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [instructionOrderImage, setInstructionOrderImage] = useState('');

  // Photo comparisons
  const [comparisons, setComparisons] = useState<Comparison[]>(
    SIDES.map(s => ({ side: s.id, side_name: s.name, standard: '', actual: '', result: 'pass', difference: '' }))
  );

  const [resultSummary, setResultSummary] = useState('');

  useEffect(() => {
    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    setInspectionDate(today);

    fetch('/api/auth')
      .then(res => res.json())
      .then(data => {
        if (data.success) setUser(data.user);
        else router.push('/login');
      })
      .catch(() => router.push('/login'));
  }, []);

  const handlePhotoUpload = (sideIndex: number, type: 'standard' | 'actual') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) {
          setComparisons(prev => {
            const next = [...prev];
            next[sideIndex] = { ...next[sideIndex], [type]: data.url };
            return next;
          });
        }
      } catch {
        alert('上传失败');
      }
    };
    input.click();
  };

  const handleInstructionOrderUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) {
          setInstructionOrderImage(data.url);
        }
      } catch {
        alert('上传失败');
      }
    };
    input.click();
  };

  const updateComparison = (index: number, field: keyof Comparison, value: string) => {
    setComparisons(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!productName || !productCode || !colorNumber) {
      alert('请填写产品名称、代码和色号');
      return;
    }

    const activeComparisons = comparisons.filter(c => c.standard || c.actual);
    if (activeComparisons.length === 0) {
      alert('请至少上传一组照片');
      return;
    }

    const hasFail = activeComparisons.some(c => c.result === 'fail');
    setLoading(true);

    try {
      const res = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspection_date: inspectionDate,
          product_name: productName,
          product_code: productCode,
          color_number: colorNumber,
          batch_number: batchNumber,
          instruction_order_image: instructionOrderImage,
          comparisons: activeComparisons,
          result: hasFail ? 'fail' : 'pass',
          result_summary: resultSummary || (hasFail ? '存在不通过项' : '全部通过'),
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('检验记录已提交，等待线长审核');
        router.push('/dashboard');
      } else {
        alert(data.error || '提交失败');
      }
    } catch {
      alert('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <div className="header-bar" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer', padding: '4px' }}>
          ←
        </button>
        <div className="title" style={{ flex: 1 }}>新建检验</div>
      </div>

      {/* Section 1: Basic Info */}
      <div className="section">
        <div className="section-title">📋 基本信息</div>
        <div className="card">
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>检验日期</label>
            <input className="input-box" type="date" value={inspectionDate} onChange={(e) => setInspectionDate(e.target.value)} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>产品名称 *</label>
            <input className="input-box" type="text" placeholder="请输入产品名称" value={productName} onChange={(e) => setProductName(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>产品代码 *</label>
              <input className="input-box" type="text" placeholder="如 LP-001" value={productCode} onChange={(e) => setProductCode(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>色号 *</label>
              <input className="input-box" type="text" placeholder="如 C01" value={colorNumber} onChange={(e) => setColorNumber(e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>批号 <span style={{ color: '#999', fontSize: '11px' }}>(不参与比对)</span></label>
            <input className="input-box" type="text" placeholder="请输入批号" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>工单/指令单照片</label>
            {instructionOrderImage ? (
              <div className="photo-preview" style={{ marginTop: '8px' }}>
                <img src={instructionOrderImage} alt="工单" style={{ height: '100px' }} />
                <button onClick={() => setInstructionOrderImage('')} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
              </div>
            ) : (
              <div className="photo-upload-area" onClick={handleInstructionOrderUpload} style={{ marginTop: '8px', padding: '16px' }}>
                <div className="icon">📄</div>
                <div className="text">点击上传工单照片</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Photo Comparison */}
      <div className="section">
        <div className="section-title">📷 照片对比 <span style={{ fontSize: '12px', color: '#999', fontWeight: '400' }}>(最多6个面)</span></div>

        {comparisons.map((comp, idx) => (
          <div key={comp.side} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>{comp.side_name}</span>
              <select
                value={comp.result}
                onChange={(e) => updateComparison(idx, 'result', e.target.value)}
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '12px', background: comp.result === 'pass' ? '#e8f5e9' : '#ffebee', color: comp.result === 'pass' ? '#2e7d32' : '#d32f2f' }}
              >
                <option value="pass">✅ 通过</option>
                <option value="fail">❌ 不通过</option>
              </select>
            </div>

            <div className="comparison-row">
              <div className="photo-side">
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>标样照片</div>
                {comp.standard ? (
                  <div className="photo-preview">
                    <img src={comp.standard} alt="标样" />
                    <button onClick={() => updateComparison(idx, 'standard', '')} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                  </div>
                ) : (
                  <div className="photo-upload-area" onClick={() => handlePhotoUpload(idx, 'standard')} style={{ padding: '12px' }}>
                    <div style={{ fontSize: '24px' }}>📷</div>
                    <div className="text" style={{ fontSize: '11px' }}>上传标样</div>
                  </div>
                )}
              </div>
              <div className="photo-side">
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>首件照片</div>
                {comp.actual ? (
                  <div className="photo-preview">
                    <img src={comp.actual} alt="首件" />
                    <button onClick={() => updateComparison(idx, 'actual', '')} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                  </div>
                ) : (
                  <div className="photo-upload-area" onClick={() => handlePhotoUpload(idx, 'actual')} style={{ padding: '12px' }}>
                    <div style={{ fontSize: '24px' }}>📷</div>
                    <div className="text" style={{ fontSize: '11px' }}>上传首件</div>
                  </div>
                )}
              </div>
            </div>

            {comp.result === 'fail' && (
              <div style={{ marginTop: '8px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#d32f2f', marginBottom: '4px' }}>差异说明 *</label>
                <textarea
                  className="input-box"
                  placeholder="请说明不通过的原因（颜色差异、外观差异等）"
                  value={comp.difference}
                  onChange={(e) => updateComparison(idx, 'difference', e.target.value)}
                  rows={2}
                  style={{ resize: 'vertical' }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Section 3: Summary */}
      <div className="section">
        <div className="section-title"> 检验总结</div>
        <div className="card">
          <textarea
            className="input-box"
            placeholder="检验总结说明（可选）"
            value={resultSummary}
            onChange={(e) => setResultSummary(e.target.value)}
            rows={3}
            style={{ resize: 'vertical' }}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div style={{ padding: '12px 12px 24px 12px' }}>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
          {loading ? '提交中...' : '提交检验 → 线长审核'}
        </button>
      </div>
    </div>
  );
}
