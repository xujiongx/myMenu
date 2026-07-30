# 小菜单（Next.js 移动端 + Supabase + ImgBB）

轻量移动端点菜：账号登录、分类浏览、加购结算、点菜记录、管理员维护菜品（图片经 ImgBB）。

UI：黄色品牌色、笑脸餐盘站标、左右分类点菜、底部双 Tab；支持 **PWA**（添加到主屏幕 + Service Worker 缓存），名称为 **小菜单**。

## 技术栈

- Next.js 16（App Router）+ TypeScript + Tailwind CSS 4
- lucide-react（图标）
- Supabase PostgreSQL（Service Role 服务端访问）
- bcryptjs + jose（账号密码与会话 Cookie）
- ImgBB（`IMG_BB_API_KEY`，仅服务端上传）

## 本地运行

### 1. 执行数据库迁移

在 [Supabase SQL Editor](https://supabase.com/dashboard) 执行：

`supabase/migrations/001_init.sql`

### 2. 环境变量

复制 `.env.example` 为 `.env.local`，至少配置：

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 项目 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 可发布密钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | **必填**，仅服务端；Settings → API |
| `SESSION_SECRET` | 会话签名（建议随机长串） |
| `IMG_BB_API_KEY` | 菜品图上传 |
| `HEALTH_CHECK_SECRET` | 可选；`/api/health` 保活鉴权 |

### 3. 安装与启动

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

**演示账号**：`admin` / `admin123`（管理员，可用户管理）· `user` / `user123`（**各自独立菜单**）

## 路由

| 路径 | 功能 |
|------|------|
| `/login` | 登录 |
| `/` | 点菜（本人菜单） |
| `/mine` | 我的 |
| `/orders` | 点菜记录 |
| `/orders/[id]` | 订单详情 |
| `/orders/[id]/add` | 订单加菜 |
| `/manage` | 我的菜单（菜品管理） |
| `/manage/dish` | 新增/编辑菜品 |
| `/categories` | 分类管理 |
| `/categories/form` | 新增/编辑分类 |
| `/users` | 用户管理（仅 admin） |
| `/users/form` | 新增/编辑用户（仅 admin） |
| `/api/health` | Supabase 保活健康检查（Bearer） |

### 数据库

- 新库：执行 `supabase/migrations/001_init.sql`
- 已跑过旧版全局菜单：再执行 `002_per_user_menu.sql`
- 已有库且 admin 角色为 user：再执行 `003_admin_role.sql`
- 订单待支付金额：再执行 `004_order_payable.sql`
- 订单明细已付标记：再执行 `005_order_item_paid.sql`

生产部署后可配置 `.github/workflows/keep-alive.yml`（见 [部署文档](./docs/deployment.md) §8）。

## 文档

完整设计见 **[docs/](./docs/)**：[PRD](./docs/PRD.md) · [数据库](./docs/database-design.md) · [接口](./docs/api.md) · [缓存](./docs/cache-design.md) · [开发指南](./docs/development-guide.md) · [部署](./docs/deployment.md)
