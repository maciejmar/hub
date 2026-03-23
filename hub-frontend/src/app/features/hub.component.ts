import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
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
        <img class="hub__logo" [src]="lightTheme ? 'bgk-logo.svg' : 'bgk-logo-white.svg'" alt="BGK" />
        <div class="hub__header-info">
          <h1>Portal aplikacji AI</h1>
        </div>
        <div class="hub__header-right" *ngIf="data">
          <div class="hub__user-bar" (click)="toggleMenu(); $event.stopPropagation()">
            <div class="hub__avatar" [style.background]="avatarBg">
              <span *ngIf="!customAvatar">{{ initials }}</span>
            </div>
            <span class="hub__user-name">{{ data.user.name }}</span>
            <svg class="hub__chevron" [class.hub__chevron--open]="menuOpen" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 6l4 4 4-4"/>
            </svg>
          </div>

          <div class="hub__dropdown" *ngIf="menuOpen" (click)="$event.stopPropagation()">
            <div class="hub__dropdown-header">
              <div class="hub__avatar hub__avatar--lg" [style.background]="avatarBg">
                <span *ngIf="!customAvatar">{{ initials }}</span>
              </div>
              <div>
                <div class="hub__dropdown-name">{{ data.user.name }}</div>
                <div class="hub__dropdown-email">{{ data.user.email }}</div>
                <div class="hub__dropdown-role">
                  <span class="hub__role-badge">{{ isAdmin ? 'admin' : 'user' }}</span>
                </div>
              </div>
            </div>
            <div class="hub__dropdown-divider"></div>
            <button class="hub__dropdown-item" (click)="openSettings()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              Ustawienia konta
            </button>
            <button class="hub__dropdown-item hub__dropdown-item--danger" (click)="logout()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Wyloguj
            </button>
          </div>
        </div>
      </header>

      <p class="hub__state" *ngIf="loading">Ladowanie aplikacji...</p>
      <p class="hub__state hub__state--error" *ngIf="error">{{ error }}</p>

      <div class="hub__grid" *ngIf="data">
        <article class="hub__card" *ngFor="let app of data.apps">
          <h2>{{ app.name }}</h2>
          <p>{{ app.description }}</p>
          <button class="hub__open" type="button" (click)="open(app.url)">Zacznij pracę z aplikacją</button>
        </article>
      </div>
    </section>

    <!-- Settings modal -->
    <div class="hub__modal-overlay" *ngIf="settingsOpen" (click)="closeSettings()">
      <div class="hub__modal" (click)="$event.stopPropagation()">
        <div class="hub__modal-header">
          <h3>Ustawienia konta</h3>
          <button class="hub__modal-close" (click)="closeSettings()">✕</button>
        </div>

        <div class="hub__modal-section">
          <div class="hub__avatar hub__avatar--xl" [style.background]="avatarBg">
            <span *ngIf="!customAvatar">{{ initials }}</span>
          </div>
          <label class="hub__btn-secondary">
            Zmień avatar
            <input type="file" accept="image/*" (change)="onAvatarChange($event)" hidden />
          </label>
          <button class="hub__btn-ghost" *ngIf="customAvatar" (click)="removeAvatar()">Usuń avatar</button>
        </div>

        <div class="hub__modal-divider"></div>

        <div class="hub__modal-section">
          <p class="hub__modal-label">Motyw</p>
          <div class="hub__theme-toggle">
            <button class="hub__theme-btn" [class.hub__theme-btn--active]="!lightTheme" (click)="setTheme(false)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              Ciemny
            </button>
            <button class="hub__theme-btn" [class.hub__theme-btn--active]="lightTheme" (click)="setTheme(true)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              Jasny
            </button>
          </div>
        </div>
      </div>
    </div>
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
      position: relative;
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

    /* User bar */
    .hub__user-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      padding: 6px 10px;
      border-radius: 40px;
      border: 1px solid var(--line);
      background: var(--surface);
      transition: background 0.15s;
      user-select: none;
    }
    .hub__user-bar:hover {
      background: var(--surface-strong);
    }
    .hub__user-name {
      font-size: 14px;
      color: var(--text-main);
      white-space: nowrap;
    }
    .hub__chevron {
      color: var(--text-muted);
      transition: transform 0.2s;
    }
    .hub__chevron--open {
      transform: rotate(180deg);
    }
    .hub__chevron path {
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
    }

    /* Avatar */
    .hub__avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }
    .hub__avatar--lg {
      width: 52px;
      height: 52px;
      font-size: 18px;
    }
    .hub__avatar--xl {
      width: 80px;
      height: 80px;
      font-size: 28px;
      margin: 0 auto 12px;
    }

    /* Dropdown */
    .hub__dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      min-width: 260px;
      background: var(--dropdown-bg);
      border: 1px solid var(--dropdown-border);
      border-radius: 12px;
      box-shadow: var(--shadow-lg);
      z-index: 100;
      overflow: hidden;
    }
    .hub__dropdown-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
    }
    .hub__dropdown-name {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-main);
    }
    .hub__dropdown-email {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 2px;
    }
    .hub__dropdown-role {
      margin-top: 6px;
    }
    .hub__role-badge {
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 999px;
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 700;
      color: #d8ebff;
      background: rgba(56, 189, 248, 0.16);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .hub__dropdown-divider {
      height: 1px;
      background: var(--dropdown-border);
    }
    .hub__dropdown-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 12px 16px;
      background: none;
      border: none;
      color: var(--text-main);
      font-family: inherit;
      font-size: 14px;
      cursor: pointer;
      text-align: left;
      transition: background 0.12s;
    }
    .hub__dropdown-item:hover {
      background: var(--dropdown-hover);
    }
    .hub__dropdown-item--danger {
      color: #f87171;
    }

    /* State */
    .hub__state {
      margin: 10px 0 4px;
      color: var(--text-muted);
    }
    .hub__state--error {
      color: #fecdd3;
    }

    /* Grid */
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
      color: var(--text-main);
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
      background: linear-gradient(rgb(211, 23, 46), rgb(200, 13, 38));
      border: 1px solid rgb(211, 23, 46);
      border-radius: 4px;
      transition: all 0.15s;
    }
    .hub__open:hover {
      filter: brightness(1.1);
    }

    /* Modal */
    .hub__modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
    }
    .hub__modal {
      background: var(--dropdown-bg);
      border: 1px solid var(--dropdown-border);
      border-radius: 16px;
      padding: 24px;
      width: 340px;
      box-shadow: var(--shadow-lg);
    }
    .hub__modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .hub__modal-header h3 {
      margin: 0;
      font-size: 18px;
      color: var(--text-main);
    }
    .hub__modal-close {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 18px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
    }
    .hub__modal-close:hover {
      background: var(--dropdown-hover);
    }
    .hub__modal-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 16px 0;
    }
    .hub__modal-divider {
      height: 1px;
      background: var(--dropdown-border);
    }
    .hub__modal-label {
      margin: 0 0 8px;
      font-size: 13px;
      color: var(--text-main);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      align-self: flex-start;
    }
    .hub__btn-secondary {
      padding: 8px 18px;
      border-radius: 6px;
      border: 1px solid var(--dropdown-border);
      background: var(--surface-strong);
      color: var(--text-main);
      font-family: inherit;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .hub__btn-secondary:hover {
      background: var(--surface-strong);
    }
    .hub__btn-ghost {
      background: none;
      border: none;
      color: #f87171;
      font-family: inherit;
      font-size: 13px;
      cursor: pointer;
      padding: 4px 8px;
    }

    /* Theme toggle */
    .hub__theme-toggle {
      display: flex;
      gap: 8px;
      width: 100%;
    }
    .hub__theme-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid var(--dropdown-border);
      background: var(--surface);
      color: var(--text-muted);
      font-family: inherit;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .hub__theme-btn--active {
      border-color: rgb(211, 23, 46);
      background: rgba(211, 23, 46, 0.12);
      color: var(--text-main);
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
  menuOpen = false;
  settingsOpen = false;
  customAvatar: string | null = null;
  lightTheme = false;

  constructor(
    private readonly auth: OidcAuthService,
    private readonly hubService: HubService,
    private readonly router: Router,
  ) {}

  get initials(): string {
    const name = this.data?.user.name ?? '';
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  get avatarBg(): string {
    return this.customAvatar
      ? `url(${this.customAvatar}) center/cover no-repeat`
      : 'linear-gradient(135deg, rgb(211,23,46), rgb(150,10,30))';
  }

  get isAdmin(): boolean {
    return this.data?.roles.includes('hub-admin') ?? false;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.menuOpen = false;
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  openSettings(): void {
    this.menuOpen = false;
    this.settingsOpen = true;
  }

  closeSettings(): void {
    this.settingsOpen = false;
  }

  onAvatarChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.customAvatar = e.target?.result as string;
      localStorage.setItem('hub_avatar', this.customAvatar);
    };
    reader.readAsDataURL(file);
  }

  removeAvatar(): void {
    this.customAvatar = null;
    localStorage.removeItem('hub_avatar');
  }

  setTheme(light: boolean): void {
    this.lightTheme = light;
    localStorage.setItem('hub_theme', light ? 'light' : 'dark');
    document.body.classList.toggle('light-theme', light);
  }

  open(url: string): void {
    if (url.startsWith(window.location.origin)) {
      this.router.navigateByUrl(url.replace(window.location.origin, ''));
    } else {
      window.open(url, '_blank', 'noopener');
    }
  }

  ngOnInit(): void {
    this.customAvatar = localStorage.getItem('hub_avatar');
    const savedTheme = localStorage.getItem('hub_theme');
    if (savedTheme === 'light') {
      this.lightTheme = true;
      document.body.classList.add('light-theme');
    }

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
