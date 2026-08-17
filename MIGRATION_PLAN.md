# 化妆品首件核对系统 - 迁移方案

## 一、当前系统分析

### 技术栈
| 组件 | 当前方案 | 说明 |
|------|---------|------|
| **框架** | Next.js 16 | App Router |
| **语言** | TypeScript 5 | - |
| **UI** | shadcn/ui + Tailwind CSS 4 | - |
| **数据库** | SQLite (better-sqlite3) | 本地文件存储 |
| **文件存储** | 本地文件系统 | public/uploads/ |
| **部署** | 沙箱环境 | 临时，会休眠 |

### 数据库表结构
- `users` - 用户表（10 个用户）
- `products` - 产品信息表
- `inspections` - 检验记录表
- `approvals` - 审核日志表

### 当前问题
1. 沙箱会休眠，需要频繁唤醒
2. 数据存储在本地，沙箱重置后丢失
3. 照片存储在本地，无法共享
4. 无法 24 小时稳定运行

---

## 二、目标架构

```
┌─────────────────────────────────────────────────────────┐
│                      用户层                              │
│   手机 APP (PWA)  /  电脑浏览器 (Chrome)                 │
└────────────────────────┬────────────────────────────────┘
                         │
                    ┌────▼────┐
                    │  Vercel  │  ← 应用托管（24 小时在线）
                    │  (CDN)   │
                    └────┬────
                         │
          ┌──────────────┼──────────────┐
          │              │              │
     ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
     │  API    │   │  页面   │   │  静态   │
     │ Routes  │   │  (SSR)  │   │  资源   │
     └────┬────┘   └─────────┘   └─────────┘
          │
     ┌────▼────────────────────────────────┐
     │         数据层                        │
     │                                      │
     │  ┌──────────────┐  ──────────────┐ │
     │  │  Supabase    │  │  阿里云 OSS  │ │
     │  │  (PostgreSQL)│  │  (照片存储)  │ │
     │  │              │  │              │ │
     │  │ - 用户表     │  │ - 标样照片   │ │
     │  │ - 产品表     │  │ - 首件照片   │ │
     │  │ - 检验记录   │  │ - 标签照片   │ │
     │  │ - 审核日志   │  │              │ │
     │  └──────────────┘  └──────────────┘ │
     └─────────────────────────────────────┘
```

### 目标技术栈
| 组件 | 目标方案 | 费用 |
|------|---------|------|
| **应用托管** | Vercel | 免费~20 元/月 |
| **数据库** | Supabase (PostgreSQL) | 免费~50 元/月 |
| **文件存储** | 阿里云 OSS | 约 10 元/月 |
| **域名** | 可选 | 约 50 元/年 |
| **总计** | - | **约 0-80 元/月** |

---

## 三、迁移步骤

### 阶段 1：准备工作（1-2 小时）

#### 1.1 注册账号
- [ ] 注册 GitHub 账号（如已有可跳过）
- [ ] 注册 Vercel 账号（用 GitHub 登录）
- [ ] 注册 Supabase 账号
- [ ] 注册阿里云账号（用于 OSS）

#### 1.2 创建项目
- [ ] 在 GitHub 创建仓库 `cosmetics-inspection`
- [ ] 在 Supabase 创建项目 `cosmetics-inspection`
- [ ] 在阿里云创建 OSS Bucket `cosmetics-inspection-photos`

#### 1.3 上传代码
```bash
# 在当前项目目录执行
git init
git add .
git commit -m "初始提交：化妆品首件核对系统"
git branch -M main
git remote add origin https://github.com/你的用户名/cosmetics-inspection.git
git push -u origin main
```

---

### 阶段 2：数据库迁移（2-3 小时）

#### 2.1 创建 Supabase 数据库表

在 Supabase SQL Editor 中执行：

```sql
-- 用户表
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('assistant', 'line_leader', 'qc', 'supervisor', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 产品信息表
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  color_number TEXT NOT NULL,
  batch_number TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

-- 首件检验记录表
CREATE TABLE inspections (
  id SERIAL PRIMARY KEY,
  inspection_date TEXT,
  product_name TEXT NOT NULL,
  product_code TEXT NOT NULL,
  color_number TEXT NOT NULL,
  batch_number TEXT NOT NULL,
  assistant_id INTEGER REFERENCES users(id),
  assistant_name TEXT,
  status TEXT DEFAULT 'draft',
  result TEXT,
  result_summary TEXT,
  submit_explanation TEXT,
  rejected_to TEXT,
  current_reviewer_id INTEGER REFERENCES users(id),
  current_reviewer_name TEXT,
  review_levels TEXT[],
  comparisons JSONB,
  label_comparisons JSONB,
  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 审核日志表
CREATE TABLE approvals (
  id SERIAL PRIMARY KEY,
  inspection_id INTEGER REFERENCES inspections(id),
  reviewer_id INTEGER REFERENCES users(id),
  reviewer_name TEXT,
  reviewer_role TEXT,
  action TEXT NOT NULL CHECK(action IN ('approved', 'rejected', 'returned', 'submitted')),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_inspections_status ON inspections(status);
CREATE INDEX idx_inspections_assistant ON inspections(assistant_id);
CREATE INDEX idx_inspections_reviewer ON inspections(current_reviewer_id);
CREATE INDEX idx_approvals_inspection ON approvals(inspection_id);
```

#### 2.2 导出当前数据

```bash
# 在沙箱中执行
cd /workspace/projects
node -e "
const db = require('better-sqlite3')('data/inspection.db');
const fs = require('fs');

// 导出用户
const users = db.prepare('SELECT * FROM users').all();
fs.writeFileSync('backup/users.json', JSON.stringify(users, null, 2));

// 导出产品
const products = db.prepare('SELECT * FROM products').all();
fs.writeFileSync('backup/products.json', JSON.stringify(products, null, 2));

// 导出检验记录
const inspections = db.prepare('SELECT * FROM inspections').all();
fs.writeFileSync('backup/inspections.json', JSON.stringify(inspections, null, 2));

// 导出审核日志
const approvals = db.prepare('SELECT * FROM approvals').all();
fs.writeFileSync('backup/approvals.json', JSON.stringify(approvals, null, 2));

console.log('数据导出完成');
"
```

#### 2.3 导入数据到 Supabase

使用 Supabase 的 Dashboard 或 API 导入数据。

---

### 阶段 3：代码改造（4-6 小时）

#### 3.1 安装新依赖

```bash
pnpm add @supabase/supabase-js @aws-sdk/client-s3
```

#### 3.2 修改数据库连接

**文件**: `src/lib/db.ts` → `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// 保持原有的函数签名，内部改为调用 Supabase
export async function getUsers() {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data;
}

// ... 其他函数类似改造
```

#### 3.3 修改文件上传

**文件**: `src/app/api/upload/route.ts`

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  const key = `uploads/${Date.now()}-${file.name}`;
  
  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: Buffer.from(await file.arrayBuffer()),
    ContentType: file.type,
  }));
  
  return NextResponse.json({ 
    success: true, 
    url: `https://${process.env.AWS_BUCKET_NAME}.oss-${process.env.AWS_REGION}.aliyuncs.com/${key}` 
  });
}
```

#### 3.4 添加环境变量

在 Vercel 项目设置中添加：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx

# AWS S3 / 阿里云 OSS
AWS_REGION=cn-hangzhou
AWS_ACCESS_KEY_ID=LTAIxxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_BUCKET_NAME=cosmetics-inspection-photos

# JWT (保持不变)
JWT_SECRET=your-secret-key
```

#### 3.5 修改数据库查询

所有 API 路由中的数据库查询需要从 SQLite 语法改为 PostgreSQL 语法：

**SQLite**:
```typescript
const inspections = db.prepare('SELECT * FROM inspections WHERE status = ?').all('draft');
```

**PostgreSQL (Supabase)**:
```typescript
const { data: inspections } = await supabase
  .from('inspections')
  .select('*')
  .eq('status', 'draft');
```

---

### 阶段 4：部署上线（1-2 小时）

#### 4.1 连接 Vercel

1. 在 Vercel 点击 "New Project"
2. 导入 GitHub 仓库 `cosmetics-inspection`
3. 配置环境变量
4. 点击 "Deploy"

#### 4.2 配置域名（可选）

1. 购买域名（如 `inspection.yourcompany.com`）
2. 在 Vercel 项目设置中添加域名
3. 配置 DNS 解析

#### 4.3 测试验证

- [ ] 登录功能正常
- [ ] 创建检验记录正常
- [ ] 照片上传正常
- [ ] 审核流程正常
- [ ] 数据导出正常
- [ ] 统计图表正常

---

## 四、代码修改清单

### 需要修改的文件

| 文件 | 修改内容 | 工作量 |
|------|---------|--------|
| `src/lib/db.ts` | 改为 Supabase 客户端 | 2 小时 |
| `src/lib/auth.ts` | 适配新的数据库查询 | 1 小时 |
| `src/app/api/upload/route.ts` | 改为 OSS 上传 | 1 小时 |
| `src/app/api/auth/route.ts` | 适配 Supabase | 0.5 小时 |
| `src/app/api/users/route.ts` | 适配 Supabase | 0.5 小时 |
| `src/app/api/inspections/route.ts` | 适配 Supabase | 1 小时 |
| `src/app/api/inspections/[id]/approve/route.ts` | 适配 Supabase | 0.5 小时 |
| `src/app/api/export/route.ts` | 适配 Supabase | 0.5 小时 |
| `src/app/api/stats/route.ts` | 适配 Supabase | 0.5 小时 |
| `src/app/api/archive/route.ts` | 适配 Supabase + OSS | 1 小时 |
| `src/app/api/cleanup/route.ts` | 适配 Supabase + OSS | 0.5 小时 |
| `src/app/api/pdf/route.ts` | 适配 Supabase | 0.5 小时 |
| `src/app/api/compare/route.ts` | 无需修改 | 0 |
| `src/app/api/ocr/route.ts` | 无需修改 | 0 |

**总工作量**: 约 8-10 小时

---

## 五、成本估算

### 月度费用

| 项目 | 免费额度 | 超出后费用 | 预估月费 |
|------|---------|-----------|---------|
| **Vercel** | 100GB 流量/月 | 20 元/月 | 0-20 元 |
| **Supabase** | 500MB 数据库 | 50 元/月 | 0-50 元 |
| **阿里云 OSS** | - | 按量计费 | 约 10 元 |
| **域名** | - | 50 元/年 | 约 4 元/月 |
| **总计** | - | - | **0-84 元/月** |

### 首年费用（新用户优惠）

| 项目 | 费用 |
|------|------|
| Vercel 团队版 | 240 元/年 |
| Supabase Pro | 600 元/年 |
| 阿里云 OSS | 120 元/年 |
| 域名 | 50 元/年 |
| **总计** | **约 1000 元/年** |

---

## 六、时间表

| 阶段 | 工作内容 | 预计时间 |
|------|---------|---------|
| **阶段 1** | 准备工作（注册账号、创建项目） | 1-2 小时 |
| **阶段 2** | 数据库迁移（建表、导出数据、导入） | 2-3 小时 |
| **阶段 3** | 代码改造（数据库、文件上传） | 4-6 小时 |
| **阶段 4** | 部署上线（Vercel 配置、测试） | 1-2 小时 |
| **总计** | - | **8-13 小时** |

**建议分 2 天完成**：
- 第 1 天：阶段 1 + 阶段 2（准备工作 + 数据库迁移）
- 第 2 天：阶段 3 + 阶段 4（代码改造 + 部署上线）

---

## 七、风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| **数据迁移丢失** | 高 | 迁移前完整备份，迁移后验证数据完整性 |
| **代码兼容性问题** | 中 | 逐步改造，每个模块测试后再继续 |
| **费用超支** | 低 | 设置用量告警，监控资源使用 |
| **部署失败** | 中 | 保留沙箱版本作为备份，可随时回滚 |
| **用户访问中断** | 高 | 选择低峰期迁移，提前通知用户 |

---

## 八、迁移后维护

### 日常维护
- **代码更新**: 提交到 GitHub，Vercel 自动部署
- **数据备份**: Supabase 自动每日备份
- **监控告警**: 配置 Vercel 和 Supabase 的告警通知

### 定期任务
- **每月**: 检查资源使用量，优化成本
- **每季度**: 清理过期数据，归档旧记录
- **每年**: 续费域名和云服务

---

## 九、回滚方案

如果迁移后出现问题，可以快速回滚：

1. **代码回滚**: 在 Vercel 中恢复到旧版本部署
2. **数据回滚**: 从 Supabase 备份恢复数据
3. **完全回滚**: 继续使用沙箱版本（代码和数据都在）

---

## 十、下一步行动

### 立即执行
1. 确认迁移方案
2. 注册所需账号（GitHub、Vercel、Supabase、阿里云）
3. 备份当前沙箱数据

### 等待确认后执行
1. 创建云资源（Supabase 项目、OSS Bucket）
2. 开始代码改造
3. 部署测试环境
4. 验证功能
5. 正式切换

---

**需要我帮你开始执行哪个阶段？**
