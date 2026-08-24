# 化妆品首件核对系统 - 腾讯云版超详细迁移操作手册

> 本手册包含每一步的具体网址、按钮名称、填写内容，按照说明操作即可。
> 
> 📅 预计时间：1-2 小时
> 💰 费用：每月约 10-30 元（腾讯云 + Supabase 免费套餐）

---

## 目录

- [第一天：注册账号和创建资源](#第一天注册账号和创建资源)
  - [步骤 1：登录 GitHub](#步骤-1登录-github)
  - [步骤 2：注册 Vercel 账号](#步骤-2注册-vercel-账号)
  - [步骤 3：注册 Supabase 账号](#步骤-3注册-supabase-账号)
  - [步骤 4：创建 Supabase 数据库](#步骤-4创建-supabase-数据库)
  - [步骤 5：获取数据库连接信息](#步骤-5获取数据库连接信息)
  - [步骤 6：创建数据库表](#步骤-6创建数据库表)
  - [步骤 7：登录腾讯云](#步骤-7登录腾讯云)
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

## 步骤 1：登录 GitHub

> ✅ 你已有 GitHub 账号，直接登录即可

### 1.1 打开登录页面

**🔗 点击这个链接**：[https://github.com/login](https://github.com/login)

### 1.2 登录

- **Username or email address**: 输入你的用户名或邮箱
- **Password**: 输入你的密码
- 点击 **"Sign in"** 按钮（绿色）

### 1.3 完成

- 看到 GitHub 首页，右上角显示你的用户名
- ✅ **登录成功！**

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

### 5.1 进入 Supabase 项目

1. 打开 [https://supabase.com/dashboard/](https://supabase.com/dashboard/)
2. 你会看到项目列表页面
3. 点击你刚创建的 **cosmetics-inspection** 项目（蓝色卡片）

### 5.2 打开项目设置

1. 进入项目后，看**左侧菜单栏**
2. 向下滚动，找到 **"Project Settings"**（齿轮图标 ⚙️）
3. 点击 **"Project Settings"**

### 5.3 进入 API 设置页面

1. 进入设置页面后，看**左侧子菜单**
2. 点击 **"API"**（在 "CONFIGURATION" 分类下）
3. 页面会显示项目的 API 配置信息

### 5.4 复制 Project URL

1. 在 API 页面，找到 **"Project URL"** 部分（在页面顶部）
2. 你会看到类似这样的内容：
   ```
   Project URL
   https://abcdefg.supabase.co
   ```
3. 点击右侧的 **复制图标** 📋（两个小方块的图标）
4. 打开记事本，按 `Ctrl+V` 粘贴保存

### 5.5 复制 anon public 密钥

1. 继续向下滚动页面
2. 找到 **"Project API keys"** 部分
3. 你会看到两行密钥：
   - **anon public**（公开的，用于前端）
   - **service_role**（私密的，用于后端）
4. 找到 **anon public** 这一行
5. 点击右侧的 **复制图标** 📋
6. 打开记事本，按 `Ctrl+V` 粘贴保存（在 Project URL 下面一行）

### 5.6 完成

- 记事本里应该有 2 行内容：
```
SUPABASE_URL=https://abcdefg.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx...
```
- ✅ **信息获取完成！**

> 💡 **提示**：这两个信息非常重要，后面配置环境变量时需要用到

---

## 步骤 6：创建数据库表

### 6.1 打开 SQL 编辑器

1. 回到 Supabase 项目页面（如果不在项目页面，打开 [https://supabase.com/dashboard/](https://supabase.com/dashboard/) 并点击你的项目）
2. 看**左侧菜单栏**
3. 找到 **"SQL Editor"**（图标像代码 💻，在 "DEVELOPMENT" 分类下）
4. 点击 **"SQL Editor"**

### 6.2 新建查询

1. 进入 SQL Editor 页面后，看**右上角**
2. 点击 **"New query"** 按钮（蓝色按钮）
3. 页面会打开一个空白的 SQL 编辑器

### 6.3 粘贴 SQL 代码

1. 清空编辑器中的内容（如果有的话）
2. 复制以下所有代码：

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

3. 在编辑器中按 `Ctrl+V` 粘贴代码
4. 你会看到代码出现在编辑器中，有语法高亮显示

### 6.4 运行 SQL

1. 看编辑器的**右下角**
2. 点击 **"Run"** 按钮（绿色按钮，或按 `Ctrl+Enter`）
3. 等待几秒钟执行

### 6.5 查看结果

1. 执行完成后，看编辑器**下方**
2. 如果成功，会显示 **"Success. No rows returned"**（绿色提示）
3. 如果有错误，会显示红色错误信息，检查是否复制完整

### 6.6 验证表创建

1. 看**左侧菜单栏**
2. 找到 **"Table Editor"**（图标像表格 📊，在 "DEVELOPMENT" 分类下）
3. 点击 **"Table Editor"**
4. 你应该看到 4 个表：
   - `users`
   - `products`
   - `inspections`
   - `approvals`

### 6.7 完成

- ✅ **数据库表创建完成！**

> 💡 **提示**：如果看不到表，刷新页面再试

---

## 步骤 7：登录腾讯云

> ✅ 你已有腾讯云账号，直接登录即可

### 7.1 打开登录页面

**🔗 点击这个链接**：[https://cloud.tencent.com/login](https://cloud.tencent.com/login)

### 7.2 选择登录方式

- 如果有微信，点击 **"微信扫码登录"**（推荐）
- 如果有 QQ，点击 **"QQ登录"**
- 或者使用账号密码登录

### 7.3 完成实名认证（如未完成）

- 登录后，如果提示需要实名认证
- 点击页面顶部的 **"实名认证"**
- 选择 **"个人认证"**
- 输入姓名、身份证号
- 点击 **"提交"**
- 等待审核（通常 5 分钟）

### 7.4 完成

- 看到腾讯云控制台首页
- ✅ **登录成功！**

---

## 步骤 8：创建 COS 存储桶

### 8.1 打开 COS 控制台

**🔗 点击这个链接**：[https://console.cloud.tencent.com/cos/bucket](https://console.cloud.tencent.com/cos/bucket)

或者手动操作：
1. 打开 [https://console.cloud.tencent.com/](https://console.cloud.tencent.com/)
2. 在顶部搜索框输入 **"对象存储"**
3. 点击搜索结果中的 **"对象存储"**

### 8.2 创建存储桶

1. 进入对象存储控制台后，看**左侧菜单**
2. 点击 **"存储桶列表"**
3. 看页面**左上方**
4. 点击 **"创建存储桶"** 按钮（蓝色按钮）

### 8.3 填写存储桶信息

1. 弹出创建存储桶的窗口
2. **名称**：输入 `cosmetics-inspection-photos`
   - ⚠️ 必须全部小写，不能有空格，不能有中文
   - ⚠️ 如果提示名称已存在，换一个名称（如 `cosmetics-photos-2026`）
3. **地域**：点击下拉框，选择 **"上海"**（或离你近的城市）
4. **访问权限**：找到这一项，点击 **"公有读私有写"**
   - ⚠️ 这个很重要！选择错误会导致照片无法访问
5. 其他选项保持默认

### 8.4 确认创建

1. 向下滚动窗口
2. 点击 **"创建"** 按钮（在窗口底部）
3. 等待几秒钟

### 8.5 完成

1. 窗口关闭
2. 回到存储桶列表页面
3. 你应该能看到 `cosmetics-inspection-photos` 在列表中
4. ✅ **存储桶创建完成！**

> 💡 **提示**：记住你选择的地域，后面配置环境变量时需要用到

---

## 步骤 9：获取腾讯云密钥

### 9.1 打开密钥管理页面

**🔗 点击这个链接**：[https://console.cloud.tencent.com/cam/capi](https://console.cloud.tencent.com/cam/capi)

或者手动操作：
1. 打开 [https://console.cloud.tencent.com/](https://console.cloud.tencent.com/)
2. 点击右上角你的**头像**
3. 点击 **"访问管理"**
4. 在左侧菜单，点击 **"API 密钥管理"**

### 9.2 新建密钥

1. 进入 API 密钥管理页面
2. 看页面**左上方**
3. 点击 **"新建密钥"** 按钮（蓝色按钮）

### 9.3 验证身份

1. 弹出验证窗口
2. 可能需要手机验证码
3. 输入收到的验证码
4. 点击 **"确定"**

### 9.4 复制密钥

1. 弹出窗口显示密钥信息：
   - **SecretId**：类似 `AKIDxxxxxxxxxxxxxxxxxxxxxxxx`
   - **SecretKey**：类似 `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
2. 点击 **SecretId** 右侧的 **"复制"** 按钮
3. 打开记事本，粘贴保存
4. 点击 **SecretKey** 右侧的 **"复制"** 按钮
5. 在记事本中换行，粘贴保存

### 9.5 完成

- 记事本里应该有 4 行内容：
```
SUPABASE_URL=https://abcdefg.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx...
AWS_ACCESS_KEY_ID=AKIDxxxxxxxxxxxxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
- ✅ **密钥获取完成！**

> ⚠️ **重要提示**：
> - SecretKey 只显示一次，关闭后无法再查看
> - 如果忘记了，只能删除重新创建
> - 妥善保管，不要泄露给他人

---

# 第二天：部署系统

---

## 步骤 10：上传代码到 GitHub

### 10.1 打开终端

**Windows 系统**：
1. 打开文件资源管理器
2. 找到项目文件夹（`/workspace/projects`）
3. 在文件夹空白处，按住 `Shift` 键 + 右键点击
4. 选择 **"在此处打开 PowerShell 窗口"** 或 **"在终端中打开"**

**Mac 系统**：
1. 打开终端应用
2. 输入以下命令，按回车：
```bash
cd /workspace/projects
```

### 10.2 初始化 Git

1. 在终端输入以下命令，按回车：
```bash
git init
```
2. 等待命令执行完成
3. 会显示 "Initialized empty Git repository in..."

### 10.3 添加文件

1. 在终端输入以下命令，按回车：
```bash
git add .
```
2. 等待命令执行完成（可能需要几秒钟）
3. 没有错误提示就是成功

### 10.4 提交代码

1. 在终端输入以下命令，按回车：
```bash
git commit -m "初始提交"
```
2. 等待命令执行完成
3. 会显示 "X files changed, X insertions(+)"

### 10.5 创建 GitHub 仓库

**🔗 点击这个链接**：[https://github.com/new](https://github.com/new)

或者手动操作：
1. 打开 [https://github.com](https://github.com)
2. 点击右上角你的**头像**
3. 点击 **"Your repositories"**
4. 点击右上角 **"New"** 按钮（绿色）

填写仓库信息：
1. **Repository name**：输入 `cosmetics-inspection`
2. **Description**：可以留空，或输入 "化妆品首件核对系统"
3. 选择 **"Public"**（公开，单选按钮）
4. ⚠️ **不要勾选** "Add a README file"
5. ⚠️ **不要勾选** "Add .gitignore"
6. ⚠️ **不要勾选** "Choose a license"
7. 向下滚动
8. 点击 **"Create repository"** 按钮（绿色，在页面底部）

### 10.6 复制推送命令

1. 创建成功后，会显示仓库页面
2. 向下滚动，找到 **"...or push an existing repository from the command line"**
3. 复制下面的 3 行命令：
```bash
git remote add origin https://github.com/你的用户名/cosmetics-inspection.git
git branch -M main
git push -u origin main
```

### 10.7 推送代码

1. 回到终端
2. 粘贴刚才复制的 3 行命令
3. 按回车执行
4. 如果弹出登录框：
   - 选择 **"Sign in with GitHub"**
   - 在浏览器中登录 GitHub
   - 授权终端访问
5. 等待上传完成（可能需要几分钟）

### 10.8 完成

1. 回到 GitHub 仓库页面
2. 按 `F5` 刷新页面
3. 你应该能看到项目文件列表
4. ✅ **代码上传完成！**

> 💡 **提示**：如果上传失败，检查网络连接，或重新执行推送命令

---

## 步骤 11：连接 Vercel 部署

### 11.1 打开 Vercel 导入页面

**🔗 点击这个链接**：[https://vercel.com/new](https://vercel.com/new)

或者手动操作：
1. 打开 [https://vercel.com](https://vercel.com)
2. 点击右上角 **"Log In"**
3. 点击 **"Continue with GitHub"**
4. 授权登录

### 11.2 选择仓库

1. 进入导入页面后，你会看到你的 GitHub 仓库列表
2. 找到 **cosmetics-inspection** 仓库
3. 点击仓库右侧的 **"Import"** 按钮（蓝色）

> 💡 **提示**：如果看不到仓库，点击 **"Adjust GitHub App Permissions"** 授权访问

### 11.3 配置项目

1. 进入配置页面
2. **Framework Preset**：点击下拉框，选择 **"Next.js"**
   - 通常会自动识别，如果没有，手动选择
3. **Build and Output Settings**：保持默认
4. **Environment Variables**：先跳过，下一步再配置

### 11.4 部署

1. 向下滚动页面
2. 点击 **"Deploy"** 按钮（蓝色，在页面底部）
3. 等待部署（2-3 分钟）

### 11.5 等待部署

1. 页面会显示部署进度
2. 你会看到：
   - "Building"（构建中）
   - "Deploying"（部署中）
   - "Ready"（准备就绪）
3. 等待状态变为 **"Ready"**

### 11.6 完成

1. 部署成功后，会显示 **"Congratulations!"** 页面
2. 你会看到一个网址，类似：
   ```
   https://cosmetics-inspection-xxxx.vercel.app
   ```
3. 点击这个网址可以访问系统
4. ✅ **部署完成！**

> 💡 **提示**：第一次访问可能需要等待几秒钟加载

---

## 步骤 12：配置环境变量

### 12.1 打开环境变量设置

1. 在 Vercel 项目页面（部署成功后自动跳转）
2. 如果没有在项目页面，打开 [https://vercel.com/dashboard](https://vercel.com/dashboard) 并点击你的项目
3. 看页面**顶部菜单**
4. 点击 **"Settings"**（设置）
5. 看**左侧菜单**
6. 点击 **"Environment Variables"**（环境变量）

### 12.2 添加第一个变量（Supabase URL）

1. 在环境变量页面，找到 **"Environment Variables"** 部分
2. 点击 **"Add"** 按钮（右侧）
3. 填写信息：
   - **Name**：输入 `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**：粘贴步骤 5 保存的 Project URL（如 `https://abcdefg.supabase.co`）
   - **Environment**：勾选 **"Production"**（生产环境）
4. 点击 **"Save"** 按钮

### 12.3 添加第二个变量（Supabase Key）

1. 点击 **"Add"** 按钮
2. 填写信息：
   - **Name**：输入 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**：粘贴步骤 5 保存的 anon public 密钥
   - **Environment**：勾选 **"Production"**
3. 点击 **"Save"** 按钮

### 12.4 添加第三个变量（地域）

1. 点击 **"Add"** 按钮
2. 填写信息：
   - **Name**：输入 `AWS_REGION`
   - **Value**：输入 `ap-shanghai`（如果你在步骤 8 选择了上海）
     - 如果选择了其他地域，对应修改：
       - 北京：`ap-beijing`
       - 广州：`ap-guangzhou`
       - 成都：`ap-chengdu`
   - **Environment**：勾选 **"Production"**
3. 点击 **"Save"** 按钮

### 12.5 添加第四个变量（腾讯云 SecretId）

1. 点击 **"Add"** 按钮
2. 填写信息：
   - **Name**：输入 `AWS_ACCESS_KEY_ID`
   - **Value**：粘贴步骤 9 保存的 SecretId（如 `AKIDxxxxxxxxxx`）
   - **Environment**：勾选 **"Production"**
3. 点击 **"Save"** 按钮

### 12.6 添加第五个变量（腾讯云 SecretKey）

1. 点击 **"Add"** 按钮
2. 填写信息：
   - **Name**：输入 `AWS_SECRET_ACCESS_KEY`
   - **Value**：粘贴步骤 9 保存的 SecretKey
   - **Environment**：勾选 **"Production"**
3. 点击 **"Save"** 按钮

### 12.7 添加第六个变量（存储桶名称）

1. 点击 **"Add"** 按钮
2. 填写信息：
   - **Name**：输入 `AWS_BUCKET_NAME`
   - **Value**：输入 `cosmetics-inspection-photos`（你在步骤 8 创建的存储桶名称）
   - **Environment**：勾选 **"Production"**
3. 点击 **"Save"** 按钮

### 12.8 添加第七个变量（JWT 密钥）

1. 点击 **"Add"** 按钮
2. 填写信息：
   - **Name**：输入 `JWT_SECRET`
   - **Value**：输入 `my-secret-key-12345`（或你自己设置的密钥）
   - **Environment**：勾选 **"Production"**
3. 点击 **"Save"** 按钮

### 12.9 完成

1. 环境变量列表里应该有 7 个变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `AWS_REGION`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_BUCKET_NAME`
   - `JWT_SECRET`
2. ✅ **配置完成！**

> ⚠️ **重要提示**：
> - 所有变量都必须勾选 "Production"
> - 变量名必须完全正确（区分大小写）
> - Value 不能有空格或换行

---

## 步骤 13：重新部署

> ⚠️ **重要**：配置环境变量后，必须重新部署才能生效

### 13.1 打开部署页面

1. 在 Vercel 项目页面
2. 看页面**顶部菜单**
3. 点击 **"Deployments"**（部署）

### 13.2 重新部署

1. 在部署列表页面，找到最新的部署（第一个，状态为 "Ready"）
2. 看这一行的**最右侧**
3. 点击 **"..."** 按钮（三个点）
4. 在弹出菜单中，点击 **"Redeploy"**（重新部署）

### 13.3 等待部署

1. 页面会显示新的部署进度
2. 等待 2-3 分钟
3. 状态会从 "Building" → "Deploying" → "Ready"

### 13.4 完成

1. 部署状态显示 **"Ready"**（绿色）
2. ✅ **重新部署完成！**

> 💡 **提示**：重新部署后，环境变量才会生效，系统才能正常连接数据库和存储

---

## 步骤 14：测试系统

### 14.1 打开系统

1. 在 Vercel 项目页面
2. 看页面**顶部**
3. 找到你的系统网址（类似 `https://cosmetics-inspection-xxxx.vercel.app`）
4. 点击这个网址
5. 或者复制链接，在浏览器新标签页打开

### 14.2 测试登录

1. 系统会显示登录页面
2. 在登录表单中输入：
   - **用户名**：`admin`
   - **密码**：`admin123`
3. 点击 **"登录"** 按钮
4. 如果登录成功，会跳转到仪表盘页面

> ⚠️ **如果登录失败**：
> - 检查环境变量是否配置正确
> - 检查 Supabase 数据库表是否创建成功
> - 查看 Vercel 部署日志排查错误

### 14.3 测试功能

逐项测试以下功能：

#### ✅ 测试 1：查看仪表盘
- [ ] 能看到统计图表
- [ ] 能看到检验记录列表

#### ✅ 测试 2：创建检验记录
- [ ] 点击 **"新建检验"** 按钮
- [ ] 填写基本信息（产品名称、代码、色号、批号）
- [ ] 上传照片（标样和首件）
- [ ] 点击 **"保存"**
- [ ] 检查照片是否上传成功（能正常显示）

#### ✅ 测试 3：提交审核
- [ ] 在详情页点击 **"提交审核"**
- [ ] 选择审核人
- [ ] 确认提交
- [ ] 检查状态是否变为 "待审核"

#### ✅ 测试 4：数据导出
- [ ] 在仪表盘点击 **"导出 CSV"**
- [ ] 检查下载的文件是否正常

### 14.4 完成

- 所有功能正常
- ✅ **测试完成！**
- ✅ **迁移成功！**

> 🎉 **恭喜你！系统已经成功迁移到云端！**
> 
> 现在你可以：
> - 24 小时访问系统
> - 多人同时使用
> - 数据永久保存
> - 自动备份

---

## 测试失败怎么办？

### 问题 1：登录失败
**可能原因**：环境变量配置错误
**解决方法**：
1. 回到 Vercel，检查 7 个环境变量是否都配置正确
2. 检查 Supabase 数据库是否创建了 users 表
3. 查看 Vercel 部署日志（Deployments → 点击部署 → Logs）

### 问题 2：照片上传失败
**可能原因**：腾讯云配置错误
**解决方法**：
1. 检查腾讯云存储桶是否设置为 "公有读私有写"
2. 检查 SecretId 和 SecretKey 是否正确
3. 检查存储桶名称是否正确

### 问题 3：页面显示异常
**可能原因**：部署不完整
**解决方法**：
1. 在 Vercel 重新部署（步骤 13）
2. 清除浏览器缓存（Ctrl+Shift+Delete）
3. 使用隐私模式打开

### 问题 4：数据库连接失败
**可能原因**：Supabase 配置错误
**解决方法**：
1. 检查 Project URL 和 anon key 是否正确
2. 检查 Supabase 项目是否正常运行
3. 查看 Supabase 日志（Logs → Database Logs）

---

## 迁移后的日常维护

### 每日检查
- ✅ 系统能正常访问
- ✅ 能正常创建检验记录
- ✅ 照片能正常上传

### 每周检查
- ✅ 查看 Supabase 数据库用量（Settings → Billing → Usage）
- ✅ 查看腾讯云存储用量（对象存储 → 概览）
- ✅ 备份重要数据（导出 CSV）

### 每月检查
- ✅ 检查费用账单
- ✅ 清理过期数据
- ✅ 更新系统（如有新版本）

---

## 技术支持

如果遇到问题无法解决：
1. 查看 Vercel 部署日志
2. 查看 Supabase 数据库日志
3. 查看腾讯云存储日志
4. 联系技术支持

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
