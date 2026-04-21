# Project Overview

## 摘要

`lf-smart-paper-web` 是 Smart Paper 的前端工程，面向“小学纸面错题的录入、整理、打印与结果回填”。当前仓库重点不是做完整后端，而是把家长/学生侧的交互主链路和管理后台前端先跑通，并在 backend 能力未完全定型时保持 demo-friendly。

## 已实现

- React + Vite 单页应用，入口为 `src/main.jsx`，路由收口在 `src/app/App.jsx`。
- 主应用采用登录守卫：
  - 学生/家长侧使用 `smart_paper_student_session`
  - 管理侧使用 `smart_paper_admin_session`
- 当前活跃路由：
  - `/login`
  - `/capture`
  - `/workspace`
  - `/print`
  - `/profile`
  - `/question/:id`
  - `/practice/:id`
  - `/admin/students`
  - `/admin/providers`
  - `/admin/agents`
  - `/admin/llm-logs`
- 家长/学生主链路已经具备前端入口：
  - 上传或拍照录入
  - OCR 识别与题块切分
  - 错题保存与编辑
  - 错题筛选与维护
  - 生成打印重做包
  - 练习结果回填与状态回流
- 管理后台已经具备前端界面：
  - 学生管理
  - 模型供应商管理
  - Agent 配置
  - LLM 请求日志与统计

## 规划 / 未完全落地

- `analysis` 在设计文档中仍被当作独立顶层模块，但当前 `App.jsx` 直接把 `/analysis` 重定向到 `/profile`，说明分析页尚未独立成稳定入口。
- `docs/47-parent-single-role-adaptive-design.md` 把产品语义收敛为单角色 `parent`，但代码仍使用 `student` 命名的 session、API 和部分页面文案。
- 仓库中保留了多组旧页面，如 `src/pages/paper/`、`src/pages/student/`、`src/pages/mine/`，这些更像历史残留或迁移中间态，不代表当前主路由。

## 已知 Drift

- `README.md` 的“页面路由”仍列出 `/upload`、`/result`、`/student/dashboard` 等旧入口；运行时并不以这些说明为准。
- `docs/46-v2-frontend-redesign.md` 中提到的 `/mine`、批量练习页等设计并未完整反映在当前路由实现。
- “只保留 parent 单角色”的产品方向与当前前端数据结构并存，后续需要统一命名或补解释层。
- `src/pages/admin/AdminLoginPage.jsx` 文件存在，但 `src/app/App.jsx` 当前没有挂载 `/admin/login`；未登录的管理访问会被 `AdminGate` 重定向到普通 `/login`。

## 开放问题 / 风险

- 后端 repo 不在当前仓库中，前端只能观察到接口调用面，无法从本仓库直接验证完整领域模型和权限策略。
- 若后续继续清理旧页面，可能引发文档和知识层的大量链接变更，需要同步维护 `repo-layout` 与 `document-map`。
- 若产品语义继续从 `student` 向 `parent` 迁移，session key、接口命名和页面文案可能出现一段时间的混用期。

## 来源

- `README.md`
- `AGENTS.md`
- `src/app/App.jsx`
- `src/components/layout/AppFrameLayout.jsx`
- `src/components/layout/AdminLayout.jsx`
- `src/pages/workspace/WorkspacePage.jsx`
- `src/pages/PrintPage.jsx`
- `src/pages/ProfilePage.jsx`
- `docs/45-m5-main-flow-field-closure-and-api-validation.md`
- `docs/47-parent-single-role-adaptive-design.md`
