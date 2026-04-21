# lf-smart-paper-web LLM Wiki Schema

## Goal

Maintain a repo-local knowledge layer for `lf-smart-paper-web/` that helps future agents and maintainers answer three questions quickly:

1. What is implemented now.
2. What is only planned or partially landed.
3. Which files are the canonical sources for each claim.

This schema is for the current frontend repo only. Do not treat adjacent backend repos as in-scope unless they are explicitly imported into this repo as documentation or code.

## Source Priority

When sources disagree, resolve them in this order:

1. Runtime code and routing
   - `src/app/App.jsx`
   - `src/main.jsx`
   - `src/services/api.js`
   - active page/layout files imported by `App.jsx`
2. Repo constraints
   - `AGENTS.md`
   - `docs/CODE_LAYOUT.md`
3. Root project description
   - `README.md`
   - `package.json`
   - `vite.config.js`
4. Change notes and milestone docs under `docs/`
5. Design intent docs that may be ahead of code
   - especially `docs/46-v2-frontend-redesign.md`
   - `docs/47-parent-single-role-adaptive-design.md`
   - `docs/48-capture-composer-layout-cleanup.md`

If a design doc conflicts with active code, the wiki must mark that as `drift` instead of silently choosing the doc.

## Page Conventions

All synthesized pages under `docs/llm-wiki/wiki/` should:

- default to Chinese, matching the repo's current documentation style
- preserve code identifiers, routes, filenames, env vars, headers, and API paths in English
- include these sections when relevant:
  - `摘要`
  - `已实现`
  - `规划 / 未完全落地`
  - `已知 drift`
  - `开放问题 / 风险`
  - `来源`
- distinguish clearly between:
  - implemented behavior observed in code
  - planned behavior mentioned only in docs
  - inferred conclusions drawn from multiple files

Do not write empty placeholder pages. Every new page should contain usable synthesized knowledge.

## Raw Layer Rules

`docs/llm-wiki/raw/` is for source capture notes, not synthesis.

Each raw file should record:

- source type
- access date
- trust level
- what was extracted
- what was intentionally not verified

Raw files may reference:

- local repo files
- local skill instructions used during bootstrap
- conceptual external patterns if they informed structure

If an external pattern was not fetched directly during the current run, say so explicitly.

## Ingest Workflow

When updating the wiki:

1. Read repo constraints first.
2. Read active runtime entrypoints and route composition.
3. Read only the docs needed for the topic being updated.
4. Add or update raw notes if a new source set was used.
5. Update synthesized pages incrementally.
6. Append to `docs/llm-wiki/log.md`.
7. Update `docs/llm-wiki/index.md` if navigation changed.

Prefer incremental edits over rewriting the whole knowledge layer.

## Query Workflow

When answering repo questions from the wiki:

1. Start from `docs/llm-wiki/index.md`.
2. Use the most specific topic page available.
3. Verify any unstable claim against code if the page signals drift or uncertainty.
4. Cite both the synthesized page and the underlying source files when the answer matters.

Never answer from a design doc alone if the current code says otherwise.

## Lint Workflow

After changing the wiki, run lightweight validation:

1. confirm expected files exist
2. run `git diff --check`
3. spot-check `CLAUDE.md`, `docs/llm-wiki/index.md`, and at least one topic page
4. ensure no planned feature is phrased as already shipped
5. ensure logs are appended rather than rewritten

## Repo-Specific Constraints

- Scope is this repo root only: `lf-smart-paper-web/`.
- Only edit files inside this repo.
- Run frontend commands from repo root.
- Do not commit generated artifacts such as `dist/` or `node_modules/`.
- Current delivery phase is `interaction/UI-first`.
- Prioritize interaction and UI confirmation before backend expansion.
- Keep frontend behavior demo-friendly when backend capability is incomplete.
- The active route map comes from `src/app/App.jsx`, not older route lists in docs.
- The active API surface comes from `src/services/api.js`, not assumptions about the backend repo.

## Do Not Do

- Do not copy large blocks from `README.md` or numbered docs into the wiki.
- Do not delete or rewrite existing user docs just to normalize style.
- Do not treat legacy pages under `src/pages/` as active unless `App.jsx` mounts them.
- Do not assume design proposals in `docs/46-48` are fully implemented.
- Do not claim backend schema details that are not visible from this frontend repo.
- Do not clear `docs/llm-wiki/log.md`; only append new entries.
