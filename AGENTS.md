# AGENTS.md

Guidance for coding agents and contributors working in this repository.

## What this repo is

A single-page React + Vite + TypeScript demo that computes MD5 hashes of
user-selected files in the browser using a pool of five Web Workers.
There is no backend and no routing; one component does all the work.

## Commands

```bash
yarn install     # install dependencies (yarn 1.x; yarn.lock is authoritative)
yarn dev         # Vite dev server with HMR
yarn build       # tsc (typecheck) + vite build -> dist/
yarn preview     # serve the production build
```

There are no tests and no linter/formatter configured. `yarn build` is the
closest thing to CI: it runs `tsc` first, so type errors fail the build.

## Architecture map

```
index.html
  └─ src/main.tsx            ReactDOM.createRoot + <React.StrictMode>
       └─ src/App.tsx         shell; renders <FileHasherWorker />
            └─ src/FileHasherWorker.tsx   THE core file
                 ├─ calculateMD5Hook()    state + worker pool management
                 │    ├─ 5 × new Worker("./worker.js")   created in useEffect
                 │    ├─ onMessage        HASH_CALCULATED -> append FileInfo
                 │    ├─ onError          console.error
                 │    └─ cleanup          remove listeners + terminate()
                 ├─ calculateMD5(FileList)  round-robin postMessage per file
                 └─ <input type="file" multiple> + results list

public/worker.js             classic (non-module) worker, served as a static asset
  ├─ SparkMD5 (vendored, minified UMD, ~1 line)
  └─ message handler: FileReaderSync.readAsBinaryString(file)
                       -> spark.appendBinary -> spark.end()
                       -> postMessage(HASH_CALCULATED)
```

Request/response protocol:

- Main → worker: `{ type: "CALCULATE_HASH", file: File }`
- Worker → main: `{ type: "HASH_CALCULATED", hash, name, size }`

Worker selection is round-robin: file `i` goes to `workers[i % NUM_WORKERS]`
(`NUM_WORKERS = 5`). Results render as they arrive; order is not guaranteed
to match selection order.

## Conventions

- TypeScript strict mode is off; still type new code (the codebase uses
  explicit tuple types on multi-value returns — follow that pattern).
- The worker is plain JavaScript in `public/`, deliberately outside the
  Vite bundle. Do not import from it; communicate only via `postMessage`.
- Discriminated `type` field on every worker message; check it on receipt.
- No state management library, no router, no test framework — keep it lean
  unless the project explicitly grows.

## Gotchas

- **`public/worker.js` is not bundled or type-checked.** Vite serves it
  verbatim; changes there require a manual page refresh and are invisible
  to `tsc`. SparkMD5 is vendored inline, so upgrading it means replacing
  that minified line by hand (or switching to `importScripts`/module
  workers).
- **`new Worker("./worker.js")` resolves against the page URL**, not the
  source file. It works for this app's root-served layout; deep paths or
  hash routing could break it.
- **React 18 StrictMode double-invokes effects in dev**, so the pool is
  created, torn down, and recreated on mount. The cleanup terminates all
  workers; also note it calls `setWorkers` during cleanup, which is
  discouraged. Expect the `useEffect called` console.log twice in dev.
- **`FileReaderSync` only exists in workers.** Do not reuse worker code on
  the main thread.
- **Whole-file reads:** each file is fully read into memory as a binary
  string before hashing; huge files can exhaust memory. Chunked hashing
  (`spark.appendBinary` per chunk) would be the upgrade path.
- **Dead dependencies:** `spark-md5` and `@tanstack/react-table` are in
  `package.json` but unused by current code (imports lived in the deleted
  `src/FileHasher.tsx`). Safe to remove if you accept a lockfile churn.
- **History note:** commit messages were rewritten on 2026-09-08
  (messages-only `git filter-branch`). Old hashes referenced elsewhere
  (e.g., PR #1 on GitHub) no longer resolve.

## Verifying changes

1. `yarn build` — must typecheck and build cleanly.
2. `yarn dev`, select several files (mix of sizes), confirm:
   - every selected file eventually shows `Filename | MD5 hash | Filesize`;
   - UI stays responsive while hashing (scroll/type during a large file);
   - hashes match an external tool (e.g., `md5 file` in a terminal).
3. Worker-only changes: hard-refresh after editing `public/worker.js`.

## Pointers

- [README.md](README.md) — user-facing overview, API, protocol.
- [CHANGELOG.md](CHANGELOG.md) — per-commit history (newest first).
- [architectural-diary/](architectural-diary/) — decision records.
- [prompt.md](prompt.md) — one-shot recreation prompt for this app.
