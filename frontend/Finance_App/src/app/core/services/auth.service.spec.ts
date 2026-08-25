import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService; let http: HttpTestingController; let router: Router;
  const user = { id: '1', username: 'alice', email: 'alice@example.com', first_name: '', last_name: '', is_email_verified: true, date_joined: '2026-01-01' };
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [AuthService, provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: 'login', redirectTo: '' }])] });
    service = TestBed.inject(AuthService); http = TestBed.inject(HttpTestingController); router = TestBed.inject(Router);
  });
  afterEach(() => { http.verify(); sessionStorage.clear(); });
  it('starts unauthenticated and logs in, persists tokens, and loads user', () => {
    expect(service.isAuthenticated()).toBeFalse();
    service.login({ email: 'alice@example.com', password: 'StrongPass123!' }).subscribe((r) => expect(r.user).toEqual(user));
    let request = http.expectOne(`${environment.apiUrl}auth/login/`); request.flush({ access: 'access', refresh: 'refresh' });
    request = http.expectOne(`${environment.apiUrl}auth/me/`); request.flush(user);
    expect(service.getToken()).toBe('access'); expect(service.currentUser()).toEqual(user);
  });
  it('restores a session and clears it on unauthorized', () => {
    sessionStorage.setItem('finance_access_token', 'old'); sessionStorage.setItem('finance_refresh_token', 'refresh');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [AuthService, provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: 'login', redirectTo: '' }])] });
    const restored = TestBed.inject(AuthService); router = TestBed.inject(Router); http = TestBed.inject(HttpTestingController);
    expect(restored.isAuthenticated()).toBeTrue();
    const request = http.expectOne(`${environment.apiUrl}auth/me/`); request.flush(user);
    spyOn(router, 'navigate').and.resolveTo(true);
    restored.handleUnauthorized(); expect(restored.isAuthenticated()).toBeFalse(); expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
  it('refreshes tokens and supports logout with and without refresh token', () => {
    service.login({ email: 'a', password: 'b' }).subscribe();
    let request = http.expectOne(`${environment.apiUrl}auth/login/`); request.flush({ access: 'a', refresh: 'r' });
    request = http.expectOne(`${environment.apiUrl}auth/me/`); request.flush(user);
    service.refreshToken().subscribe((r) => expect(r.access).toBe('new'));
    request = http.expectOne(`${environment.apiUrl}auth/refresh/`); request.flush({ access: 'new', refresh: 'new-r' });
    service.logout(); request = http.expectOne(`${environment.apiUrl}auth/logout/`); request.flush({});
    service.logout();
  });

  it('rejects refresh when no refresh token exists', async () => {
    await expectAsync(firstValueFrom(service.refreshToken())).toBeRejectedWithError('No refresh token available');
  });
  it('updates profile, changes password, and clears tokens when login fails', () => {
    service.updateProfile({ first_name: 'A' }).subscribe((r) => expect(r.first_name).toBe('A'));
    let request = http.expectOne(`${environment.apiUrl}auth/me/`); request.flush({ ...user, first_name: 'A' });
    service.changePassword({ current_password: 'x', new_password: 'StrongPass123!', new_password2: 'StrongPass123!' }).subscribe((r) => expect(r.detail).toBe('ok'));
    request = http.expectOne(`${environment.apiUrl}auth/change-password/`); request.flush({ detail: 'ok' });
    service.login({ email: 'bad', password: 'bad' }).subscribe({ error: () => expect(service.isAuthenticated()).toBeFalse() });
    request = http.expectOne(`${environment.apiUrl}auth/login/`); request.flush({ detail: 'bad' }, { status: 401, statusText: 'Unauthorized' });
  });
});
