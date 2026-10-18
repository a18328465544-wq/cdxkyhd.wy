# GPU ranking data

## Catalog and matching

`shared/src/gpuCatalog.ts` owns the seed catalog and device identity parser. Game,
Blender, and configured external snapshots extend the catalog at runtime. Catalog
entries never contain benchmark values. Integrated GPUs and unrecognized device
families are intentionally excluded, rather than guessed from a product number.

Desktop, laptop, professional, D/D V2, Ti/Super, explicit VRAM, and recognized
power variants have separate keys. Unspecified VRAM scores are not assigned to
an explicit capacity. Inventory matching permits an unspecified catalog capacity
but never a conflicting explicit capacity. Official reference specifications are
optional and retain a manufacturer source link; unknown values stay unknown.

## Scores and freshness

Game metrics use tuples in the order 1080p, 1440p, 4K. Missing test cells are null.
A card may have only raster results. Invalid numeric cells and fewer than 40
measured raster rows reject a refresh. Failed refreshes retain the last valid
snapshot; the response exposes failure status separately from last successful
check time. Missing data never falls back to historical hardcoded percentages.

Blender is compared only within the snapshot version. Score rows show sample
counts and flag fewer than 5 samples. Percentages are recalculated from the same
selected test and resolution against the comparison baseline, or the fastest
measured card of the selected type. Different benchmark scales are not combined.

## Public 3DMark references

With no custom data file, the website uses the verified reference in
`backend/data/3dmark-public-reference.json` and checks public source pages every
6 hours. Time Spy Graphics comes from ComputerBase's editorial test chart;
Steel Nomad comes from UL's public hardware ranking (user-result medians, not a
stock-clock-only sample). Every test retains its own source link, methodology,
last successful check and failure status. Sample counts are null when unpublished.
Same-name entries with conflicting scores are excluded, never resolved by taking
the highest value. Notebook, explicit VRAM, LHR and memory-speed variants remain
separate. No percentage or other benchmark is converted into a missing score.

At initial verification on 2026-10-18, ComputerBase returned HTTP 403 to the
production server. Time Spy therefore uses a publicly retrieved and locally
verified snapshot (source history: 2026-09-24). Automatic attempts respect the
denial, retain that snapshot and report failure; no proxy or identity spoofing is
used. UL's Steel Nomad page was directly reachable from the production server.
Port Royal and Speed Way are not populated by either reference and remain pending.

## Optional 3DMark import

The existing environment configuration and display-permission gate remain in
place for custom files. Set `THREE_DMARK_RANKING_SOURCE=file`, or configure
`THREE_DMARK_RANKING_DATA_FILE`, to use that import path instead of public references.
Schema version 1 is backward compatible with two new optional arrays:

```json
{
  "schemaVersion": 1,
  "sourceUrl": "https://www.3dmark.com/search",
  "sourceUpdatedAt": "2026-10-18T00:00:00Z",
  "filtering": "valid-stock-only",
  "models": [{
    "model": "GeForce RTX 4090",
    "timeSpyGraphicsScores": [],
    "portRoyalScores": [],
    "steelNomadScores": [],
    "speedWayScores": []
  }]
}
```

Empty arrays are omitted from rankings. The example deliberately contains no
scores and is not an importable production dataset. Each imported array yields
its own median and sample count. Only the standard tests named above are allowed;
do not put Steel Nomad Light or overall Time Spy scores in these fields.

Geekbench retains its API key and display-permission requirements. Its default
queries now cover the expanded seed catalog, with existing concurrency limits.
Neither external service is considered populated merely because a UI tab exists.

## Comparison links and verification

`/gpu-ranking?test=raster&res=1440p&compare=RTX4090,RTX5090&base=RTX4090`
restores up to four model keys and the baseline. Query values are allow-listed;
unknown catalog keys are shown as unavailable and can be removed. Sharing does
not include inventory IDs, prices, or private information.

Run `npm run build -w shared`, `npm test`, `npm run lint`, and `npm run build`.
Data/route/render tests do not replace desktop and mobile browser acceptance or
real external credentials/data-file acceptance. No database migration is needed;
old valid game caches and 3DMark files remain readable.
