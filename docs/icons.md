# 图标方案（lucide-react）

本项目使用业界通用图标库 [**lucide-react**](https://lucide.dev/)（Lucide Icons）。

## 用法

```tsx
import { Search, ShoppingCart } from "lucide-react";
import { ICON_SIZE } from "@/lib/constants/icon-size";

<Search size={ICON_SIZE.md} strokeWidth={2} className="text-muted" />
<ShoppingCart size={ICON_SIZE.cart} />
```

- 颜色：继承 `currentColor`（用 Tailwind `text-*`）
- 尺寸：统一参考 `lib/constants/icon-size.ts`

## 尺寸约定

| 场景 | size |
|------|------|
| Tab | 22 |
| 购物车 | 22 |
| 搜索 / 返回 / 列表 | 16 |
| 加减按钮内 | 14 |
| 关闭 | 18 |
| 登录 LOGO | 40 |

## 常用映射

| 场景 | 组件 |
|------|------|
| 点菜 Tab | `ShoppingBag` |
| 我的 Tab | `User` |
| 搜索 | `Search` |
| 购物车 | `ShoppingCart` |
| 加减 | `Plus` / `Minus` |
| 返回 | `ChevronLeft` |
| 右箭头 | `ChevronRight` |
| 编辑 / 删除 | `Pencil` / `Trash2` |
| 关闭 | `X` |
| 刷新 | `RefreshCw` |
| 占位图 | `Image` / `ImageIcon` |
| 分类管理 | `FolderTree` |
