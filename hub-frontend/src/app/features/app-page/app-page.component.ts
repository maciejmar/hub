import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-page',
  standalone: true,
  template: `
    <div class="page">
      <header class="page__header">
        <img class="page__logo" src="bgk-logo-white.svg" alt="BGK" (click)="goBack()" />
        <div class="page__header-text">
          <h1>{{ title }}</h1>
          <p *ngIf="description">{{ description }}</p>
        </div>
        <button class="page__back" type="button" (click)="goBack()">← Wróć do Hub</button>
      </header>
      <main class="page__main">
        <p class="page__placeholder">Zacznij pracę z aplikacją</p>
      </main>
    </div>
  `,
  styles: `
    .page {
      max-width: 1120px;
      margin: 0 auto;
      padding: 24px 16px 36px;
    }
    .page__header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 32px;
    }
    .page__logo {
      height: 56px;
      width: auto;
      flex-shrink: 0;
      cursor: pointer;
    }
    .page__header-text {
      flex: 1;
    }
    .page__header-text h1 {
      margin: 0;
      font-size: clamp(22px, 3vw, 32px);
      color: #f3f8ff;
    }
    .page__header-text p {
      margin: 6px 0 0;
      font-size: 15px;
      color: var(--text-muted);
    }
    .page__back {
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
      flex-shrink: 0;
    }
    .page__back:hover {
      filter: brightness(1.1);
    }
    .page__main {
      padding: 32px 0;
    }
    .page__placeholder {
      color: var(--text-muted);
      font-size: 16px;
    }
  `,
  imports: [CommonModule],
})
export class AppPageComponent implements OnInit {
  title = '';
  description = '';

  constructor(private readonly route: ActivatedRoute, private readonly router: Router) {}

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    this.title = data['title'] ?? '';
    this.description = data['description'] ?? '';
  }

  goBack(): void {
    this.router.navigate(['/apps']);
  }
}
