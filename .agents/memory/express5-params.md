---
name: Express 5 params typing
description: req.params values are typed as string | string[] in Express 5, causing TS errors when calling string methods
---

In Express 5 with strict TypeScript, `req.params.someKey` is typed as `string | string[]`, not just `string`.

**Why:** Express 5 widened the type to support array params. Calling `.toUpperCase()`, `.toLowerCase()`, etc. directly will fail TS type checking.

**How to apply:** Always wrap with `String(req.params.x)` before calling string methods:
```ts
const symbol = String(req.params.symbol).toUpperCase();
```
