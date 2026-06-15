import {
  Component, OnInit, inject, signal,
  ChangeDetectionStrategy, DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CheckoutService } from '../../../../core/services/checkout.service';
import {
  DynamicFormRendererComponent,
  FormFieldConfig
} from '../../../../shared/components/dynamic-form-renderer/dynamic-form-renderer.component';

@Component({
  selector: 'app-step2-delivery',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, DynamicFormRendererComponent],
  templateUrl: './step2-delivery.component.html',
  styleUrls: ['./step2-delivery.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Step2DeliveryComponent implements OnInit {

  private fb         = inject(FormBuilder);
  private http       = inject(HttpClient);
  private checkout   = inject(CheckoutService);
  private router     = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly formConfig = signal<FormFieldConfig[]>([]);

  readonly form = signal<FormGroup | null>(null);

  ngOnInit(): void {
    this.http
      .get<FormFieldConfig[]>('/assets/checkout-form.json')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (config) => {
          this.formConfig.set(config);

          const controls: Record<string, any> = {};
          for (const field of config) {
            controls[field.name] = [field.type === 'checkbox' ? false : ''];
          }
          const group = this.fb.group(controls);

          const saved = this.checkout.deliveryData();
          if (saved) group.patchValue(saved);

          this.form.set(group);
        },
        error: (err) => {
          console.error('Failed to load checkout form config', err);
        }
      });
  }

  submit(): void {
    const form = this.form();
    if (!form) return;

    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }
    this.checkout.deliveryData.set(form.value);
    this.checkout.completeStep(2);
    this.router.navigate(['/shop/checkout/step/3']);
  }
}