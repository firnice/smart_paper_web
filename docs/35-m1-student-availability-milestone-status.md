# 35-m1-student-availability-milestone-status

## 目的

把学生端 M1（可用性收口）从“零散修复”切到“里程碑视角”，明确哪些已经完成，哪些还没完成，避免后续继续碎片化推进。

## M1 当前状态（2026-03-18）

### 已完成

#### 1. `/profile` 我的页已去 mock
- 已切到真实学生 session + 真实统计接口
- 见：`31-profile-page-real-data-cutover.md`

#### 2. 首页 / 工作台 / 我的页核心统计口径已开始统一
- 工作台使用：
  - `total_wrong_questions`
  - `new_count`
  - `reviewing_count`
  - `mastered_count`
  - `study_records_count`
- 首页已修正，不再拿最近列表长度冒充总数
- 首页已改为展示：
  - 复习中
  - 掌握率
  - 新错题
  - 累计练习
- 见：`33-dashboard-count-semantic-fix.md`
- 见：`34-homepage-stats-semantic-alignment.md`

#### 3. 底部导航 / 首页跳转 / 登录态守卫已确认一致
- 路由统一由 `StudentGate` 守卫控制
- 未登录时根路由会跳转到 `/student/login`
- 登录后根路由会跳转到 `/home`
- 底部导航当前仅暴露：
  - `/home`
  - `/student/dashboard`
  - `/bank`
  - `/print`
  - `/profile`
- `InsightsPage` 虽然仍存在文件，但当前不在路由和导航中，不属于学生可见主入口

#### 4. 学生登录页环境定位更明确
- 明确标注为“测试环境 / 联调账号入口”
- 明确说明：
  - 登录接口是真实后端接口
  - 账号仍是联调测试账号
  - 不应误解为正式学生账号体系

## 仍未完成

### 1. 学生工作台内部还需要继续清点“临时联调用语”
重点关注：
- 是否还有容易让用户误解的演示式提示
- 是否还有只为方便联调保留的临时入口
- 是否还有统计说明口径和首页 / 我的页不一致的地方

重点文件：
- `src/pages/student/StudentDashboardPage.jsx`
- `src/pages/PracticePage.jsx`
- `src/pages/PrintPage.jsx`

### 2. 仍需做一次学生端入口级手动验收
建议最少走一遍：
- 学生登录 → 首页
- 首页 → 工作台
- 工作台 → 错题详情
- 工作台 / 错题本 → 打印
- 底部导航 → 我的页
- 退出登录 → 再次访问受保护页面

## 当前判断

M1 已经从“明显 mock 混杂”进入“收尾与验收阶段”。

接下来不应立刻扩到家长端或管理端；更合适的是继续把学生端剩余临时文案、入口说明、手动验收说明补齐，然后再宣布 M1 结束。

## 建议下一任务

### Task-M1-Next
对 `StudentDashboardPage` 做一次“联调/临时/误导性文案”清点与收口，并补一份学生端入口级手动验收说明。
