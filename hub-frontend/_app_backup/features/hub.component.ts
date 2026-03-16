import { Component } from '@angular/core';

import { OidcAuthService } from '../core/auth/oidc-auth.service';

@Component({
  selector: 'app-hub',
  standalone: true,
  template: `
    <h1>Hub aplikacji</h1>
    <p>Sesja SSO aktywna. Mozesz przechodzic do podpietych aplikacji.</p>
    <button type="button" (click)="logout()">Wyloguj</button>
  `,
})
export class HubComponent {
  constructor(private readonly auth: OidcAuthService) {}

  logout(): void {
    this.auth.logout();
  }
}
