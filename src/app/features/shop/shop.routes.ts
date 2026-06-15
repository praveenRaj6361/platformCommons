import { Routes } from '@angular/router';
import { checkoutStepGuard } from '../../core/guards/checkout-step.guard';
import { productResolver } from '../../core/resolvers/product.resolver';

export const SHOP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./catalogue/catalogue.component').then(m => m.CatalogueComponent)
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./product-detail/product-detail.component').then(m => m.ProductDetailComponent),
    resolve: { product: productResolver }
  },
  {
    path: 'checkout',
    children: [
      {
        path: 'step/1',
        loadComponent: () =>
          import('./checkout/step1-cart-review/step1-cart-review.component')
            .then(m => m.Step1CartReviewComponent)
      },
      {
        path: 'step/2',
        canActivate: [checkoutStepGuard],
        data: { requiredStep: 1 },
        loadComponent: () =>
          import('./checkout/step2-delivery/step2-delivery.component')
            .then(m => m.Step2DeliveryComponent)
      },
      {
        path: 'step/3',
        canActivate: [checkoutStepGuard],
        data: { requiredStep: 2 },
        loadComponent: () =>
          import('./checkout/step3-payment/step3-payment.component')
            .then(m => m.Step3PaymentComponent)
      },
      { path: '', redirectTo: 'step/1', pathMatch: 'full' }
    ]
  },
  {
    path: 'order-confirmation/:id',
    loadComponent: () =>
      import('./order-confirmation/order-confirmation.component')
        .then(m => m.OrderConfirmationComponent)
  },
  {
    path: 'order-history',
    loadComponent: () =>
      import('./order-history/order-history.component')
        .then(m => m.OrderHistoryComponent)
  }
];