import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { AuthCallbackComponent } from './features/auth/auth-callback.component';
import { LoginComponent } from './features/auth/login.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'auth/callback', component: AuthCallbackComponent },
  {
    path: 'apps',
    canActivate: [authGuard],
    loadComponent: () => import('./features/hub.component').then((m) => m.HubComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'apps' },
  { path: '**', redirectTo: 'apps' },
];
