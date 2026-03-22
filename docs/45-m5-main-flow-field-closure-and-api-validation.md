# 45-m5-main-flow-field-closure-and-api-validation

## 背景

Smart Paper 当前的核心开发里程碑是：

- **M5：学生错题主链路闭环**

主链路目标是把下面这条线真正收成连续可用体验：

`录入/上传 → 错题保存 → 错题详情 → 打印 → 练习回填 → 状态/统计回流`

在进入本轮之前，项目表面上已经有：

- 工作台录入
- 错题详情页
- 打印页
- 练习回填页
- 首页 / 我的页 / 工作台统计

但从代码审查来看，主链路里仍然存在一种高风险状态：

- 页面和 docs 看起来像是通的
- 实际字段契约和导出兼容性还存在断点

所以这一轮的目标不是继续发散新功能，而是优先做：

1. **字段闭环审计**
2. **关键断点修复**
3. **基于真实 API 的主链路验证**

---

## 本轮关注范围

### 字段闭环
重点检查：

- 错题创建时是否能保存图片字段
- 错题列表 / 详情是否能返回图片字段
- 前端各页面是否能稳定显示持久化图片
- 打印导出是否能消费带图错题
- 回填后状态和统计是否会回流

### 验证链路
本轮按以下顺序验证：

1. 创建带图错题
2. 列表读取
3. 详情读取
4. 打印导出
5. 提交练习记录
6. 检查错题状态
7. 检查统计回流

---

## 本轮发现的问题

### 问题 1：错题创建 schema 未声明图片字段

前端 `StudentDashboardPage` 保存错题时已经会提交：

- `image_url`
- `image_name`

但后端 `WrongQuestionCreate` schema 原先未定义这两个字段。

这会导致一个典型断链：

- 工作台录入阶段看似有图
- 但创建时图片字段可能不会真正进入后端契约
- 后续详情 / 打印 / 回填就会失去基础图片数据

### 问题 2：错题响应序列化未返回图片字段

即使数据库模型和响应 schema 已经存在：

- `image_url`
- `image_name`

后端 `_serialize_wrong_question()` 之前也没有把这两个字段写回响应。

这会导致：

- 错题已保存
- 数据库里有图
- 但列表和详情接口返回时前端仍拿不到图

这会直接影响：

- 工作台卡片
- 错题本
- 首页最近错题
- 错题详情页
- 回填页
- 打印页

### 问题 3：前端未统一归一化持久化图片地址

前端页面虽然会读取 `image_url`，但主链路多个页面之前没有统一做资源地址归一化。

潜在问题包括：

- `/static/...` 相对路径在前端 dev server 场景下可能走错 host
- `http://localhost:8000/static/...` 这种绝对路径在某些运行环境下会与页面访问 host 不一致
- `data:` URL 与静态 URL 的处理口径不一致

这会导致：

- 字段存在
- 但图片实际展示仍不稳定

### 问题 4：打印导出对 SVG data URL 不兼容

本轮真实 API 验证时发现：

- 带图错题创建、列表、详情都已通过
- 但打印导出最初失败

根因有两层：

#### 4.1 `data:` URL 解析只按 base64 处理
导出服务对 `data:` URL 初版只做了：

- `base64.b64decode(data)`

这无法兼容：

- URL-encoded SVG data URL

#### 4.2 就算读到 SVG，ReportLab 也不一定能直接嵌入
也就是说，如果图片本身是 SVG data URL：

- 不能因为这张图不支持就让整份打印包直接失败

否则主链路会在“打印”这一步被单张图片格式打断。

---

## 本轮修复

### 修复 1：创建 schema 接入图片字段

后端文件：

- `smart_paper_service/app/schemas/wrong_questions.py`

为 `WrongQuestionCreate` 增加：

- `image_url: Optional[str]`
- `image_name: Optional[str]`

结果：

- 工作台创建带图错题时，图片字段能够进入后端创建契约

---

### 修复 2：错题响应补回图片字段

后端文件：

- `smart_paper_service/app/api/routes/wrong_questions.py`

在 `_serialize_wrong_question()` 中补回：

- `image_url=item.image_url`
- `image_name=item.image_name`

结果：

- 列表接口可返回图片字段
- 详情接口可返回图片字段
- 为前端各页展示图片补齐必要前提

---

### 修复 3：前端统一归一化持久化图片地址

前端文件：

- `smart_paper_web/src/services/api.js`

新增：

- `resolveAssetUrl(url)`

处理范围：

- `data:` URL
- `/static/...`
- `http://.../static/...`

并接入主链路关键页面：

- `HomePage.jsx`
- `QuestionBankPage.jsx`
- `QuestionDetailPage.jsx`
- `PracticePage.jsx`
- `PrintPage.jsx`
- `StudentDashboardPage.jsx`

结果：

- 持久化后的图片地址在主链路页面展示更稳定
- 避免“字段明明有，但页面实际仍不显示”的假通状态

---

### 修复 4：打印导出兼容 SVG data URL，并在不支持时跳过图片而不整单失败

后端文件：

- `smart_paper_service/app/services/export_service.py`

修复内容：

#### 4.1 `data:` URL 解析兼容两类格式
- `;base64`
- URL-encoded data URL

#### 4.2 构建导出图片时增加兜底
当图片格式不被当前 PDF 流程支持时：

- 跳过该图片
- 继续生成整份 PDF

而不是：

- 直接让整个导出任务失败

结果：

- 带 SVG data URL 的错题不会再因为单张图片格式问题导致整份打印包失败

---

## 本轮真实 API 验证结果

本轮使用真实后端接口对主链路做了数据级验证。

### 测试方式
- 使用学生 `student_id=5`
- 创建一条带图测试错题
- 图片字段使用 SVG data URL
- 依次验证创建、列表、详情、打印、回填、统计

---

### Step 1：创建带图错题

#### 结果
**通过**

创建成功，响应中正确返回：

- `id`
- `image_url`
- `image_name`

说明：

- 录入保存链路已能带图片字段入库并返回

---

### Step 2：错题列表读取

#### 结果
**通过**

`GET /api/wrong-questions?student_id=5&limit=100`

可正确返回该测试题，并包含：

- `image_url`
- `image_name`
- `status = new`

说明：

- 列表链路已接住图片字段

---

### Step 3：错题详情读取

#### 结果
**通过**

`GET /api/wrong-questions/{id}`

可正确返回：

- `image_url`
- `image_name`
- `status = new`

说明：

- 详情链路已接住图片字段

---

### Step 4：打印导出

#### 初次结果
**失败**

失败原因：

- 导出服务不兼容 URL-encoded SVG data URL
- 单图异常会导致整份打印包失败

#### 修复后复测结果
**通过**

修复后 `/api/export` 返回：

- `status = completed`
- `download_url` 有值

说明：

- 打印链路已不再因 SVG data URL 整单失败

> 注：当前策略是“优先保证整份练习包可生成”。若图片格式本身不适合嵌入 PDF，则允许跳过图片，但不阻断打印主流程。

---

### Step 5：提交练习记录

#### 结果
**通过**

对同一题提交：

- `result = correct`
- `mastery_level = 4`

返回成功。

说明：

- 回填接口工作正常

---

### Step 6：错题状态回流

#### 结果
**通过**

回填后该题详情变为：

- `status = mastered`
- `last_practice_result = correct`
- `last_review_date` 已更新

说明：

- 单题状态回流正常

---

### Step 7：统计回流

#### 结果
**通过**

回填前统计：

- `total_wrong_questions = 1`
- `new_count = 1`
- `mastered_count = 0`
- `study_records_count = 0`

回填后统计：

- `total_wrong_questions = 2`
- `new_count = 1`
- `mastered_count = 1`
- `study_records_count = 1`

说明：

- 练习记录已回流到统计概览
- `mastered_count` 与 `study_records_count` 均出现合理变化

---

## 当前结论

经过本轮修复与真实 API 验证，M5 主链路中最关键的“字段闭环 + 状态闭环”已经明显收口：

### 已验证打通
- 带图错题创建
- 列表读取图片字段
- 详情读取图片字段
- 回填练习记录
- 单题状态回流
- 统计回流
- 打印导出不再因 SVG data URL 整单失败

### 当前阶段判断
M5 已经从“页面大体具备”推进到：

- **关键后端字段契约已收口**
- **主链路 API 级闭环已验证通过**

这意味着当前项目不再只是“看上去有流程”，而是已经有了一条可验证、可追踪、可继续往 UI 实测推进的主链路。

---

## 当前仍需继续关注

### 1. UI 级真实页面验证
本轮重点是 API 与字段闭环验证，仍建议后续补一轮页面级手动验证，关注：

- 工作台卡片显示是否符合预期
- 详情页图片显示是否稳定
- 打印页对不同图片类型展示是否一致
- 回填页状态提示是否符合用户理解

### 2. 图片持久化策略仍是“短闭环优先”
当前允许 `image_url` 直接保存：

- data URL
- 静态资源 URL

这对当前里程碑是合理的，但后续如进入更正式的交付阶段，仍可考虑继续升级：

- 统一独立上传
- 统一静态资源路径
- 限制过大 data URL 直接入库

### 3. 打印对“不支持直接嵌入 PDF 的图片格式”当前是容错而非完整保真
当前导出策略是：

- 不中断主流程优先
- 必要时跳过不支持图片

这适合当前阶段，但后续如果要求“打印必须保真带图”，还可继续演进：

- 在导出前把 SVG 转成 PNG
- 或在生成卡片时统一落成可打印格式

---

## 本轮相关提交

### smart_paper_service
- `fix: allow wrong-question image fields on create`
- `fix: include wrong-question image fields in responses`
- `fix: tolerate svg data urls in export pipeline`

### smart_paper_web
- `fix: normalize persisted wrong-question asset urls`

---

## 建议下一步

### 下一轮更合适的方向
从“字段闭环”转向“页面体验收口”，优先做：

1. 学生工作台残余临时文案 / 临时入口清理
2. 页面级主链路手动验收留痕
3. 打印与回填之间的交互连续性再优化

一句话：

> **M5 的后端与字段主干已经基本打通，下一步更适合继续做学生端页面体验收口。**
