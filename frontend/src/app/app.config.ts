import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { OAuthModule, OAuthService } from 'angular-oauth2-oidc';

import { authInterceptor } from './core/auth/auth.interceptor';
import { OidcAuthService } from './core/auth/oidc-auth.service';
import { routes } from './app.routes';

function initializeAuth(auth: OidcAuthService): () => Promise<void> {
  return () => auth.initialize();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(OAuthModule.forRoot()),
    OAuthService,
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [OidcAuthService],
      useFactory: initializeAuth,
    },
  ],
};
