import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, HttpEvent, HttpRequest } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';
import { of, throwError } from 'rxjs';

describe('authInterceptor', () => {
  const protectedRequest = new HttpRequest('GET', '/api/transactions/');

  it('adds a bearer token to protected requests', () => {
    const auth = { getToken: () => 'token', refreshToken: jasmine.createSpy(), handleUnauthorized: jasmine.createSpy() };
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: auth }] });
    let received!: HttpRequest<unknown>;
    TestBed.runInInjectionContext(() => authInterceptor(protectedRequest, (request) => { received = request; return of({} as HttpEvent<unknown>); })).subscribe();
    expect(received.headers.get('Authorization')).toBe('Bearer token');
  });

  it('leaves authentication endpoints unchanged', () => {
    const auth = { getToken: () => 'token', refreshToken: jasmine.createSpy(), handleUnauthorized: jasmine.createSpy() };
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: auth }] });
    const login = new HttpRequest('POST', '/api/auth/login/', {});
    let received!: HttpRequest<unknown>;
    TestBed.runInInjectionContext(() => authInterceptor(login, (request) => { received = request; return of({} as HttpEvent<unknown>); })).subscribe();
    expect(received.headers.has('Authorization')).toBeFalse();
  });

  it('refreshes and retries a protected request after 401', () => {
    const auth = { getToken: jasmine.createSpy().and.returnValues('old', 'new'), refreshToken: jasmine.createSpy().and.returnValue(of({ access: 'new', refresh: 'refresh' })), handleUnauthorized: jasmine.createSpy() };
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: auth }] });
    let calls = 0; let retried!: HttpRequest<unknown>;
    TestBed.runInInjectionContext(() => authInterceptor(protectedRequest, (request) => { calls += 1; retried = request; return calls === 1 ? throwError(() => new HttpErrorResponse({ status: 401 })) : of({} as HttpEvent<unknown>); })).subscribe();
    expect(auth.refreshToken).toHaveBeenCalled();
    expect(retried.headers.get('Authorization')).toBe('Bearer new');
  });

  it('logs out when token refresh fails', () => {
    const auth = { getToken: () => 'old', refreshToken: () => throwError(() => new Error('failed')), handleUnauthorized: jasmine.createSpy() };
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: auth }] });
    TestBed.runInInjectionContext(() => authInterceptor(protectedRequest, () => throwError(() => new HttpErrorResponse({ status: 401 }))).subscribe({ error: () => undefined }));
    expect(auth.handleUnauthorized).toHaveBeenCalled();
  });
});
