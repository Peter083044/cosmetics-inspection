# 化妆品首件核对系统 - 腾讯云版超详细迁移操作手册

> 本手册包含每一步的具体网址、按钮名称、填写内容，按照说明操作即可。
> 
> 📅 预计时间：1-2 小时
> 💰 费用：每月约 10-30 元（腾讯云 + Supabase 免费套餐）

---

## 目录

- [第一天：注册账号和创建资源](#第一天注册账号和创建资源)
  - [步骤 1：注册 GitHub 账号](#步骤-1注册-github-账号)
  - [步骤 2：注册 Vercel 账号](#步骤-2注册-vercel-账号)
  - [步骤 3：注册 Supabase 账号](#步骤-3注册-supabase-账号)
  - [步骤 4：创建 Supabase 数据库](#步骤-4创建-supabase-数据库)
  - [步骤 5：获取数据库连接信息](#步骤-5获取数据库连接信息)
  - [步骤 6：创建数据库表](#步骤-6创建数据库表)
  - [步骤 7：注册腾讯云账号](#步骤-7注册腾讯云账号)
  - [步骤 8：创建 COS 存储桶](#步骤-8创建-cos-存储桶)
  - [步骤 9：获取腾讯云密钥](#步骤-9获取腾讯云密钥)
- [第二天：部署系统](#第二天部署系统)
  - [步骤 10：上传代码到 GitHub](#步骤-10上传代码到-github)
  - [步骤 11：连接 Vercel 部署](#步骤-11连接-vercel-部署)
  - [步骤 12：配置环境变量](#步骤-12配置环境变量)
  - [步骤 13：重新部署](#步骤-13重新部署)
  - [步骤 14：测试系统](#步骤-14测试系统)

---

# 第一天：注册账号和创建资源

---

## 步骤 1：注册 GitHub 账号

### 1.1 打开注册页面

**🔗 点击这个链接**：[https://github.com/signup](https://github.com/signup)

### 1.2 填写邮箱

- 在 **"Enter your email"** 输入框中，输入你的邮箱（如 `peter@example.com`）
- 点击 **"Continue"** 按钮

### 1.3 设置密码

- 在 **"Create a password"** 输入框中，设置密码（至少 8 位，包含字母和数字）
- 点击 **"Continue"** 按钮

### 1.4 选择用户名

- 在 **"Choose a username"** 输入框中，输入用户名（如 `peter-chen-2026`）
- 点击 **"Continue"** 按钮
- 如果提示"用户名已存在"，换一个用户名

### 1.5 接收邮件

- 选择 **"Receive product updates and announcements"**（可选）
- 点击 **"Continue"** 按钮

### 1.6 验证邮箱

- 打开你的邮箱
- 找到来自 GitHub 的邮件（标题：Please verify your email）
- 点击邮件中的 **"Verify email address"** 按钮

### 1.7 完成

- 看到 GitHub 首页，右上角显示你的用户名
- ✅ **注册完成！**

---

## 步骤 2：注册 Vercel 账号

### 2.1 打开注册页面

**🔗 点击这个链接**：[https://vercel.com/signup](https://vercel.com/signup)

### 2.2 选择登录方式

- 点击 **"Continue with GitHub"** 按钮（蓝色，在页面中间）

### 2.3 授权 GitHub

- 如果弹出 GitHub 授权页面，点击 **"Authorize Vercel"** 按钮
- 如果已登录 GitHub，会自动跳转

### 2.4 填写信息

- **What's your name?**: 输入你的名字（如 `Peter`）
- 点击 **"Continue"** 按钮

### 2.5 选择用途

- 选择 **"Hobby"**（个人使用）
- 点击 **"Continue"** 按钮

### 2.6 完成

- 看到 Vercel 仪表盘页面，显示 **"Welcome to Vercel"**
- ✅ **注册完成！**

---

## 步骤 3：注册 Supabase 账号

### 3.1 打开注册页面

**🔗 点击这个链接**：[https://supabase.com/dashboard/sign-in](https://supabase.com/dashboard/sign-in)

### 3.2 选择登录方式

- 点击 **"Continue with GitHub"** 按钮（绿色，在页面中间）

### 3.3 授权 GitHub

- 如果弹出 GitHub 授权页面，点击 **"Authorize Supabase"** 按钮

### 3.4 完成

- 看到 Supabase 仪表盘页面
- ✅ **注册完成！**

---

## 步骤 4：创建 Supabase 数据库

### 4.1 打开项目创建页面

**🔗 点击这个链接**：[https://supabase.com/dashboard/projects/new](https://supabase.com/dashboard/projects/new)

### 4.2 填写项目信息

- **Name**: 输入 `cosmetics-inspection`
- **Database Password**: 输入密码（如 `MyDB@2026`）
  - ⚠️ **一定要记住这个密码！** 建议保存到记事本
- **Region**: 点击下拉框，选择 **"Southeast Asia (Singapore)"**（新加坡，离中国近）

### 4.3 创建项目

- 点击 **"Create new project"** 按钮（绿色，在页面底部）

### 4.4 等待创建

- 页面会显示进度条，等待 2-3 分钟
- 看到 **"Welcome to your new project"** 表示创建成功

### 4.5 完成

- 看到 Supabase 项目仪表盘
- ✅ **项目创建完成！**

---

## 步骤 5：获取数据库连接信息

### 5.1 打开项目设置

- 在 Supabase 项目页面，点击左侧菜单 **"Project Settings"**（齿轮图标 ⚙️）

### 5.2 打开 API 设置

- 在项目设置页面，点击 **"API"**（在左侧菜单）

### 5.3 复制 Project URL

- 找到 **"Project URL"** 部分
- 点击右侧的复制图标（两个小方块 📋）
- 打开记事本，粘贴保存

### 5.4 复制 anon public 密钥

- 找到 **"Project API keys"** 部分
- 找到 **"anon public"** 这一行
- 点击右侧的复制图标 📋
- 打开记事本，粘贴保存

### 5.5 完成

- 记事本里应该有 2 行内容：
```
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx...
```
- ✅ **信息获取完成！**

---

## 步骤 6：创建数据库表

### 6.1 打开 SQL 编辑器

- 在 Supabase 左侧菜单，点击 **"SQL Editor"**（图标像代码 💻）

### 6.2 新建查询

- 点击 **"New query"** 按钮（右上角，蓝色）

### 6.3 粘贴 SQL 代码

- 清空编辑器中的内容
- 复制以下所有代码，粘贴到编辑器中：

```sql
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
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
  action TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_assistant ON inspections(assistant_id);
CREATE INDEX IF NOT EXISTS idx_inspections_reviewer ON inspections(current_reviewer_id);
CREATE INDEX IF NOT EXISTS idx_approvals_inspection ON approvals(inspection_id);
```

### 6.4 运行 SQL

- 点击右下角 **"Run"** 按钮（绿色，或按 `Ctrl+Enter`）

### 6.5 查看结果

- 下方显示 **"Success. No rows returned"** 表示成功
- 如果有错误，检查是否复制完整

### 6.6 验证表创建

- 点击左侧菜单 **"Table Editor"**（图标像表格 📊）
- 应该看到 4 个表：`users`、`products`、`inspections`、`approvals`

### 6.7 完成

- ✅ **数据库表创建完成！**

---

## 步骤 7：注册腾讯云账号

### 7.1 打开注册页面

**🔗 点击这个链接**：[https://cloud.tencent.com/register](https://cloud.tencent.com/register)

### 7.2 选择注册方式

- 如果有微信/QQ 账号，点击 **"微信扫码登录"** 或 **"QQ登录"**（推荐，最快）
- 如果没有，点击 **"邮箱注册"** 或 **"手机号注册"**

### 7.3 填写信息（邮箱注册）

- **邮箱地址**: 输入你的邮箱
- **密码**: 设置密码（至少 8 位，包含字母和数字）
- **验证码**: 输入图片中的验证码
- 点击 **"同意协议并注册"**

### 7.4 验证邮箱

- 打开你的邮箱
- 找到来自腾讯云的邮件（标题：腾讯云账号激活）
- 点击邮件中的 **"立即激活"** 按钮

### 7.5 实名认证

- 登录后，点击页面顶部的 **"实名认证"**（或系统会弹窗提示）
- 选择 **"个人认证"**
- 输入姓名、身份证号
- 点击 **"提交"**
- 等待审核（通常 5 分钟）

### 7.6 完成

- 看到腾讯云控制台首页
- ✅ **注册完成！**

---

## 步骤 8：创建 COS 存储桶

### 8.1 打开 COS 控制台

**🔗 点击这个链接**：[https://console.cloud.tencent.com/cos/bucket](https://console.cloud.tencent.com/cos/bucket)

### 8.2 创建存储桶

- 点击 **"创建存储桶"** 按钮（左上角，蓝色）

### 8.3 填写存储桶信息

- **名称**: 输入 `cosmetics-inspection-photos`
  - ⚠️ 必须全部小写，不能有空格，不能有中文
- **地域**: 点击下拉框，选择 **"上海"**（或离你近的）
- **访问权限**: 点击 **"公有读私有写"**（重要！）
- 其他保持默认

### 8.4 确认创建

- 点击 **"创建"** 按钮（底部）

### 8.5 完成

- 看到存储桶列表里有 `cosmetics-inspection-photos`
- ✅ **存储桶创建完成！**

---

## 步骤 9：获取腾讯云密钥

### 9.1 打开密钥管理页面

**🔗 点击这个链接**：[https://console.cloud.tencent.com/cam/capi](https://console.cloud.tencent.com/cam/capi)

### 9.2 新建密钥

- 点击 **"新建密钥"** 按钮（左上角，蓝色）

### 9.3 验证身份

- 可能需要手机验证码，输入验证码
- 点击 **"确定"**

### 9.4 复制密钥

- 弹出窗口显示 **SecretId** 和 **SecretKey**
- 点击 **"复制"** 按钮，分别复制这两个值
- 保存到记事本（和 Supabase 信息放一起）

### 9.5 完成

- 记事本里应该有 4 行内容：
```
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx...
AWS_ACCESS_KEY_ID=AKIDxxxxxxxxxxxxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
- ✅ **密钥获取完成！**

---

# 第二天：部署系统

---

## 步骤 10：上传代码到 GitHub

### 10.1 打开终端

- 在当前项目目录（`/workspace/projects`）打开终端
- 如果是 Windows，右键点击文件夹 → **"在此处打开 PowerShell"**
- 如果是 Mac，打开终端，输入 `cd /workspace/projects`

### 10.2 初始化 Git

- 输入以下命令，按回车：
```bash
git init
```

### 10.3 添加文件

- 输入以下命令，按回车：
```bash
git add .
```

### 10.4 提交代码

- 输入以下命令，按回车：
```bash
git commit -m "初始提交"
```

### 10.5 创建 GitHub 仓库

**🔗 点击这个链接**：[https://github.com/new](https://github.com/new)

- **Repository name**: 输入 `cosmetics-inspection`
- 选择 **"Public"**（公开）
- **不要勾选** "Add a README file"
- 点击 **"Create repository"** 按钮（底部，绿色）

### 10.6 复制推送命令

- 在创建的仓库页面，找到 **"...or push an existing repository from the command line"**
- 复制下面的命令（类似）：
```bash
git remote add origin https://github.com/你的用户名/cosmetics-inspection.git
git branch -M main
git push -u origin main
```

### 10.7 推送代码

- 在终端粘贴刚才复制的命令，按回车
- 如果弹出登录框，输入 GitHub 用户名和密码

### 10.8 完成

- GitHub 仓库页面显示项目文件
- ✅ **代码上传完成！**

---

## 步骤 11：连接 Vercel 部署

### 11.1 打开 Vercel 导入页面

**🔗 点击这个链接**：[https://vercel.com/new](https://vercel.com/new)

### 11.2 选择仓库

- 找到 `cosmetics-inspection` 仓库
- 点击 **"Import"** 按钮（右侧）

### 11.3 配置项目

- **Framework Preset**: 点击下拉框，选择 **"Next.js"**
- 其他保持默认

### 11.4 部署

- 点击 **"Deploy"** 按钮（底部，蓝色）

### 11.5 等待部署

- 页面显示部署进度，等待 2-3 分钟

### 11.6 完成

- 看到 **"Congratulations!"** 页面
- 有一个 `.vercel.app` 的网址
- ✅ **部署完成！**

---

## 步骤 12：配置环境变量

### 12.1 打开环境变量设置

- 在 Vercel 项目页面，点击 **"Settings"**（顶部菜单）
- 点击左侧 **"Environment Variables"**

### 12.2 添加第一个变量

- 点击 **"Add"** 按钮
- **Name**: 输入 `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: 粘贴步骤 5 的 Project URL
- **Environment**: 选择 **"Production"**
- 点击 **"Save"** 按钮

### 12.3 添加第二个变量

- 点击 **"Add"** 按钮
- **Name**: 输入 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: 粘贴步骤 5 的 anon public 密钥
- **Environment**: 选择 **"Production"**
- 点击 **"Save"** 按钮

### 12.4 添加第三个变量

- 点击 **"Add"** 按钮
- **Name**: 输入 `AWS_REGION`
- **Value**: 输入 `ap-shanghai`（或你选的地域）
- **Environment**: 选择 **"Production"**
- 点击 **"Save"** 按钮

### 12.5 添加第四个变量

- 点击 **"Add"** 按钮
- **Name**: 输入 `AWS_ACCESS_KEY_ID`
- **Value**: 粘贴步骤 9 的 SecretId
- **Environment**: 选择 **"Production"**
- 点击 **"Save"** 按钮

### 12.6 添加第五个变量

- 点击 **"Add"** 按钮
- **Name**: 输入 `AWS_SECRET_ACCESS_KEY`
- **Value**: 粘贴步骤 9 的 SecretKey
- **Environment**: 选择 **"Production"**
- 点击 **"Save"** 按钮

### 12.7 添加第六个变量

- 点击 **"Add"** 按钮
- **Name**: 输入 `AWS_BUCKET_NAME`
- **Value**: 输入 `cosmetics-inspection-photos`
- **Environment**: 选择 **"Production"**
- 点击 **"Save"** 按钮

### 12.8 添加第七个变量

- 点击 **"Add"** 按钮
- **Name**: 输入 `JWT_SECRET`
- **Value**: 输入 `my-secret-key-12345`
- **Environment**: 选择 **"Production"**
- 点击 **"Save"** 按钮

### 12.9 完成

- 环境变量列表里有 7 个变量
- ✅ **配置完成！**

---

## 步骤 13：重新部署

### 13.1 打开部署页面

- 在 Vercel 项目页面，点击 **"Deployments"**（顶部菜单）

### 13.2 重新部署

- 找到最新的部署（第一个）
- 点击右侧 **"..."** 按钮
- 点击 **"Redeploy"**

### 13.3 等待部署

- 等待 2-3 分钟

### 13.4 完成

- 部署状态显示 **"Ready"**
- ✅ **重新部署完成！**

---

## 步骤 14：测试系统

### 14.1 打开系统

- 在 Vercel 项目页面，点击顶部的 **.vercel.app 网址**

### 14.2 测试登录

- 用户名：`admin`
- 密码：`admin123`
- 点击 **"登录"** 按钮

### 14.3 测试功能

- [ ] 能看到仪表盘
- [ ] 能创建检验记录
- [ ] 能上传照片
- [ ] 能提交审核

### 14.4 完成

- 所有功能正常
- ✅ **测试完成！**

---

# 迁移完成！

你现在拥有：
- ✅ 24 小时在线的系统
- ✅ 安全可靠的云数据库
- ✅ 永久保存的照片存储
- ✅ 自动部署的代码更新

---

## 常见问题

### Q1: 为什么选择腾讯云？
- 国内访问速度快
- 中文界面，操作简单
- 支持微信/QQ 登录，注册方便

### Q2: 费用是多少？
- **Supabase**: 免费（每月 500MB 数据库 + 1GB 存储）
- **腾讯云 COS**: 约 0.1 元/GB/月（10GB 约 1 元/月）
- **Vercel**: 免费（个人使用）
- **总计**: 每月约 10-30 元

### Q3: 系统更新怎么办？
- 修改代码后，提交到 GitHub
- Vercel 会自动重新部署
- 无需手动操作

### Q4: 数据备份怎么做？
- Supabase 每天自动备份
- 可以定期导出 CSV 和照片
- 建议每月备份一次

### Q5: 遇到问题怎么办？
- 检查环境变量是否配置正确
- 查看 Vercel 部署日志
- 联系技术支持

---

## 快速链接汇总

| 服务 | 链接 | 用途 |
|------|------|------|
| GitHub | https://github.com | 代码托管 |
| Vercel | https://vercel.com | 系统部署 |
| Supabase | https://supabase.com | 数据库 |
| 腾讯云 | https://cloud.tencent.com | 照片存储 |

---

**祝你迁移顺利！** 🎉
