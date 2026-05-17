import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
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
    req.url.includes('/api/auth/logout/') ||
    req.url.includes('/api/auth/register/') ||
    req.url.includes('/api/auth/refresh/');

  const cloned =
    token && !isAuthEndpoint
      ? req.clone({ setHeaders: { Authorization: 'Bearer ' + token } })
      : req;

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si 401 y no es endpoint de auth, intentar refresh
      if (error.status === 401 && !isAuthEndpoint) {
        return authService.refreshToken().pipe(
          switchMap(() => {
            // Refresh exitoso, reintentar el request original con nuevo token
            const newToken = authService.getToken();
            const retryReq = req.clone({
              setHeaders: { Authorization: 'Bearer ' + newToken },
            });
            return next(retryReq);
          }),
          catchError(() => {
            // Refresh falló, logout
            authService.handleUnauthorized();
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};