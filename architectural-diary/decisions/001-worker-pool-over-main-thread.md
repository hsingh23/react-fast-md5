# Decision 001 — Hash in a pool of Web Workers, not on the main thread

- Date: 2022-12-22
- Commits: `cbbbf4e` (introduced), still current
- Status: accepted

## Context

The app's entire purpose is hashing arbitrary user files. MD5 in
JavaScript is CPU-bound; doing it on the main thread freezes rendering for
the duration. The initial commit deliberately shipped both approaches so
they could be compared.

## Decision

Maintain a fixed pool of `NUM_WORKERS = 5` workers, each an instance of
`public/worker.js`. When the user selects files, dispatch file `i` to
`workers[i % NUM_WORKERS]` (round-robin). Workers reply with
`HASH_CALCULATED`; the UI appends each result to state as it arrives.

## Consequences

- The UI stays responsive; hashing parallelizes across workers.
- Results render incrementally rather than after a `Promise.all` barrier,
  so small files show up immediately while big ones churn.
- Round-robin is naive: five huge files can pile onto different workers
  while a sixth small file queues behind one of them. A work-stealing
  queue would balance better, but was unnecessary at this scale.
- Pool lifecycle is manual: create in `useEffect`, terminate in cleanup —
  with the known React 18 StrictMode double-mount wrinkle (see AGENTS.md).

## Alternatives considered

- **Main thread with `FileReader` (the deleted `FileHasher.tsx`):** simple
  but blocks the UI; also required a brittle promise/counter dance just to
  batch results. Rejected — see decision 003.
- **One worker per file:** unbounded worker creation for large selections;
  a fixed pool is predictable and cheap.
