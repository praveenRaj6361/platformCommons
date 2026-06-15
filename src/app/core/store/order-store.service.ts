import { Injectable, signal, inject } from '@angular/core';
import { OrderApiService } from '../services/order-api.service';
import { Order, OrderStatus } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderStoreService {

  private api = inject(OrderApiService);

  private readonly _orders    = signal<Order[]>([]);
  private readonly _loading   = signal(false);
  private readonly _error     = signal<string | null>(null);
  private readonly _hasLoaded = signal(false);

  readonly orders    = this._orders.asReadonly();
  readonly loading   = this._loading.asReadonly();
  readonly error     = this._error.asReadonly();
  readonly hasLoaded = this._hasLoaded.asReadonly();

  loadOrders(): void {
    if (this._hasLoaded()) return;

    this._loading.set(true);
    this._error.set(null);

    this.api.getOrders().subscribe({
      next: (orders) => {
        this._orders.set(orders);
        this._loading.set(false);
        this._hasLoaded.set(true);
      },
      error: () => {
        this._error.set('Failed to load orders.');
        this._loading.set(false);
      }
    });
  }

  forceReload(): void {
    this._hasLoaded.set(false);
    this.loadOrders();
  }

  updateStatus(orderId: string, status: OrderStatus): void {
    // Optimistic update — signal updates immediately for a snappy UI
    this._orders.update(list =>
      list.map(o => o.id === orderId ? { ...o, status } : o)
    );

    // Persist the change back to the API layer so re-fetches stay in sync
    this.api.updateOrderStatus(orderId, status).subscribe({
      error: () => {
        this._error.set(`Failed to update status for order ${orderId}.`);
      }
    });
  }
}