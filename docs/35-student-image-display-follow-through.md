# 35-student-image-display-follow-through

## 背景

上一轮已打通错题图片保存链路，但展示层还没有完全跟上：
- `QuestionDetailPage`
- `QuestionBankPage`

仍然只显示文本，没有使用后端新增的 `image_url / image_name` 字段。

## 本次修复

### 错题详情页
- 读取并展示：
  - `image_url`
  - `image_name`

### 错题本列表
- 列表卡片读取并展示错题图片预览
- 没有图片时保持纯文本卡片样式

## 结果

学生在工作台保存带图错题后：
- 工作台能看到图
- 错题本能看到图
- 错题详情页也能看到图

图片链路从“保存不丢”推进到“保存后可见”。
