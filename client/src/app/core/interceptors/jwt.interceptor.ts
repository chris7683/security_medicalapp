import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken;
  const cloned = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && auth.refreshToken) {
        return auth.refresh().pipe(
          switchMap(({ accessToken }) => {
            const retried = req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } });
            return next(retried);
          })
        );
      }
      return throwError(() => err);
    })
  );
};
