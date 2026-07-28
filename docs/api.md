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
| 图片上传 | `app/api/upload/route.ts`（任意登录用户） |

## 2. 菜单

- `fetchMenuSnapshot()`：先 `ensureDefaultCategories`，再返回当前用户上架菜品与分类。
- `refreshMenuCache()`：`revalidateTag(menu:{userId})`。

## 3. 菜品 / 分类管理

- 任意登录用户可进入 `/manage`、`/categories`。
- `createDish` / `updateDish` / `deleteDishes` 校验归属。
- `createCategory` / `updateCategory` / `deleteCategory`：同名不可重复；有菜品的分类不可删。

## 4. 用户管理（admin）

- 仅 `role=admin` 可访问 `/users`、`/users/form`。
- `listUsers` / `createUser` / `updateUser` / `deleteUser`。
- **不可编辑 / 删除**账号 `admin` 或 `role=admin` 的用户；不可新建账号名 `admin`；新建用户固定 `role=user`。
- 删除用户前先删其订单，再删 profile（分类/菜品 CASCADE）。

## 5. 下单

- `createOrder` 只接受当前用户自己的上架菜品 ID。

## 6. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-07-28 | 落地 Actions |
| 2026-07-28 | 按 user_id 隔离菜单 |
| 2026-07-28 | 新增分类管理 CRUD |
| 2026-07-28 | 管理员用户管理 CRUD（保护 admin） |
