import { Injectable, signal, computed, effect } from '@angular/core';
import { CartItem } from '../models/cart-item.model';

@Injectable({ providedIn: 'root' })
export class CartService {

  private readonly _items = signal<CartItem[]>(this.rehydrate());

  readonly items    = this._items.asReadonly();
  readonly count    = computed(() => this._items().reduce((s, i) => s + i.quantity, 0));
  readonly subtotal = computed(() => this._items().reduce((s, i) => s + i.price * i.quantity, 0));

  constructor() {
    // Persist on every change — effect() is batched by the signal scheduler
    effect(() => {
      localStorage.setItem('cart_items', JSON.stringify(this._items()));
    });
  }

  private rehydrate(): CartItem[] {
    try {
      const raw = localStorage.getItem('cart_items');
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  }

  addItem(product: any, quantity = 1): void {
    this._items.update(items => {
      const idx = items.findIndex(i => i.productId === product.id);
      if (idx !== -1) {
        return items.map(i =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      const item: CartItem = {
        productId: product.id,
        name:      product.title,
        price:     product.price,
        thumbnail: product.thumbnail,
        quantity,
        stock:     product.stock ?? 99
      };
      return [...items, item];
    });
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) { this.removeItem(productId); return; }
    this._items.update(items =>
      items.map(i => i.productId === productId ? { ...i, quantity } : i)
    );
  }

  removeItem(productId: number): void {
    this._items.update(items => items.filter(i => i.productId !== productId));
  }

  clear(): void {
    this._items.set([]);
  }
}