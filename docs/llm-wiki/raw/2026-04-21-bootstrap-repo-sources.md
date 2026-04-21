# 2026-04-21 Bootstrap Repo Sources

## 来源类型

- 当前仓库 bootstrap 读取清单

## 核心来源

- `AGENTS.md`
- `README.md`
- `docs/CODE_LAYOUT.md`
- `package.json`
- `vite.config.js`
- `src/main.jsx`
- `src/app/App.jsx`
- `src/services/api.js`
- `src/components/layout/AppFrameLayout.jsx`
- `src/components/layout/AdminLayout.jsx`
- `src/context/TermContext.jsx`
- `src/utils/studentSession.js`
- `src/utils/adminSession.js`
- `src/pages/workspace/WorkspacePage.jsx`
- `src/pages/workspace/hooks/useComposer.js`
- `src/pages/workspace/mappers.js`
- `src/pages/PrintPage.jsx`
- `src/pages/ProfilePage.jsx`
- `src/pages/admin/AgentConfigPage.jsx`
- `src/pages/admin/ProvidersPage.jsx`
- `src/pages/admin/LlmLogsPage.jsx`
- `src/services/studentDemo.js`
- `docs/45-m5-main-flow-field-closure-and-api-validation.md`
- `docs/46-v2-frontend-redesign.md`
- `docs/47-parent-single-role-adaptive-design.md`
- `docs/48-capture-composer-layout-cleanup.md`
- `docs/49-nginx-reverse-proxy-entry.md`

## 关键事实摘录

- 运行时主路由来自 `src/app/App.jsx`，学生侧主入口为 `/login`、`/capture`、`/workspace`、`/print`、`/profile`、`/question/:id`、`/practice/:id`。
- 管理端主入口为 `/admin/students`、`/admin/providers`、`/admin/agents`、`/admin/llm-logs`。
- `src/services/api.js` 是前端观察到的 API surface，包含 OCR、错题 CRUD、打印导出、趋势分析、模型供应商和 LLM 日志能力。
- 当前仓库处于 `interaction/UI-first` 阶段，且要求在 backend 能力未完全确定时保持 demo-friendly。
- 设计文档已朝单角色 `parent` 语义收敛，但代码仍大量使用 `student` 命名。
- 代码仓中仍保留多组旧页面与旧目录，并非全部在运行时挂载。

## 未验证项

- 后端真实 schema、响应字段全集和权限策略并不在本仓库内，前端 wiki 只能写“从客户端可见的接口面”。
- `docs/46-48` 中尚未逐项比对全部设计要求是否落地，只标记了最明显的实现差异。
