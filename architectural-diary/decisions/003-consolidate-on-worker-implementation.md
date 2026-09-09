# Decision 003 — Keep only the worker-based hasher; drop the main-thread one

- Date: 2022-12-22
- Commits: `21bed9c` (change), `fc831ed` (merge into main)
- Status: accepted

## Context

After the initial commit, `src/FileHasher.tsx` (main-thread hashing) and
`src/FileHasherWorker.tsx` (worker pool) coexisted, but only
`FileHasherWorker` was wired into `App.tsx`. The comparison having served
its purpose, the duplicate path was dead code. The worker version also
carried small defects: an illegal `worker = null` assignment in the effect
cleanup (assignment to a `const`-like loop parameter — a TypeScript error),
an under-typed hook return that degraded inference at the call site, and an
unguarded `event.target.files` dereference.

## Decision

Delete `src/FileHasher.tsx` and make the worker pool the sole MD5
implementation. In `FileHasherWorker.tsx`: remove the `worker = null`
line, type the hook contract explicitly as
`[FileInfo[], (files: FileList) => void]` (both at the return and the
destructure), and guard `onChange` with `event.target.files &&`.

## Consequences

- One hashing path to maintain and reason about; `App.tsx` unchanged.
- The `spark-md5` npm import that only `FileHasher.tsx` used disappears,
  leaving `spark-md5` (and the never-used `@tanstack/react-table`) as dead
  entries in `package.json`.
- The explicit tuple type documents the hook's contract — later consumers
  get real types instead of `(FileInfo[] | ((files: FileList) => void))[]`.

## Alternatives considered

- **Keep both behind a toggle:** more surface area, no user need for a
  main-thread mode that freezes the UI.
- **Promote the hook to a reusable exported hook (`useMD5`):** would be the
  natural next step for reuse, but out of scope for this demo.
