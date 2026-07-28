# 缓存设计文档

> 项目：我的菜单 · 更新日期：2026-07-28

## 1. 概述

本期**不引入** Redis / Memcached；**不使用** Supabase Realtime 推送点菜协同。

| 层级 | 机制 | 目标 |
|------|------|------|
| Next 数据缓存 | `unstable_cache` 菜单快照，**按 userId 分键**，标签 **`menu:{userId}`** | 降低读库且互不串号 |
| 同请求去重 | React `cache()` 可包装 `requireUser()` | 同一次 RSC 内只解析一次会话 |
| 路由 / 标签失效 | 菜品写操作 `revalidateTag(menu:{userId})` | 仅刷新本人菜单 |
| 会话 | httpOnly Cookie（Auth session） | 服务端识别当前用户 |
| 前端持久化 | localStorage：用户展示信息（昵称/头像/角色）；**不存密码** | 重启减少闪烁；以 Cookie 为准 |
| 购物车 | 内存 `useState`；可选 `sessionStorage`（键如 `menu_cart`） | 刷新页可恢复未结算；**切换账号必须清空** |
| 客户端路由 | 可选 `experimental.staleTimes` 与底部 Tab prefetch | Tab 切换少打 Flight |

**一致性**：PostgreSQL 为唯一事实源。菜单在读缓存窗口内可能短暂滞后，直至 TTL、写操作 `revalidateTag`，或用户下拉刷新（主动失效 + `router.refresh()`）。

## 2. 缓存 Key 与标签

| 数据 | 缓存键要素 | 标签 | 失效时机 |
|------|------------|------|----------|
| 菜单快照 | 键含 `userId` | `menu:{userId}` | 本人创建/更新/删除菜品、登录/登出 |
| 用户资料 | 一般不长缓存；按请求读 Cookie → profiles | — | 登录/登出 |
| 订单列表 | 不建议长缓存（含 userId）；可仅 React `cache()` 同请求去重 | — | 下单后 `revalidatePath('/orders')` |

若未来多门店，菜单键需带 `store_id`。

## 3. 与页面行为的对应

| 场景 | 行为 |
|------|------|
| 打开点菜页 | RSC / Action 拉菜单；可命中 `menu` 缓存 |
| 管理端改菜成功 | `revalidateTag('menu')`；点菜页下次导航或刷新为新数据 |
| 用户点「下拉刷新」 | 可选 `refreshMenuCache` Action → `revalidateTag('menu')` + `router.refresh()` |
| 结算成功 | 清客户端购物车；订单列表 path 失效 |
| 切换账号 | 清 Cookie + localStorage 用户信息 + 购物车 → `/login` |
| 登录过期 | 中间件拦截；清客户端缓存 |

## 4. 购物车缓存规则

| 规则 | 说明 |
|------|------|
| 不入数据库 | 仅下单瞬间写入 `orders` |
| 结构 | `{ [dishId]: quantity }` 或明细数组（含临时展示字段） |
| 切换账号 / 登出 | 必须 `removeItem('menu_cart')` |
| 多端 | 购物车不跨设备同步（本期） |

## 5. CDN / 静态资源

| 类型 | 说明 |
|------|------|
| `/_next/static/*` | 生产带内容哈希，可长期缓存 |
| 菜品图（ImgBB 域名） | 缓存头由 ImgBB CDN 决定；`next/image` 若启用需配置 `images.remotePatterns` |
| `next dev` | 静态资源常为 no-store，属预期，勿与生产混淆 |

## 6. 无服务端 KV

- 未使用 SWR/React Query 持久化层；若接入需补充 Key 与和 `menu` 标签的协同策略。

## 7. 后续可优化

| 方向 | 说明 |
|------|------|
| 分类级缓存键 | 大菜单时按 `categoryId` 分键 |
| 短 TTL + 手动刷新 | 运营改价频繁时缩短 `revalidate` |
| 受控 Realtime | 多端管理后台改菜后推送失效（需鉴权） |

## 8. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-07-28 | 初版：menu 标签、会话、购物车、无 Realtime |
