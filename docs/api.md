# 接口与数据访问说明

> 数据访问由 **Next.js Server Actions** + Supabase **Service Role** 完成；图片上传为 `POST /api/upload`（ImgBB）。  
> 更新日期：2026-07-28

## 1. 设计说明

| 能力 | 实现方式 | 文件 |
|------|----------|------|
| 登录 / 登出 / 当前用户 | Server Actions | `app/actions/auth.ts` |
| 菜单快照 / 刷新缓存 | Server Actions + `unstable_cache` | `app/actions/menu.ts` |
| 下单 / 订单列表 / 详情 | Server Actions | `app/actions/order.ts` |
| 菜品 CRUD | Server Actions（admin） | `app/actions/dish-admin.ts` |
| 图片上传 | Route Handler | `app/api/upload/route.ts` |
| 路由守卫 | middleware（Cookie 有无） | `middleware.ts` |

会话 Cookie：`menu_session`（JWT，HS256，7 天）。购物车仅客户端 `sessionStorage`（`menu_cart`）。

## 2. 会话

- `loginAction({ account, password })` → 校验 bcrypt → 写 Cookie → 返回用户资料  
- `logoutAction()` → 清 Cookie → 跳转 `/login`  
- `getCurrentUserAction()` / `requireUser()` / `requireAdmin()`

## 3. 菜单 / 订单 / 管理

契约与 [PRD](./PRD.md) 一致，已实现：

- `fetchMenuSnapshot`、`refreshMenuCache`（标签 `menu`）
- `createOrder`、`fetchMyOrders`、`fetchOrderDetail`
- `fetchDishesForManage`、`fetchDishById`、`createDish`、`updateDish`、`deleteDishes`

金额以下单时库内**上架价**重算；明细写入名称/价/图快照。

## 4. `POST /api/upload`

- 需登录且 `role === admin`
- `multipart/form-data` 字段 `file`
- 成功：`{ code: 0, data: { url, displayUrl, filename, size } }`

## 5. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-07-28 | 初版设计 |
| 2026-07-28 | 落地实现上述 Actions 与上传接口 |
