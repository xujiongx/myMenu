# 开发指南

> 项目：小菜单（Next.js 移动端点菜 + Supabase + ImgBB）· 更新日期：2026-07-30

## 1. 环境要求

| 工具 | 建议版本 | 说明 |
|------|----------|------|
| Node.js | 20.x / 22.x | 与当前 Next 大版本兼容即可 |
| 包管理器 | npm（默认） | 亦可用 pnpm / yarn |
| Supabase | 云端项目 | 执行 `supabase/migrations` 中 SQL |
| ImgBB | API Key | 菜品图上传，仅服务端使用 |

## 2. 技术架构概要

```mermaid
flowchart LR
  subgraph next [Next.js]
    MW[middleware 会话]
    RSC[Server Components]
    SA[Server Actions]
    API["/api/upload"]
    CC[Client Components]
  end
  subgraph external [外部服务]
    PG[(Supabase PostgreSQL / Auth)]
    IB[ImgBB]
  end
  MW --> RSC
  CC --> SA
  CC --> API
  SA -->|Service Role 或用户会话| PG
  API -->|IMG_BB_API_KEY| IB
```

- **会话**：自定义账号密码（`profiles`）+ httpOnly JWT Cookie（`menu_session`）；中间件保护业务路由。
- **品牌 / PWA**：`lib/constants/branding.ts`（`APP_DISPLAY_NAME=小菜单`）；`app/manifest.ts`；图标维护 `app/logo.ico`（同步 `app/icon.ico`、`public/logo.ico`）+ `public/icons/icon-{192,512}.png`；生产环境经 `@serwist/turbopack` 注册 Service Worker（`/serwist/sw.js`），预缓存壳层与静态资源，导航缓存已访问页，离线回退 `/~offline`。
- **菜单 / 订单**：Server Actions 读写；菜单读走 `unstable_cache`（标签 `menu`）。
- **图片**：客户端选图（可多张，最多 9）→ 逐张 `POST /api/upload` → ImgBB → `image_urls` 写入菜品，`image_url` 为首图封面；列表/详情 `object-contain`，点击全屏预览。
- **购物车**：仅客户端 `sessionStorage`；结算 `createOrder`（待支付）；加菜 `addOrderItems`。
- **布局**：移动端 `max-w-md`；底部双 Tab「点菜 / 我的」；品牌黄对齐设计图。二级页（`/manage`、`/categories`、`/orders`、`/users`、`/login`、加菜 `/orders/[id]/add`）隐藏底栏；二级页顶栏 `PageHeader` 标题居中。

详见 [database-design.md](./database-design.md)、[api.md](./api.md)、[cache-design.md](./cache-design.md)。

## 3. 建议仓库结构（落地时对齐）

```
/
├── middleware.ts                 # 无会话 → /login
├── app/
│   ├── actions/
│   │   ├── auth.ts               # 登录 / 登出 / 当前用户 / requireAdmin
│   │   ├── menu.ts               # 分类、菜品读取、菜单缓存刷新
│   │   ├── order.ts              # 下单/加菜/支付/完成、列表与详情
│   │   ├── stats.ts              # 已点次数与数据统计
│   │   ├── dish-admin.ts         # 菜品 CRUD（本人）
│   │   ├── category.ts           # 分类 CRUD（本人）
│   │   └── user-admin.ts         # 用户 CRUD（仅 admin）
│   ├── manifest.ts               # PWA Web App Manifest
│   ├── sw.ts                     # Service Worker 源（Serwist）
│   ├── serwist/[path]/route.ts   # 构建并提供 /serwist/sw.js
│   ├── ~offline/page.tsx         # 离线回退页
│   ├── logo.ico / icon.ico       # 应用图标源（与 public/logo.ico 同步）
│   ├── api/upload/route.ts       # ImgBB 上传
│   ├── api/health/route.ts       # 健康检查 / Supabase 保活
│   ├── login/page.tsx
│   ├── page.tsx                  # 点菜 Tab
│   ├── mine/page.tsx             # 我的 Tab
│   ├── orders/page.tsx           # 点菜记录
│   ├── stats/page.tsx            # 数据统计（排行与汇总）
│   ├── manage/
│   │   ├── page.tsx              # 菜品列表管理
│   │   └── dish/page.tsx         # 新增/编辑（可用 query id）
│   ├── categories/               # 分类管理
│   ├── users/                    # 用户管理（仅 admin）
│   └── layout.tsx                # 壳层、Tab、metadata、PWA 注册
├── components/
│   ├── common/                   # AppShell、AppLogo、PwaProvider、PageHeader、ImagePreview、DishImageCarousel 等
│   └── features/
│       ├── auth/
│       ├── menu/                 # 分类栏、菜品卡、购物车栏
│       ├── order/
│       ├── stats/                # 数据统计页
│       └── manage/
├── lib/
│   ├── supabase/                 # server / client / middleware 客户端
│   └── constants/                # 品牌文案、限制（上传大小等）
├── public/
│   ├── logo.ico
│   └── icons/                    # PWA 安装图标 192 / 512
├── supabase/migrations/          # SQL 迁移
├── docs/                         # 本目录
├── .env.example
└── README.md
```

## 4. 环境变量

复制 `.env.example` 为 `.env.local`：

| 变量 | 必填 | 说明 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 是 | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 或 `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 是 | 浏览器 / SSR 匿名可发布密钥（以控制台为准） |
| `SUPABASE_SERVICE_ROLE_KEY` | 是（服务端写推荐） | **仅服务端**，禁止 `NEXT_PUBLIC_` |
| `IMG_BB_API_KEY` | 是（管理上传） | **仅服务端**，ImgBB |
| `HEALTH_CHECK_SECRET` | 建议（保活） | `/api/health` Bearer；与 GitHub Actions 同值 |

勿将 Service Role、ImgBB Key 提交 Git。

## 5. 常用命令

```bash
npm install
npm run dev          # http://localhost:3000（开发不注册 SW）
npm run build
npm run start        # 生产预览；可用「添加到主屏幕」验证 PWA
```

## 6. 开发约定

1. **只改任务所需**：不做顺手大重构。
2. **密钥边界**：上传与写库只在服务端；客户端只收图片 URL。
3. **数据隔离**：分类 / 菜品 / 订单一律带当前 `user_id`；菜单缓存标签 `menu:{userId}`。
4. **文档同步**：功能合并后更新 `docs/` 对应专篇，并在 `docs/change/` 记迭代。
5. **Next 版本**：若仓库已安装 Next，编写前先查阅 `node_modules/next/dist/docs/` 中与当前版本相关的指南，注意破坏性变更。

## 7. UI / 交互要点（对齐 PRD）

- 登录：居中简约；LOGO 使用站标 `/logo.ico`。
- 点菜：仅展示**本人**菜单；左右分类滚动联动；详情弹层；有历史下单时显示「已点 N 次」。
- 我的：点菜记录、**数据统计**、**分类管理**、**我的菜单**、**用户管理（仅 admin）**、切换账号。
- 数据统计：`/stats`，非取消订单汇总 + 菜品下单排行。
- 图标：lucide-react，见 [icons.md](./icons.md)。
- PWA：生产构建后安装到主屏幕；二次打开走 SW 缓存，弱网可进壳层与已访问页。

## 8. FAQ

| 问题 | 建议 |
|------|------|
| 改菜后点菜页仍旧？ | 确认写操作 `revalidateTag(menu:{userId})`；或点刷新 |
| 开发时改代码不生效？ | 开发环境不注册 SW；若曾开过 `next start`，可在浏览器清站点数据 |
| 主屏幕图标仍旧？ | 删掉主屏幕图标后重新「添加到主屏幕」；确认 `public/icons` 已同步 |
| 切换账号后仍看到旧菜？ | 清购物车；菜单按用户分键缓存，登录会失效标签 |
| 上传失败？ | 检查 `IMG_BB_API_KEY`、文件大小/类型 |
| 菜单加载报 image_urls？ | 在 Supabase 执行 `006_dish_image_urls.sql` |
| 两个演示账号菜不一样？ | 预期：admin 与 user 种子菜单相互独立 |

## 9. 相关文档

- [PRD.md](./PRD.md)
- [deployment.md](./deployment.md)
- [iteration-design.md](./iteration-design.md)
