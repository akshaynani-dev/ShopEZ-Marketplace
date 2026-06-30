---
name: Orval single-mode codegen index fix
description: After running orval codegen, lib/api-zod/src/index.ts is overwritten with stale content
---

After every `pnpm --filter @workspace/api-spec run codegen` run, the file `lib/api-zod/src/index.ts` gets regenerated with stale content (e.g., `export * from './generated/types'`) that references a non-existent file.

**Why:** Orval rewrites the barrel index on each codegen run. The `mode: "single"` config generates a single `api.ts` file, but the index template still emits a reference to a `types` sub-export.

**How to apply:** Always run this after codegen:
```
echo "export * from './generated/api';" > lib/api-zod/src/index.ts
```
The codegen script in `lib/api-spec/package.json` could be updated to include this fix automatically.
