# 34-homepage-stats-semantic-alignment

## 背景

学生首页 `HomePage` 虽然已经接了真实统计接口，但仍有两个会误导用户的点：

1. `pendingCount` 用的是 `questions.length`
   - 这个值只来自 `listWrongQuestions({ limit: 20 })`
   - 实际是“最近拉到的列表条数”，不是学生全部错题总数
2. 首页卡片口径与工作台、`/profile` 不完全一致
   - 工作台/我的页使用 `total_wrong_questions`、`mastered_count`、`reviewing_count`、`new_count`、`study_records_count`
   - 首页此前只展示“待复习 / 已掌握”，缺少对“掌握率”和“累计练习”语义的明确说明

## 本次改动

### 1. 首页总数改为真实统计口径

使用 `getStatisticsOverview(studentId)` 返回的字段：

- `total_wrong_questions`
- `mastered_count`
- `reviewing_count`
- `new_count`
- `study_records_count`

不再使用“最近列表长度”充当总数。

### 2. 统一首页核心指标文案

首页改为展示：

- `复习中`
- `掌握率`
- `新错题`
- `累计练习`

并补充说明：

- 掌握率 = `mastered_count / total_wrong_questions`
- 累计练习 = `study_records_count`
- 学习记录次数不等于错次

### 3. 首页顶部摘要同步统一

顶部摘要改为：

- `累计练习 X 次，已掌握 Y / Z 道错题`

这样和 `/profile`、学生工作台的统计解释保持一致。

## 结果

学生端首页不再因为列表分页限制而低估总量；同时，首页、工作台、我的页对核心统计的含义更一致，能减少“总数 / 掌握率 / 练习次数”被误解的风险。
