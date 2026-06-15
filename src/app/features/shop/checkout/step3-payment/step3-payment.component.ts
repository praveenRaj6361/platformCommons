import {
  Component, inject, signal, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../../../core/services/cart.service';
import { CheckoutService } from '../../../../core/services/checkout.service';
import { OrderApiService } from '../../../../core/services/order-api.service';
import { OrderStoreService } from '../../../../core/store/order-store.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CardInputComponent } from '../../../../shared/components/card-input/card-input.component';
import {
  DynamicFormRendererComponent,
  FormFieldConfig
} from '../../../../shared/components/dynamic-form-renderer/dynamic-form-renderer.component';

// Billing address fields — use visibleWhen to show only when sameAsDelivery is false
const BILLING_FIELDS: FormFieldConfig[] = [
  {
    name: 'billingAddress', type: 'text',  label: 'Billing Address',
    placeholder: 'Street address', validators: ['required'],
    visibleWhen: { field: 'sameAsDelivery', value: false }
  },
  {
    name: 'billingCity', type: 'text', label: 'City',
    placeholder: 'City', validators: ['required'],
    visibleWhen: { field: 'sameAsDelivery', value: false }
  },
  {
    name: 'billingPincode', type: 'text', label: 'PIN Code',
    placeholder: '560001', validators: ['required', 'minLength:6'],
    visibleWhen: { field: 'sameAsDelivery', value: false }
  }
];

@Component({
  selector: 'app-step3-payment',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    CardInputComponent, DynamicFormRendererComponent
  ],
  templateUrl: './step3-payment.component.html',
  styleUrls: ['./step3-payment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Step3PaymentComponent {

  private fb         = inject(FormBuilder);
  private cart       = inject(CartService);
  private checkout   = inject(CheckoutService);
  private orderApi   = inject(OrderApiService);
  private orderStore = inject(OrderStoreService);
  private auth       = inject(AuthService);
  private router     = inject(Router);

  readonly billingFields = BILLING_FIELDS;
  readonly submitting    = signal(false);
  readonly error         = signal<string | null>(null);

  readonly form = this.fb.group({
    cardNumber:     ['', Validators.required],
    cardExpiry:     ['', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}$/)]],
    cardCvv:        ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
    sameAsDelivery: [true],
    billingAddress: [''],
    billingCity:    [''],
    billingPincode: ['']
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const orderId      = 'ORD-' + Date.now();
    const cartItems    = this.cart.items();
    const deliveryData = this.checkout.deliveryData();
    const total        = this.cart.subtotal();

    // order-history filter (which matches against currentUser name) always finds it.
    // deliveryData fullName is only a shipping address field, not the account name.
    const customerName = this.auth.currentUser()?.name ?? 'Guest';

    // OPTIMISTIC: clear cart and navigate immediately
    this.cart.clear();
    this.checkout.reset();
    this.router.navigate(['/shop/order-confirmation', orderId]);

    // POST to mock endpoint — reconcile or rollback on failure
    this.orderApi.submitOrder({
      id: orderId,
      customerName, 
      total,
      items: cartItems.map(i => ({
        productId:   i.productId,
        productName: i.name,
        quantity:    i.quantity,
        price:       i.price
      }))
    })
    .subscribe({
      next: () => {
        this.orderStore.forceReload();
      },
      error: () => {
        this.error.set('Order could not be placed. Please try again.');
      }
    });
  }
}