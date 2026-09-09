# Changelog

All notable changes to this project. Format: newest first.

> History note (2026-09-08): commit messages across the 4 original commits
> were improved via a messages-only `git filter-branch` rewrite (trees and
> diff content unchanged; only messages replaced). Hashes below are the
> post-rewrite hashes. The pre-rewrite hashes were, oldest to newest:
> `316ebfb`, `292d373`, `06b2709`, `03f154c`.

## 2022-12-22 — fc831ed `chore: merge PR #1 to adopt worker-only MD5 hashing`

Merge pull request #1 from `hsingh23/draft/pedantic-wildflower`, which
deletes the main-thread SparkMD5 `FileHasher.tsx` and fixes typing in
`FileHasherWorker.tsx` so the web worker pool is the only MD5
implementation.

- GitHub-created merge commit integrating the worker-only refactor into `main`.
- Merge topology preserved (two parents); no file changes of its own beyond
  the merged branch.

## 2022-12-22 — 21bed9c `refactor: keep only worker-based MD5 hasher and fix its typing`

Delete the main-thread SparkMD5 `FileHasher.tsx` in favor of the web
worker implementation. Remove the invalid `worker = null` cleanup
assignment, give the hashing hook an explicit tuple return type
(`[FileInfo[], (files: FileList) => void]`), and guard the file input's
`onChange` against a null `FileList`.

- Removes `src/FileHasher.tsx` (57 lines) — the single-threaded hashing path.
- Drops the illegal `worker = null` assignment inside the effect cleanup.
- Adds explicit `useCallback` generic and tuple types so consumers get a
  properly typed `[fileInfos, calculateMD5]` pair.
- Guards `onChange` with `event.target.files &&` before hashing.

## 2022-12-22 — 551a0ea `docs: remove CodeSandbox template boilerplate from README`

Delete the 14 lines of generated Vite + React template content
(description, CodeSandbox badge, docs links) from README.md, leaving
it empty pending project-specific documentation.

- Documentation-only; no code, build, or runtime impact.

## 2022-12-22 — cbbbf4e `feat: add file MD5 hashing app with web worker pool`

Scaffold a Vite + React + TypeScript project that computes MD5 hashes
for selected files. `FileHasher.tsx` hashes on the main thread with
SparkMD5, while `FileHasherWorker.tsx` distributes files round-robin
across five web workers (`public/worker.js`) and renders each
`HASH_CALCULATED` result as filename, hash, and size. Also adds Vite
scaffold files, README, .gitignore, CodeSandbox config, and yarn.lock.

- Initial import: 18 files, 1240 insertions.
- Two hashing implementations side by side: main-thread SparkMD5
  (`FileHasher.tsx`) and a 5-worker pool (`FileHasherWorker.tsx`).
- `public/worker.js` vendors SparkMD5 inline (UMD build) and computes
  hashes with `FileReaderSync` inside the worker.
- Vite 3 + React 18 + TypeScript 4.6 scaffold, CodeSandbox workspace
  config, and `yarn.lock`.
