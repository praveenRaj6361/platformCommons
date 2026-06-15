import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CheckoutService {

  private readonly _completedStep = signal<number>(0);
  readonly completedStep = this._completedStep.asReadonly();

  readonly deliveryData = signal<Record<string, any> | null>(null);

  completeStep(step: number): void {
    if (step > this._completedStep()) this._completedStep.set(step);
  }

  reset(): void {
    this._completedStep.set(0);
    this.deliveryData.set(null);
  }
}