# 接口与数据访问说明

> 更新日期：2026-07-28（每用户独立菜单）

## 1. 隔离原则

所有菜单 / 菜品 / 订单读写均带当前登录用户 `user_id`；缓存标签为 `menu:{userId}`。

| 能力 | 文件 |
|------|------|
| 登录 / 登出 | `app/actions/auth.ts` |
| 用户管理（仅 admin） | `app/actions/user-admin.ts` |
| 菜单快照（仅本人） | `app/actions/menu.ts` |
| 菜品 CRUD（仅本人） | `app/actions/dish-admin.ts` |
| 分类 CRUD（仅本人） | `app/actions/category.ts` |
| 下单 / 订单（仅本人） | `app/actions/order.ts` |
| 数据统计（仅本人） | `app/actions/stats.ts` |
| 图片上传 | `app/api/upload/route.ts`（任意登录用户；客户端先压缩） |
| 健康检查 | `app/api/health/route.ts`（Bearer `HEALTH_CHECK_SECRET`） |

## 2. 菜单

- `fetchMenuSnapshot()`：先 `ensureDefaultCategories`，再返回当前用户上架菜品与分类。
- `refreshMenuCache()`：`revalidateTag(menu:{userId})`。

## 3. 菜品 / 分类管理

- 任意登录用户可进入 `/manage`、`/categories`。
- `createDish` / `updateDish` / `deleteDishes` 校验归属；图片字段 `imageUrls`（最多 9 张），写入同步封面 `image_url`。
- 上传：`lib/menu/compress-image.ts` 前端压缩（最长边 1920、目标 ≤1.2MB）后再 `POST /api/upload`；服务端上限 3.5MB。
- `createCategory` / `updateCategory` / `deleteCategory`：同名不可重复；有菜品的分类不可删。

## 4. 用户管理（admin）

- 仅 `role=admin` 可访问 `/users`、`/users/form`。
- `listUsers` / `createUser` / `updateUser` / `deleteUser`。
- **不可编辑 / 删除**账号 `admin` 或 `role=admin` 的用户；不可新建账号名 `admin`；新建用户固定 `role=user`。
- 删除用户前先删其订单，再删 profile（分类/菜品 CASCADE）。

## 5. 下单与支付

- `createOrder`：状态 `pending`，`payable_amount = total_amount`。
- `payOrder`：仅 `pending` → `confirmed`，未付明细标为已付，`payable_amount = 0`。
- `addOrderItems`：`pending`/`confirmed` 可加菜；已确认加菜后回到 `pending`，`payable_amount` 仅为本次加菜金额；新明细 `paid=false`。
- `cancelOrder`：仅待支付且**无已付明细**时可取消 → `cancelled`。
- `removeUnpaidOrderItem`：待支付下移除未付明细；全部移除则删单；未付清零且仍有已付 → 回 `confirmed`。
- `completeOrder`：仅 `confirmed` → `completed`。
- 加菜入口：`/orders/[id]/add`（二级页，无底栏）。
- `fetchMyOrders({ keyword, status, offset })`：可按菜品名模糊搜、按状态筛；关键字 ≥4 位时也可匹配订单号片段。

## 6. 数据统计

- 口径：统计 `pending` / `confirmed` / `completed`；**不含** `cancelled`。
- `fetchDishOrderCounts()`：按 `dish_id` 累加 `quantity`，供点菜页「已点 N 次」。
- `fetchOrderStats()`：订单数、总份数、消费额、状态小计、菜品排行（按份数，上限 50）；入口 `/stats`。

## 7. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-07-28 | 落地 Actions |
| 2026-07-28 | 按 user_id 隔离菜单 |
| 2026-07-28 | 新增分类管理 CRUD |
| 2026-07-28 | 管理员用户管理 CRUD（保护 admin） |
| 2026-07-30 | `/api/health` + GitHub Actions keep-alive |
| 2026-07-30 | 订单待支付 / 加菜 / 去支付 / 已完成 |
| 2026-07-30 | 取消订单 / 移除未付明细（`paid`） |
| 2026-07-30 | 数据统计与点菜页已点次数 |
| 2026-07-30 | 菜品多图 `image_urls`；完整显示 + 点击预览 |
| 2026-07-30 | 上传前前端压缩，规避 Vercel 4.5MB 限制 |
