import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  signal, computed, inject, DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  debounceTime, distinctUntilChanged, Subject, switchMap, of
} from 'rxjs';
import { ProductStoreService } from '../../../core/store/product-store.service';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';

const CATEGORIES = [
  'all', 'smartphones', 'laptops', 'fragrances', 'skincare',
  'groceries', 'home-decoration', 'furniture', 'tops',
  'womens-dresses', 'womens-shoes', 'mens-shirts', 'mens-shoes',
  'mens-watches', 'womens-watches', 'womens-bags',
  'womens-jewellery', 'sunglasses', 'automotive', 'motorcycle', 'lighting'
];

/**
 * OnPush — this component reads exclusively from signals and @Input props.
 * Signal reads are tracked by Angular's reactive graph; the view only
 * re-evaluates when a signal it depends on emits a new value.
 * Default CD would run on every browser event across the entire product grid.
 */
@Component({
  selector: 'app-catalogue',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ProductCardComponent],
  templateUrl: './catalogue.component.html',
  styleUrls: ['./catalogue.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogueComponent implements OnInit, OnDestroy {

  private store      = inject(ProductStoreService);
  private route      = inject(ActivatedRoute);
  private router     = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly products = this.store.products;
  readonly loading  = this.store.loading;
  readonly total    = this.store.total;
  readonly storeErr = this.store.error;

  readonly searchTerm       = signal('');
  readonly selectedCategory = signal('all');
  readonly minPrice         = signal(0);
  readonly maxPrice         = signal(10000);
  readonly inStockOnly      = signal(false);

  readonly categories  = CATEGORIES;
  readonly skeletons   = Array(8).fill(0);

  readonly displayProducts = computed(() => {
    let list = this.products();
    if (this.inStockOnly()) list = list.filter(p => p.stock > 0);
    list = list.filter(p => p.price >= this.minPrice() && p.price <= this.maxPrice());
    return list;
  });

  readonly currentPage = computed(() =>
    Math.floor(this.store.skip() / this.store.limit()) + 1
  );
  readonly totalPages = computed(() =>
    Math.ceil(this.total() / this.store.limit())
  );

  private search$ = new Subject<string>();

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.searchTerm.set(params['q'] ?? '');
        this.selectedCategory.set(params['category'] ?? 'all');
        this.inStockOnly.set(params['inStock'] === 'true');
        this.minPrice.set(+(params['minPrice'] ?? 0));
        this.maxPrice.set(+(params['maxPrice'] ?? 10000));

        // FIX: skip() is a signal now — set it via .set()
        this.store.search.set(this.searchTerm());
        this.store.category.set(this.selectedCategory());

        this.store.loadProducts();
      });

    this.search$
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap(q => {
          this.store.search.set(q);
          this.store.skip.set(0);
          this.store.loadProducts();
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    this.setupPerformanceObservers();
  }

  ngOnDestroy(): void {}

  onSearch(value: string): void {
    this.searchTerm.set(value);
    this.updateUrl({ q: value });
    this.search$.next(value);
  }

  onCategory(cat: string): void {
    this.selectedCategory.set(cat);
    this.store.setCategory(cat);
    this.updateUrl({ category: cat });
  }

  onInStockToggle(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.inStockOnly.set(checked);
    this.updateUrl({ inStock: String(checked) });
  }

  onMinPrice(event: Event): void {
    this.minPrice.set(+(event.target as HTMLInputElement).value);
    this.updateUrl({ minPrice: this.minPrice() });
  }

  onMaxPrice(event: Event): void {
    this.maxPrice.set(+(event.target as HTMLInputElement).value);
    this.updateUrl({ maxPrice: this.maxPrice() });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.store.setPage(page);
  }

  retry(): void {
    this.store.loadProducts();
  }

  trackById(_: number, item: any): number {
    return item.id;
  }

  private updateUrl(params: Record<string, any>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  private setupPerformanceObservers(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const lcpObs = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const last    = entries[entries.length - 1] as any;
        console.log(`[Perf] LCP: ${last.startTime.toFixed(2)}ms`);
      });
      lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (_) {}

    try {
      const clsObs = new PerformanceObserver(list => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            console.log(`[Perf] CLS layout shift: ${entry.value.toFixed(4)}`);
          }
        }
      });
      clsObs.observe({ type: 'layout-shift', buffered: true });
    } catch (_) {}
  }
}