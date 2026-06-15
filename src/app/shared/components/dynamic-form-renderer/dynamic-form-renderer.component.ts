import {
  Component, Input, OnChanges, ChangeDetectionStrategy
} from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface FormFieldConfig {
  name:        string;
  type:        'text' | 'email' | 'tel' | 'select' | 'textarea' | 'checkbox';
  label:       string;
  placeholder?: string;
  options?:    string[];
  validators?: Array<'required' | 'email' | `minLength:${number}` | `maxLength:${number}`>;
  visibleWhen?: { field: string; value: any };
}

/**
 * Shared, module-agnostic form renderer.
 * Accepts a JSON config and a FormGroup — has zero knowledge of which
 * step or feature is using it. Used in both Task 2 (admin) and Task 3 (checkout).
 */
@Component({
  selector: 'app-dynamic-form-renderer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dynamic-form-renderer.component.html',
  styleUrls: ['./dynamic-form-renderer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicFormRendererComponent implements OnChanges {

  @Input({ required: true }) config!:    FormFieldConfig[];
  @Input({ required: true }) formGroup!: FormGroup;

  private triggersSubscribed = false;

  ngOnChanges(): void {
    this.applyValidators();
    this.subscribeToVisibilityTriggers();
  }

  private applyValidators(): void {
    if (!this.formGroup || !this.config?.length) return;

    for (const field of this.config) {
      const ctrl = this.formGroup.get(field.name);
      if (!ctrl) continue;

    
      if (!this.isVisible(field)) {
        ctrl.clearValidators();
        ctrl.setErrors(null);
        ctrl.updateValueAndValidity({ emitEvent: false });
        continue;
      }

      const validators = (field.validators ?? []).map(v => {
        if (v === 'required')              return Validators.required;
        if (v === 'email')                 return Validators.email;
        if (v.startsWith('minLength:'))    return Validators.minLength(+v.split(':')[1]);
        if (v.startsWith('maxLength:'))    return Validators.maxLength(+v.split(':')[1]);
        return null;
      }).filter(Boolean) as any[];

      ctrl.setValidators(validators);
      ctrl.updateValueAndValidity({ emitEvent: false });
    }
  }

  
  private subscribeToVisibilityTriggers(): void {
    if (this.triggersSubscribed) return;
    if (!this.formGroup || !this.config?.length) return;

    const triggerFields = new Set(
      this.config
        .filter(f => f.visibleWhen)
        .map(f => f.visibleWhen!.field)
    );

    for (const fieldName of triggerFields) {
      const ctrl = this.formGroup.get(fieldName);
      if (!ctrl) continue;

      ctrl.valueChanges.subscribe(() => {
        this.applyValidators();
      });
    }

    this.triggersSubscribed = true;
  }

  isVisible(field: FormFieldConfig): boolean {
    if (!field.visibleWhen) return true;
    const ctrl = this.formGroup.get(field.visibleWhen.field);
    return ctrl?.value === field.visibleWhen.value;
  }

  getError(name: string): string | null {
    const ctrl = this.formGroup.get(name);
    if (!ctrl?.touched || !ctrl.errors) return null;
    if (ctrl.errors['required'])    return 'This field is required.';
    if (ctrl.errors['email'])       return 'Enter a valid email address.';
    if (ctrl.errors['minlength'])   return `Minimum ${ctrl.errors['minlength'].requiredLength} characters.`;
    if (ctrl.errors['maxlength'])   return `Maximum ${ctrl.errors['maxlength'].requiredLength} characters.`;
    return null;
  }
}