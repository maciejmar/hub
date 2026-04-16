import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { HubService } from '../hub.service';
import { HubApp } from '../hub.models';

@Component({
  selector: 'app-centrum-dowodzenia',
  standalone: true,
  imports: [CommonModule],
  styles: `
    .cd {
      min-height: 100vh;
      background: var(--bg);
      color: var(--text-main);
      display: flex;
      flex-direction: column;
    }
    .cd__header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px 32px 0;
    }
    .cd__back {
      background: none;
      border: 1px solid var(--line);
      color: var(--text-main);
      border-radius: 8px;
      padding: 8px 16px;
      cursor: pointer;
      font-size: 14px;
    }
    .cd__back:hover { background: var(--surface); }
    .cd__title {
      font-size: 22px;
      font-weight: 700;
      margin: 0;
    }
    .cd__grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
      padding: 32px;
    }
    .cd__card {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      position: relative;
    }
    .cd__status-dot {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--line);
    }
    .cd__status-dot--active { background: #22c55e; }
    .cd__status-dot--orange { background: #f97316; }
    .cd__card h2 { font-size: 18px; font-weight: 600; margin: 0; }
    .cd__card p { font-size: 14px; color: var(--text-sub); margin: 0; flex: 1; }
    .cd__open {
      background: var(--accent);
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 10px 16px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }
    .cd__open:hover { opacity: 0.9; }
    .cd__error { padding: 32px; color: var(--text-sub); }
  `,
  template: `
    <div class="cd">
      <div class="cd__header">
        <button class="cd__back" (click)="goBack()">← Powrót</button>
        <h1 class="cd__title">Centrum Dowodzenia SandboxAI</h1>
      </div>

      <div *ngIf="error" class="cd__error">{{ error }}</div>

      <div class="cd__grid">
        <article class="cd__card" *ngFor="let app of apps">
          <span class="cd__status-dot"
            [class.cd__status-dot--active]="app.status === 'active'"
            [class.cd__status-dot--orange]="app.status === 'orange'">
          </span>
          <h2>{{ app.name }}</h2>
          <p>{{ app.description }}</p>
          <button class="cd__open" type="button" (click)="open(app.url)">
            Otwórz
          </button>
        </article>
      </div>
    </div>
  `,
})
export class CentrumDowodzeniaComponent implements OnInit {
  apps: HubApp[] = [];
  error = '';

  constructor(
    private readonly hubService: HubService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.hubService.getSystemApps().subscribe({
      next: (data) => (this.apps = data.apps),
      error: () => (this.error = 'Nie udało się pobrać listy aplikacji.'),
    });
  }

  goBack(): void {
    this.router.navigate(['/apps']);
  }

  open(url: string): void {
    if (url.includes('/portainer')) {
      this.router.navigateByUrl('/portainer-redirect');
      return;
    }
    window.open(url, '_blank', 'noopener');
  }
}
