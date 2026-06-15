import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CheckoutService } from '../services/checkout.service';

export const checkoutStepGuard: CanActivateFn = (route) => {
  const checkout = inject(CheckoutService);
  const router   = inject(Router);
  const required = route.data['requiredStep'] as number;

  if (checkout.completedStep() >= required) return true;
  return router.createUrlTree(['/shop/checkout/step/1']);
};