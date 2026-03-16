import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';

import { OidcService } from './core/oidc.service';

interface PressureResponse {
  city: string;
  time: string;
  pressure_msl_hpa: number;
  surface_pressure_hpa: number;
  temperature_c: number;
  source: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="!auth.isAuthenticated(); else appContent">
      <main class="page">
        <section class="card">
          <h1>App B - Cisnienie w Warszawie</h1>
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
          <h1>App B - Cisnienie w Warszawie</h1>
          <p>Aktualne dane meteorologiczne dla Warszawy.</p>

          <button type="button" (click)="refresh()" [disabled]="loading">
            {{ loading ? 'Odswiezanie...' : 'Odswiez dane' }}
          </button>

          <p class="error" *ngIf="error">{{ error }}</p>

          <div *ngIf="result" class="result">
            <p><strong>Miasto:</strong> {{ result.city }}</p>
            <p><strong>Czas pomiaru:</strong> {{ result.time }}</p>
            <p><strong>Cisnienie (MSL):</strong> {{ result.pressure_msl_hpa }} hPa</p>
            <p><strong>Cisnienie powierzchniowe:</strong> {{ result.surface_pressure_hpa }} hPa</p>
            <p><strong>Temperatura:</strong> {{ result.temperature_c }} C</p>
            <p><strong>Zrodlo:</strong> {{ result.source }}</p>
          </div>

          <button type="button" class="btn-logout" (click)="auth.logout()">Wyloguj</button>
        </section>
      </main>
    </ng-template>
  `,
  styles: `
    @keyframes auroraShift {
      0%   { background-position: 0% 0%; }
      33%  { background-position: 100% 50%; }
      66%  { background-position: 50% 100%; }
      100% { background-position: 0% 0%; }
    }
    .page {
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: linear-gradient(160deg, #042f2e, #065f46, #0f766e, #0d9488, #22d3ee, #0d9488, #064e3b, #042f2e);
      background-size: 300% 300%;
      animation: auroraShift 20s ease-in-out infinite;
      margin: 0;
      font-family: Arial, sans-serif;
    }
    .card { width: min(560px, 92vw); background: rgba(255,255,255,0.75); backdrop-filter: blur(14px); border: 1px solid rgba(204,231,223,0.45); border-radius: 16px; padding: 24px; box-shadow: 0 8px 40px rgba(4,47,46,0.35); }
    h1 { margin-top: 0; }
    button { margin: 12px 0; padding: 10px 12px; border-radius: 8px; border: 0; background: #0f766e; color: #fff; font-weight: 600; cursor: pointer; }
    .btn-login { width: 100%; background: #0078d4; }
    .btn-logout { background: #6b7280; font-size: 13px; padding: 6px 12px; }
    .error { color: #b91c1c; }
    .result { background: #ecfeff; border: 1px solid #99f6e4; border-radius: 8px; padding: 12px; }
  `,
})
export class AppComponent {
  private readonly apiBase = 'http://localhost:8002';

  loading = false;
  error = '';
  result: PressureResponse | null = null;

  constructor(
    public readonly auth: OidcService,
    private readonly http: HttpClient,
  ) {
    if (this.auth.isAuthenticated()) {
      this.refresh();
    }
  }

  refresh(): void {
    if (this.loading) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.http.get<PressureResponse>(`${this.apiBase}/api/pressure/warsaw`).subscribe({
      next: (data) => {
        this.result = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'Nie udalo sie pobrac cisnienia.';
        this.loading = false;
      },
    });
  }
}
