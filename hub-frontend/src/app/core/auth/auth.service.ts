import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, switchMap, tap } from 'rxjs';

import { LoginRequest, RegisterRequest, TokenPair, User } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiBase = 'http://localhost:8000/api/v1/auth';
  private readonly accessTokenKey = 'hub_access_token';
  private readonly refreshTokenKey = 'hub_refresh_token';

  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(private readonly http: HttpClient) {
    this.bootstrapSession();
  }

  register(payload: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.apiBase}/register`, payload);
  }

  login(payload: LoginRequest): Observable<User> {
    const body = new HttpParams()
      .set('username', payload.email)
      .set('password', payload.password)
      .set('grant_type', 'password');

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    return this.http
      .post<TokenPair>(`${this.apiBase}/login`, body.toString(), { headers })
      .pipe(
        tap((tokens) => this.persistTokens(tokens)),
        switchMap(() => this.loadCurrentUser()),
      );
  }

  logout(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem('portal-ai-user');
    this.currentUserSubject.next(null);
  }

  loadCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiBase}/me`).pipe(
      tap((user) => {
        this.currentUserSubject.next(user);
        localStorage.setItem('portal-ai-user', JSON.stringify({
          email:       user.email,
          displayName: user.full_name,
          groups:      [],
        }));
      }),
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  refreshTokens(): Observable<boolean> {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    if (!refreshToken) {
      this.logout();
      return of(false);
    }

    return this.http
      .post<TokenPair>(`${this.apiBase}/refresh`, { refresh_token: refreshToken })
      .pipe(
        tap((tokens) => this.persistTokens(tokens)),
        map(() => true),
        catchError(() => {
          this.logout();
          return of(false);
        }),
      );
  }

  private bootstrapSession(): void {
    const token = this.getAccessToken();
    if (!token) {
      return;
    }

    this.loadCurrentUser().subscribe({
      error: () => {
        this.refreshTokens().subscribe((ok) => {
          if (ok) {
            this.loadCurrentUser().subscribe();
          }
        });
      },
    });
  }

  private persistTokens(tokens: TokenPair): void {
    localStorage.setItem(this.accessTokenKey, tokens.access_token);
    localStorage.setItem(this.refreshTokenKey, tokens.refresh_token);
  }
}
