# Repo Layout

## 摘要

本仓库已经从“少量页面 + 单体学生工作台”演进到“统一应用壳层 + 工作台/打印/资料/管理后台”的结构，但目录中仍保留不少迁移前页面。看目录时要先区分“当前活跃入口”与“历史残留”。

## 顶层结构

- `src/app/`
  - 应用入口与路由汇总
- `src/components/`
  - 跨页面共享组件和布局
- `src/context/`
  - 全局状态，例如学期上下文
- `src/pages/`
  - 页面级容器，包含当前活跃页面和历史页面
- `src/services/`
  - API wrapper 与少量 demo 数据 helper
- `src/styles/`
  - 全局样式和工作台/打印样式
- `src/utils/`
  - 会话、图片处理等工具
- `docs/`
  - 变更说明、里程碑记录、布局规范
- `docs/llm-wiki/`
  - repo-local 知识层

## 当前活跃目录

### 运行时主入口

- `src/main.jsx`
- `src/app/App.jsx`

### 当前主应用页面

- `src/pages/workspace/`
  - 当前工作台主页面和录入链路
- `src/pages/print/`
  - 打印工作台分步组件
- `src/pages/auth/`
  - 登录页
- `src/pages/admin/`
  - 管理端页面
  - 其中 `AdminLoginPage.jsx` 当前并未被 `App.jsx` 挂载
- 顶层单页文件
  - `src/pages/PrintPage.jsx`
  - `src/pages/ProfilePage.jsx`
  - `src/pages/PracticePage.jsx`
  - `src/pages/QuestionDetailPage.jsx`

### 共享支撑层

- `src/components/layout/`
- `src/context/`
- `src/services/api.js`
- `src/utils/`

## 历史残留 / 非主路由目录

这些文件目前存在于仓库中，但不由 `src/app/App.jsx` 直接挂载：

- `src/pages/paper/`
  - `UploadPage.jsx`
  - `ResultPage.jsx`
- `src/pages/student/StudentDashboardPage.jsx`
- `src/pages/mine/MinePage.jsx`
- `src/pages/management/WorkspacePage.jsx`
- 顶层旧页面
  - `src/pages/HomePage.jsx`
  - `src/pages/QuestionBankPage.jsx`
  - `src/pages/InsightsPage.jsx`

这些目录对理解历史演进有价值，但不应被直接当作当前主产品结构。

## 文档目录结构

- `docs/CODE_LAYOUT.md`
  - 基础目录规则
- `docs/30-45*.md`
  - 多为链路修复、数据口径和阶段验收记录
- `docs/46-48*.md`
  - 偏产品/交互重构与响应式规范
- `docs/49-nginx-reverse-proxy-entry.md`
  - 联调与部署入口约束

## 已知 Drift

- `README.md` 中展示的目录结构只覆盖了较早期的 `home` / `paper` 形态，没有完整反映后来的 `workspace`、`print`、`admin` 等目录。
- `docs/CODE_LAYOUT.md` 仍然是基础规范，但它比当前实际代码树更保守，不能单独用来判断哪些页面是活跃页面。

## 开放问题 / 风险

- 旧页面长期保留会提高理解成本，也容易让自动化工具把未挂载页面误判成当前实现。
- 如果后续做一次目录清理，应该先更新知识层和文档链接，再迁移代码。

## 来源

- `README.md`
- `docs/CODE_LAYOUT.md`
- `src/app/App.jsx`
- `src/components/layout/AppFrameLayout.jsx`
- `src/components/layout/AdminLayout.jsx`
- 当前 `src/` 目录树
