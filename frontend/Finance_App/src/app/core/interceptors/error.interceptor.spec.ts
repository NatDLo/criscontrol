import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { errorInterceptor } from './error.interceptor';
import { throwError } from 'rxjs';

describe('errorInterceptor', () => {
  it('shows the mapped HTTP message and rethrows the error', () => {
    const snack = { open: jasmine.createSpy('open') };
    TestBed.configureTestingModule({ providers: [{ provide: MatSnackBar, useValue: snack }] });
    const error = new HttpErrorResponse({ status: 404, error: {} });
    let received: unknown;
    TestBed.runInInjectionContext(() => errorInterceptor(new HttpRequest('GET', '/x'), () => throwError(() => error)).subscribe({ error: (e) => received = e }));
    expect(received).toBe(error); expect(snack.open).toHaveBeenCalledWith(jasmine.stringMatching('no fue encontrado'), 'Cerrar', jasmine.any(Object));
  });
  it('uses backend or fallback messages', () => {
    const snack = { open: jasmine.createSpy('open') };
    TestBed.configureTestingModule({ providers: [{ provide: MatSnackBar, useValue: snack }] });
    for (const error of [new HttpErrorResponse({ status: 418, error: { message: 'Backend message' } }), new HttpErrorResponse({ status: 418, error: {} })]) {
      TestBed.runInInjectionContext(() => errorInterceptor(new HttpRequest('GET', '/x'), () => throwError(() => error)).subscribe({ error: () => undefined }));
    }
    expect(snack.open.calls.argsFor(0)[0]).toBe('Backend message'); expect(snack.open.calls.argsFor(1)[0]).toContain('inesperado');
  });
});
