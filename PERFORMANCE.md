# Website Performance

Scope: website gateway and frontend only. ERP schema, inventory markers, benchmark data and calculator formulas are unchanged. Implementation branch: `codex/website-performance-20261022`. A local build is not a production deployment.

## Changes

- gzip/Brotli for GET/HEAD public text above 1 KiB; compression level 6 and default Brotli quality 4. Forum/session responses are excluded.
- Fingerprinted `/assets` files: one-year immutable caching. HTML and unversioned files: revalidate. APIs: `no-store`. Missing JS returns 404, never the SPA HTML shell.
- Home sections are no longer prefetched by tool pages. Home is lazy-loaded; FAQ no longer imports the animation runtime.
- Inventory `view=list` validates page/pageSize (maximum 50), returns totalCount and 9 cards by default, and keeps every condition/box/warranty/repair/risk/status marker. Full specifications remain available on expansion via `detailId`.
- `view=availability&category=GPU` serves the ranking stock join; `/api/pc-parts?view=picker` serves the builder. Legacy API envelopes remain available.
- Pagination is in the website gateway. The ERP adapter still reads its existing upstream pages; no claim is made that the ERP database now executes native 9-row paging.
- ERP GETs share only in-flight requests. Settled reads and writes are not cached. Browser requests time out at 15 seconds, ERP calls at 8 seconds. UI changes cancel stale reads/calculations; writes are never automatically retried.
- Ranking and price polls pause while hidden. Daily prices no longer rerender every second; a timer still invalidates them exactly at Beijing midnight, including after a suspended tab resumes.
- Price consumers share a live read, not a permanently cached promise or static fallback quote. Price lists initially render 8 entries; search covers every entry and one action expands the complete list. Loading skeletons reserve card/row space.

## Checks

Run `npm ci --ignore-scripts`, `npm run build`, `npm run lint`, `npm test`, and `npm run check:performance`.

`check:performance` checks the production manifest: rental page JS <= 200 KiB gzip, initial CSS <= 20 KiB gzip, and no static homepage dependency. Browser coverage must also verify no idle home prefetch, calculator interaction, inventory paging/search/detail, and mobile layouts. Build budgets are not user-experience scores.

## Anonymous Performance Samples

`web-vitals` reports LCP, INP and CLS on a configurable sample (default 10%). INP is absent when there was no qualifying interaction; absence is not zero. Only allowlisted public path, numeric value, metric name and mobile/desktop class are saved. Query strings, hashes, cookies, account/session identifiers, IP addresses, SNs and form contents are not collected by this feature. Existing reverse-proxy access logs are separate.

The same-origin POST endpoint has a global 120/minute limit, queue limit 16, and 1 MiB/day disk cap. Only its own `vitals-YYYY-MM-DD.jsonl` files older than 7 days are removed. Data has no public GET endpoint. Configure `PERFORMANCE_DATA_DIR` on persistent storage and `PERFORMANCE_SITE_ORIGIN=https://cdgpu.cn`; set `VITE_PERFORMANCE_SAMPLE_RATE=0` to disable collection at build time. This measures performance, not Baidu visits/unique visitors.

Inspect private daily samples with `node scripts/report-vitals.mjs /private/path/vitals-YYYY-MM-DD.jsonl`. Compare p75 separately by page/device after enough real traffic; small local samples cannot establish field targets (LCP <= 2.5s, INP <= 200ms, CLS <= 0.1).

## Release Requirements

1. Run normal source/version, backup/rollback and ERP boundary checks. No previous one-off backup waiver is a standing waiver.
2. Before switching releases, retain both old and new fingerprinted assets:

   ```sh
   node scripts/retain-assets.mjs PREVIOUS_RELEASE/frontend/dist/assets /home/ubuntu/cdweb-data/static-assets
   node scripts/retain-assets.mjs NEW_RELEASE/frontend/dist/assets /home/ubuntu/cdweb-data/static-assets
   ```

3. Set `STATIC_ASSET_FALLBACK_DIR=/home/ubuntu/cdweb-data/static-assets` in the website environment. Preserve the normal persistent `.env`/data links. Do not reuse the ERP process or change ERP service settings. The helper copies only flat fingerprinted public files, refuses different-content collisions and does not delete assets. Manage disk retention separately; keep at least the rollback releases and the desired old-tab support window.
4. Switch/reload only the website process. Verify public HTML is revalidated, JS/CSS are compressed and immutable, APIs are no-store, retained old JS still resolves, and missing JS returns 404. Never cache forum identity/session responses.
5. Repeat the cold mobile test and read-only ERP paging/detail/builder checks. Publishing and accepting production results are separate from local tests.

No production release, credential change or database migration is performed by these scripts.

## Page Transitions (2026-10-28)

Same-origin site links now use React Router history instead of reloading the document. The shared header stays mounted; a single revealed Suspense boundary retains the previous page while the destination code loads, then changes the page, questions and footer together. Initial direct requests still use the existing server SEO HTML; that rendering contract is unchanged.

Modified clicks, new tabs, downloads, phone links, third-party links and unknown paths retain native browser behavior. Community post navigation uses the same history owner; ranking query updates preserve history state. Page commits reset scroll without a smooth flight through the previous page. Home anchors observe layout changes before paint and stop following after user input, route changes or 20 seconds.

`npm run test:routes -w frontend` includes DOM regressions for delayed page imports, persistent header/content, back navigation and scroll restoration, anchors, user interruption, failed chunks and error recovery. Browser testing must still cover real nested tools, mobile menus, rapid navigation and metadata updates. Existing Web Vitals remain document-entry measurements, not per-soft-navigation field scores.
