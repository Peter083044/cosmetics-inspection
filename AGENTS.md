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
│   ├── dashboard/page.tsx    # 仪表盘（检验记录列表）
│   ├── inspection/
│   │   ├── new/page.tsx      # 新建检验
│   │   └── [id]/page.tsx     # 检验详情与审核
│   ├── admin/page.tsx        # 用户管理（管理员）
│   └── api/
│       ├── auth/route.ts     # 登录/登出/获取当前用户
│       ├── users/route.ts    # 用户CRUD
│       ├── inspections/route.ts      # 检验记录CRUD
│       ├── inspections/[id]/approve/ # 审核操作
│       ├── products/route.ts # 产品信息
│       ├── upload/route.ts   # 文件上传
│       └── export/route.ts   # 记录导出
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

### 数据库 (db.ts)
- SQLite 数据库存储在 `data/inspection.db`
- 表：users、products、inspections
- 首次启动自动创建表和默认用户

### 审核工作流
1. 辅助人员创建检验记录 → 状态: `line_leader_review`
2. 线长审核 → 通过后状态: `supervisor_review`
3. 主管审核 → 通过后状态: `qc_review`
4. QC审核 → 通过后状态: `approved`
5. 任何环节可驳回 → 状态: `rejected`

### 照片对比
- 最多6个面（正面、背面、左侧、右侧、顶部、底部）
- 每个面上传标样照片和首件实物照片
- 判定结果：通过/不通过
- 不通过需填写差异说明
- 批号信息不参与比对

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
