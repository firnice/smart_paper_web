# 40-use-detail-endpoint-for-question-pages

## 背景

`QuestionDetailPage` 和 `PracticePage` 之前都通过同一种方式加载单题：

1. 调 `listWrongQuestions({ student_id, limit: 100 })`
2. 再在前端列表里 `.find(id)` 找当前题目

这有一个明显的上限问题：

- 当学生错题总数超过 100 条
- 只要目标题目不在当前前 100 条里
- 详情页和回填页就会误报“错题不存在”

这不是真正的数据不存在，而是前端把“列表接口 + 分页上限”当成了“单条详情接口”。

## 现状

后端其实已经提供了单条详情接口：

- `GET /api/wrong-questions/{wrong_question_id}`

只是前端之前没有使用。

## 本次修复

### 1. 前端 API 层新增 `getWrongQuestion()`

封装：

- `getWrongQuestion(wrongQuestionId)`

### 2. `QuestionDetailPage` 改为直连单条详情接口

不再先拉 100 条列表后本地查找。

同时补了一层学生身份校验：

- 若返回的错题不属于当前登录学生
- 前端直接报“无权访问这道错题”

### 3. `PracticePage` 也改为直连单条详情接口

这样练习回填页不会再受列表分页影响。

## 结果

修复后：

- 错题详情页不会因错题总量超过 100 条而误报不存在
- 练习回填页不会因分页截断而打不开旧题
- 页面职责更清晰：
  - 列表页用列表接口
  - 单题页用单题详情接口

这属于 M2 的字段/接口契约收口：

- 不再把分页列表接口冒充单条详情来源
- 让“错题卡片 → 详情 → 回填”链路更稳定
