import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { AuthResponse, LoginDto, User, UpdateProfileDto, ChangePasswordDto } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _currentUser = signal<User | null>(null);
  private readonly _token = signal<string | null>(null);
  private readonly _refresh = signal<string | null>(null);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = () => !!this._token();

  private readonly TOKEN_KEY = 'finance_access_token';
  private readonly REFRESH_KEY = 'finance_refresh_token';

  constructor() {
    this.restoreSession();
    this.bootstrapUser();
  }

  private api(path: string): string {
    const base = environment.apiUrl.replace(/\/+$/, '');
    const cleanPath = path.replace(/^\/+/, '');
    return `${base}/${cleanPath}`;
  }

  private restoreSession(): void {
    const token = sessionStorage.getItem(this.TOKEN_KEY);
    const refresh = sessionStorage.getItem(this.REFRESH_KEY);

    if (token) this._token.set(token);
    if (refresh) this._refresh.set(refresh);
  }

  private persistTokens(access: string, refresh: string): void {
    this._token.set(access);
    this._refresh.set(refresh);
    sessionStorage.setItem(this.TOKEN_KEY, access);
    sessionStorage.setItem(this.REFRESH_KEY, refresh);
  }

  private clearLocal(redirect = true): void {
    this._token.set(null);
    this._refresh.set(null);
    this._currentUser.set(null);
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_KEY);

    if (redirect) {
      this.router.navigate(['/login']);
    }
  }

  private bootstrapUser(): void {
    if (!this._token()) return;

    this.getMe()
      .pipe(
        catchError(() => {
          this.clearLocal(false);
          return of(null);
        })
      )
      .subscribe();
  }

  getToken(): string | null {
    return this._token();
  }

  // Se usa desde el interceptor para evitar loop de logout -> 401 -> logout.
  handleUnauthorized(): void {
    this.clearLocal(true);
  }

  login(credentials: LoginDto): Observable<AuthResponse> {
    return this.http
      .post<{ access: string; refresh: string }>(
        this.api(API_ENDPOINTS.AUTH.LOGIN),
        credentials
      )
      .pipe(
        tap((tokens) => this.persistTokens(tokens.access, tokens.refresh)),
        switchMap((tokens) =>
          this.getMe().pipe(
            map((user) => ({
              access: tokens.access,
              refresh: tokens.refresh,
              user,
            }))
          )
        ),
        catchError((error) => {
          this.clearLocal(false);
          throw error;
        })
      );
  }

  logout(): void {
    const refresh = this._refresh();

    if (!refresh) {
      this.clearLocal(true);
      return;
    }

    this.http.post(this.api(API_ENDPOINTS.AUTH.LOGOUT), { refresh }).subscribe({
      next: () => this.clearLocal(true),
      error: () => this.clearLocal(true),
    });
  }

  getMe(): Observable<User> {
    return this.http
      .get<User>(this.api(API_ENDPOINTS.AUTH.ME))
      .pipe(tap((user) => this._currentUser.set(user)));
  }

  updateProfile(dto: UpdateProfileDto): Observable<User> {
  return this.http
    .patch<User>(this.api(API_ENDPOINTS.AUTH.ME), dto)
    .pipe(tap((user) => this._currentUser.set(user)));
}

  changePassword(dto: ChangePasswordDto): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(
      this.api(API_ENDPOINTS.AUTH.CHANGE_PASSWORD),
      dto
    );
  }
}

