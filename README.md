# Angular E-Commerce — Task Submission

## Setup

```bash
npm install
ng serve
```

Navigate to `http://localhost:4200`. The app redirects to `/login` by default.

**Production build:**
```bash
ng build --configuration=production
```

**Run with AOT (matches Lighthouse measurements in PERFORMANCE.md):**
```bash
ng serve --configuration=production
```

---

## Test Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin1@test.com | password |
| Admin | admin2@test.com | password |
| User | user1@test.com | password |
| User | user2@test.com | password |

New accounts can be created via the Sign Up flow — they are persisted to `localStorage` and assigned the `user` role automatically.

---

## Architecture Decisions

### Auth — Signal Store, Not BehaviorSubject

`AuthService` exposes `currentUser`, `role`, and `isAuthenticated` as Angular signals rather than RxJS observables. The reason is ergonomic and correctness-driven: signals are synchronous, so session rehydration from `sessionStorage` in the constructor completes before any route guard fires on page refresh. A `BehaviorSubject` would require guards to `take(1)` or `firstValueFrom()` and still risk a timing gap on cold load. No `APP_INITIALIZER` needed.

### Single Source of Truth for Products and Orders

`ProductStoreService` and `OrderStoreService` are both `providedIn: 'root'` signal stores. Admin and Shop modules share the same instances — the stock stream started in the admin products view keeps ticking when the user navigates to the shop catalogue, and order updates made in the admin panel are immediately visible in the user's order history without a refetch.

### State Shape — Signals over Component Properties

No component holds a local copy of server data. All state that needs to survive navigation or be shared across routes lives in the store services. Components only hold ephemeral UI state (open/closed panels, form values, sort direction) as local signals.

### Dynamic Form Renderer

Step 2 of checkout (Delivery Details) and the admin panel both use a single `DynamicFormRendererComponent` that accepts a `FormFieldConfig[]` and a `FormGroup` as inputs. The `visibleWhen` predicate (`{ field, value }`) is evaluated by checking `FormGroup.get(field)?.value === value` — no `eval()`, no string parsing. The component has no knowledge of which module or step is using it.

### Optimistic UI Pattern

Two places use optimistic updates:

- **Delete product** — the row is removed from the signal array immediately. If the DELETE call fails, the snapshot taken before deletion is restored and an error toast is shown.
- **Order submission** — cart is cleared and the router navigates to `/shop/order-confirmation/:id` before the POST resolves. On failure, the router rolls back to `/shop/checkout/step/3` with an error message.

The tradeoff: users see success immediately at the cost of a visible rollback if the network fails. Acceptable for a mock API where failures are rare.

### Checkout Step Guard

`checkoutStepGuard` reads `CheckoutService.completedSteps` (a signal) to decide whether to allow navigation to step 2 or 3. Deep-linking to `/shop/checkout/step/3` without completing steps 1 and 2 redirects to step 1. The guard is data-only — it does not know the form contents, only which step numbers have been marked complete.

### `hasLoaded` Flag in OrderStore

`OrderStoreService` tracks a `_hasLoaded` boolean signal. `loadOrders()` is a no-op if data is already present — this prevents the admin Orders view from wiping optimistic status changes when the component re-mounts after navigation. `forceReload()` resets the flag and re-fetches; it is called explicitly after a new order is submitted from checkout.

---

## Known Limitations

**Passwords in `localStorage` are hashed but not salted.** The SHA-256 hash used is deterministic — two users with the same password produce the same hash. A real implementation would use bcrypt with a per-user salt. This is acceptable for a mock auth store.

**`getAllUsers()` does not merge static + dynamic users.** If a user signs up, their record is written to `localStorage` as the full user list, replacing the static `USERS` constant. This means the original four hardcoded users are lost if `localStorage` already has a `users` key from a previous signup session. Fix: merge the two arrays on read, deduplicating by email.

**Order store is in-memory only.** `OrderApiService` holds orders in a plain array — a hard refresh resets it to the six seed orders. Orders placed in the current session survive navigation (via `OrderStoreService` signals) but not a page reload.

**Stock stream never stops.** `ProductStoreService.destroy()` exists but is never called automatically — it is only safe to call on full app teardown, not on route navigation, because the stream is shared. If the stream needs to pause (e.g. when no product view is mounted), a reference-counting pattern or `takeUntilDestroyed` on the store itself would be needed.

**Category filter and search are mutually exclusive at the API level.** `dummyjson.com` does not support combining `/products/category/:cat` with a `q=` search param. The service prioritises search over category when both are set. A real API would support both simultaneously.

**No refresh token.** The session token is stored in `sessionStorage`, which is cleared when the tab closes. There is no silent token refresh — users must log in again in a new tab. This is intentional given the mock scope.