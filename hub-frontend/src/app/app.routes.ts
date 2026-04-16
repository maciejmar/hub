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
  {
    path: 'eksplorator',
    canActivate: [authGuard],
    loadComponent: () => import('./features/app-page/app-page.component').then((m) => m.AppPageComponent),
    data: { title: 'Eksplorator', description: 'Testowanie aplikacji w GUI' },
  },
  {
    path: 'proster',
    canActivate: [authGuard],
    loadComponent: () => import('./features/app-page/app-page.component').then((m) => m.AppPageComponent),
    data: { title: 'Proster', description: 'Prosty język polski' },
  },
  {
    path: 'asystent-programisty',
    canActivate: [authGuard],
    loadComponent: () => import('./features/app-page/app-page.component').then((m) => m.AppPageComponent),
    data: { title: 'Asystent programisty', description: 'Współtworzenie kodu z AI' },
  },
  {
    path: 'ai-sandbox',
    canActivate: [authGuard],
    loadComponent: () => import('./features/app-page/app-page.component').then((m) => m.AppPageComponent),
    data: { title: 'Miejsce na Wasz AI Sandbox', description: 'Wsparcie AI' },
  },
  {
    path: 'centrum-dowodzenia',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/centrum-dowodzenia/centrum-dowodzenia.component').then((m) => m.CentrumDowodzeniaComponent),
  },
  {
    path: 'portainer-redirect',
    canActivate: [authGuard],
    loadComponent: () => import('./features/portainer-redirect/portainer-redirect.component').then((m) => m.PortainerRedirectComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'apps' },
  { path: '**', redirectTo: 'apps' },
];
