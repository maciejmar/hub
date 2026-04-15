import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom, tap } from 'rxjs';

import { environment } from '../environment';
import { CatalogApp, HubApp, HubAppsResponse } from './hub.models';

@Injectable({ providedIn: 'root' })
export class HubService {
  private roles: string[] = [];
  private rolesLoaded = false;

  constructor(private readonly http: HttpClient) {}

  getApps(): Observable<HubAppsResponse> {
    return this.http.get<HubAppsResponse>(`${environment.apiBaseUrl}/hub/apps`).pipe(
      tap((data) => {
        this.roles = data.roles ?? [];
        this.rolesLoaded = true;
      }),
    );
  }

  async ensureRolesLoaded(): Promise<void> {
    if (!this.rolesLoaded) {
      await firstValueFrom(this.getApps());
    }
  }

  isAdmin(): boolean {
    return this.roles.includes('hub-admin');
  }

  adminListApps(): Observable<CatalogApp[]> {
    return this.http.get<CatalogApp[]>(`${environment.apiBaseUrl}/admin/apps`);
  }

  adminCreateApp(app: CatalogApp): Observable<CatalogApp> {
    return this.http.post<CatalogApp>(`${environment.apiBaseUrl}/admin/apps`, app);
  }

  adminUpdateApp(id: string, app: Omit<CatalogApp, 'id'>): Observable<CatalogApp> {
    return this.http.put<CatalogApp>(`${environment.apiBaseUrl}/admin/apps/${id}`, app);
  }

  adminDeleteApp(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/admin/apps/${id}`);
  }

  adminCheckHealth(): Observable<Record<string, string>> {
    return this.http.get<Record<string, string>>(`${environment.apiBaseUrl}/admin/health`);
  }

  getSystemApps(): Observable<{ apps: HubApp[] }> {
    return this.http.get<{ apps: HubApp[] }>(`${environment.apiBaseUrl}/hub/system-apps`);
  }
}
