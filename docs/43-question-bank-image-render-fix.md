# 43-question-bank-image-render-fix

## 背景

学生端 `QuestionBankPage` 的卡片模板其实已经支持图片区域：

- `question.imageUrl`
- `question.imageName`

但 `mapQuestion()` 之前没有把后端返回的：

- `image_url`
- `image_name`

映射到前端对象。

## 问题

结果就是：

- 错题本列表页代码看起来支持图片
- 但实际所有带图错题都不会在列表里显示图片

这会造成和其他页面的割裂：

- 工作台卡片有图
- 错题详情页有图
- 回填页有图
- 但错题本列表页却像“没图”

## 本次修复

在 `QuestionBankPage` 的 `mapQuestion()` 中补上：

- `imageUrl: item.image_url || ""`
- `imageName: item.image_name || ""`

## 结果

修复后：

- 错题本列表页会正确显示带图错题
- 学生端多个页面对图片展示的行为更一致
- 继续收口学生端真实链路，而不涉及家长端设计扩张
