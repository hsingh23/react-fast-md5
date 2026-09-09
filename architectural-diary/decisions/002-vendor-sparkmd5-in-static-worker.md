# Decision 002 — Vendor SparkMD5 inline inside a static `public/` worker

- Date: 2022-12-22
- Commits: `cbbbf4e`; still current
- Status: accepted (with known maintenance cost)

## Context

The worker needs an MD5 implementation. Classic workers created with
`new Worker("./worker.js")` from `public/` are served as raw static files:
Vite does not bundle them, resolve their imports, or type-check them. The
repo also carries `spark-md5` as an npm dependency, but that only helps
code that goes through the bundler (i.e., main-thread modules).

## Decision

`public/worker.js` contains the entire minified SparkMD5 UMD build pasted
as line 3, defining `SparkMD5` in the worker's global scope. The message
handler then uses `FileReaderSync` to read the whole file as a binary
string and feeds it to `spark.appendBinary()` / `spark.end()`.

## Consequences

- The worker is a single self-contained static file: no bundler config, no
  module resolution, works identically in dev and in the built `dist/`.
- Upgrading SparkMD5 means hand-replacing the minified line — the npm
  dependency in `package.json` does not feed the worker at all (a standing
  trap for contributors; called out in AGENTS.md).
- `FileReaderSync` exists only in workers; the whole file is read into
  memory at once, which caps practical file size (chunked appends are the
  upgrade path).

## Alternatives considered

- **`importScripts("https://unpkg.com/spark-md5@3.0.2/spark-md5.min.js")`:**
  present as a commented-out line in the file. Rejected because it needs
  network access at runtime and trusts a CDN.
- **Module worker + bundled import (`new Worker(new URL(...), { type: "module" })`):**
  Vite 3 supports it, but it complicates the worker spec and diverges from
  the static-asset simplicity the project wanted.
