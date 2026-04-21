# 2026-04-21 Pattern Reference: Karpathy / Idea File Style

## 来源类型

- 外部模式参考的本地记录

## 实际可见来源

- `/Users/firnice/.codex/skills/initialize-llm-wiki/SKILL.md`
- `/Users/firnice/.codex/skills/initialize-llm-wiki/references/bootstrap-checklist.md`

## 概念来源

- Karpathy 风格的 Idea File / LLM Wiki 维护模式

说明：

- 本次 bootstrap 没有直接联网抓取 Karpathy 原始页面或 gist。
- 因此这里记录的是“通过本地 skill 间接获得的模式约束”，而不是原文快照。

## 本次抽取到的模式

- 使用 repo-local 知识层，而不是散落式笔记
- 保留 `raw/` 与 `wiki/` 两层语义
- 维护 `index.md` 做导航
- 维护 `log.md` 做增量更新记录
- 根级 `CLAUDE.md` 负责 schema 和维护规则

## 可信度

- 中

理由：

- 结构规则来自本地 skill，足以支撑本仓库 bootstrap
- 但没有直接验证外部原始材料的具体表述
