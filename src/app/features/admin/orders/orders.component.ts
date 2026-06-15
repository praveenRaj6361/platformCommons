import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  OnInit,
  HostListener
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Order, OrderStatus } from '../../../core/models/order.model';
import { OrderStoreService } from '../../../core/store/order-store.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersComponent implements OnInit {

  private store = inject(OrderStoreService);

  // =========================
  // STATE
  // =========================
  selectedOrder = signal<Order | null>(null);
  statusFilter = signal<string>('All');

  startDate = signal<string | null>(null);
  endDate = signal<string | null>(null);

  currentPage = signal(1);
  pageSize = signal(10);

  sortField = signal<'id' | 'customerName' | 'products' | 'total' | 'status' | 'date' | null>(null);
  sortDirection = signal<'asc' | 'desc'>('asc');

  ngOnInit(): void {
    this.store.loadOrders();
  }

  // =========================
  // TRACK BY (FIXED ERROR)
  // =========================
  trackById(_: number, o: Order): string {
    return o.id;
  }

  // =========================
  // CLOSE PANEL OUTSIDE CLICK
  // =========================
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const selectedOrder = this.selectedOrder();
    if (!selectedOrder) return;

    const target = event.target as HTMLElement;

    if (!target.closest('.side-panel')) {
      this.closePanel();
    }
  }

  onRowClick(event: MouseEvent, order: Order): void {
    event.stopPropagation();
    this.openOrder(order);
  }

  // =========================
  // FILTERED
  // =========================
  readonly filteredOrders = computed(() => {
    const status = this.statusFilter();
    const start = this.startDate();
    const end = this.endDate();

    let orders = [...this.store.orders()];

    if (status !== 'All') {
      orders = orders.filter(o => o.status === status);
    }

    const normalize = (d: string) => new Date(d + 'T00:00:00').getTime();

    if (start) orders = orders.filter(o => normalize(o.date) >= normalize(start));
    if (end) orders = orders.filter(o => normalize(o.date) <= normalize(end));

    return orders;
  });

  // =========================
  // SORTED
  // =========================
  readonly sortedOrders = computed(() => {
    const field = this.sortField();
    const dir = this.sortDirection();

    let orders = [...this.filteredOrders()];

    if (field) {
      orders.sort((a: any, b: any) => {

        let valA: any;
        let valB: any;

        if (field === 'total') {
          valA = this.getOrderPrice(a);
          valB = this.getOrderPrice(b);
        } else if (field === 'customerName') {
          valA = a.customerName.toLowerCase();
          valB = b.customerName.toLowerCase();
        } else if (field === 'date') {
          valA = new Date(a.date).getTime();
          valB = new Date(b.date).getTime();
        } else if (field === 'products') {
          valA = a.items.map((i: any) => i.productName).join(' ');
          valB = b.items.map((i: any) => i.productName).join(' ');
        } else {
          valA = (a as any)[field];
          valB = (b as any)[field];
        }

        return valA < valB ? (dir === 'asc' ? -1 : 1)
             : valA > valB ? (dir === 'asc' ? 1 : -1)
             : 0;
      });
    }

    return orders;
  });

  // =========================
  // PAGINATION
  // =========================
  readonly orders = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.sortedOrders().slice(start, start + this.pageSize());
  });

  readonly totalPages = computed(() =>
    Math.ceil(this.sortedOrders().length / this.pageSize())
  );

  // =========================
  // ACTIONS
  // =========================
  openOrder(order: Order) {
    this.selectedOrder.set(order);
  }

  closePanel() {
    this.selectedOrder.set(null);
  }

  updateStatus(status: string) {
    const order = this.selectedOrder();
    if (!order) return;

    this.store.updateStatus(order.id, status as OrderStatus);

    this.selectedOrder.set({ ...order, status: status as OrderStatus });
  }

  clearDateFilter() {
    this.startDate.set(null);
    this.endDate.set(null);
  }

  onStatusChange(value: string) {
    this.statusFilter.set(value);
  }

  onSort(field: 'id' | 'customerName' | 'products' | 'total' | 'status' | 'date'): void {

  if (this.sortField() === field) {
    this.sortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
  } else {
    this.sortField.set(field);
    this.sortDirection.set('asc');
  }
}

  // =========================
  // CALCULATIONS
  // =========================
  getOrderTotal(order: Order) {
    return order.items.reduce((s, i) => s + i.quantity, 0);
  }

  getOrderPrice(order: Order) {
    return order.items.reduce((s, i) => s + i.price, 0);
  }

  // =========================
  // SORT ICON
  // =========================
  getSortIcon(field: string) {
    return this.sortField() === field
      ? (this.sortDirection() === 'asc' ? '↑' : '↓')
      : '⇅';
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }
}