# 化妆品首件核对系统 - 超详细迁移操作手册

> 本手册包含每一步的具体网址、按钮名称、填写内容，按照说明操作即可。

---

## 第一步：注册 GitHub 账号

### 1.1 打开注册页面
**点击这个链接**：https://github.com/signup

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
- **注册完成！**

---

## 第二步：注册 Vercel 账号

### 2.1 打开注册页面
**点击这个链接**：https://vercel.com/signup

### 2.2 选择登录方式
- 点击 **"Continue with GitHub"** 按钮

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
- **注册完成！**

---

## 第三步：注册 Supabase 账号

### 3.1 打开注册页面
**点击这个链接**：https://supabase.com/dashboard/sign-in

### 3.2 选择登录方式
- 点击 **"Continue with GitHub"** 按钮

### 3.3 授权 GitHub
- 如果弹出 GitHub 授权页面，点击 **"Authorize Supabase"** 按钮

### 3.4 完成
- 看到 Supabase 仪表盘页面
- **注册完成！**

---

## 第四步：创建 Supabase 数据库项目

### 4.1 打开项目创建页面
**点击这个链接**：https://supabase.com/dashboard/projects/new

### 4.2 填写项目信息
- **Name**: 输入 `cosmetics-inspection`
- **Database Password**: 输入密码（如 `MyDB@2026`）
  - ⚠️ **一定要记住这个密码！** 建议保存到记事本
- **Region**: 点击下拉框，选择 **"Southeast Asia (Singapore)"**

### 4.3 创建项目
- 点击 **"Create new project"** 按钮（绿色，在页面底部）

### 4.4 等待创建
- 页面会显示进度条，等待 2-3 分钟
- 看到 **"Welcome to your new project"** 表示创建成功

### 4.5 完成
- 看到 Supabase 项目仪表盘
- **项目创建完成！**

---

## 第五步：获取 Supabase 连接信息

### 5.1 打开项目设置
- 在 Supabase 项目页面，点击左侧菜单 **"Project Settings"**（齿轮图标）

### 5.2 打开 API 设置
- 在项目设置页面，点击 **"API"**

### 5.3 复制 Project URL
- 找到 **"Project URL"** 部分
- 点击右侧的复制图标（两个小方块）
- 打开记事本，粘贴保存

### 5.4 复制 anon public 密钥
- 找到 **"Project API keys"** 部分
- 找到 **"anon public"** 这一行
- 点击右侧的复制图标
- 打开记事本，粘贴保存

### 5.5 完成
- 记事本里应该有 2 行内容：
```
https://xxxxxxxxxxxxx.supabase.co
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx...
```
- **信息获取完成！**

---

## 第六步：创建数据库表

### 6.1 打开 SQL 编辑器
- 在 Supabase 左侧菜单，点击 **"SQL Editor"**（图标像代码）

### 6.2 新建查询
- 点击 **"New query"** 按钮（右上角）

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
- 点击右下角 **"Run"** 按钮（或按 `Ctrl+Enter`）

### 6.5 查看结果
- 下方显示 **"Success. No rows returned"** 表示成功
- 如果有错误，检查是否复制完整

### 6.6 验证表创建
- 点击左侧菜单 **"Table Editor"**（图标像表格）
- 应该看到 4 个表：`users`、`products`、`inspections`、`approvals`

### 6.7 完成
- **数据库表创建完成！**

---

## 第七步：注册阿里云账号

### 7.1 打开注册页面
**点击这个链接**：https://account.aliyun.com/register/register.htm

### 7.2 选择注册方式
- 如果有支付宝/淘宝账号，点击 **"支付宝登录"** 或 **"淘宝登录"**
- 如果没有，点击 **"邮箱注册"** 或 **"手机号注册"**

### 7.3 填写信息
- 按照页面提示填写邮箱/手机号、密码等
- 点击 **"同意协议并注册"**

### 7.4 实名认证
- 登录后，点击页面顶部的 **"实名认证"**
- 选择 **"个人实名认证"**
- 输入姓名、身份证号
- 点击 **"提交"**
- 等待审核（通常 5 分钟）

### 7.5 完成
- 看到阿里云控制台首页
- **注册完成！**

---

## 第八步：创建 OSS 存储桶

### 8.1 打开 OSS 控制台
**点击这个链接**：https://oss.console.aliyun.com/bucket

### 8.2 创建 Bucket
- 点击 **"创建 Bucket"** 按钮（右上角，蓝色）

### 8.3 填写 Bucket 信息
- **Bucket 名称**: 输入 `cosmetics-inspection-photos`
  - ⚠️ 必须全部小写，不能有空格
- **地域**: 点击下拉框，选择 **"华东 1（杭州）"**（或离你近的）
- **读写权限**: 点击 **"公共读"**（重要！）
- 其他保持默认

### 8.4 确认创建
- 点击 **"确定"** 按钮（底部）

### 8.5 完成
- 看到存储桶列表里有 `cosmetics-inspection-photos`
- **存储桶创建完成！**

---

## 第九步：获取阿里云 AccessKey

### 9.1 打开 AccessKey 管理页面
**点击这个链接**：https://ram.console.aliyun.com/manage/ak

### 9.2 继续使用 AccessKey
- 如果弹出提示框，点击 **"继续使用 AccessKey"**

### 9.3 创建新的 AccessKey
- 点击 **"创建新的 AccessKey"** 按钮（右上角）

### 9.4 验证身份
- 可能需要手机验证码，输入验证码

### 9.5 复制 AccessKey
- 弹出窗口显示 **AccessKey ID** 和 **AccessKey Secret**
- 点击 **"复制"** 按钮，分别复制这两个值
- 保存到记事本（和 Supabase 信息放一起）

### 9.6 完成
- 记事本里应该有 4 行内容：
```
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx...
AWS_ACCESS_KEY_ID=LTAIxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
```
- **AccessKey 获取完成！**

---

## 第十步：上传代码到 GitHub

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
**点击这个链接**：https://github.com/new

- **Repository name**: 输入 `cosmetics-inspection`
- 选择 **"Public"**
- **不要勾选** "Add a README file"
- 点击 **"Create repository"** 按钮（底部）

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
- **代码上传完成！**

---

## 第十一步：连接 Vercel

### 11.1 打开 Vercel 导入页面
**点击这个链接**：https://vercel.com/new

### 11.2 选择仓库
- 找到 `cosmetics-inspection` 仓库
- 点击 **"Import"** 按钮

### 11.3 配置项目
- **Framework Preset**: 点击下拉框，选择 **"Next.js"**
- 其他保持默认

### 11.4 部署
- 点击 **"Deploy"** 按钮（底部）

### 11.5 等待部署
- 页面显示部署进度，等待 2-3 分钟

### 11.6 完成
- 看到 **"Congratulations!"** 页面
- 有一个 `.vercel.app` 的网址
- **部署完成！**

---

## 第十二步：配置环境变量

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
- **Value**: 输入 `cn-hangzhou`（或你选的地域）
- **Environment**: 选择 **"Production"**
- 点击 **"Save"** 按钮

### 12.5 添加第四个变量
- 点击 **"Add"** 按钮
- **Name**: 输入 `AWS_ACCESS_KEY_ID`
- **Value**: 粘贴步骤 9 的 AccessKey ID
- **Environment**: 选择 **"Production"**
- 点击 **"Save"** 按钮

### 12.6 添加第五个变量
- 点击 **"Add"** 按钮
- **Name**: 输入 `AWS_SECRET_ACCESS_KEY`
- **Value**: 粘贴步骤 9 的 AccessKey Secret
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
- **配置完成！**

---

## 第十三步：重新部署

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
- **重新部署完成！**

---

## 第十四步：测试系统

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
- **测试完成！**

---

## 迁移完成！

你现在拥有：
- ✅ 24 小时在线的系统
- ✅ 安全可靠的云数据库
- ✅ 永久保存的照片存储
- ✅ 自动部署的代码更新

---

## 以后更新代码

1. 修改代码
2. 在终端输入：
```bash
git add .
git commit -m "修改说明"
git push
```
3. Vercel 自动部署（1-2 分钟）
4. 完成！

---

## 需要帮助？

如果在任何步骤遇到问题，告诉我：
1. 你在第几步
2. 看到了什么错误信息
3. 截图（如果可能）

我会帮你解决！
