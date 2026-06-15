# PROMPTS.md

---

**Prompt 1 — Signal Store with Session Rehydration**
> "In Angular 17, if I rehydrate AuthService signals from sessionStorage inside a constructor using inject(), will the signals be ready before route guards fire on page refresh? Or do I need APP_INITIALIZER?"

*Decision:* Confirmed that signals set in the constructor are synchronous and ready before guards run — no need for APP_INITIALIZER. Kept it simple.

---

**Prompt 2 — Shared WebSocket Stream Across Lazy Modules**
> "I have a simulated stock stream in a singleton service. Admin module and Shop module both consume it. If Shop is lazy-loaded, will it get the same Subject instance or a new one? How do I guarantee one shared stream?"

*Decision:* Confirmed providedIn: 'root' ensures one instance even across lazy modules. No need for manual multicast operators.

---

**Prompt 3 — visibleWhen in Dynamic Form Without eval()**
> "My checkout JSON config has a visibleWhen field like `'country === IN'`. What's the safest way to evaluate this against sibling form values at runtime without using eval()?"

*Decision:* Used a small predicate parser with split + FormGroup.get() lookup instead of eval(). Keeps it safe and testable.

---

**Prompt 4 — Optimistic Delete Rollback Timing with Signals**
> "If I remove an item from a signal array optimistically and the HTTP call fails, restoring the original array causes a flicker. Is there a clean pattern to avoid that in a signal-based store?"

*Decision:* Snapshot the array before deletion, restore on error. Added a 300ms debounce on the error toast so the flicker isn't noticeable in practice.

---

**Prompt 5 — Luhn CVA Validator Blocking Form Submit**
> "My card number CVA returns { invalidCard: true } but the parent FormGroup doesn't pick it up — the form stays valid even with a bad card. What am I missing in the CVA validator registration?"

*Decision:* Was missing `validate()` method on the CVA class and `NG_VALIDATORS` provider. Adding both fixed the FormGroup integration.

---

**Prompt 6 — @defer with Route-Level Lazy Loading**
> "Can @defer be used at the route level in Angular 17 alongside loadComponent, or does it only work inside templates? I want the entire /shop chunk deferred until navigation."

*Decision:* @defer is template-only. Used loadComponent for route-level lazy loading and @defer inside the shell component for the catalogue content block with a skeleton placeholder.

---

**Prompt 7 — PerformanceObserver LCP Always Returns 0**
> "My PerformanceObserver for LCP logs 0 on the catalogue route. I'm attaching it in ngOnInit. Is the timing wrong, or is @defer causing LCP to fire before the observer registers?"

*Decision:* Moved observer attachment to the constructor and added buffered: true so past entries are captured. LCP now logs correctly even when the element renders before the observer registers.

