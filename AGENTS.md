# 化妆品首件核对系统

## 项目概览
基于 Next.js 的化妆品生产过程首件核对管理系统。支持多级审核工作流（辅助→线长→主管→QC），照片对比标样与实物，记录管理与导出。

## 技术栈
- **框架**: Next.js 16 (App Router)
- **核心**: React 19
- **语言**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **样式**: Tailwind CSS 4
- **数据库**: SQLite (better-sqlite3)
- **认证**: JWT + Cookie

## 文件结构
```
src/
├── app/
│   ├── page.tsx              # 根页面（重定向到登录）
│   ├── login/page.tsx        # 登录页面
│   ├── dashboard/page.tsx    # 仪表盘（检验记录列表，管理员可批量删除）
│   ├── inspection/
│   │   ├── new/page.tsx      # 新建检验（保存为草稿）
│   │   └── [id]/page.tsx     # 检验详情与审核（管理员可删除）
│   ├── admin/
│   │   ├── page.tsx          # 管理后台（人员管理/实时记录/数据导出）
│   │   └── archive/page.tsx  # 归档管理（导出ZIP/清理记录/磁盘监控）
│   └── api/
│       ├── auth/route.ts     # 登录/登出/获取当前用户
│       ├── users/route.ts    # 用户CRUD
│       ├── users/batch/route.ts # 批量创建用户
│       ├── inspections/route.ts      # 检验记录CRUD（含管理员删除）
│       ├── inspections/[id]/approve/ # 审核操作
│       ├── products/route.ts # 产品信息
│       ├── upload/route.ts   # 文件上传
│       ├── export/route.ts   # CSV导出
│       ├── archive/route.ts  # 归档导出（ZIP打包）
│       ├── cleanup/route.ts  # 记录清理
│       └── storage/route.ts  # 磁盘用量查询
├── lib/
│   ├── auth.ts               # 认证逻辑（JWT、密码哈希）
│   └── db.ts                 # 数据库初始化与连接
└── components/ui/            # shadcn/ui 组件
```

## 核心模块说明

### 认证系统 (auth.ts)
- JWT token 存储在 httpOnly cookie 中
- 支持 Bearer token 认证（Authorization header）
- bcrypt 密码哈希
- 角色：assistant（辅助）、line_leader（线长）、supervisor（主管）、qc（QC）、admin（管理员）
- 权限区分：管理员拥有所有权限（审核、管理、导出），其他角色仅有执行权限
- 权限函数：`hasPermission()`, `isAdmin()`, `isExecutor()`

### 数据库 (db.ts)
- SQLite 数据库存储在 `data/inspection.db`
- 表：users、products、inspections、approvals
- inspections 表包含 `submit_explanation`（提交说明）和 `rejected_to`（退回至）字段
- 表：users、products、inspections
- 首次启动自动创建表和默认用户

### 审核工作流
1. 辅助人员创建检验记录 → 状态: `draft`（草稿）
2. 辅助人员在详情页选择审核人（线长） → 提交后状态: `line_leader_review`
3. 线长审核通过 → 选择下一级审核人（主管） → 状态: `supervisor_review`
4. 主管审核通过 → 选择下一级审核人（QC） → 状态: `qc_review`
5. QC审核 → 通过后状态: `approved`
6. 任何环节可驳回 → 状态: `rejected`
7. 任何环节可退回 → 状态回退到上一级（`rejected_to` 记录退回目标角色）
8. 被退回/驳回后，辅助修改后重新提交（再次选择审核人）

### 退回功能
- 审核人可选择"退回"或"驳回"
- 退回：记录退回到上一责任人，状态回退（如线长退回→辅助重新编辑）
- 驳回：记录变为已驳回状态，辅助需修改后重新提交
- 退回流程定义在 `REJECT_FLOW` 常量中

### 审核人选择
- 辅助提交检验时，弹出弹窗选择对应角色的审核人（从该角色已注册用户中选择）
- 审核人通过审核时，弹出弹窗选择下一级审核人
- 通过 API `/api/users?role=xxx` 获取对应角色的用户列表
- 选定的审核人存储在 `inspections.current_reviewer_id` 和 `current_reviewer_name` 字段中

### 提交说明
- 当通过率不足100%时，必须填写提交说明原因
- 新建检验时，如果有不通过项，系统会提示并强制填写说明
- 详情页提交时，如果通过率<100%，弹窗要求填写说明
- 说明存储在 `submit_explanation` 字段中

### 照片对比
- 最多6个面（正面、背面、左侧、右侧、顶部、底部）
- 每个面上传标样照片和首件实物照片
- 判定结果：通过/不通过
- 不通过需填写差异说明
- 批号信息不参与比对

### 标签核对
- 支持最多4项标签核对（标签1~标签4）
- 每项上传标样标签照片和首件标签照片
- 每项独立判定结果：通过/不通过
- 不通过需填写差异说明
- 所有标签核对项纳入通过率计算

### 批量创建账号
- 管理员可在后台批量创建账号
- 支持按角色批量创建（辅助/线长/主管/QC）
- 用户名自动生成（角色前缀+序号）
- 统一设置默认密码

### 管理后台（/admin）
三个标签页：
1. **人员管理** — 用户列表、添加/编辑/删除用户、批量创建
2. **实时记录** — 查看所有检验记录，含状态筛选、批量删除
3. **数据导出** — CSV/Excel 导出

### 归档管理（/admin/archive）
- **存储概览** — 项目空间、数据记录、照片存储的实时用量
- **归档导出** — 按日期范围将记录+照片打包为 ZIP 下载
- **记录清理** — 删除已归档的记录和照片，释放磁盘空间
- **磁盘告警** — 超过 3GB 阈值时显示红色警告

### 管理员删除权限
- 管理员可在详情页删除单条记录
- 管理员可在仪表盘批量删除记录
- 管理员可在实时记录标签页筛选并删除
- 删除时自动清理关联照片（仅当无其他记录引用时）
- 所有删除操作需二次确认

## 默认账号
| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 辅助 | assistant1 | pass123 |
| 线长 | leader1 | pass123 |
| 主管 | supervisor1 | pass123 |
| QC | qc1 | pass123 |

## 关键常量
- `JWT_SECRET`: JWT 签名密钥（环境变量或默认值）
- `TOKEN_EXPIRY`: Token 有效期（24h）
- `DB_PATH`: 数据库路径（data/inspection.db）
- `UPLOAD_DIR`: 上传目录（public/uploads）

## 性能优化
- SQLite WAL 模式提高并发性能
- 数据库连接复用（单例模式）
- 前端使用 React Server Components 减少客户端 JS
- 图片使用 Next.js Image 组件优化
