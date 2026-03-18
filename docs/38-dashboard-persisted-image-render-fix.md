# 38-dashboard-persisted-image-render-fix

## 背景

学生工作台 `StudentDashboardPage` 中，错题卡片支持渲染图片：

- `item.image_data`
- `item.image_name`

但在把后端 `WrongQuestionResponse` 映射成前端卡片对象时，`mapWrongQuestionItem()` 之前始终写死：

- `image_data: ""`
- `image_name: ""`

这会导致一个真实问题：

- 用户在工作台录入带图错题并保存后
- 后端其实已经持久化了 `image_url / image_name`
- 但前端重新刷新列表时，工作台卡片仍然不显示图片

于是主链路会出现割裂：

- 录入时有图
- 保存后回到工作台列表却像“没图”

这会直接影响 M2 的：

`录入 → 错题卡片 → 维护 → 练习回流`

## 本次修复

在 `mapWrongQuestionItem()` 中改为接入后端真实字段：

- `image_data: item.image_url || ""`
- `image_name: item.image_name || ""`

这样工作台列表卡片会直接复用后端保存的图片地址。

## 结果

修复后：

- 已保存的带图错题，刷新后仍能在工作台卡片看到图片
- 工作台列表、错题详情页、结果回填页三处图片展示语义更一致
- 学生端主链路里“带图错题保存后丢图”的体验断点被收口

## 说明

这里前端字段名虽然仍叫 `image_data`，但实际承载的已经可能是：

- 本地 data URL（录入中临时预览）
- 后端持久化后的 `image_url`

后续如果继续做字段契约清理，可以考虑把前端命名进一步区分为：

- `image_preview`
- `image_url`

以减少“预览数据”和“持久化地址”混用造成的理解成本。
