# 化妆品首件核对系统 - 傻瓜式迁移指南

> 本指南适合没有技术背景的用户，按照步骤一步步操作即可完成迁移。
> 预计总时间：2-3 小时（分 2 天完成）

---

## 第一天：准备工作 + 数据库迁移

### 步骤 1：注册 GitHub 账号（10 分钟）

1. 打开浏览器，访问：https://github.com
2. 点击右上角 **"Sign up"**
3. 输入邮箱地址，点击 **"Continue"**
4. 设置密码，点击 **"Continue"**
5. 输入用户名（如 `peter-chen`），点击 **"Continue"**
6. 选择是否接收邮件通知，点击 **"Continue"**
7. 完成人机验证
8. 去邮箱点击验证链接

**完成标志**: 看到 GitHub 首页，右上角显示你的用户名

---

### 步骤 2：注册 Vercel 账号（5 分钟）

1. 打开浏览器，访问：https://vercel.com
2. 点击右上角 **"Sign Up"**
3. 点击 **"Continue with GitHub"**（用刚才注册的 GitHub 账号登录）
4. 授权 Vercel 访问你的 GitHub 账号
5. 输入你的名字（随便填，如 `Peter`）
6. 选择用途（选 **"Hobby"** 即可）

**完成标志**: 看到 Vercel 仪表盘页面

---

### 步骤 3：注册 Supabase 账号（10 分钟）

1. 打开浏览器，访问：https://supabase.com
2. 点击右上角 **"Start your project"** 或 **"Sign In"**
3. 点击 **"Continue with GitHub"**（用 GitHub 账号登录）
4. 授权 Supabase 访问你的 GitHub 账号
5. 点击 **"New Project"**

**完成标志**: 看到 Supabase 项目创建页面

---

### 步骤 4：创建 Supabase 数据库项目（15 分钟）

1. 在 Supabase 项目创建页面：
   - **Name**: 输入 `cosmetics-inspection`
   - **Database Password**: 设置一个密码（**一定要记住！** 如 `MyDB@2026`）
   - **Region**: 选择 `Southeast Asia (Singapore)`（离中国近）
2. 点击 **"Create new project"**
3. 等待 2-3 分钟（页面会显示进度）

**完成标志**: 看到 Supabase 项目仪表盘

---

### 步骤 5：获取 Supabase 连接信息（5 分钟）

1. 在 Supabase 项目页面，点击左侧菜单 **"Project Settings"**（项目设置）
2. 点击 **"API"**
3. 找到 **"Project URL"**，复制这个地址（如 `https://xxx.supabase.co`）
   - **保存到记事本**
4. 找到 **"anon public"** 密钥，复制这个长字符串
   - **保存到记事本**

**完成标志**: 记事本里有 2 行内容：
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 步骤 6：创建数据库表（20 分钟）

1. 在 Supabase 左侧菜单，点击 **"SQL Editor"**（SQL 编辑器）
2. 点击 **"New query"**（新建查询）
3. 复制以下所有 SQL 代码，粘贴到编辑器中：

```sql
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('assistant', 'line_leader', 'qc', 'supervisor', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 产品信息表
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  color_number TEXT NOT NULL,
  batch_number TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

-- 首件检验记录表
CREATE TABLE IF NOT EXISTS inspections (
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
CREATE TABLE IF NOT EXISTS approvals (
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
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_assistant ON inspections(assistant_id);
CREATE INDEX IF NOT EXISTS idx_inspections_reviewer ON inspections(current_reviewer_id);
CREATE INDEX IF NOT EXISTS idx_approvals_inspection ON approvals(inspection_id);
```

4. 点击右下角 **"Run"**（运行）按钮
5. 看到下方显示 **"Success. No rows returned"** 表示成功

**完成标志**: 左侧菜单 **"Table Editor"** 里能看到 4 个表：users、products、inspections、approvals

---

### 步骤 7：注册阿里云账号（15 分钟）

1. 打开浏览器，访问：https://www.aliyun.com
2. 点击右上角 **"免费注册"**
3. 用支付宝或淘宝账号登录（或注册新账号）
4. 完成实名认证（需要身份证，5 分钟）

**完成标志**: 看到阿里云控制台首页

---

### 步骤 8：创建 OSS 存储桶（20 分钟）

1. 在阿里云控制台，搜索 **"OSS"** 或 **"对象存储"**
2. 点击 **"对象存储 OSS"**
3. 点击 **"创建 Bucket"**（存储桶）
4. 填写信息：
   - **Bucket 名称**: `cosmetics-inspection-photos`（必须英文小写）
   - **地域**: 选择离你近的（如 `华东 1（杭州）`）
   - **读写权限**: 选择 **"公共读"**（重要！）
5. 点击 **"确定"**

**完成标志**: 看到存储桶列表里有 `cosmetics-inspection-photos`

---

### 步骤 9：获取阿里云 AccessKey（10 分钟）

1. 在阿里云控制台，点击右上角头像
2. 点击 **"AccessKey 管理"**
3. 点击 **"继续使用 AccessKey"**
4. 点击 **"创建新的 AccessKey"**
5. 复制 **AccessKey ID** 和 **AccessKey Secret**
   - **保存到记事本**（和 Supabase 信息放一起）

**完成标志**: 记事本里有 4 行内容：
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
AWS_ACCESS_KEY_ID=LTAIxxx
AWS_SECRET_ACCESS_KEY=xxx
```

---

### 第一天完成！✅

休息一下吧，明天继续代码迁移。

---

## 第二天：代码迁移 + 部署上线

### 步骤 10：安装 Git（如果已安装可跳过）（10 分钟）

**Windows**:
1. 访问：https://git-scm.com/download/win
2. 下载并安装，一路点 **"Next"**

**Mac**:
1. 打开终端（Terminal）
2. 输入 `git --version`
3. 如果提示安装，点击 **"安装"**

**验证**: 打开命令行，输入 `git --version`，显示版本号即成功

---

### 步骤 11：上传代码到 GitHub（20 分钟）

1. 在当前项目目录（`/workspace/projects`）打开终端
2. 依次输入以下命令（每行输入后按回车）：

```bash
# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交代码
git commit -m "初始提交：化妆品首件核对系统"

# 创建主分支
git branch -M main
```

3. 在浏览器打开 GitHub，点击右上角 **"+"** → **"New repository"**
4. 填写：
   - **Repository name**: `cosmetics-inspection`
   - 选择 **"Public"**
   - **不要勾选** "Add a README file"
5. 点击 **"Create repository"**
6. 复制页面显示的命令（类似）：
```bash
git remote add origin https://github.com/你的用户名/cosmetics-inspection.git
git push -u origin main
```
7. 在终端粘贴执行

**完成标志**: GitHub 仓库页面显示项目文件

---

### 步骤 12：连接 Vercel（10 分钟）

1. 打开 Vercel 仪表盘：https://vercel.com/dashboard
2. 点击 **"Add New..."** → **"Project"**
3. 找到 `cosmetics-inspection` 仓库，点击 **"Import"**
4. 在 **"Configure Project"** 页面：
   - **Framework Preset**: 选择 `Next.js`
   - 其他保持默认
5. 点击 **"Deploy"**
6. 等待 2-3 分钟

**完成标志**: 看到 **"Congratulations!"** 页面，有一个 `.vercel.app` 的网址

---

### 步骤 13：配置环境变量（15 分钟）

1. 在 Vercel 项目页面，点击 **"Settings"**
2. 点击左侧 **"Environment Variables"**
3. 依次添加以下变量（点击 **"Add"** 添加每一个）：

| Name | Value | 来源 |
|------|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 步骤 5 的 URL | 记事本 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 步骤 5 的 Key | 记事本 |
| `AWS_REGION` | `cn-hangzhou` 或你选的地域 | 步骤 8 |
| `AWS_ACCESS_KEY_ID` | 步骤 9 的 ID | 记事本 |
| `AWS_SECRET_ACCESS_KEY` | 步骤 9 的 Secret | 记事本 |
| `AWS_BUCKET_NAME` | `cosmetics-inspection-photos` | 步骤 8 |
| `JWT_SECRET` | `my-secret-key-12345` | 随便设置 |

4. 每个变量填完后点击 **"Save"**

**完成标志**: 环境变量列表里有 7 个变量

---

### 步骤 14：重新部署（5 分钟）

1. 在 Vercel 项目页面，点击 **"Deployments"**
2. 找到最新的部署，点击右侧 **"..."** → **"Redeploy"**
3. 等待 2-3 分钟

**完成标志**: 部署状态显示 **"Ready"**

---

### 步骤 15：测试系统（20 分钟）

1. 在 Vercel 项目页面，点击顶部的 **.vercel.app 网址**
2. 测试以下功能：
   - [ ] 能打开登录页面
   - [ ] 用 `admin` / `admin123` 能登录
   - [ ] 能看到仪表盘
   - [ ] 能创建检验记录
   - [ ] 能上传照片
   - [ ] 能提交审核

**完成标志**: 所有功能正常

---

### 步骤 16：绑定自定义域名（可选）（15 分钟）

1. 购买域名（如 `inspection.yourcompany.com`）
   - 阿里云、腾讯云都可以买，约 50 元/年
2. 在 Vercel 项目页面，点击 **"Settings"** → **"Domains"**
3. 输入你的域名，点击 **"Add"**
4. 按照提示配置 DNS 解析
5. 等待 10-30 分钟生效

**完成标志**: 用自定义域名能访问系统

---

## 迁移完成！

### 你现在拥有：
- ✅ 24 小时在线的系统
- ✅ 安全可靠的云数据库
- ✅ 永久保存的照片存储
- ✅ 自动部署的代码更新

### 以后更新代码：
1. 修改代码
2. 提交到 GitHub：`git add . && git commit -m "修改说明" && git push`
3. Vercel 自动部署（1-2 分钟）
4. 完成！

---

## 常见问题

### Q: 部署失败怎么办？
A: 在 Vercel 点击 **"Deployments"** → 找到失败的部署 → 点击 **"View Build Logs"** 查看错误信息

### Q: 数据库连不上？
A: 检查环境变量 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 是否正确

### Q: 照片上传失败？
A: 检查 OSS Bucket 权限是否为 **"公共读"**，AccessKey 是否正确

### Q: 想回滚到旧版本？
A: 在 Vercel **"Deployments"** 找到旧版本 → 点击 **"..."** → **"Rollback"**

---

## 需要帮助？

如果在任何步骤遇到问题，告诉我具体的步骤编号和错误信息，我会帮你解决。
