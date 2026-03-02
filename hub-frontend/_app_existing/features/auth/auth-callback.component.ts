import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { OidcAuthService } from '../../core/auth/oidc-auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `
    <p>Finalizowanie logowania...</p>
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
      this.router.navigate(['/apps']);
      return;
    }
    this.router.navigate(['/login']);
  }
}
