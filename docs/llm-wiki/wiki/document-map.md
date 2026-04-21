# Document Map

## 摘要

`docs/` 目录目前更像“连续的开发记录与设计决策集合”，不是统一维护的手册。阅读时需要先判断某篇文档是：

- 修复记录
- 阶段验收
- 设计方向
- 联调/部署约束

## 高价值文档分组

### 运行约束

- `docs/CODE_LAYOUT.md`
  - 目录规范，仍然有效，但覆盖面偏基础
- `docs/49-nginx-reverse-proxy-entry.md`
  - 当前同域代理和 `/api`、`/static` 入口约束的重要说明

### 鉴权、入口与学生主链路修复

- `docs/30-auth-entry-and-routing-hotfix.md`
- `docs/31-profile-page-real-data-cutover.md`
- `docs/32-student-surface-mock-audit.md`
- `docs/35-m1-student-availability-milestone-status.md`
- `docs/36-student-main-flow-manual-validation.md`

这些文档适合回答：

- 登录守卫是怎么收口的
- 学生侧哪些页面已经去 mock
- 主链路曾经做过哪些人工验收

### 统计、图片和详情链路闭环

- `docs/33-dashboard-count-semantic-fix.md`
- `docs/34-homepage-stats-semantic-alignment.md`
- `docs/34-wrong-question-image-persistence.md`
- `docs/35-student-image-display-follow-through.md`
- `docs/36-student-image-surface-completion.md`
- `docs/37-dashboard-study-record-total-fix.md`
- `docs/38-dashboard-persisted-image-render-fix.md`
- `docs/39-practice-page-status-feedback-fix.md`
- `docs/40-use-detail-endpoint-for-question-pages.md`
- `docs/43-question-bank-image-render-fix.md`
- `docs/44-print-to-practice-next-step-link.md`
- `docs/45-m5-main-flow-field-closure-and-api-validation.md`

这些文档适合回答：

- 错题图片字段是如何补齐的
- 统计口径怎么统一的
- 详情页与练习页为何改用详情接口
- 打印与回填主链路是否打通

### 管理端与扩展能力

- `docs/41-management-entry-route-exposed.md`
- `docs/42-management-study-target-selection-fix.md`

这些文档说明了管理台入口从隐藏到显式暴露的过程，但当前正式管理端能力还需要配合 `src/pages/admin/*` 代码一起看。

### 产品与交互方向文档

- `docs/46-v2-frontend-redesign.md`
- `docs/47-parent-single-role-adaptive-design.md`
- `docs/48-capture-composer-layout-cleanup.md`

这些文档适合回答：

- 为什么产品从多 tab 形态转向工作台中心化
- 为什么产品语义向单角色 `parent` 收敛
- 录入弹窗的布局与响应式意图是什么

它们更偏“设计方向 + 局部已落地”，不能直接当作当前代码真相。

## 优先阅读顺序

如果要快速理解当前仓库，建议顺序：

1. `README.md`
2. `docs/CODE_LAYOUT.md`
3. `docs/45-m5-main-flow-field-closure-and-api-validation.md`
4. `docs/47-parent-single-role-adaptive-design.md`
5. `docs/49-nginx-reverse-proxy-entry.md`
6. 再回到 `src/app/App.jsx` 和具体页面代码验证

## 已知 Drift

- 一些较早文档会使用 `/home`、`/student/dashboard` 等旧路由名称。
- 设计文档中的路由与角色描述，比当前代码更“未来态”。
- `README.md` 的路由列表已经不是完整的当前运行时地图。

## 开放问题 / 风险

- `docs/` 缺少总索引页，新人很容易把编号顺序误读成“全部仍然有效且同等优先”。
- 若后续做大范围重构，建议补一个面向当前状态的 `docs/README.md` 或继续依赖 `docs/llm-wiki/index.md` 做入口。

## 来源

- `README.md`
- `docs/CODE_LAYOUT.md`
- `docs/30-auth-entry-and-routing-hotfix.md`
- `docs/35-m1-student-availability-milestone-status.md`
- `docs/36-student-main-flow-manual-validation.md`
- `docs/45-m5-main-flow-field-closure-and-api-validation.md`
- `docs/46-v2-frontend-redesign.md`
- `docs/47-parent-single-role-adaptive-design.md`
- `docs/48-capture-composer-layout-cleanup.md`
- `docs/49-nginx-reverse-proxy-entry.md`
