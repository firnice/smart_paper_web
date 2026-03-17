# 33-dashboard-count-semantic-fix

## 背景

学生工作台 `StudentDashboardPage` 中，错题卡片曾把：

- `error_count`（累计出错次数）
- `review_count`（练习 / 回填次数）

错误地混成了同一个值。

具体问题：
- `mapWrongQuestionItem()` 中把 `review_count` 映射成了 `item.error_count`
- 这会导致前端把“错次”误当成“练习次数”

## 正确语义

### 1. 错次 `error_count`
来源：`WrongQuestion.error_count`

语义：
- 这道题累计出错多少次
- 在再次做错时会继续增加

### 2. 练习次数 / 回填次数
来源：`StudyRecord` 列表

前端当前口径：
- `(studyRecordMap[item.id] || []).length`

语义：
- 这道题一共被回填/练习了多少次
- 与 `error_count` 不是一回事

## 本次修复

- 将 `StudentDashboardPage` 中错误的 `review_count: item.error_count` 修正为独立值
- 在错题卡片元信息区明确展示：
  - `错次`
  - `练习次数`

## 影响

修复后，学生工作台不会再把“错次”误显示成“练习次数”，统计语义更清晰，也能减少首页 / 我的页 / 工作台之间的口径混乱。
