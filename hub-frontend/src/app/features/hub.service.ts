import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../environment';
import { HubAppsResponse } from './hub.models';

@Injectable({ providedIn: 'root' })
export class HubService {
  constructor(private readonly http: HttpClient) {}

  getApps(): Observable<HubAppsResponse> {
    return this.http.get<HubAppsResponse>(`${environment.apiBaseUrl}/hub/apps`);
  }
}
