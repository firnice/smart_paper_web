# Data Model

## 摘要

本页描述的是“前端观察到的领域对象与派生视图”，不是数据库 schema。重点是说明页面、session 和接口之间实际传递什么概念。

## 核心实体

### 1. Student Session

存储位置：

- `localStorage["smart_paper_student_session"]`

前端已知结构至少包括：

- `session_token`
- `student`
  - `id`
  - `name`
  - `student_profile`
    - `grade`
    - `class_name`
    - `birth_date`
    - `student_no`
    - `school_name`

用途：

- 路由守卫
- 注入 `X-Student-Token`
- 推断当前默认学期
- 在 `ProfilePage` 中展示与编辑基础资料

### 2. Admin Session

存储位置：

- `localStorage["smart_paper_admin_session"]`

前端已知结构至少包括：

- `session_token`
- `role`

用途：

- `/admin/*` 守卫
- 注入 `X-Admin-Token`

### 3. SchoolTerm

来源：

- `GET /api/school-terms`

前端已知字段：

- `id`
- `name`

用途：

- `TermContext` 中维护当前学期
- 作为错题列表、统计和打印过滤条件

### 4. Subject / WrongQuestionCategory / ErrorReason

来源：

- `/api/subjects`
- `/api/wrong-question-categories`
- `/api/error-reasons`

前端用途：

- 录入时自动填充候选项
- 工作台筛选
- 错题编辑表单

### 5. WrongQuestion

这是当前前端最重要的业务实体。`mapWrongQuestionItem()` 把后端响应整理成统一展示对象。

前端归一化后会使用这些字段：

- `id`
- `title`
- `content`
- `subject` / `subject_id`
- `term`
- `grade`
- `category` / `category_id`
- `error_reason`
- `error_reason_ids`
- `status`
  - `new`
  - `reviewing`
  - `mastered`
- `difficulty`
- `notes`
- `is_bookmarked`
- `error_count`
- `image_data`
- `svg_data`
- `original_image_data`

图像相关语义：

- `image_data`：当前题图或后端返回图片地址
- `svg_data`：优先使用 SVG 或图像资源作为配图展示
- `original_image_data`：尽量保留原题来源图，支持详情和重绘链路

### 6. StudyRecord

与 `WrongQuestion` 绑定。

前端已知结果枚举：

- `correct`
- `incorrect`
- `skipped`

用途：

- 练习结果回填
- 统计聚合
- 错题状态回流

### 7. StatisticsOverview

前端在 `buildStats()` 中使用的摘要字段包括：

- `total_wrong_questions`
- `mastered_count`
- `reviewing_count`
- `new_count`
- `study_records_count`
- `total_error_count`

这些字段会被转成：

- 总题数
- 未掌握 / 复习中 / 已掌握
- 掌握率
- 总复习次数

### 8. TrendAnalysis

来源：

- `/api/analysis/trend`

前端当前只把它当作分析能力入口和结果列表来源，没有在主路由中形成独立稳定页面。

### 9. ModelProvider / Agent / LlmLog

这是管理侧三组关键对象：

- `ModelProvider`
  - `id`
  - `name`
  - `base_url`
  - `api_key_masked`
  - `is_active`
  - `models`
- `Agent`
  - `node_name`
  - `display_name`
  - `provider`
  - `model`
  - `temperature`
  - `timeout_seconds`
  - `is_enabled`
  - `system_prompt`
  - `user_prompt_template`
- `LlmLog`
  - `id`
  - `called_at`
  - `agent_node`
  - `provider`
  - `model`
  - `status`
  - `elapsed_ms`
  - `input_tokens`
  - `output_tokens`
  - `error_message`

## 瞬时前端模型

### Composer State

`useComposer()` 内部维护一套临时录入对象：

- 原始图片
- 纸面裁剪框
- OCR 结果列表
- 每题的分析结果
- SVG 配图 prompt 与裁剪区域
- 批量保存进度

这套状态是交互驱动的 transient model，不是长期持久化对象。

### Print Config State

`PrintPage` 维护：

- 选题 ID 列表
- 题目展示模式
- 练习配置
- AI 生成题的预览状态
- 导出 URL

它同样属于前端工作流状态，而非后端实体本身。

## 已知 Drift

- `src/services/studentDemo.js` 仍保留一套 demo DB 结构和若干种子题，说明仓库曾经支持或计划支持纯前端 demo 数据源；当前主页面已经不以它为主数据来源。
- 产品文档更偏 `parent` 单角色，但数据模型仍以 `student` 对象为中心组织。

## 开放问题 / 风险

- 错题的完整后端字段并不在当前仓库中，前端只展示了实际用到的子集。
- 图像字段在 `image_url`、`svg`、`original_image_url`、本地缓存之间切换，后续若要标准化，需要补一页专门的媒体字段规范。

## 来源

- `src/utils/studentSession.js`
- `src/utils/adminSession.js`
- `src/context/TermContext.jsx`
- `src/pages/workspace/mappers.js`
- `src/pages/workspace/WorkspacePage.jsx`
- `src/pages/workspace/hooks/useComposer.js`
- `src/pages/PrintPage.jsx`
- `src/pages/ProfilePage.jsx`
- `src/pages/admin/AgentConfigPage.jsx`
- `src/pages/admin/ProvidersPage.jsx`
- `src/pages/admin/LlmLogsPage.jsx`
- `src/services/studentDemo.js`
