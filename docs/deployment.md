# 部署文档

> 项目：我的菜单（Next.js + Supabase + ImgBB）· 更新日期：2026-07-28

## 1. 部署架构

```mermaid
flowchart TB
  user[用户浏览器]
  edge[Vercel 或同类平台]
  next[Next.js 服务端]
  supa[Supabase Auth + PostgreSQL]
  imgbb[ImgBB]
  user --> edge
  edge --> next
  next -->|Auth / Service Role| supa
  next -->|IMG_BB_API_KEY| imgbb
```

- **应用**：Next.js（SSR、Server Actions、middleware、`/api/upload`）。
- **数据**：Supabase；迁移在控制台或 CI 执行，不随前端静态资源发布。
- **图片**：ImgBB 公网 URL；应用只存 URL。

## 2. 环境说明

| 环境 | 用途 | 说明 |
|------|------|------|
| 本地 | 开发 | `.env.local` |
| 预发 / 生产 | 对外 | 平台环境变量；建议独立 Supabase 项目 |

## 3. 配置与密钥（环境变量）

| 变量 | 必填 | 说明 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 是 | 项目 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 或 `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 是 | 可发布密钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | 是 | **仅服务端**，业务读写必填 |
| `SESSION_SECRET` | 建议 | JWT 会话签名 |
| `IMG_BB_API_KEY` | 是（启用上传） | **仅服务端** |
| `HEALTH_CHECK_SECRET` | 建议（保活） | `/api/health` Bearer 鉴权；与 GitHub Actions Secret 同值 |

**密钥管理**：Service Role、ImgBB Key 只放部署平台密钥区；**禁止** `NEXT_PUBLIC_` 前缀。参考根目录 [.env.example](../.env.example)。

## 4. 构建产物

| 命令 | 说明 |
|------|------|
| `npm run build` | 生产构建 |
| `npm run start` | 本地验证产物 |

若使用 `next/image` 加载 ImgBB 域名，须在 `next.config` 配置 `images.remotePatterns`（如 `i.ibb.co`）。

## 5. 部署步骤（以 Vercel 为例）

### 5.1 首次部署

1. 在 Supabase SQL Editor 执行迁移（`supabase/migrations/*`，实现阶段提供）。
2. 执行迁移：新库用 `001_init.sql`；旧库追加 `002_per_user_menu.sql`。  
3. 用演示账号验证：admin / user 菜单互不相同；均可进入「我的菜单」管理；仅 admin 可见「用户管理」。

### 5.2 常规发布

推送生产分支触发构建即可。若有 SQL 变更，**先迁移再发版**（或兼容双写）。

### 5.3 回滚

在平台将上一稳定 Deployment 提升为 Production；数据库回滚需单独评估，勿盲目执行破坏性 SQL。

## 6. 数据库与迁移

- 生产变更前先在预发验证。
- 表结构见 [database-design.md](./database-design.md)。
- 订单明细含快照字段，删菜品不应导致历史订单无法展示。

## 7. 健康检查清单

| 检查项 | 预期 |
|--------|------|
| `/login` | 可打开 |
| 错误密码 | 明确错误提示 |
| 点菜结算 | 生成订单且金额正确 |
| 非本人菜品 / 订单 | 不可见、不可改 |
| 上传接口未登录 | 401 |

## 8. 健康检查与 Supabase 保活

### 8.1 `/api/health` 接口

`GET /api/health` 仅供内部调用：向 Supabase 发一条轻量查询（`SELECT id FROM profiles LIMIT 1`），用于验证连通性，并**防止免费项目因 30 天不活跃被暂停**。

鉴权：请求头须带 `Authorization: Bearer <HEALTH_CHECK_SECRET>`。未配置该变量时返回 503。

### 8.2 GitHub Actions 定时保活

`.github/workflows/keep-alive.yml` 在每月 1 日和 21 日（UTC 02:00）自动调用 `/api/health`。

**配置步骤：**

1. GitHub 仓库 → Settings → Secrets and variables → Actions 新增：

   | Secret 名称 | 值 |
   |-------------|-----|
   | `HEALTH_CHECK_URL` | `https://你的域名/api/health` |
   | `HEALTH_CHECK_SECRET` | 与部署平台 `HEALTH_CHECK_SECRET` 相同 |

2. 在 Vercel（或其他平台）环境变量中配置同名 `HEALTH_CHECK_SECRET`。
3. 可在 Actions → Keep Supabase Alive → Run workflow 手动验证。

## 9. 监控与日志（建议）

- 平台函数日志关注：登录失败率、上传 5xx、下单失败。
- ImgBB 限额与失败需有可读错误，避免前端无限重试。

## 10. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-07-28 | 初版：Vercel + Supabase + ImgBB |
| 2026-07-30 | 增加 `/api/health` 与 keep-alive Workflow |
