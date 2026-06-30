---
name: Zod import in esbuild bundles
description: How to import zod correctly in API server routes when bundled with esbuild
---

Use `import { z } from "zod"` — NOT `"zod/v4"` — in any file that gets bundled with esbuild (i.e., `artifacts/api-server/src/**`).

**Why:** esbuild cannot resolve the `zod/v4` subpath export at bundle time and throws "Could not resolve zod/v4". The main `"zod"` import works fine since zod v4's primary export IS the v4 API when installed as `zod@^4`.

**How to apply:** Any new API server route that uses zod must import from `"zod"`, not `"zod/v4"`. Also ensure `zod` is listed in `artifacts/api-server/package.json` dependencies (it is not auto-inherited from workspace root).
