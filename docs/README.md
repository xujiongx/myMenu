# 项目文档索引

本目录为**小菜单**（移动端点菜 · Next.js + Supabase + ImgBB）的中文项目文档，与根目录 [README.md](../README.md)（快速上手）配合使用。

**当前能力摘要**：账号密码登录；**每人独立菜单**（分类/菜品/订单按 `user_id` 隔离）；点菜结算、订单记录、数据统计（下单排行与已点次数）、自助菜品管理（多图上传与预览）与 ImgBB 上传；lucide-react 图标；菜单缓存标签 `menu:{userId}`；品牌名 **小菜单**；PWA（manifest + Serwist Service Worker，安装图标 `/icons/icon-*.png`）。

| 文档 | 说明 |
|------|------|
| [PRD.md](./PRD.md) | 产品需求与验收要点 |
| [database-design.md](./database-design.md) | 表结构、枚举、RLS 策略 |
| [api.md](./api.md) | Server Actions / 上传接口、会话、错误约定 |
| [cache-design.md](./cache-design.md) | Cookie、localStorage、读缓存与失效 |
| [development-guide.md](./development-guide.md) | 目录、环境、命令、FAQ |
| [icons.md](./icons.md) | lucide-react 图标用法与尺寸约定 |
| [deployment.md](./deployment.md) | 环境变量、上线与回滚 |
| [iteration-design.md](./iteration-design.md) | 迭代说明与 `change/` 约定 |
| [change/](./change/) | 各迭代独立文档 |

## 文档维护约定

- 功能落地或接口变更后，同步更新对应专篇，并在 [change/](./change/) 记本轮差异。
- 根目录 README 只保留快速上手；细节以本目录为准。
