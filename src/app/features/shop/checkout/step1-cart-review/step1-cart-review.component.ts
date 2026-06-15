import {
  Component, OnInit, inject, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../../../core/services/cart.service';
import { CheckoutService } from '../../../../core/services/checkout.service';
import { OrderTotalPipe } from '../../../../shared/pipes/order-total.pipe';

const TAX_RATE = 0.18;

@Component({
  selector: 'app-step1-cart-review',
  standalone: true,
  imports: [CommonModule, RouterModule, OrderTotalPipe],
  templateUrl: './step1-cart-review.component.html',
  styleUrls: ['./step1-cart-review.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Step1CartReviewComponent implements OnInit {

  private cart     = inject(CartService);
  private checkout = inject(CheckoutService);
  private router   = inject(Router);

  readonly items   = this.cart.items;
  readonly taxRate = TAX_RATE;

  readonly totals = computed(() => {
    const pipe = new OrderTotalPipe();
    return pipe.transform(this.items(), TAX_RATE);
  });

  ngOnInit(): void {
    // Empty cart guard — redirect to shop
    if (this.items().length === 0) {
      this.router.navigate(['/shop']);
    }
  }

  updateQty(productId: number, event: Event): void {
    const qty = +(event.target as HTMLInputElement).value;
    this.cart.updateQuantity(productId, qty);
    if (this.items().length === 0) this.router.navigate(['/shop']);
  }

  remove(productId: number): void {
    this.cart.removeItem(productId);
    if (this.items().length === 0) this.router.navigate(['/shop']);
  }

  proceed(): void {
    this.checkout.completeStep(1);
    this.router.navigate(['/shop/checkout/step/2']);
  }

  trackById(_: number, i: any): number {
    return i.productId;
  }
}