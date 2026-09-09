# One-shot recreation prompt — react-fast-md5

Goal: rebuild this application from scratch, from this prompt alone.

## Goal

A browser-only React app that computes MD5 hashes of user-selected files
without blocking the UI thread, by distributing files across a pool of Web
Workers and rendering results incrementally as each hash completes. No
backend, no server round-trips, no configuration.

## Stack

- React 18 with TypeScript 4.6, Vite 3, `@vitejs/plugin-react`
- yarn 1.x as the package manager
- SparkMD5 for the MD5 implementation (vendored into the worker)
- Entry: `index.html` → `src/main.tsx` (`ReactDOM.createRoot` inside
  `React.StrictMode`)

## App contract

### UI

`App` renders a single `FileHasherWorker` component:

- an `<input type="file" multiple />`; on change, if `event.target.files`
  is non-null, pass the `FileList` to the hashing dispatcher;
- below it, one line per completed file:
  `Filename: <name> | MD5 hash: <hash> | Filesize: <size> bytes`.
- Results appear in completion order (not selection order) as they arrive.

### Core module (`src/FileHasherWorker.tsx`)

- `interface FileInfo { name: string; hash: string; size: number }`
- `NUM_WORKERS = 5`
- A hook-style function `calculateMD5Hook()` returning the tuple
  `[FileInfo[], (files: FileList) => void]`:
  - state: `fileInfos: FileInfo[]` and `workers: Worker[]`;
  - on mount (`useEffect`, empty deps): create 5 workers via
    `new Worker("./worker.js")`, attach a `message` listener that appends
    `{name, hash, size}` to `fileInfos` when `message.data.type ===
    "HASH_CALCULATED"`, and an `error` listener that `console.error`s;
  - cleanup: remove both listeners from every worker and `terminate()`
    each (no `worker = null` assignment);
  - `calculateMD5(files: FileList)`: for each file `i`, `postMessage({
    type: "CALCULATE_HASH", file: files[i] })` to `workers[i % NUM_WORKERS]`.
- Type the tuple explicitly at the destructure site.

### Worker (`public/worker.js`)

A classic (non-module) worker served as a static asset:

- contains the SparkMD5 UMD build inline (so `SparkMD5` is global in the
  worker; no imports, no `importScripts`);
- `self.addEventListener('message', ...)`:
  read `event.data.file`, hash it with
  `FileReaderSync().readAsBinaryString(file)` →
  `new SparkMD5().appendBinary(binaryString).end()`,
  then `self.postMessage({ type: "HASH_CALCULATED", hash, name:
  file.name, size: file.size })`.

## Design decisions to preserve

1. **Fixed pool of 5 workers with round-robin dispatch** — keeps the UI
   responsive and parallelizes; simpler than work-stealing, adequate at
   this scale.
2. **SparkMD5 vendored inline in `public/worker.js`** — the worker is a
   raw static file the bundler never touches, so the library must live
   inside it; self-contained, no CDN `importScripts`.
3. **Worker-only hashing** — no main-thread fallback path exists; the
   main-thread prototype was deliberately deleted.
4. **Incremental rendering** — results render per-message; there is no
   `Promise.all` barrier over the batch.

## Acceptance criteria

1. `yarn install && yarn build` succeeds (tsc typecheck + Vite build).
2. `yarn dev`: selecting multiple files shows a result line per file with
   name, hex MD5 digest, and byte size.
3. Hashes match an independent tool (`md5 <file>` / `md5sum <file>`).
4. UI remains interactive (scrolling, cursor) while a large file hashes.
5. Dev StrictMode double-mount does not leak workers (pool torn down and
   recreated; no orphaned workers in devtools).
6. No network requests beyond app assets; no environment variables; no
   secrets in the repo.
