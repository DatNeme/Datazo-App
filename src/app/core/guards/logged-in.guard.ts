import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

export const loggedInGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return toObservable(auth.currentUser).pipe(
    filter(user => user !== undefined),
    take(1),
    map(user => {
      if (!user) return true;
      return router.createUrlTree(['/']);
    })
  );
};
