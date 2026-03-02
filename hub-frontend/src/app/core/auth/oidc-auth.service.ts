import { Injectable } from '@angular/core';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';

import { environment } from '../../environment';

const authConfig: AuthConfig = {
  issuer: environment.oidc.issuer,
  redirectUri: `${window.location.origin}${environment.oidc.redirectPath}`,
  clientId: environment.oidc.clientId,
  responseType: 'code',
  scope: environment.oidc.scope,
  showDebugInformation: false,
  strictDiscoveryDocumentValidation: false,
};

@Injectable({ providedIn: 'root' })
export class OidcAuthService {
  constructor(private readonly oauthService: OAuthService) {
    this.oauthService.configure(authConfig);
    this.oauthService.setupAutomaticSilentRefresh();
  }

  async initialize(): Promise<void> {
    await this.oauthService.loadDiscoveryDocumentAndTryLogin();
  }

  login(): void {
    this.oauthService.initCodeFlow();
  }

  logout(): void {
    this.oauthService.logOut();
  }

  hasValidAccessToken(): boolean {
    return this.oauthService.hasValidAccessToken();
  }

  getAccessToken(): string {
    return this.oauthService.getAccessToken();
  }

  async loadProfile(): Promise<object> {
    return this.oauthService.loadUserProfile();
  }
}
