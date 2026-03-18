import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { OidcAuthService } from '../core/auth/oidc-auth.service';
import { HubAppsResponse } from './hub.models';
import { HubService } from './hub.service';

@Component({
  selector: 'app-hub',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="hub">
      <header class="hub__header">
        <img class="hub__logo" src="bgk-logo-white.svg" alt="BGK" />
        <div class="hub__header-info">
          <h1>Portal aplikacji AI</h1>
        </div>
        <div class="hub__header-right">
          <p class="hub__user" *ngIf="data">Zalogowany: {{ data.user.name }} ({{ data.user.email }})</p>
          <div class="hub__roles" *ngIf="data && data.roles.length > 0">
            <span class="hub__role" *ngFor="let role of data.roles">{{ role }}</span>
          </div>
          <button class="hub__logout" type="button" (click)="logout()">Wyloguj</button>
        </div>
      </header>

      <p class="hub__state" *ngIf="loading">Ladowanie aplikacji...</p>
      <p class="hub__state hub__state--error" *ngIf="error">{{ error }}</p>

      <div class="hub__grid" *ngIf="data">
        <article class="hub__card" *ngFor="let app of data.apps">
          <h2>{{ app.name }}</h2>
          <p>{{ app.description }}</p>
          <button class="hub__open" type="button" (click)="open(app.url)">Otworz aplikacje</button>
        </article>
      </div>
    </section>
  `,
  styles: `
    .hub {
      max-width: 1120px;
      margin: 0 auto;
      padding: 24px 16px 36px;
    }
    .hub__logo {
      height: 80px;
      width: auto;
      flex-shrink: 0;
    }
    .hub__header-info {
      flex: 1;
    }
    .hub__header-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
    }
    .hub__user {
      margin: 0;
      font-size: 13px;
      color: var(--text-muted);
    }
    .hub__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      margin-bottom: 96px;
    }
    .hub__header h1 {
      margin: 0;
      font-size: clamp(26px, 4vw, 38px);
    }
    .hub__logout {
      display: inline-block;
      height: 35px;
      padding: 6px 10px;
      cursor: pointer;
      font-family: tide_sans_cond400_lil_dude, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 14px;
      font-weight: 400;
      line-height: 21px;
      color: #fff;
      text-align: center;
      background: linear-gradient(rgb(211, 23, 46), rgb(200, 13, 38));
      border: 1px solid rgb(211, 23, 46);
      border-radius: 4px;
      transition: all 0.15s;
    }
    .hub__logout:hover {
      filter: brightness(1.1);
    }
    .hub__state {
      margin: 10px 0 4px;
      color: var(--text-muted);
    }
    .hub__state--error {
      color: #fecdd3;
    }
    .hub__roles {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .hub__role {
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 700;
      color: #d8ebff;
      background: rgba(56, 189, 248, 0.16);
    }
    .hub__grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 14px;
    }
    .hub__card {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 16px;
      background:
        linear-gradient(160deg, rgba(56, 189, 248, 0.08), rgba(45, 212, 191, 0.04)),
        var(--surface-strong);
      box-shadow: var(--shadow-md);
      transition: transform 140ms ease, border-color 140ms ease;
    }
    .hub__card:hover {
      transform: translateY(-2px);
      border-color: rgba(56, 189, 248, 0.42);
    }
    .hub__card h2 {
      margin: 0 0 8px;
      font-size: 18px;
      color: #f3f8ff;
    }
    .hub__card p {
      margin: 0 0 14px;
      color: var(--text-muted);
      line-height: 1.4;
      flex: 1;
    }
    .hub__open {
      display: inline-block;
      height: 35px;
      padding: 6px 10px;
      cursor: pointer;
      font-family: tide_sans_cond400_lil_dude, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 14px;
      font-weight: 400;
      line-height: 21px;
      color: #fff;
      text-align: center;
      text-decoration: none;
      background: linear-gradient(rgb(211, 23, 46), rgb(200, 13, 38));
      border: 1px solid rgb(211, 23, 46);
      border-radius: 4px;
      transition: all 0.15s;
    }
    .hub__open:hover {
      filter: brightness(1.1);
    }
    @media (max-width: 640px) {
      .hub__header {
        flex-direction: column;
      }
    }
  `,
})
export class HubComponent implements OnInit {
  loading = true;
  error = '';
  data: HubAppsResponse | null = null;

  constructor(
    private readonly auth: OidcAuthService,
    private readonly hubService: HubService,
    private readonly router: Router,
  ) {}

  open(url: string): void {
    if (url.startsWith(window.location.origin)) {
      this.router.navigateByUrl(url.replace(window.location.origin, ''));
    } else {
      window.open(url, '_blank', 'noopener');
    }
  }

  ngOnInit(): void {
    this.hubService.getApps().subscribe({
      next: (data) => {
        this.data = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Nie udalo sie pobrac listy aplikacji.';
        this.loading = false;
      },
    });
  }

  logout(): void {
    this.auth.logout();
  }
}
