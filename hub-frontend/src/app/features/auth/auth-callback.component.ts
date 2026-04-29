import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { OidcAuthService } from '../../core/auth/oidc-auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `
    <section class="cb">
      <div class="cb__card">
        <div class="cb__dot" aria-hidden="true"></div>
        <p>Finalizowanie logowania...</p>
      </div>
    </section>
  `,
  styles: `
    .cb {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
    }
    .cb__card {
      display: flex;
      align-items: center;
      gap: 12px;
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 14px 18px;
      background: var(--surface);
      color: var(--text-main);
      box-shadow: var(--shadow-md);
    }
    .cb__dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: linear-gradient(130deg, var(--accent-a), var(--accent-b));
      animation: pulse 900ms ease-in-out infinite alternate;
    }
    @keyframes pulse {
      from {
        transform: scale(0.8);
        opacity: 0.5;
      }
      to {
        transform: scale(1.2);
        opacity: 1;
      }
    }
  `,
})
export class AuthCallbackComponent {
  constructor(
    private readonly auth: OidcAuthService,
    private readonly router: Router,
  ) {
    this.finishLogin();
  }

  private async finishLogin(): Promise<void> {
    await this.auth.initialize();
    if (this.auth.hasValidAccessToken()) {
      const info = this.auth.getUserInfo();
      if (info) {
        localStorage.setItem('portal-ai-user', JSON.stringify({
          email:       info.email,
          displayName: info.displayName,
          groups:      [],
        }));
      }
      this.router.navigate(['/apps']);
      return;
    }
    this.router.navigate(['/login']);
  }
}
