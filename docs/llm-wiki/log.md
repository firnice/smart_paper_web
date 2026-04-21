# LLM Wiki Log

## 2026-04-21 Bootstrap

- 创建根级 `CLAUDE.md`，固定了本仓库的知识层 schema、来源优先级、raw/wiki 规则以及 ingest/query/lint 流程。
- 新建 `docs/llm-wiki/` 结构，并补齐 `index.md`、`log.md`、`raw/README.md`、两条 raw 来源记录和首批主题页。
- 本轮综合时优先使用运行时代码与仓库约束，重点读取了 `AGENTS.md`、`README.md`、`docs/CODE_LAYOUT.md`、`src/app/App.jsx`、`src/services/api.js`、`src/pages/workspace/WorkspacePage.jsx`、`src/pages/workspace/hooks/useComposer.js`、`src/pages/PrintPage.jsx`、`src/pages/ProfilePage.jsx` 及 `docs/45-49`。
- 显式记录了三类 drift：
  - `README.md` 路由说明滞后于 `App.jsx`
  - `docs/46-48` 中的设计方向并不完全等于当前代码
  - `student` 命名与 `parent` 单角色产品方向并存

## 下一轮建议 Ingest

- 补一页 `admin-surface.md`，把 `/admin/*` 页面能力、鉴权头和配置模型整理成独立主题页。
- 如果后续继续推进 `analysis` 页面，更新 `current-phase-and-constraints.md` 与 `project-overview.md` 的路由状态。
- 如果开始清理遗留页面目录，更新 `repo-layout.md` 和 `document-map.md` 中的“历史残留”说明。
