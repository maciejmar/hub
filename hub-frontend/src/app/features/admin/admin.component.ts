import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CatalogApp } from '../hub.models';
import { HubService } from '../hub.service';

const EMPTY_FORM = (): Omit<CatalogApp, never> => ({
  id: '',
  name: '',
  description: '',
  url: '',
  required_roles: '',
  sort_order: 0,
  is_active: true,
  status: 'active',
});

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="admin">
      <header class="admin__header">
        <img class="admin__logo" src="bgk-logo-white.svg" alt="BGK" />
        <div class="admin__header-info">
          <h1>Panel Administracyjny</h1>
          <p>Katalog aplikacji widocznych w Portalu.</p>
        </div>
        <button class="btn btn--back" type="button" (click)="goBack()">← Powrot do Huba</button>
      </header>

      <p class="state" *ngIf="loading">Ladowanie...</p>
      <p class="state state--error" *ngIf="error">{{ error }}</p>

      <!-- Add button -->
      <div class="toolbar" *ngIf="!showForm">
        <button class="btn btn--primary" type="button" (click)="openCreate()">+ Dodaj aplikacje</button>
        <button class="btn" type="button" (click)="checkHealth()" [disabled]="healthChecking">
          {{ healthChecking ? 'Sprawdzam...' : '🔍 Sprawdź dostępność' }}
        </button>
      </div>

      <!-- Form: create / edit -->
      <form class="form" *ngIf="showForm" (ngSubmit)="saveForm()">
        <h2>{{ editingId ? 'Edytuj aplikacje' : 'Nowa aplikacja' }}</h2>

        <label>
          ID (slug, np. <em>my-app</em>)
          <input type="text" [(ngModel)]="form.id" name="id" required [disabled]="!!editingId"
                 pattern="^[a-z0-9\-]+$" placeholder="my-app" />
        </label>
        <label>
          Nazwa
          <input type="text" [(ngModel)]="form.name" name="name" required placeholder="Moja Aplikacja"
                 (ngModelChange)="onNameChange($event)" />
        </label>
        <label>
          Opis
          <input type="text" [(ngModel)]="form.description" name="description" placeholder="Krotki opis" />
        </label>
        <label>
          URL
          <input type="text" [(ngModel)]="form.url" name="url" required placeholder="http://localhost:4203" />
        </label>
        <label>
          Wymagane role (oddzielone przecinkiem)
          <input type="text" [(ngModel)]="form.required_roles" name="required_roles"
                 placeholder="hub-admin, inne-role" />
        </label>
        <label>
          Kolejnosc
          <input type="number" [(ngModel)]="form.sort_order" name="sort_order" min="0" />
        </label>
        <label>
          Status
          <select [(ngModel)]="form.status" name="status">
            <option value="active">🟢 Aktywna</option>
            <option value="orange">🟠 W budowie</option>
            <option value="gray">⚫ Planowana</option>
          </select>
        </label>
        <label class="label--checkbox">
          <input type="checkbox" [(ngModel)]="form.is_active" name="is_active" />
          Aktywna (widoczna w Hubie)
        </label>

        <div class="form__actions">
          <button class="btn btn--primary" type="submit">Zapisz</button>
          <button class="btn" type="button" (click)="closeForm()">Anuluj</button>
        </div>
      </form>

      <!-- Apps table -->
      <table class="table" *ngIf="!loading && apps.length > 0">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nazwa</th>
            <th>URL</th>
            <th>Role</th>
            <th>Kolejnosc</th>
            <th>Status</th>
            <th>Dostępność</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let app of apps" [class.row--inactive]="!app.is_active">
            <td><code>{{ app.id }}</code></td>
            <td>{{ app.name }}</td>
            <td><a [href]="app.url" target="_blank" rel="noopener">{{ app.url }}</a></td>
            <td>
              <span class="badge" *ngFor="let r of splitRoles(app.required_roles)">{{ displayRole(r) }}</span>
              <span class="badge badge--empty" *ngIf="!app.required_roles">wszyscy</span>
            </td>
            <td>{{ app.sort_order }}</td>
            <td>
              <span class="status" [class.status--on]="app.is_active">
                {{ app.is_active ? 'Aktywna' : 'Ukryta' }}
              </span>
            </td>
            <td>
              <span class="health-badge" [class]="'health-badge--' + (health[app.id] || '')">
                {{ healthLabel(app.id) }}
              </span>
            </td>
            <td class="actions">
              <button class="btn btn--sm" type="button" (click)="openEdit(app)">Edytuj</button>
              <button class="btn btn--sm btn--danger" type="button" (click)="remove(app.id)">Usun</button>
            </td>
          </tr>
        </tbody>
      </table>

      <p class="state" *ngIf="!loading && apps.length === 0 && !error">
        Brak aplikacji. Dodaj pierwsza aplikacje.
      </p>
    </section>
  `,
  styles: `
    :host { display: block; min-height: 100vh; }
    .admin { max-width: 1100px; margin: 0 auto; padding: 24px 16px 48px; font-family: tide_sans_cond400_lil_dude, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .admin__logo { height: 72px; width: auto; flex-shrink: 0; }
    .admin__header-info { flex: 1; }
    .admin__header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .admin__header h1 { margin: 0; font-size: clamp(22px, 3vw, 32px); color: var(--text-muted); }
    .admin__header p { margin: 6px 0 0; color: var(--text-muted); }
    .toolbar { margin-bottom: 18px; }
    .state { color: var(--text-muted); }
    .state--error { color: var(--danger-a); }

    .btn { padding: 9px 14px; border-radius: 8px; border: 1px solid var(--line); background: var(--surface); color: var(--text-main); cursor: pointer; font-weight: 600; font-size: 13px; font-family: inherit; transition: background 0.15s; }
    .btn:hover { background: var(--surface-strong); }
    .btn--primary { background: linear-gradient(rgb(211, 23, 46), rgb(200, 13, 38)); color: #fff; border: 1px solid rgb(211, 23, 46); border-radius: 4px; }
    .btn--primary:hover { filter: brightness(1.1); }
    .btn--back { background: transparent; border-color: var(--line); color: var(--text-muted); }
    .btn--danger { background: rgba(244, 63, 94, 0.15); color: var(--danger-a); border-color: rgba(244, 63, 94, 0.3); }
    .btn--danger:hover { background: rgba(244, 63, 94, 0.25); }
    .btn--sm { padding: 5px 10px; font-size: 12px; }

    .form { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 20px; margin-bottom: 24px; display: grid; gap: 12px; max-width: 560px; }
    .form h2 { margin: 0 0 4px; font-size: 18px; color: var(--text-main); }
    label { display: grid; gap: 4px; font-size: 13px; font-weight: 600; color: var(--text-muted); }
    label input[type=text], label input[type=url], label input[type=number] { padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; font-size: 14px; background: var(--surface-strong); color: var(--text-main); font-family: inherit; }
    label input[type=text]:focus, label input[type=url]:focus, label input[type=number]:focus { outline: 1px solid var(--accent-b); }
    label select { padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; font-size: 14px; background: var(--surface-strong); color: var(--text-main); font-family: inherit; }
    .label--checkbox { flex-direction: row; align-items: center; gap: 8px; display: flex; font-size: 14px; }
    .form__actions { display: flex; gap: 8px; margin-top: 4px; }

    .table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .table th { text-align: left; padding: 8px 10px; background: var(--surface); color: var(--text-muted); border-bottom: 2px solid var(--line); white-space: nowrap; }
    .table td { padding: 8px 10px; border-bottom: 1px solid var(--line); vertical-align: middle; color: var(--text-main); height: 42px; box-sizing: border-box; }
    .row--inactive td { opacity: 0.45; }
    .table a { color: var(--accent-b); }
    .actions { display: flex; gap: 6px; white-space: nowrap; }
    code { background: var(--surface); color: var(--accent-a); padding: 2px 6px; border-radius: 4px; font-size: 12px; border: 1px solid var(--line); }

    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; background: rgba(56, 189, 248, 0.15); color: var(--accent-b); border: 1px solid rgba(56, 189, 248, 0.25); margin: 2px 2px 2px 0; }
    .badge--empty { background: rgba(45, 212, 191, 0.15); color: var(--accent-a); border: 1px solid rgba(45, 212, 191, 0.25); }
    .status { padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; background: rgba(244, 63, 94, 0.15); color: var(--danger-a); border: 1px solid rgba(244, 63, 94, 0.25); }
    .status--on { background: rgba(45, 212, 191, 0.15); color: var(--accent-a); border: 1px solid rgba(45, 212, 191, 0.25); }

    .health-badge { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; background: var(--surface); color: var(--text-muted); border: 1px solid var(--line); vertical-align: middle; line-height: 1.4; }
    .health-badge--active { background: rgba(45, 212, 191, 0.15); color: var(--accent-a); border: 1px solid rgba(45, 212, 191, 0.25); }
    .health-badge--inactive { background: rgba(251, 146, 60, 0.15); color: #fb923c; border: 1px solid rgba(251, 146, 60, 0.3); }
    .health-badge--timeout { background: rgba(250, 204, 21, 0.15); color: #facc15; border: 1px solid rgba(250, 204, 21, 0.3); }
    .health-badge--building { background: rgba(148, 163, 184, 0.15); color: var(--text-muted); border: 1px solid rgba(148, 163, 184, 0.25); }
  `,
})
export class AdminComponent implements OnInit {
  apps: CatalogApp[] = [];
  loading = true;
  error = '';
  showForm = false;
  editingId: string | null = null;
  form: CatalogApp = EMPTY_FORM();
  healthChecking = false;
  health: Record<string, string> = {};

  constructor(
    private readonly hubService: HubService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.hubService.adminListApps().subscribe({
      next: (apps) => {
        this.apps = apps;
        this.loading = false;
      },
      error: () => {
        this.error = 'Nie udalo sie zaladowac aplikacji.';
        this.loading = false;
      },
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.form = EMPTY_FORM();
    this.showForm = true;
  }

  openEdit(app: CatalogApp): void {
    this.editingId = app.id;
    this.form = { ...app };
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingId = null;
  }

  saveForm(): void {
    if (this.editingId) {
      const { id, ...rest } = this.form;
      this.hubService.adminUpdateApp(this.editingId, rest).subscribe({
        next: () => { this.closeForm(); this.load(); },
        error: (err) => { this.error = err?.error?.detail ?? 'Blad zapisu.'; },
      });
    } else {
      this.hubService.adminCreateApp(this.form).subscribe({
        next: () => { this.closeForm(); this.load(); },
        error: (err) => { this.error = err?.error?.detail ?? 'Blad tworzenia.'; },
      });
    }
  }

  remove(id: string): void {
    if (!confirm(`Usunac aplikacje "${id}"?`)) return;
    this.hubService.adminDeleteApp(id).subscribe({
      next: () => this.load(),
      error: (err) => { this.error = err?.error?.detail ?? 'Blad usuwania.'; },
    });
  }

  onNameChange(name: string): void {
    if (!this.editingId) {
      this.form.id = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
  }

  splitRoles(roles: string): string[] {
    return roles ? roles.split(',').map((r) => r.trim()).filter(Boolean) : [];
  }

  displayRole(role: string): string {
    return role === 'hub-admin' ? 'admin' : role;
  }

  checkHealth(): void {
    this.healthChecking = true;
    this.hubService.adminCheckHealth().subscribe({
      next: (result) => { this.health = result; this.healthChecking = false; },
      error: () => { this.error = 'Blad sprawdzania dostepnosci.'; this.healthChecking = false; },
    });
  }

  healthLabel(id: string): string {
    const s = this.health[id];
    if (!s) return '—';
    if (s === 'active') return 'Aktywna';
    if (s === 'inactive') return 'Nieaktywna';
    if (s === 'timeout') return 'Timeout';
    return 'W budowie';
  }

  goBack(): void {
    this.router.navigate(['/apps']);
  }
}
