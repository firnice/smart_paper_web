# System Architecture

## 摘要

这是一个“前端壳层 + API orchestration”的 React 应用。当前架构核心不是复杂的本地业务引擎，而是把录入、错题维护、打印与管理能力，通过路由、页面状态、API wrapper 和少量本地缓存组织成可演示的产品流。

## 架构分层

### 1. 应用壳层

- `src/main.jsx`：挂载 React 应用并引入全局样式。
- `src/app/App.jsx`：统一声明路由、学生/管理守卫、根路径重定向。
- `src/components/layout/AppFrameLayout.jsx`：学生/家长主应用外壳，区分移动端底部导航和桌面端侧边导航。
- `src/components/layout/AdminLayout.jsx`：管理端固定侧边栏布局。

### 2. 全局状态层

- `src/context/TermContext.jsx`
  - 启动时拉取学期列表
  - 根据当前 session 中的年级推断默认学期
  - 在前端本地切换当前学期，不直接持久化
- Session state
  - `src/utils/studentSession.js`
  - `src/utils/adminSession.js`
  - 采用 localStorage 保存最小登录态

### 3. API 封装层

- `src/services/api.js` 是统一 API wrapper。
- 负责：
  - 基础 URL 解析
  - 同域优先与 `VITE_API_BASE` fallback
  - 学生与管理端 token 注入
  - 401 失效清理与跳转
  - 常见错误信息整理

### 4. 页面与流程层

- `WorkspacePage`
  - 拉取错题、学科、分类、错误原因、统计概览
  - 维护筛选、编辑、删除、收藏和状态更新
  - 驱动录入弹窗 `ComposerModal`
- `useComposer`
  - 处理录入链路
  - 图片压缩、裁剪、OCR 调用、题目分析、SVG 配图再生成、错题保存
- `PrintPage`
  - 基于错题列表做多步打印导出流程
  - 支持配置练习模式、预览排版、触发 PDF 导出
- `ProfilePage`
  - 展示学生资料
  - 支持资料编辑与当前学期切换
- Admin pages
  - 供应商、Agent、日志和统计都通过 `api.js` 访问后端管理接口

## 关键运行链路

### 录入链路

1. 用户进入 `/capture` 或从工作台打开录入弹窗。
2. `useComposer` 读取图片，做压缩与裁剪。
3. 调用 `/api/ocr/extract` 获取 OCR 项。
4. 对每个识别项调用 `/api/ocr/analyze-question` 推断学科、错误类型、原因。
5. 可选调用 `/api/ocr/diagram/svg` 生成或重绘 SVG 配图。
6. 调用 `/api/wrong-questions` 创建错题。
7. 回到 `WorkspacePage` 触发 `refresh()`。

### 错题维护链路

1. `WorkspacePage` 通过 `listWrongQuestions()` 拉取列表。
2. `mapWrongQuestionItem()` 统一前端展示字段。
3. 用户可编辑、删除、收藏、修改状态。
4. 状态更新通过 `updateWrongQuestion()` 回写后端。

### 打印链路

1. `PrintPage` 拉取候选错题并做筛选。
2. 为每题配置打印/练习参数。
3. 需要时触发举一反三生成。
4. 预览组合结果。
5. 调用 `/api/print-pack/export` 导出 PDF。

## 已知 Drift

- `src/services/studentDemo.js` 仍保留本地 demo 数据与学期 helper；当前主链路已明显以真实 API 为主，但部分 fallback 逻辑仍会引用它。
- 存在旧的 `src/pages/management/WorkspacePage.jsx`，它使用一组不带显式 admin token 的老 helper；当前正式管理端路由已切到 `src/pages/admin/*`。
- 设计文档里对 `/analysis` 的定位比当前代码更独立，运行时代码尚未完全匹配。

## 开放问题 / 风险

- API wrapper 目前是单文件聚合，随着接口增长，后续可能需要按领域拆分。
- `WorkspacePage` 与 `useComposer` 仍承担较多流程状态，若继续扩功能，可能需要把录入链路拆成更明确的状态机或子模块。
- 前端图片与 SVG 兼容策略较多依赖容错，真实保真度仍取决于后端和导出链路。

## 来源

- `src/main.jsx`
- `src/app/App.jsx`
- `src/components/layout/AppFrameLayout.jsx`
- `src/components/layout/AdminLayout.jsx`
- `src/context/TermContext.jsx`
- `src/services/api.js`
- `src/pages/workspace/WorkspacePage.jsx`
- `src/pages/workspace/hooks/useComposer.js`
- `src/pages/PrintPage.jsx`
- `src/pages/ProfilePage.jsx`
- `docs/48-capture-composer-layout-cleanup.md`
