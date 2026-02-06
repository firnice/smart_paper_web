# Frontend Code Layout Convention

## Scope
- This rule applies to `lf-smart-paper-web/` only.
- Do not place runtime code in parent directories.

## Directory Standard

```text
lf-smart-paper-web/
  src/
    app/                 # app composition and routes
    components/
      home/              # landing page components
      paper/             # paper preview components
    constants/           # static content/config
    context/             # shared React context/state
    pages/
      paper/             # workflow pages (upload/result)
    services/            # HTTP request wrappers
    styles/              # global and module styles
    utils/               # pure utility functions
```

## Rules

- Keep components focused on presentation; call API through `services/`.
- Put cross-page state in `context/`, avoid scattered prop drilling.
- Prefer feature grouping (`home`, `paper`) when components grow.
- Remove dead components/styles when workflow changes.
- Keep generated artifacts (`dist/`, `node_modules/`) out of Git.
