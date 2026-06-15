import {
  Component, OnInit, signal, computed, inject,
  ChangeDetectionStrategy, DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CartService } from '../../../core/services/cart.service';
import { ProductApiService } from '../../../core/services/product-api.service';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent implements OnInit {

  private route      = inject(ActivatedRoute);
  private cart       = inject(CartService);
  private api        = inject(ProductApiService);
  private destroyRef = inject(DestroyRef);

  readonly product     = signal<any>(null);
  readonly related     = signal<any[]>([]);
  readonly quantity    = signal(1);
  readonly addedToCart = signal(false);

  readonly outOfStock = computed(() => (this.product()?.stock ?? 0) === 0);
  readonly maxQty     = computed(() => this.product()?.stock ?? 1);

  // Expose Math so template can use Math.round
  protected readonly Math = Math;

  ngOnInit(): void {
    const resolved = this.route.snapshot.data['product'];
    this.product.set(resolved);

    if (resolved?.category) {
      this.api
        .getProducts(5, 0, '', resolved.category)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(res => {
          this.related.set(
            (res.products as any[])
              .filter((p: any) => p.id !== resolved.id)
              .slice(0, 4)
          );
        });
    }
  }

  increment(): void {
    if (this.quantity() < this.maxQty()) this.quantity.update(q => q + 1);
  }

  decrement(): void {
    if (this.quantity() > 1) this.quantity.update(q => q - 1);
  }

  addToCart(): void {
    if (!this.product() || this.outOfStock()) return;
    this.cart.addItem(this.product(), this.quantity());
    this.addedToCart.set(true);
    setTimeout(() => this.addedToCart.set(false), 2000);
  }
}