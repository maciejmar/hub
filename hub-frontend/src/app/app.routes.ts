import { Routes } from '@angular/router';

import { adminGuard } from './core/auth/admin.guard';
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
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/admin/admin.component').then((m) => m.AdminComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'apps' },
  { path: '**', redirectTo: 'apps' },
];
