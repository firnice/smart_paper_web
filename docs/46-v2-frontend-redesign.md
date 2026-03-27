# 46 - V2 前端交互重构方案

## 背景

V2 产品重设计要求将前端从"5 tab 分散式"转变为"工作台中心化 + 中央录入"的新交互模式。本文档详细描述前端重构的技术方案。

产品设计全文见: `lf-smart-paper-service/docs/product/05-v2-product-redesign.md`

## 核心改动概览

### 路由变更

| V1 路由 | V1 页面 | V2 状态 |
|---------|---------|---------|
| `/home` | HomePage（纯统计） | **删除** — 统计移入工作台顶部和"我的" |
| `/student/dashboard` | StudentDashboardPage（工作台） | **保留+重构** — 成为核心页面 |
| `/bank` | QuestionBankPage（题库） | **删除** — 功能合并到工作台 |
| `/print` | PrintPage（打印） | **删除** — 融入快速训练和批量回归流程 |
| `/profile` | ProfilePage（我的） | **保留+重构** — 增加统计和消息 |
| `/upload` | UploadPage（上传） | **删除** — 改为中央录入按钮触发 |
| `/question/:id` | QuestionDetailPage | **保留** — 错题详情 |
| `/practice/:id` | PracticePage | **保留** — 练习页面 |

### 新路由结构

```javascript
// App.jsx 新路由
<Route element={<AppFrameLayout />}>
  {/* 核心页面 */}
  <Route path="/workspace" element={<WorkspacePage />} />      // 新版工作台
  <Route path="/mine" element={<MinePage />} />                 // 新版我的

  {/* 功能页面（从工作台进入） */}
  <Route path="/question/:id" element={<QuestionDetailPage />} />
  <Route path="/practice/:id" element={<PracticePage />} />
  <Route path="/practice/batch" element={<BatchPracticePage />} /> // 新增：批量练习
</Route>
```

### 底部导航重构

```
V1:  [首页] [工作台] [错题本] [打印] [我的]

V2:  [工作台]  [📷 录入]  [我的]
```

## 组件拆分方案

### 现状问题

`StudentDashboardPage.jsx` 当前约 2960 行，包含了：
- 错题列表展示
- 录入表单（OCR + 分析）
- 筛选逻辑
- 统计展示
- 打印功能

### 拆分目标

```
src/
  pages/
    workspace/                        // 新版工作台
      WorkspacePage.jsx               // 主页面（容器组件，< 200 行）
      components/
        StatsBar.jsx                  // 顶部统计指标栏
        QuestionList.jsx              // 错题列表（含分页/加载更多）
        QuestionCard.jsx              // 单条错题卡片
        FilterBar.jsx                 // 筛选栏（学科/学期/掌握状态）
        QuickTrainModal.jsx           // 快速训练弹窗
        BatchPracticeModal.jsx        // 批量回归弹窗
        VariantPreview.jsx            // 举一反三预览组件

    composer/                         // 录入功能（从工作台独立）
      ComposerModal.jsx              // 录入弹窗/全屏
      components/
        PhotoCapture.jsx             // 拍照/选图
        CropArea.jsx                 // 裁剪区域选择
        OcrResult.jsx                // OCR 识别结果
        AnalysisForm.jsx             // LLM 分析结果表单
        MultiQuestionSplit.jsx       // 多题拆分

    mine/                            // 新版"我的"
      MinePage.jsx
      components/
        UserHeader.jsx               // 头像/姓名/年级
        StatsOverview.jsx            // 统计总览
        SubjectChart.jsx             // 学科分布图
        TrendEntry.jsx               // 趋势分析入口
        MessageBadge.jsx             // 消息红点

    practice/                        // 练习相关
      PracticePage.jsx               // 已有，保留
      BatchPracticePage.jsx          // 新增：批量练习页
```

## 工作台页面详细设计

### WorkspacePage.jsx 结构

```jsx
function WorkspacePage() {
  return (
    <div className="workspace-page">
      {/* 顶部统计 */}
      <StatsBar />

      {/* 筛选栏 */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
      />

      {/* 错题列表 */}
      <QuestionList
        filters={filters}
        onMasteryToggle={handleMasteryToggle}
        onQuickTrain={handleQuickTrain}
      />

      {/* 快速训练弹窗 */}
      <QuickTrainModal
        visible={trainModalVisible}
        question={selectedQuestion}
        onClose={() => setTrainModalVisible(false)}
      />

      {/* 批量回归弹窗 */}
      <BatchPracticeModal
        visible={batchModalVisible}
        questions={filteredQuestions}
        onClose={() => setBatchModalVisible(false)}
      />
    </div>
  );
}
```

### QuestionCard 卡片设计

```
┌────────────────────────────────────┐
│ [数学] [三年级上]     [未掌握 🔴]  │
│                                    │
│ 题目文字内容...                     │
│                                    │
│ ┌──────────────────────────┐      │
│ │      题目图片             │      │
│ └──────────────────────────┘      │
│                                    │
│ 📎 查看原题照片                    │
│                                    │
│ ┌──────────┐  ┌──────────────┐   │
│ │ ✅ 已掌握 │  │ 🏋️ 快速训练  │   │
│ └──────────┘  └──────────────┘   │
└────────────────────────────────────┘
```

### FilterBar 筛选栏设计

```
┌──────────────────────────────────────────┐
│ [全部|未掌握|已掌握]  [学科▼]  [学期▼]   │
└──────────────────────────────────────────┘
```

- **掌握状态** — Segmented Control（类似 iOS 分段控件）
- **学科** — Dropdown，选项从 `GET /api/subjects` 获取
- **学期** — Dropdown，默认当前学期（`getDefaultSchoolTerm()`），选项从 `getTermOptions(grade)` 生成

### 快速训练弹窗

```
┌──────────────────────────────┐
│         快速训练               │
│                               │
│  📄 单条打印                  │
│     仅打印此题，可手写练习     │
│                               │
│  🔄 举一反三                  │
│     AI 生成同类型题目          │
│                               │
│         [取消]                │
└──────────────────────────────┘
```

点击"举一反三"后：
1. 调用 `POST /api/variants/generate-for-question`
2. 展示生成的变式题列表
3. 提供"打印变式题"按钮

### 批量回归弹窗

```
┌──────────────────────────────┐
│       重新练习                 │
│                               │
│  👆 人工选择                  │
│     自由勾选要练习的题目       │
│                               │
│  🎲 随机选择                  │
│     ├ 全部未掌握题目           │
│     └ 自定义数量: [__10__]    │
│                               │
│    [开始练习]  [取消]          │
└──────────────────────────────┘
```

选择后 → 调用 `POST /api/export` 生成 PDF → 下载/打印

## 中央录入按钮

### AppFrameLayout 修改

```jsx
function AppFrameLayout() {
  const [composerVisible, setComposerVisible] = useState(false);

  return (
    <div className="app-frame">
      <Outlet />

      {/* 底部导航 */}
      <nav className="bottom-nav">
        <NavLink to="/workspace" icon="📋" label="工作台" />
        <button
          className="composer-trigger"
          onClick={() => setComposerVisible(true)}
        >
          📷
        </button>
        <NavLink to="/mine" icon="👤" label="我的" />
      </nav>

      {/* 录入弹窗 */}
      <ComposerModal
        visible={composerVisible}
        onClose={() => setComposerVisible(false)}
      />
    </div>
  );
}
```

### ComposerModal 流程

```
步骤 1: 选择图片来源
  [从相册选择]  [拍照]
        ↓
步骤 2: 裁剪识别区域
  [拖拽框选]  [确认裁剪]
        ↓
步骤 3: 选择题目数量
  [单题模式]  [多题模式]
        ↓
步骤 4: OCR 识别（蒙版阻塞）
  调用 POST /api/ocr/extract
        ↓
步骤 5: LLM 分析（蒙版阻塞）
  调用 POST /api/ocr/analyze-question
  自动填充: 学科、学期、知识点、解题思路
        ↓
步骤 6: 用户确认/修改
  展示识别结果，允许修正
        ↓
步骤 7: 保存
  调用 POST /api/wrong-questions
```

## 样式方案

### 底部导航栏

```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: white;
  border-top: 1px solid #eee;
  z-index: 100;
}

.composer-trigger {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 24px;
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transform: translateY(-12px); /* 突出于导航栏 */
  cursor: pointer;
}
```

### 统计指标栏

```css
.stats-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
  border-radius: 12px;
  margin: 12px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #2d3748;
}

.stat-label {
  font-size: 12px;
  color: #718096;
  margin-top: 4px;
}
```

## 迁移策略

### 阶段 1: 路由重构（低风险）

1. 在 `App.jsx` 中添加新路由 `/workspace` 和 `/mine`
2. 将旧路由 `/home`、`/bank`、`/print` 重定向到 `/workspace`
3. 修改默认跳转为 `/workspace`

### 阶段 2: 组件拆分（中风险）

1. 从 `StudentDashboardPage.jsx` 中提取 `QuestionCard`
2. 提取 `FilterBar`
3. 提取 `StatsBar`
4. 提取录入逻辑到 `ComposerModal`
5. 逐步替换原有组件引用

### 阶段 3: 新功能实现（中风险）

1. 实现 `QuickTrainModal`
2. 实现 `BatchPracticeModal`
3. 实现 `VariantPreview`
4. 实现新版 `MinePage`

### 阶段 4: 清理（低风险）

1. 删除 `HomePage.jsx`
2. 删除旧的 `QuestionBankPage.jsx`（如功能已完全迁移）
3. 清理未使用的样式和组件
4. 更新 `CODE_LAYOUT.md`

## 关键文件影响清单

| 文件 | 改动类型 | 改动量 |
|------|----------|--------|
| `src/app/App.jsx` | 路由重构 | 中 |
| `src/components/layout/AppFrameLayout.jsx` | 底部导航重构 | 大 |
| `src/pages/student/StudentDashboardPage.jsx` | 拆分为多个子组件 | 大（减少） |
| `src/pages/workspace/` | 新增目录和组件 | 大（新增） |
| `src/pages/composer/` | 新增目录和组件 | 大（新增） |
| `src/pages/mine/` | 新增目录和组件 | 中（新增） |
| `src/styles/workspace.css` | 重写样式 | 中 |
| `src/data/studentDemo.js` | 可能需适配新筛选逻辑 | 小 |

## 验收标准

- [ ] 底部导航精简为 3 个入口（工作台 + 录入 + 我的）
- [ ] 工作台展示错题列表，支持筛选（掌握状态/学科/学期）
- [ ] 中央录入按钮触发录入流程，支持拍照和选图
- [ ] 单条操作：掌握标记、快速训练（单条打印 + 举一反三）
- [ ] 批量回归：人工选择 + 随机选择，生成练习卷
- [ ] "我的"页面展示统计图表和消息
- [ ] 旧路由正确重定向，无 404

---

**最后更新**: 2026-03-27
