import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard, authChildGuard, guestGuard } from './auth.guard';

describe('auth guards', () => {
  const auth = { isAuthenticated: jasmine.createSpy('isAuthenticated') };
  beforeEach(() => { auth.isAuthenticated.calls.reset(); TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: auth }, provideRouter([])] }); });
  it('allows authenticated users and redirects guests', () => {
    auth.isAuthenticated.and.returnValue(true); expect(TestBed.runInInjectionContext(() => authGuard({} as never, {} as never))).toBeTrue();
    auth.isAuthenticated.and.returnValue(false); const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never)); expect(result).toEqual(TestBed.inject(Router).createUrlTree(['/login']));
  });
  it('applies the same policy to child routes and guests', () => {
    auth.isAuthenticated.and.returnValue(false); expect(TestBed.runInInjectionContext(() => authChildGuard({} as never, {} as never))).toEqual(TestBed.inject(Router).createUrlTree(['/login']));
    auth.isAuthenticated.and.returnValue(true); expect(TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never))).toEqual(TestBed.inject(Router).createUrlTree(['/dashboard']));
    auth.isAuthenticated.and.returnValue(false); expect(TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never))).toBeTrue();
  });
});
