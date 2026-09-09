# Architectural Diary — react-fast-md5

A chronological narrative of how this repository took shape, written
retrospectively on 2026-09-08 from the git history and code. Commit hashes
are post-rewrite (see [CHANGELOG.md](../CHANGELOG.md) for the mapping to
the original hashes).

## 2022-12-22 — Birth of the experiment

The repo began life as a CodeSandbox "Vite + React" template with one goal:
hash files' MD5 in the browser, fast. The first commit (`cbbbf4e`) landed
two competing implementations side by side:

1. `src/FileHasher.tsx` — the naive baseline: `FileReader` +
   SparkMD5 on the main thread, coordinated with a hand-rolled
   promise/counter scheme and `Promise.all` before rendering.
2. `src/FileHasherWorker.tsx` — the real idea: a pool of five Web Workers
   (`public/worker.js`), round-robin dispatch, results rendered
   incrementally as each `HASH_CALCULATED` message arrives.

A template README was included, then immediately emptied (`551a0ea`) to
make room for real docs that were never written — until now.

## 2022-12-22 — The worker approach wins

PR #1 (`21bed9c`, merged as `fc831ed`) deleted the main-thread
implementation entirely and hardened the worker one: the illegal
`worker = null` cleanup assignment was dropped, the hook's return was
typed as an explicit `[FileInfo[], (files: FileList) => void]` tuple, and
the file input's `onChange` gained a null-`FileList` guard. From here on,
the worker pool is the only hashing path — see
[decision 003](decisions/003-consolidate-on-worker-implementation.md).

## 2026-09-08 — Documentation pass

Commit messages across all four commits were improved via a messages-only
history rewrite (content untouched), and this documentation set — README,
AGENTS.md, CHANGELOG, diary, decisions, and a one-shot recreation prompt —
was added. No application code was changed.

## Decision index

| # | Decision |
| --- | --- |
| [001](decisions/001-worker-pool-over-main-thread.md) | Hash in a pool of 5 Web Workers, not on the main thread |
| [002](decisions/002-vendor-sparkmd5-in-static-worker.md) | Vendor SparkMD5 inline inside a `public/` worker instead of bundling |
| [003](decisions/003-consolidate-on-worker-implementation.md) | Keep only the worker-based hasher; drop the main-thread one |
