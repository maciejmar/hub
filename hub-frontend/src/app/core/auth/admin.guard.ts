import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { HubService } from '../../features/hub.service';

export const adminGuard: CanActivateFn = async () => {
  const hub = inject(HubService);
  const router = inject(Router);

  await hub.ensureRolesLoaded();

  if (hub.isAdmin()) {
    return true;
  }

  router.navigate(['/apps']);
  return false;
};
