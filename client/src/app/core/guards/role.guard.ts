import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowed: string[] = route.data?.['roles'] ?? [];
  if (auth.role && allowed.includes(auth.role)) return true;
  return router.createUrlTree(['/dashboard']);
};
