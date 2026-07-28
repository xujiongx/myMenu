# 我的菜单（Next.js 移动端 + Supabase + ImgBB）

轻量移动端点菜：账号登录、分类浏览、加购结算、点菜记录、管理员维护菜品（图片经 ImgBB）。

UI 风格对齐 `docs` 设计图：黄色品牌色、餐罩 LOGO、左右分类点菜、底部双 Tab。

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

### 3. 安装与启动

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

**演示账号**：`admin` / `admin123`（管理员）· `user` / `user123`（普通用户）

## 路由

| 路径 | 功能 |
|------|------|
| `/login` | 登录 |
| `/` | 点菜 |
| `/mine` | 我的 |
| `/orders` | 点菜记录 |
| `/orders/[id]` | 订单详情 |
| `/manage` | 菜品管理（admin） |
| `/manage/dish` | 新增/编辑菜品 |

## 文档

完整设计见 **[docs/](./docs/)**：[PRD](./docs/PRD.md) · [数据库](./docs/database-design.md) · [接口](./docs/api.md) · [缓存](./docs/cache-design.md) · [开发指南](./docs/development-guide.md) · [部署](./docs/deployment.md)
