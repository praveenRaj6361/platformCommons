import {
  Component, OnInit, inject, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductStoreService } from '../../../core/store/product-store.service';
import { OrderStoreService } from '../../../core/store/order-store.service';

interface CategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
  percentage: number;
}

/**
 * OnPush — every value displayed here is derived via computed() from the
 * shared ProductStoreService and OrderStoreService signal stores. Angular
 * only re-renders this view when one of those underlying signals changes
 * (e.g. the shared stock-stream interval, or a new order being placed),
 * not on unrelated parent change-detection cycles.
 */
@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalyticsComponent implements OnInit {

  private productStore = inject(ProductStoreService);
  private orderStore   = inject(OrderStoreService);

  readonly productsLoading = this.productStore.loading;
  readonly ordersLoading   = this.orderStore.loading;

  // ── Product metrics ──────────────────────────────────────
  readonly totalProducts = computed(() => this.productStore.total());

  readonly lowStockCount = computed(() =>
    this.productStore.products().filter(p => p.stock > 0 && p.stock <= 5).length
  );

  readonly outOfStockCount = computed(() =>
    this.productStore.products().filter(p => p.stock === 0).length
  );

  readonly avgPrice = computed(() => {
    const products = this.productStore.products();
    if (!products.length) return 0;
    const sum = products.reduce((acc, p) => acc + (p.price ?? 0), 0);
    return sum / products.length;
  });

  // Category breakdown for the visible product page
  readonly categoryBreakdown = computed<CategoryBreakdown[]>(() => {
    const products = this.productStore.products();
    if (!products.length) return [];

    const counts = new Map<string, number>();
    for (const p of products) {
      const cat = p.category ?? 'uncategorized';
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }

    const total = products.length;
    return Array.from(counts.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  });

  // ── Order metrics ─────────────────────────────────────────
  readonly totalOrders = computed(() => this.orderStore.orders().length);

  readonly totalRevenue = computed(() =>
    this.orderStore.orders().reduce((sum, o) => sum + (o.total ?? 0), 0)
  );

  readonly avgOrderValue = computed(() => {
    const orders = this.orderStore.orders();
    if (!orders.length) return 0;
    return this.totalRevenue() / orders.length;
  });

  readonly statusBreakdown = computed<StatusBreakdown[]>(() => {
    const orders = this.orderStore.orders();
    if (!orders.length) return [];

    const counts = new Map<string, number>();
    for (const o of orders) {
      counts.set(o.status, (counts.get(o.status) ?? 0) + 1);
    }

    const total = orders.length;
    const order = ['Pending', 'Confirmed', 'Cancelled'];

    return order
      .filter(status => counts.has(status))
      .map(status => ({
        status,
        count: counts.get(status) ?? 0,
        percentage: Math.round(((counts.get(status) ?? 0) / total) * 100)
      }));
  });

  readonly topCustomers = computed(() => {
    const orders = this.orderStore.orders();
    if (!orders.length) return [];

    const counts = new Map<string, { count: number; total: number }>();
    for (const o of orders) {
      const existing = counts.get(o.customerName) ?? { count: 0, total: 0 };
      counts.set(o.customerName, {
        count: existing.count + 1,
        total: existing.total + (o.total ?? 0)
      });
    }

    return Array.from(counts.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  });

  // Recent orders (most recent 5 by date)
  readonly recentOrders = computed(() =>
    [...this.orderStore.orders()]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  );

  ngOnInit(): void {
    if (this.productStore.products().length === 0) {
      this.productStore.loadProducts(true);
    }
    if (this.orderStore.orders().length === 0) {
      this.orderStore.loadOrders();
    }
  }

  retryProducts(): void {
    this.productStore.loadProducts(true);
  }

  retryOrders(): void {
    this.orderStore.loadOrders();
  }

  trackByCategory(_: number, item: CategoryBreakdown): string {
    return item.category;
  }

  trackByStatus(_: number, item: StatusBreakdown): string {
    return item.status;
  }

  trackByCustomer(_: number, item: { name: string }): string {
    return item.name;
  }

  trackByOrderId(_: number, item: { id: string }): string {
    return item.id;
  }
}