# API Surface

## 摘要

本页只记录“前端在 `src/services/api.js` 中实际观察到的接口面”。它不是后端权威 schema，只是客户端视角的调用地图。

## 基础行为

- Base URL 解析顺序：
  1. `VITE_API_BASE`
  2. `window.location.origin`
  3. fallback `http://localhost:8100`
- 本地联调时，`vite.config.js` 把 `/api` 与 `/static` 代理到 `127.0.0.1:8100`。
- 学生侧请求默认自动注入 `X-Student-Token`。
- 管理侧显式注入 `X-Admin-Token`。
- 普通业务请求遇到 401 时，会清空本地 session 并跳回 `/login`。

## 学生 / 家长侧接口

### 基础与鉴权

- `GET /api/health`
- `GET /api/school-terms`
- `GET /api/auth/student-login-config`
- `POST /api/auth/student-login`

### OCR 与题目分析

- `POST /api/ocr/extract`
- `POST /api/ocr/diagram/svg`
- `POST /api/ocr/analyze-question`

### 举一反三与导出

- `POST /api/variants/generate`
- `POST /api/variants/generate-for-question`
- `POST /api/export`
- `POST /api/print-pack/export`

### 用户与关系

- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/:userId`
- `PUT /api/users/:userId/term`
- `POST /api/users/parent-student-links`
- `GET /api/users/:parentId/students`

### 元数据字典

- `GET /api/subjects`
- `POST /api/subjects`
- `GET /api/wrong-question-categories`
- `POST /api/wrong-question-categories`
- `GET /api/error-reasons`
- `POST /api/error-reasons`

### 错题与学习记录

- `GET /api/wrong-questions`
- `POST /api/wrong-questions`
- `GET /api/wrong-questions/:id`
- `PUT /api/wrong-questions/:id`
- `DELETE /api/wrong-questions/:id`
- `POST /api/wrong-questions/:id/study-records`
- `GET /api/wrong-questions/:id/study-records`
- `GET /api/statistics/overview`

### 分析

- `POST /api/analysis/trend`
- `GET /api/analysis/trend/:id`
- `GET /api/analysis/trend/latest`
- `GET /api/analysis/trend`

## 管理侧接口

### 登录

- `POST /api/auth/admin-login`

### 学生管理

- `GET /api/users?role=student`
- `POST /api/users`
- `DELETE /api/users/:userId`

### 模型供应商

- `GET /api/admin/model-providers`
- `POST /api/admin/model-providers`
- `PUT /api/admin/model-providers/:id`
- `DELETE /api/admin/model-providers/:id`

### Agent 配置

- `GET /api/admin/agents`
- `PUT /api/admin/agents/:nodeName`
- `POST /api/admin/agents/:nodeName/test`

### 日志与统计

- `GET /api/admin/llm-stats/overview`
- `GET /api/admin/llm-logs`

## 已知 Drift

- `api.js` 中同时存在两套 Agent helper：
  - `listAgents/getAgent/updateAgent/testAgent`
  - `adminListAgents/adminUpdateAgent/adminTestAgent`
- 当前正式管理页面 `src/pages/admin/AgentConfigPage.jsx` 使用的是带 `X-Admin-Token` 的 `admin*` 版本。
- 旧的 `src/pages/management/WorkspacePage.jsx` 仍使用前一套老 helper，说明该旧页面不应再被视为正式入口。

## 开放问题 / 风险

- `getStatisticsOverview(studentId, params)` 目前把 `studentId` 作为调用参数传入，但请求本身走 `GET /api/statistics/overview`，前端侧并没有展示这个 ID 是否一定进入 query string，需要以后和后端 contract 对齐。
- `createUser` / `updateUser` 同时服务学生侧与管理侧，不同调用方的 payload 约束目前只靠页面逻辑区分。
- 前端只能看到字段使用面，无法从本仓库推导后端数据库真值。

## 来源

- `src/services/api.js`
- `vite.config.js`
- `src/pages/admin/AgentConfigPage.jsx`
- `src/pages/admin/ProvidersPage.jsx`
- `src/pages/admin/LlmLogsPage.jsx`
- `src/pages/management/WorkspacePage.jsx`
- `docs/49-nginx-reverse-proxy-entry.md`
