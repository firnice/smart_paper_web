# 31-profile-page-real-data-cutover

## 背景

学生端 `/profile`（“我的”页）此前仍为 mock 页面：

- 写死“本月已记录 142 道错题”
- 写死“正确率 78%”
- 写死“坚持天数 14”
- 写死“新增错题 42 / 已解决 26 / 练习次数 58”
- 各科表现与近期成就也均为前端常量

这会让用户误以为页面已接真实数据，实际却只是静态展示。

## 本次改动

将 `/profile` 改为真实数据口径页面，数据来源如下：

### 1. 学生身份信息
来源：本地学生登录 session

文件：
- `src/utils/studentSession.js`

读取字段：
- `student.name`
- `student.student_profile.grade`
- `student.student_profile.student_no`
- `student.student_profile.school_name`
- `student.student_profile.class_name`

### 2. 错题与学习统计
来源：后端统计接口

接口：
- `GET /api/statistics/overview?student_id=<id>`

前端调用：
- `getStatisticsOverview(studentId)`

当前使用字段：
- `total_wrong_questions`
- `mastered_count`
- `reviewing_count`
- `new_count`
- `study_records_count`
- `subject_breakdown`
- `trend`

### 3. 最近错题
来源：错题列表接口

接口：
- `GET /api/wrong-questions?student_id=<id>&limit=6`

前端调用：
- `listWrongQuestions({ student_id: studentId, limit: 6 })`

当前使用字段：
- `id`
- `title`
- `subject.name`
- `updated_at / created_at`
- `status`
- `error_reasons[].name`

## 页面口径说明

### 掌握率
计算方式：

`mastered_count / total_wrong_questions`

说明：
- 这不是“答题正确率”
- 它表示当前错题库里，已经进入 `mastered` 状态的占比

### 最近 7 次学习趋势
来源：
- 统计接口返回的 `trend`

展示内容：
- 每日总学习次数 `total`
- 做对次数 `correct_count`
- 做错次数 `incorrect_count`

### 各科学习情况
来源：
- `subject_breakdown`

展示内容：
- 每科总错题数 `total`
- 每科已掌握数 `mastered`
- 进度条 = `mastered / total`

## 结果

`/profile` 页面已不再展示写死 mock 数值，改为基于当前登录学生和真实统计接口动态渲染。

## 后续建议

1. 如果产品需要“坚持天数”，应由后端新增明确字段或单独统计接口，不要前端猜。
2. 如果产品需要“本周新增 / 本周解决”，应基于明确时间范围统计，不要继续使用静态文案。
3. 学生端所有页面应统一统计口径，避免首页、工作台、我的页出现不同含义的“正确率/掌握率”。
