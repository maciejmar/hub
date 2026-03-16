import { Injectable } from '@angular/core';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';

import { environment } from '../environment';

const authConfig: AuthConfig = {
  issuer: environment.oidc.issuer,
  redirectUri: window.location.origin + '/',
  clientId: environment.oidc.clientId,
  responseType: 'code',
  scope: environment.oidc.scope,
  strictDiscoveryDocumentValidation: false,
};

@Injectable({ providedIn: 'root' })
export class OidcService {
  constructor(private readonly oauthService: OAuthService) {
    this.oauthService.configure(authConfig);
    this.oauthService.setupAutomaticSilentRefresh();
  }

  async initialize(): Promise<void> {
    await this.oauthService.loadDiscoveryDocumentAndTryLogin();
  }

  isAuthenticated(): boolean {
    return this.oauthService.hasValidAccessToken();
  }

  login(): void {
    this.oauthService.initCodeFlow();
  }

  logout(): void {
    this.oauthService.logOut(true);
    window.location.href = environment.hubUrl;
  }
}
