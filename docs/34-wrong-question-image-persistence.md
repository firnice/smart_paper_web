# 34-wrong-question-image-persistence

## 背景

学生工作台已经支持：
- OCR 识别题目
- 图示抠图 / SVG 生成
- 图片精修

但此前保存错题时，前端没有把当前图片写入后端错题表，导致：
- 编辑器里看得到图
- 保存后错题列表里可能丢图

## 本次修复

### 后端
为 `wrong_questions` 增加字段：
- `image_url`
- `image_name`

并在创建 / 查询接口中打通。

### 前端
在 `StudentDashboardPage` 中：
- 保存错题时提交 `image_url: form.image_data`
- 保存错题时提交 `image_name: form.image_name`
- 列表读取错题时回填到 `image_data / image_name`

## 当前实现说明

当前走的是**最短闭环方案**：
- 直接把当前图片数据（可能是 data URL，也可能是后端静态 URL）挂在错题记录上
- 先保证“保存后不丢图”

后续如果图片体积或存储策略需要优化，再升级为独立上传和静态资源持久化方案。
