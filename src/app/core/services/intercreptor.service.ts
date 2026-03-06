import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { GlobalSpinnerStore } from '../../shared/global-sniper/global-sniper.store';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private readonly spinnerStore: GlobalSpinnerStore) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      tap(event => {
      }),
      catchError((error: HttpErrorResponse) => {
        this.spinnerStore.stop();
        return throwError(error);
      })
    );
  }
}
