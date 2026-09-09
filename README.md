# react-fast-md5

Compute MD5 hashes of files entirely in the browser, without blocking the
UI thread. Files picked in a multi-select input are distributed round-robin
across a pool of five Web Workers, each hashing with an inline copy of
SparkMD5; results stream back into the page as they complete.

**Why:** hashing large files on the main thread freezes the UI. This small
React app demonstrates the worker-pool alternative — parallel, off-main-thread
hashing with incremental result rendering — as a pattern you can lift into
any app that needs client-side checksums (dedup, integrity verification,
upload fingerprints).

> Note: MD5 is not cryptographically secure. Use it for checksums and
> fingerprints, never for security purposes.

## Features

- Multi-file selection; each file hashed independently.
- Pool of 5 Web Workers with round-robin dispatch (`i % NUM_WORKERS`).
- Results appear as soon as each individual hash finishes (no waiting on
  `Promise.all` of the whole batch).
- Zero server round-trips: hashing happens fully client-side.
- Worker script is a plain static asset — no bundler special-casing needed.

## Stack

| Piece | Choice |
| --- | --- |
| UI | React 18 + TypeScript 4.6 |
| Build | Vite 3 (`@vitejs/plugin-react`) |
| Hashing | SparkMD5 (vendored inline in the worker) |
| IO | `FileReaderSync` inside workers |
| Package manager | yarn (1.x, `yarn.lock`) |

## Quickstart

```bash
yarn install
yarn dev        # start Vite dev server (prints a localhost URL)
```

Open the printed URL, pick one or more files, and each file's name, MD5
hash, and size appear as it finishes hashing.

```bash
yarn build      # tsc + vite build -> dist/
yarn preview    # serve the production build locally
```

## Usage / API

`src/App.tsx` renders a single component:

```tsx
import FileHasherWorker from "./FileHasherWorker";

<FileHasherWorker />
```

Inside `src/FileHasherWorker.tsx` the behavior is driven by a hook-style
function, `calculateMD5Hook()`, returning a typed tuple:

```ts
const [fileInfos, calculateMD5]: [FileInfo[], (files: FileList) => void] =
  calculateMD5Hook();
```

- `calculateMD5(files: FileList)` — post each file to the worker pool
  (round-robin). Called automatically from the file input's `onChange`.
- `fileInfos: FileInfo[]` — grows as results arrive.

```ts
interface FileInfo {
  name: string; // file name
  hash: string; // hex MD5 digest
  size: number; // size in bytes
}
```

### Worker protocol (`public/worker.js`)

Inbound message (main thread → worker):

```js
{ type: "CALCULATE_HASH", file: File }
```

Outbound message (worker → main thread):

```js
{ type: "HASH_CALCULATED", hash: string, name: string, size: number }
```

Errors on the worker surface via the `error` event and are logged with
`console.error`.

## Project structure

```
index.html               # Vite entry page (loads /src/main.tsx)
public/worker.js         # classic worker: inline SparkMD5 + FileReaderSync hashing
src/main.tsx             # React 18 root (StrictMode)
src/App.tsx              # mounts FileHasherWorker
src/FileHasherWorker.tsx # worker pool + file input + results list
src/App.css, index.css   # styling
vite.config.ts           # react plugin only
.codesandbox/            # CodeSandbox Projects config
```

## Environment variables

None. The app runs with no configuration.

## Notes and caveats

- The worker reads each file fully into memory as a binary string
  (`FileReaderSync.readAsBinaryString`), so very large files can be heavy.
- `spark-md5` and `@tanstack/react-table` remain in `package.json` but are
  not imported by the current code (the main-thread hasher that imported
  `spark-md5` was removed in the worker-only refactor).
- MD5 is for checksums, not security.

See [CHANGELOG.md](CHANGELOG.md) for history, [AGENTS.md](AGENTS.md) for
contributor/agent guidance, and [architectural-diary/](architectural-diary/)
for design decisions.
