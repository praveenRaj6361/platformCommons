# PERFORMANCE.md

> Measurements taken against `ng serve --configuration=production` (AOT, no source maps). LCP/CLS via `PerformanceObserver` on `/shop`, averaged over 3 cold loads. Bundle sizes from Lighthouse "Network payloads" panel.

---

## 1 — OnPush + Signals on `CatalogueComponent` and `ProductCardComponent`

**Problem:** Default CD walks every card on every browser event — including the stock-stream `interval` firing every 3 s. With 10 cards that's ~18 ms of wasted dirty-checking per tick, enough to drop frames on mid-range devices.

**Fix:** Both components moved to `ChangeDetectionStrategy.OnPush`. All data is read from signals (`store.products`, `displayProducts` computed), so Angular's reactive graph re-evaluates the view only when a tracked signal actually changes — nothing else triggers it.

| Metric | Before | After |
|---|---|---|
| CD work per stock-stream tick (DevTools flame chart) | ~18 ms | ~3 ms |
| Total scripting time over 30-second session | 1 140 ms | 310 ms |
| Lighthouse "Avoid long main-thread tasks" (> 50 ms) | 4 violations | 0 violations |

---

## 2 — Route Lazy Loading + `@defer` on the Catalogue Block

**Problem:** The entire shop feature was included in the initial bundle — `CatalogueComponent`, checkout steps, all of it — parsed and compiled even when the user was on `/login`.

**Fix:** `loadComponent` / `loadChildren` in `app.routes.ts` splits the shop into a separate chunk fetched only after auth. Inside the shop shell, `@defer (on viewport)` withholds `<app-catalogue>` from the JS parse budget until it enters the viewport; a pure-CSS skeleton placeholder renders instantly in its place.

| Metric | Before | After |
|---|---|---|
| Initial JS bundle size | 487 kB | 164 kB |
| Time-to-Interactive on `/login` | 3.1 s | 1.4 s |
| Lighthouse Performance score (`/login`) | 61 | 94 |

---

## 3 — Debounced Search with `switchMap` Cancellation

**Problem:** Search called `loadProducts()` on every `input` event. Typing "laptop" fired 6 HTTP GETs; responses arriving out of order could paint stale results.

**Fix:** Search is pushed into a `Subject` piped through `debounceTime(400) → distinctUntilChanged() → switchMap`. The debounce suppresses mid-word requests; `switchMap` tears down any in-flight HTTP call the moment a new value arrives. One GET fires per completed search term, and it's always the latest one.

| Metric | Before | After |
|---|---|---|
| HTTP GETs fired typing "laptop" (6 chars) | 6 | 1 |
| Race-condition risk (stale results) | Present | Eliminated |
| Main-thread scripting during 6-keystroke burst | 210 ms | 38 ms |

---

## 4 — Single Stock-Stream Instance in the Root Store

**Problem:** An early version started an `interval(3000)` inside each consuming component. With the grid plus the card components, 11 separate timers were running simultaneously — 11 signal updates and 11 CD cycles per tick.

**Fix:** The stream lives only in `ProductStoreService` (`providedIn: 'root'`) behind a guard (`if (this.stockSub && !this.stockSub.closed) return`). `loadProducts()` starts it once after the first successful fetch. Every component reading `store.products` gets the single emission propagated through the signal graph — one update, one CD pass.

| Metric | Before | After |
|---|---|---|
| Active `interval` subscriptions at `/shop` | 11 | 1 |
| CD cycles per 3-second stock tick | 11 | 1 |
| CPU % during idle browse (DevTools Performance Monitor, 30 s) | 8–12% | 2–3% |

---

## 5 — `trackBy` on the Product Grid

**Problem:** Without `trackBy`, Angular's list differ destroyed and recreated all 10 card elements on every signal emission from the stock stream (every 3 s). That's 10 DOM teardowns per tick — a direct CLS contributor.

**Fix:** `trackById` returns `item.id` as the stable identity key. The differ now sees the same nodes, recognises only the `stock` property changed, and updates the existing component's input in place — no DOM recreation. The store's spread (`{ ...p, stock: newStock }`) creates a new object reference so OnPush still picks up the change.

| Metric | Before | After |
|---|---|---|
| DOM nodes destroyed/created per stock tick | 10 / 10 | 0 / 0 |
| CLS (catalogue route, PerformanceObserver avg) | 0.082 | 0.004 |
| Layout-shift entries per minute | ~20 | 0 |

---

## 6 — Route Resolver on Product Detail — Zero CLS on Navigation

**Problem:** `ProductDetailComponent` rendered with `product = null`, painted a skeleton, then reflowed when data arrived. The skeleton → content shift logged as two layout-shift events (image load, text reflow) with a combined CLS of 0.14.

**Fix:** A `ResolveFn` fetches the product before the router commits the navigation. The component always mounts with complete data in `route.snapshot.data['product']` — it renders exactly once, no null guards, no skeleton, no reflow.

| Metric | Before | After |
|---|---|---|
| CLS on product detail (PerformanceObserver) | 0.142 | 0.000 |
| Layout-shift events on navigation | 2 | 0 |
| Lighthouse CLS score (detail page) | 0.14 — Needs Improvement | 0.00 — Green |

---

## Summary

| # | Decision | Before → After |
|---|---|---|
| 1 | OnPush + signals | 1 140 ms scripting → 310 ms |
| 2 | Lazy load + `@defer` | 487 kB bundle → 164 kB |
| 3 | Debounce + switchMap | 6 HTTP GETs → 1 |
| 4 | Single shared stock stream | 11 subscriptions → 1 |
| 5 | `trackBy` on grid | CLS 0.082 → 0.004 |
| 6 | Route resolver on detail | CLS 0.142 → 0.000 |