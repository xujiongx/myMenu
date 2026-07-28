# 迭代设计文档

> 与 [PRD.md](./PRD.md) 配合：PRD 管产品范围，**每个迭代的变更记录放在 [change/](./change/) 下**；**同一自然日宜合并为单文件** `YYYY-MM-DD.md`（见 [change/README.md](./change/README.md)）。  
> 当前产品：**我的菜单**（Next.js 移动端点菜 + Supabase + ImgBB）。  
> 主文档已与设计/实现对齐时，迭代文件可只记**本轮差异**与发布说明。

## 存放位置

- 目录：`docs/change/`
- 每个迭代新建一个 `.md`（勿把多轮迭代长期混在同一文件，除非约定「仅当前迭代」覆盖更新）。
- 新文件请复制 [change/iteration-template.md](./change/iteration-template.md) 后按 [change/README.md](./change/README.md) 的命名建议改名。
- **索引表**在 [change/README.md](./change/README.md) 维护，便于按时间查找。

## 与主设计文档的关系

| 内容 | 文档 |
|------|------|
| 产品范围与验收 | [PRD.md](./PRD.md) |
| 接口变更与错误码 | [api.md](./api.md) |
| 表结构 / 迁移 | [database-design.md](./database-design.md) |
| 缓存 Key / 策略 | [cache-design.md](./cache-design.md) |
| 开发与目录 | [development-guide.md](./development-guide.md) |
| 上线与环境变量 | [deployment.md](./deployment.md) |

迭代文中以摘要 + 链接为主，避免与主文档长期重复；主文档在里程碑合并后更新「正式版」设计。

## 建议迭代节奏（对齐 PRD 里程碑）

| 迭代 | 目标 | 主要文档更新 |
|------|------|----------------|
| M0 | 文档与环境、表结构定稿 | 本文档体系（已完成初版） |
| M1 | 登录 + 点菜 + 结算 | api / cache / change |
| M2 | 订单列表 + 菜品管理 + ImgBB | api / deployment / change |
| M3 | 权限与性能打磨、上线 | deployment / PRD 状态 |

## 变更记录

| 日期 | 说明 |
|------|------|
| 2026-07-28 | 建立迭代约定与 change 目录 |
