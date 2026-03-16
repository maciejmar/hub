import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { OidcAuthService } from './oidc-auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(OidcAuthService);
  const token = auth.getAccessToken();

  if (!token) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authReq);
};
