import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { Order, OrderStatus } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderApiService {

  // In-memory store (mutable so submitOrder can push)
  private orders: Order[] = [
    {
      id: 'ORD-1001', customerName: 'John Doe',    total: 2500, status: 'Pending',
      date: '2026-06-01',
      items: [{ productId: 1, productName: 'Laptop',  quantity: 1, price: 2500 }]
    },
    {
      id: 'ORD-1002', customerName: 'Sarah Smith', total: 1800, status: 'Confirmed',
      date: '2026-06-03',
      items: [{ productId: 2, productName: 'Phone',   quantity: 2, price: 900  }]
    },
    {
      id: 'ORD-1003', customerName: 'Alex Johnson',total: 3200, status: 'Cancelled',
      date: '2026-06-04',
      items: [{ productId: 3, productName: 'Monitor', quantity: 2, price: 1600 }]
    },
    {
      id: 'ORD-1004', customerName: 'John Doe',    total: 2500, status: 'Pending',
      date: '2026-06-01',
      items: [{ productId: 1, productName: 'Laptop',  quantity: 1, price: 2500 }]
    },
    {
      id: 'ORD-1005', customerName: 'Sarah Smith', total: 1800, status: 'Confirmed',
      date: '2026-06-03',
      items: [{ productId: 2, productName: 'Phone',   quantity: 2, price: 900  }]
    },
    {
      id: 'ORD-1006', customerName: 'Alex Johnson',total: 3200, status: 'Cancelled',
      date: '2026-06-04',
      items: [{ productId: 3, productName: 'Monitor', quantity: 2, price: 1600 }]
    }
  ];

  getOrders(): Observable<Order[]> {
    return of(structuredClone(this.orders)).pipe(delay(500));
  }

  updateOrderStatus(orderId: string, status: OrderStatus): Observable<void> {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
    }
    return of(void 0).pipe(delay(200));
  }

  // mock POST endpoint for order submission
  submitOrder(order: Partial<Order>): Observable<{ id: string }> {
    const newOrder: Order = {
      id:           order.id           ?? ('ORD-' + Date.now()),
      customerName: order.customerName ?? 'Guest',
      total:        order.total        ?? 0,
      status:       'Pending',
      date:         new Date().toISOString().split('T')[0],
      items:        order.items        ?? []
    };
    this.orders.push(newOrder);
    return of({ id: newOrder.id }).pipe(delay(1200));
  }
}