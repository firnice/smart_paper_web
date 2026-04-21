# Smart Paper Web Wiki Index

## 当前快照

- 仓库类型：React + Vite 前端工程
- 当前真实主入口：`src/main.jsx` -> `src/app/App.jsx`
- 当前产品阶段：`interaction/UI-first`
- 当前主链路：登录 -> 录入 `capture` -> 错题整理 `workspace` -> 打印导出 `print` -> 结果回填/状态回流
- 主要风险：运行时代码、`README.md` 和部分设计文档之间存在路由与角色语义 drift

## 核心主题页

- [`wiki/project-overview.md`](./wiki/project-overview.md)
- [`wiki/system-architecture.md`](./wiki/system-architecture.md)
- [`wiki/api-surface.md`](./wiki/api-surface.md)
- [`wiki/data-model.md`](./wiki/data-model.md)
- [`wiki/repo-layout.md`](./wiki/repo-layout.md)
- [`wiki/document-map.md`](./wiki/document-map.md)
- [`wiki/current-phase-and-constraints.md`](./wiki/current-phase-and-constraints.md)

## 来源层

- [`raw/2026-04-21-pattern-reference-karpathy-idea-file.md`](./raw/2026-04-21-pattern-reference-karpathy-idea-file.md)
- [`raw/2026-04-21-bootstrap-repo-sources.md`](./raw/2026-04-21-bootstrap-repo-sources.md)

## 已知 Drift

- `README.md` 中的页面路由说明仍包含 `/upload`、`/result`、`/student/dashboard` 等旧入口；当前运行时路由以 `src/app/App.jsx` 为准。
- `docs/46-v2-frontend-redesign.md` 和 `docs/47-parent-single-role-adaptive-design.md` 提供了产品方向，但并不等价于全部已落地实现。
- 代码中仍保留 `student` 命名的 session、API 和部分页面目录，而产品文档已朝 `parent` 单角色语义收敛。

## 维护提示

- 新增主题时先补 `raw/` 来源记录，再更新 `wiki/` 综合页，最后追加 `log.md`。
- 只做增量更新，不重置历史日志。
