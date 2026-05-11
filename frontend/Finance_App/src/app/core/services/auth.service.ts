import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { AuthResponse, LoginDto, User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http   = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _currentUser = signal<User | null>(null);
  private readonly _token       = signal<string | null>(null);

  readonly currentUser    = this._currentUser.asReadonly();
  readonly isAuthenticated = () => !!this._token();

  /** Token is kept in sessionStorage (cleared when tab is closed).
   *  For production with stricter security requirements, use HttpOnly cookies
   *  and handle the CSRF token on the Python backend.
   */
  private readonly TOKEN_KEY = 'finance_access_token';
  private readonly baseUrl   = environment.apiUrl;

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    const token = sessionStorage.getItem(this.TOKEN_KEY);
    if (token) {
      this._token.set(token);
    }
  }

  getToken(): string | null {
    return this._token();
  }

  login(credentials: LoginDto): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}${API_ENDPOINTS.AUTH.LOGIN}`, credentials)
      .pipe(
        tap((response) => {
          this._token.set(response.accessToken);
          this._currentUser.set(response.user);
          sessionStorage.setItem(this.TOKEN_KEY, response.accessToken);
        })
      );
  }

  logout(): void {
    this._token.set(null);
    this._currentUser.set(null);
    sessionStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/login']);
  }

  getMe(): Observable<User> {
    return this.http
      .get<User>(`${this.baseUrl}${API_ENDPOINTS.AUTH.ME}`)
      .pipe(tap((user) => this._currentUser.set(user)));
  }
}
