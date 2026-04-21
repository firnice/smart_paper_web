# LLM Wiki

这是 `lf-smart-paper-web` 的 repo-local 知识层，用来沉淀“当前代码事实、文档方向、已知 drift 和下一轮 ingest 入口”。

## 目录说明

- [`index.md`](./index.md)：导航首页
- [`log.md`](./log.md)：增量维护日志
- [`raw/`](./raw/README.md)：来源层，记录本次读取了哪些来源以及信任边界
- [`wiki/`](./wiki/project-overview.md)：综合页、主题页、状态页

## 使用原则

- 先看综合页，再回溯到底层来源。
- 代码与文档冲突时，默认以代码为准，并在 wiki 里显式标注 `drift`。
- 本知识层服务于当前前端仓库，不自动扩展到外部 backend 仓库。
