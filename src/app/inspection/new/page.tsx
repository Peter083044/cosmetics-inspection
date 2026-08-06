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

const LABEL_ITEMS = [
  { id: 1, name: '标签1' },
  { id: 2, name: '标签2' },
  { id: 3, name: '标签3' },
  { id: 4, name: '标签4' },
];

interface LabelComparison {
  index: number;
  name: string;
  standard: string;
  actual: string;
  result: string;
  difference: string;
}

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

  // Label comparisons (up to 4 items)
  const [labelComparisons, setLabelComparisons] = useState<LabelComparison[]>(
    LABEL_ITEMS.map((l, i) => ({ index: l.id, name: l.name, standard: '', actual: '', result: 'pass', difference: '' }))
  );

  // Review levels selection
  const [reviewLevels, setReviewLevels] = useState<string[]>(['line_leader', 'supervisor', 'qc']);

  // Auto-comparing states
  const [comparingSides, setComparingSides] = useState<Set<number>>(new Set());
  const [comparingLabels, setComparingLabels] = useState<Set<number>>(new Set());

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

  const REVIEW_LEVEL_OPTIONS = [
    { value: 'line_leader', label: '线长' },
    { value: 'supervisor', label: '主管' },
    { value: 'qc', label: 'QC' },
  ];

  const toggleReviewLevel = (level: string) => {
    setReviewLevels(prev => {
      if (prev.includes(level)) {
        // Don't allow removing all levels
        if (prev.length <= 1) return prev;
        return prev.filter(l => l !== level);
      }
      // Add in order
      const order = ['line_leader', 'supervisor', 'qc'];
      return [...prev, level].sort((a, b) => order.indexOf(a) - order.indexOf(b));
    });
  };

  // Compress image before upload using Canvas API
  const compressImage = (file: File, maxSize = 1920, quality = 0.8): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          // Resize if exceeds max dimension
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            } else {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve(file); return; }
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => { resolve(blob || file); },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => { resolve(file); };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => { resolve(file); };
      reader.readAsDataURL(file);
    });
  };

  // Auto-compare function for photo comparisons
  const autoComparePhoto = async (sideIndex: number, standard: string, actual: string, sideName: string) => {
    if (!standard || !actual) return;
    setComparingSides(prev => new Set(prev).add(sideIndex));
    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ standard_url: standard, actual_url: actual, side_name: sideName }),
      });
      const data = await res.json();
      if (data.success) {
        setComparisons(prev => {
          const next = [...prev];
          next[sideIndex] = { ...next[sideIndex], result: data.result, difference: data.difference };
          return next;
        });
      }
    } catch {
      // Silently fail - user can still manually set result
    } finally {
      setComparingSides(prev => {
        const next = new Set(prev);
        next.delete(sideIndex);
        return next;
      });
    }
  };

  // Auto-compare function for label comparisons
  const autoCompareLabel = async (labelIndex: number, standard: string, actual: string, labelName: string) => {
    if (!standard || !actual) return;
    setComparingLabels(prev => new Set(prev).add(labelIndex));
    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ standard_url: standard, actual_url: actual, side_name: labelName }),
      });
      const data = await res.json();
      if (data.success) {
        setLabelComparisons(prev => {
          const next = [...prev];
          next[labelIndex] = { ...next[labelIndex], result: data.result, difference: data.difference };
          return next;
        });
      }
    } catch {
      // Silently fail
    } finally {
      setComparingLabels(prev => {
        const next = new Set(prev);
        next.delete(labelIndex);
        return next;
      });
    }
  };

  const handlePhotoUpload = (sideIndex: number, type: 'standard' | 'actual') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        // Compress image before upload
        const compressedBlob = await compressImage(file);
        const compressedFile = new File([compressedBlob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('file', compressedFile);

        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) {
          setComparisons(prev => {
            const next = [...prev];
            next[sideIndex] = { ...next[sideIndex], [type]: data.url };
            // Trigger auto-compare if both photos are uploaded
            const updated = next[sideIndex];
            if (updated.standard && updated.actual) {
              setTimeout(() => autoComparePhoto(sideIndex, updated.standard, updated.actual, updated.side_name), 100);
            }
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

      try {
        const compressedBlob = await compressImage(file);
        const compressedFile = new File([compressedBlob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('file', compressedFile);

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

  const handleLabelUpload = (labelIndex: number, type: 'standard' | 'actual') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const compressedBlob = await compressImage(file);
        const compressedFile = new File([compressedBlob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('file', compressedFile);

        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) {
          setLabelComparisons(prev => {
            const next = prev.map((lc, i) =>
              i === labelIndex ? { ...lc, [type]: data.url } : lc
            );
            // Trigger auto-compare if both photos are uploaded
            const updated = next[labelIndex];
            if (updated.standard && updated.actual) {
              setTimeout(() => autoCompareLabel(labelIndex, updated.standard, updated.actual, updated.name), 100);
            }
            return next;
          });
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
    const activeLabels = labelComparisons.filter(lc => lc.standard || lc.actual);
    if (activeComparisons.length === 0 && activeLabels.length === 0) {
      alert('请至少上传一组照片或标签照片');
      return;
    }

    // 计算通过率（包含标签核对）
    const totalItems = activeComparisons.length + activeLabels.length;
    const passItems = activeComparisons.filter(c => c.result === 'pass').length + activeLabels.filter(lc => lc.result === 'pass').length;
    const hasFail = activeComparisons.some(c => c.result === 'fail') || activeLabels.some(lc => lc.result === 'fail');
    const passRate = totalItems > 0 ? ((passItems / totalItems) * 100).toFixed(0) : '100';

    // 通过率不足100%时，必须填写提交说明
    if (hasFail && !resultSummary.trim()) {
      alert(`当前通过率${passRate}%，不足100%。请填写提交说明原因`);
      return;
    }

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
          label_comparisons: labelComparisons.filter(lc => lc.standard || lc.actual),
          review_levels: reviewLevels,
          result: hasFail ? 'fail' : 'pass',
          result_summary: resultSummary || (hasFail ? '存在不通过项' : '全部通过'),
          submit_explanation: hasFail ? resultSummary : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // 跳转到详情页，由辅助人员选择审核人后提交
        router.push(`/inspection/${data.inspectionId}`);
      } else {
        alert(data.error || '保存失败');
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

      {/* Section: Review Levels */}
      <div className="section">
        <div className="section-title">📋 审核流程 <span style={{ fontSize: '12px', color: '#999', fontWeight: '400' }}>(选择需要的审核级别)</span></div>
        <div className="card" style={{ padding: '12px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {REVIEW_LEVEL_OPTIONS.map(opt => {
              const isSelected = reviewLevels.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleReviewLevel(opt.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: isSelected ? '2px solid #4f46e5' : '2px solid #d1d5db',
                    background: isSelected ? '#eef2ff' : '#fff',
                    color: isSelected ? '#4f46e5' : '#6b7280',
                    fontWeight: isSelected ? '600' : '400',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {isSelected ? '✓ ' : ''}{opt.label}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
            审核顺序：辅助录入 → {reviewLevels.map(l => REVIEW_LEVEL_OPTIONS.find(o => o.value === l)?.label).filter(Boolean).join(' → ')}
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
                <option value="pass">✅ 内容一致</option>
                <option value="fail">❌ 内容不一致</option>
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

            {comparingSides.has(idx) && (
              <div style={{ marginTop: '8px', padding: '8px', background: '#e3f2fd', borderRadius: '8px', textAlign: 'center', fontSize: '12px', color: '#1565c0' }}>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '6px' }}>🔄</span>
                AI 自动比对中...
              </div>
            )}

            {comp.result === 'fail' && !comparingSides.has(idx) && (
              <div style={{ marginTop: '8px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#d32f2f', marginBottom: '4px' }}>不一致说明 *</label>
                <textarea
                  className="input-box"
                  placeholder="请说明内容不一致的具体原因（脏物、色差等可忽略，无需填写）"
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

      {/* Section 2.5: Label Comparisons (up to 4 items) */}
      <div className="section">
        <div className="section-title">🏷️ 标签核对</div>
        {labelComparisons.map((lc, idx) => (
          <div className="card" key={lc.index}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>{lc.name}</span>
              <select
                value={lc.result}
                onChange={(e) => setLabelComparisons(prev => prev.map((item, i) =>
                  i === idx ? { ...item, result: e.target.value } : item
                ))}
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '12px', background: lc.result === 'pass' ? '#e8f5e9' : '#ffebee', color: lc.result === 'pass' ? '#2e7d32' : '#d32f2f' }}
              >
                <option value="pass">✅ 内容一致</option>
                <option value="fail">❌ 内容不一致</option>
              </select>
            </div>

            <div className="comparison-row">
              <div className="photo-side">
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>标样标签</div>
                {lc.standard ? (
                  <div className="photo-preview">
                    <img src={lc.standard} alt={`${lc.name}标样`} />
                    <button onClick={() => setLabelComparisons(prev => prev.map((item, i) =>
                      i === idx ? { ...item, standard: '' } : item
                    ))} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                  </div>
                ) : (
                  <div className="photo-upload-area" onClick={() => handleLabelUpload(idx, 'standard')} style={{ padding: '12px' }}>
                    <div style={{ fontSize: '24px' }}>🏷️</div>
                    <div className="text" style={{ fontSize: '11px' }}>上传标样</div>
                  </div>
                )}
              </div>
              <div className="photo-side">
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>首件标签</div>
                {lc.actual ? (
                  <div className="photo-preview">
                    <img src={lc.actual} alt={`${lc.name}首件`} />
                    <button onClick={() => setLabelComparisons(prev => prev.map((item, i) =>
                      i === idx ? { ...item, actual: '' } : item
                    ))} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                  </div>
                ) : (
                  <div className="photo-upload-area" onClick={() => handleLabelUpload(idx, 'actual')} style={{ padding: '12px' }}>
                    <div style={{ fontSize: '24px' }}>🏷️</div>
                    <div className="text" style={{ fontSize: '11px' }}>上传首件</div>
                  </div>
                )}
              </div>
            </div>

            {comparingLabels.has(idx) && (
              <div style={{ marginTop: '8px', padding: '8px', background: '#e3f2fd', borderRadius: '8px', textAlign: 'center', fontSize: '12px', color: '#1565c0' }}>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '6px' }}>🔄</span>
                AI 自动比对中...
              </div>
            )}

            {lc.result === 'fail' && !comparingLabels.has(idx) && (
              <div style={{ marginTop: '8px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#d32f2f', marginBottom: '4px' }}>{lc.name}不一致说明 *</label>
                <textarea
                  className="input-box"
                  placeholder={`请说明${lc.name}内容不一致的具体原因`}
                  value={lc.difference}
                  onChange={(e) => setLabelComparisons(prev => prev.map((item, i) =>
                    i === idx ? { ...item, difference: e.target.value } : item
                  ))}
                  rows={2}
                  style={{ resize: 'vertical' }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Section 3: Summary & Pass Rate Warning */}
      <div className="section">
        <div className="section-title">📝 检验总结</div>
        <div className="card">
          {(() => {
            const activeComps = comparisons.filter(c => c.standard || c.actual);
            const activeLabels = labelComparisons.filter(lc => lc.standard || lc.actual);
            const totalItems = activeComps.length + activeLabels.length;
            const failCount = activeComps.filter(c => c.result === 'fail').length + activeLabels.filter(lc => lc.result === 'fail').length;
            const passCount = activeComps.filter(c => c.result === 'pass').length + activeLabels.filter(lc => lc.result === 'pass').length;
            const passRate = totalItems > 0 ? ((passCount / totalItems) * 100).toFixed(0) : '100';
            if (totalItems > 0 && failCount > 0) {
              return (
                <div style={{ marginBottom: '12px', padding: '10px', background: '#fff3e0', borderRadius: '8px', border: '1px solid #ffcc80' }}>
                  <div style={{ fontSize: '13px', color: '#e65100', fontWeight: '600' }}>
                    ⚠️ 通过率 {passRate}%（{passCount}/{totalItems}），不足100%
                  </div>
                  <div style={{ fontSize: '12px', color: '#bf360c', marginTop: '4px' }}>
                    必须填写提交说明原因，否则无法提交
                  </div>
                </div>
              );
            }
            return null;
          })()}
          <textarea
            className="input-box"
            placeholder={
              (comparisons.filter(c => c.standard || c.actual).some(c => c.result === 'fail') || labelComparisons.some(lc => lc.result === 'fail'))
                ? '通过率不足100%，请填写提交说明原因 *'
                : '检验总结说明（可选）'
            }
            value={resultSummary}
            onChange={(e) => setResultSummary(e.target.value)}
            rows={3}
            style={{
              resize: 'vertical',
              border: comparisons.filter(c => c.standard || c.actual).some(c => c.result === 'fail') && !resultSummary.trim()
                ? '2px solid #ff9800'
                : undefined,
            }}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div style={{ padding: '12px 12px 24px 12px' }}>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
          {loading ? '保存中...' : '保存并选择审核人'}
        </button>
      </div>
    </div>
  );
}
