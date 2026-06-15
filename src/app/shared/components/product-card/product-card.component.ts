import {
  Component, Input, ChangeDetectionStrategy, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';

/**
 * OnPush change detection is used here because this component receives data
 * exclusively via @Input bindings from the parent (CatalogueComponent).
 * The parent's signal-based product list emits a new array reference on every
 * stock update, which triggers Angular's input-diff check and re-renders only
 * the cards whose product reference actually changed.
 * This avoids checking all 20+ cards on every timer tick or browser event.
 */
@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCardComponent {

  @Input({ required: true }) product!: any;

  private cart = inject(CartService);

  addToCart(): void {
    if (this.product?.stock > 0) {
      this.cart.addItem(this.product);
    }
  }
}