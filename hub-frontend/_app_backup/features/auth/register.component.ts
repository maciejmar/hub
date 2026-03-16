import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <h1>Rejestracja</h1>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <label>Imie i nazwisko</label>
      <input type="text" formControlName="full_name" />

      <label>Email</label>
      <input type="email" formControlName="email" />

      <label>Haslo (min. 8 znakow)</label>
      <input type="password" formControlName="password" />

      <button type="submit" [disabled]="form.invalid || loading">Utworz konto</button>
      <p *ngIf="error">{{ error }}</p>
    </form>
  `,
})
export class RegisterComponent {
  loading = false;
  error = '';

  readonly form = this.fb.nonNullable.group({
    full_name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  submit(): void {
    if (this.form.invalid || this.loading) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/login']);
      },
      error: () => {
        this.loading = false;
        this.error = 'Nie udalo sie zarejestrowac konta';
      },
    });
  }
}
