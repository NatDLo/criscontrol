import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Adjunta Bearer token a requests salientes.
 * No agrega token en endpoints de autenticación (login/register/refresh).
 * Si recibe 401 en un endpoint protegido, limpia sesión local y redirige a login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const isAuthEndpoint =
    req.url.includes('/api/auth/login/') ||
    req.url.includes('/api/auth/register/') ||
    req.url.includes('/api/auth/refresh/');

  const cloned =
    token && !isAuthEndpoint
      ? req.clone({ setHeaders: { Authorization: 'Bearer ' + token } })
      : req;

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthEndpoint) {
        authService.handleUnauthorized();
      }
      return throwError(() => error);
    })
  );
};