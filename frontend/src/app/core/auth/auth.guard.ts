import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { OidcAuthService } from './oidc-auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(OidcAuthService);
  const router = inject(Router);

  if (auth.hasValidAccessToken()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
