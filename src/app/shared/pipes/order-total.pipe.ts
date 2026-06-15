import { Pipe, PipeTransform } from '@angular/core';
import { CartItem } from '../../core/models/cart-item.model';

export interface OrderTotals {
  subtotal: number;
  tax:      number;
  total:    number;
}

// pure: true (default) — Angular only recalculates when the reference changes.
// This is safe because CartService returns a new array reference on every mutation.
@Pipe({ name: 'orderTotal', standalone: true, pure: true })
export class OrderTotalPipe implements PipeTransform {
  transform(items: CartItem[], taxRate = 0.18): OrderTotals {
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax      = subtotal * taxRate;
    return { subtotal, tax, total: subtotal + tax };
  }
}