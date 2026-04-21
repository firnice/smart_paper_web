# Current Phase And Constraints

## 摘要

当前仓库的强约束不是“把所有后端和产品能力一次做全”，而是先把 UI、交互主链路和前端工作台做成可确认、可演示、可继续承接 backend 落地的状态。

## 当前阶段

来自 `AGENTS.md` 的仓库阶段约束：

- 当前处于 `interaction/UI-first` 交付阶段
- 先确认交互和界面，再扩展 backend
- backend 能力未完全定型时，前端要保持 demo-friendly

这意味着：

- 前端知识层应优先描述当前交互主链路，而不是假设未来全量能力已经完成
- 文档中必须明确区分“已经跑通的页面”与“设计文档中的下一阶段意图”

## 当前事实

- 当前真实主入口仍是 `App.jsx` 中定义的几条核心路由。
- `/capture` 与 `/workspace` 已经形成录入与整理的主链路。
- `/print` 已经是独立工作台，而不是附属功能按钮。
- `/analysis` 还没有形成独立稳定页面，当前重定向到 `/profile`。
- 管理后台已单独成壳，但它仍是前端壳层，真实权限与配置结果依赖后端。

## 当前设计方向

从 `docs/46-48` 可以看到当前明确方向：

- 产品从分散 tab 转向“工作台中心化”
- 录入、整理、打印共用一份数据
- 设备差异只影响默认入口和布局，不影响核心功能集合
- 角色语义朝单角色 `parent` 收敛

这几条方向对知识层有两个影响：

- 需要把它们作为“产品意图”记录下来
- 不能把它们自动写成“已全部落地”

## 仓库级约束

- 只编辑本 repo，不修改父目录
- 命令在 repo root 执行
- `dist/`、`node_modules/` 不入库
- 文档和知识层优先保留在 `docs/`
- 根级 `CLAUDE.md` 是 schema 例外

## 已知 Drift

- 代码还在大量使用 `student` 术语，但产品文档更偏 `parent` 语义。
- 旧页面与旧路由兼容逻辑仍存在，因此“仓库里有文件”不等于“当前产品仍在用”。
- `README.md` 与设计文档提供的是不同时间层的视图，知识层必须显式区分。
- 管理端登录文件存在，但当前路由没有显式挂载 `/admin/login`，未登录管理访问会落回普通 `/login`。

## 当前主要风险

- UI-first 阶段容易让文档把“演示友好”误写成“后端已稳定”，需要持续避免这种表述。
- 如果后续开始大规模清理旧页面，而知识层不跟进，`repo-layout` 和 `document-map` 会很快失真。
- 如果要真正落地 `parent` 单角色，需要同步处理 session key、API 命名、页面文案和路由兼容。

## 下一轮更可能的维护动作

- 把分析模块从 `/profile` 中拆出来或明确放弃独立页面。
- 清理旧页面目录并更新当前路由文档。
- 为 admin surface 建独立知识页，避免它继续和学生侧混在一起。

## 来源

- `AGENTS.md`
- `src/app/App.jsx`
- `src/components/layout/AppFrameLayout.jsx`
- `docs/45-m5-main-flow-field-closure-and-api-validation.md`
- `docs/46-v2-frontend-redesign.md`
- `docs/47-parent-single-role-adaptive-design.md`
- `docs/48-capture-composer-layout-cleanup.md`
