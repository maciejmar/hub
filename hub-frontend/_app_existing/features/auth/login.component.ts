import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { OidcAuthService } from '../../core/auth/oidc-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1>Logowanie do Huba</h1>
    <p>Uwierzytelnianie jest realizowane przez Keycloak (OIDC + PKCE).</p>
    <button type="button" (click)="login()">Zaloguj przez SSO</button>
  `,
})
export class LoginComponent {
  constructor(private readonly auth: OidcAuthService) {}

  login(): void {
    this.auth.login();
  }
}
