import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { OAuthModule, OAuthService } from 'angular-oauth2-oidc';

import { OidcService } from './core/oidc.service';

function initAuth(oidc: OidcService): () => Promise<void> {
  return () => oidc.initialize();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    importProvidersFrom(OAuthModule.forRoot()),
    OAuthService,
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [OidcService],
      useFactory: initAuth,
    },
  ],
};
