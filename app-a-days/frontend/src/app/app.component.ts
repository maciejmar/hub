import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { OidcService } from './core/oidc.service';

interface DaysToResponse {
  target_date: string;
  today: string;
  days_difference: number;
  status: 'future' | 'today' | 'past';
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <ng-container *ngIf="!auth.isAuthenticated(); else appContent">
      <main class="page">
        <section class="card">
          <h1>App A - Dni do daty</h1>
          <p>Zaloguj sie, aby korzystac z aplikacji.</p>
          <button type="button" class="btn-login" (click)="auth.login()">
            Zaloguj przez Microsoft SSO
          </button>
        </section>
      </main>
    </ng-container>

    <ng-template #appContent>
      <main class="page">
        <section class="card">
          <h1>App A - Dni do daty</h1>
          <p>Wpisz date, a aplikacja policzy ile dni zostalo.</p>

          <form [formGroup]="form" (ngSubmit)="calculate()">
            <label for="targetDate">Data docelowa</label>
            <input id="targetDate" type="date" formControlName="targetDate" />
            <button type="submit" [disabled]="loading || form.invalid">Oblicz</button>
          </form>

          <p *ngIf="loading">Liczenie...</p>
          <p class="error" *ngIf="error">{{ error }}</p>

          <div *ngIf="result" class="result">
            <p><strong>Dzisiaj:</strong> {{ result.today }}</p>
            <p><strong>Data docelowa:</strong> {{ result.target_date }}</p>
            <p><strong>Roznica dni:</strong> {{ result.days_difference }}</p>
            <p><strong>Status:</strong> {{ result.status }}</p>
          </div>

          <button type="button" class="btn-logout" (click)="auth.logout()">Wyloguj</button>
        </section>
      </main>
    </ng-template>
  `,
  styles: `
    @keyframes gradientDrift {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .page {
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #0f172a, #1e3a8a, #312e81, #1d4ed8, #0ea5e9, #312e81, #1e3a8a);
      background-size: 400% 400%;
      animation: gradientDrift 16s ease infinite;
      margin: 0;
      font-family: Arial, sans-serif;
    }
    .card { width: min(520px, 92vw); background: rgba(255,255,255,0.75); backdrop-filter: blur(14px); border: 1px solid rgba(219,226,239,0.5); border-radius: 16px; padding: 24px; box-shadow: 0 8px 32px rgba(15,23,42,0.3); }
    h1 { margin-top: 0; }
    form { display: grid; gap: 8px; margin: 16px 0; }
    input, button { padding: 10px; border-radius: 8px; border: 1px solid #c9d3e5; }
    button { cursor: pointer; background: #1d4ed8; color: #fff; border: 0; font-weight: 600; }
    .btn-login { width: 100%; margin-top: 12px; background: #0078d4; }
    .btn-logout { margin-top: 16px; background: #6b7280; font-size: 13px; padding: 6px 12px; }
    .error { color: #b91c1c; }
    .result { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; }
  `,
})
export class AppComponent {
  private readonly apiBase = 'http://localhost:18001';

  loading = false;
  error = '';
  result: DaysToResponse | null = null;
  readonly form;

  constructor(
    public readonly auth: OidcService,
    private readonly fb: FormBuilder,
    private readonly http: HttpClient,
  ) {
    this.form = this.fb.nonNullable.group({
      targetDate: ['', Validators.required],
    });
  }

  calculate(): void {
    if (this.form.invalid || this.loading) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.result = null;

    const targetDate = this.form.getRawValue().targetDate;
    this.http
      .get<DaysToResponse>(`${this.apiBase}/api/days-to`, { params: { target_date: targetDate } })
      .subscribe({
        next: (data) => {
          this.result = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = err?.error?.detail ?? 'Nie udalo sie pobrac danych.';
          this.loading = false;
        },
      });
  }
}
