import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

const HTTP_MESSAGES: Record<number, string> = {
  0:   'No se pudo conectar con el servidor. Verifica tu conexión.',
  400: 'Solicitud inválida. Revisa los datos enviados.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'El recurso solicitado no fue encontrado.',
  409: 'Ya existe un registro con esos datos.',
  422: 'Los datos enviados no son válidos.',
  500: 'Error interno del servidor. Intenta más tarde.',
  503: 'Servicio no disponible temporalmente.',
};

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message =
        HTTP_MESSAGES[error.status] ??
        (error.error?.message as string | undefined) ??
        'Ha ocurrido un error inesperado.';

      snackBar.open(message, 'Cerrar', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar'],
      });

      return throwError(() => error);
    })
  );
};
