import { Injectable, signal, inject } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { ProductApiService } from '../services/product-api.service';
import { ToastService } from '../services/toast.service';

@Injectable({ providedIn: 'root' })
export class ProductStoreService {

  private api = inject(ProductApiService);
  private toast = inject(ToastService);

  // ── State ──────────────────────────────────────────────
  readonly products = signal<any[]>([]);
  readonly total    = signal(0);
  readonly loading  = signal(false);
  readonly error    = signal<string | null>(null);

 
  readonly skip     = signal(0);
  readonly limit    = signal(10);
  readonly search   = signal('');
  readonly category = signal('all');

  private stockSub?: Subscription;

  // ── Load ───────────────────────────────────────────────
  loadProducts(resetPage = false): void {
    if (resetPage) this.skip.set(0);
    this.loading.set(true);
    this.error.set(null);

    this.api.getProducts(this.limit(), this.skip(), this.search(), this.category())
      .subscribe({
        next: (res) => {
          this.products.set(res.products ?? []);
          this.total.set(res.total ?? 0);
          this.loading.set(false);
          this.startStockStream();
        },
        error: () => {
          this.error.set('Failed to load products.');
          this.loading.set(false);
        }
      });
  }

  // ── Shared WebSocket simulation ───────────────────────
  // Single stream shared between Admin and Shop — same singleton service
  startStockStream(): void {
    if (this.stockSub && !this.stockSub.closed) return; // already running

    this.stockSub = interval(3000).subscribe(() => {
      this.products.update(list =>
        list.map(p => {
          const delta = Math.floor(Math.random() * 5) - 2;
          return { ...p, stock: Math.max(0, (p.stock ?? 0) + delta) };
        })
      );
    });
  }

  // ── Filters & pagination ──────────────────────────────
  setSearch(value: string): void {
    this.search.set(value);
    this.loadProducts(true);
  }

  setCategory(value: string): void {
    this.category.set(value);
    this.loadProducts(true);
  }

  setPage(page: number): void {
    this.skip.set((page - 1) * this.limit());
    this.loadProducts();
  }

  // ── Mutations ─────────────────────────────────────────
  addProduct(product: any): void {
    this.products.update(list => [product, ...list]);
    this.total.update(t => t + 1);
  }

  updateProduct(updated: any): void {
    this.products.update(list =>
      list.map(p => Number(p.id) === Number(updated.id) ? { ...p, ...updated } : p)
    );
  }



deleteProduct(id: number): void {
  const backup = this.products();
  this.products.update(list => list.filter(p => p.id !== id));
  this.total.update(t => Math.max(0, t - 1));

  this.api.deleteProduct(id).subscribe({
    next: () => {
      this.toast.show('Product deleted successfully', 'success');
    },
    error: () => {
      // Rollback
      this.products.set(backup);
      this.total.update(t => t + 1);
      this.toast.show('Something went wrong. Please try again.', 'error');
    }
  });
}


  destroy(): void {
    this.stockSub?.unsubscribe();
  }
}
