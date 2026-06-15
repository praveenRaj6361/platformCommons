import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal
} from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // =========================
  // UI STATE
  // =========================
  mode = signal<'login' | 'signup'>('login');
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null); // ✅ NEW

  constructor() {

    const m = this.route.snapshot.queryParamMap.get('mode');
    this.mode.set(m === 'signup' ? 'signup' : 'login');

    this.route.queryParamMap.subscribe(params => {
      const mode = params.get('mode');
      this.mode.set(mode === 'signup' ? 'signup' : 'login');
    });
  }

  // =========================
  // LOGIN FORM
  // =========================
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  // =========================
  // SIGNUP FORM
  // =========================
  signupForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  // =========================
  // SUBMIT
  // =========================
  async submit() {

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    try {

      // =========================
      // LOGIN FLOW
      // =========================
      if (this.mode() === 'login') {

        const { email, password } = this.form.value;

        const res = await this.auth.login(email!, password!);

        if (!res.success) {
          this.error.set(res.message || 'Login failed');
        }

      }

      // =========================
      // SIGNUP FLOW (UPDATED)
      // =========================
      else {

        const { name, email, password } = this.signupForm.value;

        if (!name || !email || !password) {
          this.error.set('All fields are required');
          return;
        }

        const res = await this.auth.signup(name, email, password);

        if (!res.success) {
          this.error.set(res.message || 'Signup failed');
          return;
        }

        // ✅ SHOW SUCCESS MESSAGE IN UI
        this.success.set('Signup successful! Please login.');

        // reset signup form
        this.signupForm.reset();

        // switch to login mode
        this.mode.set('login');

        // update URL
        this.router.navigate(['/login'], {
          queryParams: { mode: 'login' }
        });

        // prefill email for better UX
        this.form.patchValue({ email });

      }

    } finally {
      this.loading.set(false);
    }
  }

  // =========================
  // TOGGLE MODE
  // =========================
  toggleMode() {

    const newMode = this.mode() === 'login' ? 'signup' : 'login';

    this.router.navigate(['/login'], {
      queryParams: { mode: newMode }
    });
  }
}