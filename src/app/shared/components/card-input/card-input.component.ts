import {
  Component, forwardRef, signal, ChangeDetectionStrategy
} from '@angular/core';
import {
  ControlValueAccessor, NG_VALUE_ACCESSOR, NG_VALIDATORS,
  Validator, AbstractControl, ValidationErrors
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Custom ControlValueAccessor for card number input.
 * Integrates seamlessly into any reactive FormGroup.
 * Applies real-time Luhn algorithm validation via NG_VALIDATORS.
 */
@Component({
  selector: 'app-card-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './card-input.component.html',
  styleUrls: ['./card-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CardInputComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => CardInputComponent),
      multi: true
    }
  ]
})
export class CardInputComponent implements ControlValueAccessor, Validator {

  displayValue = signal('');
  luhnValid    = signal<boolean | null>(null);
  touched      = signal(false);

  private onChange  = (_: string) => {};
  private onTouched = () => {};

  writeValue(val: string): void {
    const digits = (val ?? '').replace(/\D/g, '').slice(0, 16);
    this.displayValue.set(this.formatCard(digits));
  }

  registerOnChange(fn: any): void  { this.onChange  = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }

  onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value
      .replace(/\D/g, '').slice(0, 16);
    this.displayValue.set(this.formatCard(raw));
    this.luhnValid.set(raw.length === 16 ? this.luhn(raw) : null);
    this.onChange(raw);
  }

  onBlur(): void {
    this.touched.set(true);
    this.onTouched();
  }

  validate(_: AbstractControl): ValidationErrors | null {
    const raw = this.displayValue().replace(/\s/g, '');
    if (!raw)                                    return { required: true };
    if (raw.length !== 16 || !this.luhn(raw))    return { invalidCard: true };
    return null;
  }

  private formatCard(raw: string): string {
    return raw.match(/.{1,4}/g)?.join(' ') ?? raw;
  }

  // Luhn algorithm — standard credit card checksum
  private luhn(num: string): boolean {
    let sum = 0, alt = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let n = parseInt(num[i], 10);
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
      alt = !alt;
    }
    return sum % 10 === 0;
  }
}